-- ============================================================
-- 016_advertising_policies_and_plans.sql
--
-- Políticas Oficiales de Publicidad:
-- 1. Cuando se crea un producto o servicio dura inicialmente
--    7 días con publicidad gratis ($0 COP).
-- 2. Luego aplican los planes oficiales (duración 7 días):
--    - Plan Individual: Pasarela        -> $10.000 COP
--    - Plan Individual: Gran Vitrina    -> $20.000 COP
--    - Plan en Combo (Las dos)          -> $25.000 COP
--
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- 1. Actualizar slots publicitarios oficiales
INSERT INTO public.ad_slot (id, surface, formats, max_ads)
VALUES
  ('search.top', 'runway', ARRAY['card', 'runway'], 20),
  ('home.carousel', 'hero', ARRAY['hero', 'banner'], 5),
  ('category.banner', 'combo', ARRAY['hero', 'runway', 'combo'], 10),
  ('free.initial', 'free_trial', ARRAY['runway', 'hero'], 50)
ON CONFLICT (id) DO UPDATE SET
  surface = EXCLUDED.surface,
  formats = EXCLUDED.formats,
  max_ads = EXCLUDED.max_ads;

-- 2. Actualizar los Paquetes Publicitarios Oficiales (ad_package)
INSERT INTO public.ad_package (id, name, slot_id, duration_days, price, max_active_slots, active)
VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    'Plan Individual: Pasarela',
    'search.top',
    7,
    10000,
    1,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    'Plan Individual: Gran Vitrina',
    'home.carousel',
    7,
    20000,
    1,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000003',
    'Plan en Combo: Gran Vitrina + Pasarela',
    'category.banner',
    7,
    25000,
    2,
    true
  ),
  (
    'd1000000-0000-0000-0000-000000000000',
    'Publicidad Inicial Gratis (7 días)',
    'free.initial',
    7,
    0,
    1,
    false
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slot_id = EXCLUDED.slot_id,
  duration_days = EXCLUDED.duration_days,
  price = EXCLUDED.price,
  max_active_slots = EXCLUDED.max_active_slots,
  active = EXCLUDED.active;

-- 3. Trigger para asignar automáticamente los 7 días de publicidad gratis inicial
--    cuando se crea o aprueba un producto o servicio en public.listing
CREATE OR REPLACE FUNCTION public.fn_assign_initial_free_7days_ad()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_ts timestamptz;
  v_end_ts   timestamptz;
BEGIN
  v_start_ts := COALESCE(NEW.published_at, NEW.created_at, now());
  v_end_ts   := v_start_ts + interval '7 days';

  IF NEW.attrs IS NULL THEN
    NEW.attrs := '{}'::jsonb;
  END IF;

  -- Si aún no tiene configurada la vigencia inicial gratuita de 7 días, registrarla
  IF (NEW.attrs->>'free_ad_starts_at') IS NULL THEN
    NEW.attrs := NEW.attrs || jsonb_build_object(
      'free_trial_days', 7,
      'free_ad_starts_at', v_start_ts,
      'free_ad_ends_at', v_end_ts,
      'ad_policy', '7_days_free_initial'
    );
  END IF;

  -- Cuando pasa a estado 'published' por primera vez, reiniciar el contador de 7 días desde la publicación
  IF TG_OP = 'UPDATE' AND OLD.status <> 'published' AND NEW.status = 'published' THEN
    v_start_ts := now();
    v_end_ts   := v_start_ts + interval '7 days';
    NEW.published_at := COALESCE(NEW.published_at, v_start_ts);
    NEW.attrs := NEW.attrs || jsonb_build_object(
      'free_trial_days', 7,
      'free_ad_starts_at', v_start_ts,
      'free_ad_ends_at', v_end_ts,
      'ad_policy', '7_days_free_initial'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listing_free_7days_ad ON public.listing;
CREATE TRIGGER trg_listing_free_7days_ad
  BEFORE INSERT OR UPDATE ON public.listing
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_assign_initial_free_7days_ad();

-- 4. Actualizar publicaciones existentes para garantizar sus metadatos de 7 días gratis iniciales
UPDATE public.listing
SET attrs = COALESCE(attrs, '{}'::jsonb) || jsonb_build_object(
  'free_trial_days', 7,
  'free_ad_starts_at', COALESCE(published_at, created_at, now()),
  'free_ad_ends_at', COALESCE(published_at, created_at, now()) + interval '7 days',
  'ad_policy', '7_days_free_initial'
)
WHERE (attrs->>'free_ad_starts_at') IS NULL;

-- Notificar recarga de caché a PostgREST
NOTIFY pgrst, 'reload schema';
