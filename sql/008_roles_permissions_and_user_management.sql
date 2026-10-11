-- ============================================================
-- 008_roles_permissions_and_user_management.sql
-- 1. Asegura políticas RLS para que los administradores puedan
--    consultar y actualizar roles en public.app_user.
-- 2. Permite a los administradores gestionar todos los registros de usuarios.
-- 3. Recarga el esquema de PostgREST.
--
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- 1. Política para que administradores puedan ver y actualizar todos los usuarios en app_user
DROP POLICY IF EXISTS "app_user_admin_all" ON public.app_user;
CREATE POLICY "app_user_admin_all"
  ON public.app_user FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Política para permitir que administradores puedan gestionar sellers
DROP POLICY IF EXISTS "seller_admin_all" ON public.seller;
CREATE POLICY "seller_admin_all"
  ON public.seller FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Recargar caché de PostgREST
NOTIFY pgrst, 'reload schema';
