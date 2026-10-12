-- ============================================================
-- 011_fix_listing_inventory_rls_policies.sql
-- Corrige las políticas RLS de public.listing para permitir que:
-- 1. Los vendedores puedan actualizar el stock, tiempos y atributos
--    de sus publicaciones (incluso cuando el anuncio esté en estado 'published').
-- 2. Los administradores puedan actualizar cualquier publicación sin restricción.
-- 3. Recarga la caché del esquema de PostgREST.
--
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- 1. Eliminar políticas restrictivas previas de actualización
DROP POLICY IF EXISTS "listing_owner_update" ON public.listing;
DROP POLICY IF EXISTS "listing_admin_all" ON public.listing;
DROP POLICY IF EXISTS "listing_admin_update" ON public.listing;
DROP POLICY IF EXISTS "listing_owner_read_all" ON public.listing;
DROP POLICY IF EXISTS "listing_public_read_published" ON public.listing;

-- 2. Política de lectura (Pública para publicados, o autor/admin para cualquier estado)
CREATE POLICY "listing_read_policy"
  ON public.listing FOR SELECT
  USING (
    status = 'published'
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.seller s
      WHERE s.id = listing.seller_id
        AND s.owner_user_id = auth.uid()
    )
  );

-- 3. Política de actualización (Permite ajustar stock, tiempos, attrs y estado a dueños y admin)
CREATE POLICY "listing_owner_update"
  ON public.listing FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.seller s
      WHERE s.id = listing.seller_id
        AND s.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.seller s
      WHERE s.id = listing.seller_id
        AND s.owner_user_id = auth.uid()
    )
  );

-- 4. Política de inserción (Dueño para su seller o admin)
DROP POLICY IF EXISTS "listing_owner_insert" ON public.listing;
CREATE POLICY "listing_owner_insert"
  ON public.listing FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.seller s
      WHERE s.id = listing.seller_id
        AND s.owner_user_id = auth.uid()
    )
  );

-- 5. Política de eliminación (Dueño o admin)
DROP POLICY IF EXISTS "listing_owner_delete" ON public.listing;
CREATE POLICY "listing_owner_delete"
  ON public.listing FOR DELETE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.seller s
      WHERE s.id = listing.seller_id
        AND s.owner_user_id = auth.uid()
    )
  );

-- 6. Política total para administradores
CREATE POLICY "listing_admin_all"
  ON public.listing FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Asegurar permisos de acceso a la tabla
GRANT ALL ON TABLE public.listing TO authenticated, service_role;
GRANT SELECT ON TABLE public.listing TO anon;

-- 8. Recargar caché de PostgREST
NOTIFY pgrst, 'reload schema';
