-- ============================================================
-- 018_user_administration_status_and_moderation.sql
--
-- Administración Integral de Usuarios (Bloqueo, Suspensión, Revisión y Permisos):
-- 1. Agrega columnas de estado y moderación administrativa a public.app_user.
-- 2. Registra el slot 'config.users_moderation' en public.ad_slot para
--    sincronizar expedientes de sanciones, permisos individuales e historial.
-- ============================================================

-- 1. Columnas de estado de cuenta y moderación en public.app_user
ALTER TABLE public.app_user
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- 2. Slot de persistencia de expedientes de moderación de usuarios
INSERT INTO public.ad_slot (id, surface, formats, max_ads)
VALUES (
  'config.users_moderation',
  'users_moderation',
  ARRAY['{}'],
  0
)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
