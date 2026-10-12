-- ============================================================
-- 012_listing_price_history.sql
-- 1. Crea la tabla public.listing_price_history para almacenar
--    el historial de cambios de precio por cada producto/servicio.
-- 2. Habilita RLS con permisos para vendedores propietarios y admins.
-- 3. Inserta registros iniciales para los artículos existentes.
-- 4. Recarga la caché del esquema PostgREST.
--
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- 1. Crear tabla de historial de precios
CREATE TABLE IF NOT EXISTS public.listing_price_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   UUID NOT NULL REFERENCES public.listing(id) ON DELETE CASCADE,
  price        NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_unit   TEXT NOT NULL DEFAULT 'unidad',
  note         TEXT,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by   UUID REFERENCES public.app_user(id) ON DELETE SET NULL
);

-- Índices para búsqueda rápida de historial por artículo y fecha
CREATE INDEX IF NOT EXISTS idx_listing_price_history_listing_id 
  ON public.listing_price_history (listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_price_history_changed_at 
  ON public.listing_price_history (changed_at DESC);

-- Permisos de tabla
GRANT ALL ON TABLE public.listing_price_history TO authenticated, service_role;
GRANT SELECT ON TABLE public.listing_price_history TO anon;

-- 2. Habilitar Seguridad RLS
ALTER TABLE public.listing_price_history ENABLE ROW LEVEL SECURITY;

-- Consulta: Admin, Vendedor dueño del artículo o público para ver historial de precios
DROP POLICY IF EXISTS "price_history_select" ON public.listing_price_history;
CREATE POLICY "price_history_select"
  ON public.listing_price_history FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.listing l
      JOIN public.seller s ON s.id = l.seller_id
      WHERE l.id = listing_price_history.listing_id
        AND (s.owner_user_id = auth.uid() OR l.status = 'published')
    )
  );

-- Inserción: Admin o Vendedor dueño del artículo
DROP POLICY IF EXISTS "price_history_insert" ON public.listing_price_history;
CREATE POLICY "price_history_insert"
  ON public.listing_price_history FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.listing l
      JOIN public.seller s ON s.id = l.seller_id
      WHERE l.id = listing_price_history.listing_id
        AND s.owner_user_id = auth.uid()
    )
  );

-- 3. Poblar historial inicial con los precios actuales de listings existentes
INSERT INTO public.listing_price_history (listing_id, price, price_unit, note, changed_at)
SELECT 
  l.id,
  COALESCE(l.price, 0),
  COALESCE(l.price_unit, 'unidad'),
  'Precio inicial registrado en catálogo/inventario',
  COALESCE(l.created_at, now())
FROM public.listing l
WHERE NOT EXISTS (
  SELECT 1 FROM public.listing_price_history h WHERE h.listing_id = l.id
);

-- 4. Recargar esquema PostgREST
NOTIFY pgrst, 'reload schema';
