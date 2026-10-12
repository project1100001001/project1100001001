-- =========================================================================
-- 014_clean_mock_ad_images.sql
-- Limpia URLs de imágenes de prueba (unsplash, placeholder, etc.) en ad_order
-- para que muestren íconos y emojis temáticos idénticos al catálogo
-- =========================================================================

UPDATE public.ad_order
SET image_url = NULL
WHERE image_url ILIKE '%unsplash%'
   OR image_url ILIKE '%placeholder%'
   OR image_url ILIKE '%picsum%'
   OR image_url ILIKE '%dummyimage%'
   OR image_url ILIKE '%example.com%';

NOTIFY pgrst, 'reload schema';
