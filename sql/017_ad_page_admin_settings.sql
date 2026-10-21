-- ============================================================
-- 017_ad_page_admin_settings.sql
--
-- Configuración Administrativa de la Página de Publicidad (Portada):
-- Registra el slot de configuración global 'config.ad_page' en public.ad_slot
-- para controlar la cantidad máxima de publicaciones por pasarela,
-- velocidad de visualización, visibilidad de bloques y futuras reglas.
-- ============================================================

INSERT INTO public.ad_slot (id, surface, formats, max_ads)
VALUES (
  'config.ad_page',
  'ad_page_settings',
  ARRAY['{"maxHeroItems":5,"maxServicesItems":10,"maxArticlesItems":20,"maxProductsItems":20,"maxMerchantsItems":10,"maxTotalListingsFetched":60,"maxPhotosPerItem":5,"showHeroRunway":true,"showServicesRunway":true,"showArticlesRunway":true,"showProductsRunway":true,"showMerchantsRunway":true,"showCatalogQuickCards":true,"showPromotionalBanner":true,"heroAutoRotate":true,"heroRotationSeconds":5,"runwayAutoScroll":true,"runwayScrollSpeed":0.65,"priorityMode":"all_with_priority","prioritizeVerifiedSellers":true,"performancePreset":"balanced","seasonalAnnouncementActive":false,"seasonalAnnouncementText":""}'],
  60
)
ON CONFLICT (id) DO UPDATE SET
  surface = EXCLUDED.surface,
  formats = EXCLUDED.formats,
  max_ads = EXCLUDED.max_ads;

NOTIFY pgrst, 'reload schema';
