-- ============================================================
-- 019_fix_ad_order_update_rls.sql
-- Corrige la política RLS de actualización (UPDATE) en public.ad_order
-- para permitir que los vendedores dueños de la cuenta publicitaria
-- o dueños de la publicación vinculada puedan editar los campos y
-- la imagen cargada (image_url, headline, body, target_city, etc.)
-- de sus campañas sin importar si están en estado 'live', 'submitted',
-- 'in_review', 'approved', 'scheduled', 'draft' o 'paused'.
--
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

DROP POLICY IF EXISTS "ad_order_admin_update" ON public.ad_order;
DROP POLICY IF EXISTS "ad_order_owner_update" ON public.ad_order;

CREATE POLICY "ad_order_owner_update"
  ON public.ad_order FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.ad_account a
      JOIN public.advertiser adv ON adv.id = a.advertiser_id
      JOIN public.seller s ON s.id = adv.seller_id
      WHERE a.id = ad_order.ad_account_id
        AND s.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.listing l
      JOIN public.seller s ON s.id = l.seller_id
      WHERE l.id = ad_order.listing_id
        AND s.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.ad_account a
      JOIN public.advertiser adv ON adv.id = a.advertiser_id
      JOIN public.seller s ON s.id = adv.seller_id
      WHERE a.id = ad_order.ad_account_id
        AND s.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.listing l
      JOIN public.seller s ON s.id = l.seller_id
      WHERE l.id = ad_order.listing_id
        AND s.owner_user_id = auth.uid()
    )
  );

-- Notificar recarga de esquema a PostgREST
NOTIFY pgrst, 'reload schema';
