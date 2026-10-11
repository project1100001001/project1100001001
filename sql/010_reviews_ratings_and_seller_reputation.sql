-- ============================================================
-- 010_reviews_ratings_and_seller_reputation.sql
-- 1. Asegura la estructura de public.review con rating, comentario,
--    sale_id y recomendación.
-- 2. Agrega has_reviewed a public.sale.
-- 3. Crea función y trigger para recalcular automáticamente
--    rating_avg y rating_count en public.seller.
-- 4. Habilita RLS con permisos públicos de lectura e inserción para compradores.
-- 5. Inserta reseñas iniciales verificadas para los vendedores de prueba.
-- 6. Recarga la caché de PostgREST.
--
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- 1. Crear / Asegurar tabla public.review
CREATE TABLE IF NOT EXISTS public.review (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID NOT NULL REFERENCES public.listing(id) ON DELETE CASCADE,
  seller_id     UUID NOT NULL REFERENCES public.seller(id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
  sale_id       UUID REFERENCES public.sale(id) ON DELETE SET NULL,
  rating        INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT NOT NULL,
  recommend     BOOLEAN NOT NULL DEFAULT true,
  status        TEXT NOT NULL DEFAULT 'published', -- published | hidden
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asegurar columnas si la tabla ya existía previamente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'review' AND column_name = 'sale_id') THEN
    ALTER TABLE public.review ADD COLUMN sale_id UUID REFERENCES public.sale(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'review' AND column_name = 'recommend') THEN
    ALTER TABLE public.review ADD COLUMN recommend BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Asegurar columna has_reviewed en public.sale si existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sale') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale' AND column_name = 'has_reviewed') THEN
      ALTER TABLE public.sale ADD COLUMN has_reviewed BOOLEAN NOT NULL DEFAULT false;
    END IF;
  END IF;
END $$;

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_review_listing_id ON public.review (listing_id);
CREATE INDEX IF NOT EXISTS idx_review_seller_id ON public.review (seller_id);
CREATE INDEX IF NOT EXISTS idx_review_buyer_user_id ON public.review (buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_review_rating ON public.review (rating);

-- Permisos
GRANT ALL ON TABLE public.review TO authenticated, service_role;
GRANT SELECT ON TABLE public.review TO anon;

-- 2. Función y Trigger de Recálculo Automático de Reputación
CREATE OR REPLACE FUNCTION public.fn_recalc_seller_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id UUID;
  v_avg       NUMERIC(3,2);
  v_count     INT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_seller_id := OLD.seller_id;
  ELSE
    v_seller_id := NEW.seller_id;
    -- Si la reseña está vinculada a una orden de venta, marcar has_reviewed en public.sale
    IF NEW.sale_id IS NOT NULL THEN
      UPDATE public.sale SET has_reviewed = true WHERE id = NEW.sale_id;
    END IF;
  END IF;

  -- Calcular promedio y total de reseñas publicadas
  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
    COUNT(*)
  INTO v_avg, v_count
  FROM public.review
  WHERE seller_id = v_seller_id
    AND status = 'published';

  -- Actualizar estadísticas de reputación en public.seller
  UPDATE public.seller
  SET
    rating_avg = v_avg,
    rating_count = v_count
  WHERE id = v_seller_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_seller_rating ON public.review;
CREATE TRIGGER trg_recalc_seller_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.review
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_recalc_seller_rating();

-- 3. Políticas de Seguridad RLS
ALTER TABLE public.review ENABLE ROW LEVEL SECURITY;

-- Lectura pública de reseñas aprobadas / publicadas
DROP POLICY IF EXISTS "review_public_read" ON public.review;
CREATE POLICY "review_public_read"
  ON public.review FOR SELECT
  USING (
    status = 'published'
    OR auth.uid() = buyer_user_id
    OR public.is_admin()
  );

-- Compradores autenticados pueden registrar reseñas
DROP POLICY IF EXISTS "review_authenticated_insert" ON public.review;
CREATE POLICY "review_authenticated_insert"
  ON public.review FOR INSERT
  WITH CHECK (
    auth.uid() = buyer_user_id
    OR public.is_admin()
  );

-- Comprador o admin pueden actualizar su propia reseña
DROP POLICY IF EXISTS "review_owner_update" ON public.review;
CREATE POLICY "review_owner_update"
  ON public.review FOR UPDATE
  USING (
    auth.uid() = buyer_user_id
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = buyer_user_id
    OR public.is_admin()
  );

-- 4. Inserción de reseñas de prueba verificadas para reputación inicial
DO $$
DECLARE
  v_buyer_id          UUID;
  v_seller_panaderia  UUID;
  v_seller_taller     UUID;
  v_seller_boutique   UUID;
  v_listing_pan       UUID;
  v_listing_taller    UUID;
  v_listing_boutique  UUID;
  v_sale_pan          UUID;
  v_sale_taller       UUID;
  v_sale_boutique     UUID;
BEGIN
  -- Obtener comprador
  SELECT id INTO v_buyer_id FROM public.app_user WHERE role = 'buyer' LIMIT 1;
  IF v_buyer_id IS NULL THEN
    SELECT id INTO v_buyer_id FROM auth.users WHERE email = 'comprador@marketplace.com' LIMIT 1;
  END IF;

  -- 1. Panadería Don Pancho
  SELECT id INTO v_seller_panaderia FROM public.seller WHERE business_name ILIKE '%Pancho%' OR business_name ILIKE '%Panader%' LIMIT 1;
  IF v_seller_panaderia IS NOT NULL AND v_buyer_id IS NOT NULL THEN
    SELECT id INTO v_listing_pan FROM public.listing WHERE seller_id = v_seller_panaderia LIMIT 1;
    SELECT id INTO v_sale_pan FROM public.sale WHERE seller_id = v_seller_panaderia LIMIT 1;

    IF v_listing_pan IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.review WHERE listing_id = v_listing_pan) THEN
      INSERT INTO public.review (
        listing_id, seller_id, buyer_user_id, sale_id, rating, comment, recommend, status, created_at
      ) VALUES (
        v_listing_pan, v_seller_panaderia, v_buyer_id, v_sale_pan, 5,
        '¡Totalmente recomendado! El pan campesino de masa madre tiene una corteza dorada y crujiente, y la miga súper suave. La entrega fue muy puntual.',
        true, 'published', now() - INTERVAL '1 day'
      );
    END IF;
  END IF;

  -- 2. Taller Moto & Auto Express
  SELECT id INTO v_seller_taller FROM public.seller WHERE business_name ILIKE '%Taller%' OR business_name ILIKE '%Express%' LIMIT 1;
  IF v_seller_taller IS NOT NULL AND v_buyer_id IS NOT NULL THEN
    SELECT id INTO v_listing_taller FROM public.listing WHERE seller_id = v_seller_taller LIMIT 1;
    SELECT id INTO v_sale_taller FROM public.sale WHERE seller_id = v_seller_taller LIMIT 1;

    IF v_listing_taller IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.review WHERE listing_id = v_listing_taller) THEN
      INSERT INTO public.review (
        listing_id, seller_id, buyer_user_id, sale_id, rating, comment, recommend, status, created_at
      ) VALUES (
        v_listing_taller, v_seller_taller, v_buyer_id, v_sale_taller, 5,
        'Excelente servicio mecánico. El tiempo estimado de 45 minutos se cumplió con total precisión, usaron el aceite sintético acordado y me entregaron el reporte de seguridad.',
        true, 'published', now() - INTERVAL '2 days'
      );
    END IF;
  END IF;

  -- 3. Boutique & Modas Elegancia
  SELECT id INTO v_seller_boutique FROM public.seller WHERE business_name ILIKE '%Boutique%' OR business_name ILIKE '%Modas%' LIMIT 1;
  IF v_seller_boutique IS NOT NULL AND v_buyer_id IS NOT NULL THEN
    SELECT id INTO v_listing_boutique FROM public.listing WHERE seller_id = v_seller_boutique LIMIT 1;
    SELECT id INTO v_sale_boutique FROM public.sale WHERE seller_id = v_seller_boutique LIMIT 1;

    IF v_listing_boutique IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.review WHERE listing_id = v_listing_boutique) THEN
      INSERT INTO public.review (
        listing_id, seller_id, buyer_user_id, sale_id, rating, comment, recommend, status, created_at
      ) VALUES (
        v_listing_boutique, v_seller_boutique, v_buyer_id, v_sale_boutique, 5,
        'Prenda de altísima calidad. Los bordados artesanales y los acabados en lino y seda superaron mis expectativas. Empaque muy cuidado y seguro.',
        true, 'published', now() - INTERVAL '3 days'
      );
    END IF;
  END IF;

  -- Forzar recálculo inicial en public.seller
  UPDATE public.seller s
  SET
    rating_avg = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.review r WHERE r.seller_id = s.id AND r.status = 'published'), s.rating_avg),
    rating_count = COALESCE((SELECT COUNT(*) FROM public.review r WHERE r.seller_id = s.id AND r.status = 'published'), s.rating_count);

END $$;

-- 5. Recargar caché de PostgREST
NOTIFY pgrst, 'reload schema';
