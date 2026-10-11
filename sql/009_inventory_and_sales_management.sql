-- ============================================================
-- 009_inventory_and_sales_management.sql
-- 1. Crea la tabla public.sale para registro de ventas de productos y servicios.
-- 2. Habilita RLS con permisos para vendedores y administradores.
-- 3. Inserta registros de ventas iniciales de prueba para los comercios existentes.
-- 4. Recarga la caché de PostgREST.
--
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- 1. Crear tabla de ventas / pedidos
CREATE TABLE IF NOT EXISTS public.sale (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id             UUID NOT NULL REFERENCES public.seller(id) ON DELETE CASCADE,
  listing_id            UUID NOT NULL REFERENCES public.listing(id) ON DELETE CASCADE,
  buyer_id              UUID REFERENCES public.app_user(id) ON DELETE SET NULL,
  buyer_name            TEXT,
  buyer_phone           TEXT,
  buyer_email           TEXT,
  quantity              INT NOT NULL DEFAULT 1,
  unit_price            NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  type                  TEXT NOT NULL DEFAULT 'product', -- product | service | article
  status                TEXT NOT NULL DEFAULT 'completed', -- completed | in_progress | pending | cancelled
  service_duration      TEXT, -- ej. '45 min', '2 horas' para servicios
  service_scheduled_for TIMESTAMPTZ, -- Fecha y hora agendada para servicios
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de optimización
CREATE INDEX IF NOT EXISTS idx_sale_seller_id ON public.sale (seller_id);
CREATE INDEX IF NOT EXISTS idx_sale_listing_id ON public.sale (listing_id);
CREATE INDEX IF NOT EXISTS idx_sale_status ON public.sale (status);
CREATE INDEX IF NOT EXISTS idx_sale_created_at ON public.sale (created_at DESC);

-- Permisos básicos
GRANT ALL ON TABLE public.sale TO authenticated, service_role;
GRANT SELECT ON TABLE public.sale TO anon;

-- 2. Políticas de Seguridad RLS
ALTER TABLE public.sale ENABLE ROW LEVEL SECURITY;

-- Vendedor puede consultar sus propias ventas
DROP POLICY IF EXISTS "sale_seller_select" ON public.sale;
CREATE POLICY "sale_seller_select"
  ON public.sale FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.seller s
      WHERE s.id = sale.seller_id
        AND s.owner_user_id = auth.uid()
    )
  );

-- Vendedor puede registrar nuevas ventas manuales para sus artículos
DROP POLICY IF EXISTS "sale_seller_insert" ON public.sale;
CREATE POLICY "sale_seller_insert"
  ON public.sale FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.seller s
      WHERE s.id = sale.seller_id
        AND s.owner_user_id = auth.uid()
    )
  );

-- Vendedor o Admin pueden actualizar estado de venta
DROP POLICY IF EXISTS "sale_seller_update" ON public.sale;
CREATE POLICY "sale_seller_update"
  ON public.sale FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.seller s
      WHERE s.id = sale.seller_id
        AND s.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.seller s
      WHERE s.id = sale.seller_id
        AND s.owner_user_id = auth.uid()
    )
  );

-- 3. Inserción de ventas de prueba representativas
DO $$
DECLARE
  v_seller_panaderia  UUID;
  v_seller_taller     UUID;
  v_seller_boutique   UUID;
  v_buyer_id          UUID;
  v_listing_pan       RECORD;
  v_listing_servicio  RECORD;
  v_listing_ropa      RECORD;
BEGIN
  -- Obtener comprador de pruebas
  SELECT id INTO v_buyer_id FROM public.app_user WHERE role = 'buyer' LIMIT 1;

  -- 1. Panadería Don Pancho
  SELECT id INTO v_seller_panaderia FROM public.seller WHERE business_name ILIKE '%Pancho%' OR business_name ILIKE '%Panader%' LIMIT 1;
  IF v_seller_panaderia IS NOT NULL THEN
    FOR v_listing_pan IN (SELECT * FROM public.listing WHERE seller_id = v_seller_panaderia LIMIT 2) LOOP
      IF NOT EXISTS (SELECT 1 FROM public.sale WHERE listing_id = v_listing_pan.id) THEN
        INSERT INTO public.sale (
          seller_id, listing_id, buyer_id, buyer_name, buyer_phone,
          quantity, unit_price, total_amount, type, status, notes, created_at
        ) VALUES (
          v_seller_panaderia, v_listing_pan.id, v_buyer_id, 'Laura Gómez', '3104567890',
          3, COALESCE(v_listing_pan.price, 12000), COALESCE(v_listing_pan.price, 12000) * 3,
          'product', 'completed', 'Pedido entregado en punto de venta con pago en efectivo.',
          now() - INTERVAL '2 days'
        ),
        (
          v_seller_panaderia, v_listing_pan.id, v_buyer_id, 'Carlos Restrepo', '3201234567',
          2, COALESCE(v_listing_pan.price, 12000), COALESCE(v_listing_pan.price, 12000) * 2,
          'product', 'completed', 'Pedido a domicilio local confirmado por WhatsApp.',
          now() - INTERVAL '4 hours'
        );
      END IF;
    END LOOP;
  END IF;

  -- 2. Taller Moto & Auto Express (Servicios)
  SELECT id INTO v_seller_taller FROM public.seller WHERE business_name ILIKE '%Taller%' OR business_name ILIKE '%Express%' LIMIT 1;
  IF v_seller_taller IS NOT NULL THEN
    FOR v_listing_servicio IN (SELECT * FROM public.listing WHERE seller_id = v_seller_taller LIMIT 2) LOOP
      IF NOT EXISTS (SELECT 1 FROM public.sale WHERE listing_id = v_listing_servicio.id) THEN
        INSERT INTO public.sale (
          seller_id, listing_id, buyer_id, buyer_name, buyer_phone,
          quantity, unit_price, total_amount, type, status, service_duration, service_scheduled_for, notes, created_at
        ) VALUES (
          v_seller_taller, v_listing_servicio.id, v_buyer_id, 'Andrés Felipe Morales', '3157891234',
          1, COALESCE(v_listing_servicio.price, 85000), COALESCE(v_listing_servicio.price, 85000),
          'service', 'completed', '45 min', now() - INTERVAL '1 day',
          'Servicio preventivo ejecutado satisfactoriamente. Cliente satisfecho.',
          now() - INTERVAL '1 day'
        ),
        (
          v_seller_taller, v_listing_servicio.id, v_buyer_id, 'Mariana Sánchez', '3009876543',
          1, COALESCE(v_listing_servicio.price, 50000), COALESCE(v_listing_servicio.price, 50000),
          'service', 'in_progress', '30 min', now() + INTERVAL '2 hours',
          'Cita agendada para revisión y escaneo computarizado en bahía 2.',
          now() - INTERVAL '3 hours'
        );
      END IF;
    END LOOP;
  END IF;

  -- 3. Boutique & Modas Elegancia (Ropa / Productos)
  SELECT id INTO v_seller_boutique FROM public.seller WHERE business_name ILIKE '%Boutique%' OR business_name ILIKE '%Modas%' LIMIT 1;
  IF v_seller_boutique IS NOT NULL THEN
    FOR v_listing_ropa IN (SELECT * FROM public.listing WHERE seller_id = v_seller_boutique LIMIT 2) LOOP
      IF NOT EXISTS (SELECT 1 FROM public.sale WHERE listing_id = v_listing_ropa.id) THEN
        INSERT INTO public.sale (
          seller_id, listing_id, buyer_id, buyer_name, buyer_phone,
          quantity, unit_price, total_amount, type, status, notes, created_at
        ) VALUES (
          v_seller_boutique, v_listing_ropa.id, v_buyer_id, 'Sofía Ramírez', '3128905678',
          1, COALESCE(v_listing_ropa.price, 160000), COALESCE(v_listing_ropa.price, 160000),
          'product', 'completed', 'Vestido de gala talla M entregado con envío nacional.',
          now() - INTERVAL '3 days'
        );
      END IF;
    END LOOP;
  END IF;

END $$;

-- 4. Recargar caché de PostgREST
NOTIFY pgrst, 'reload schema';
