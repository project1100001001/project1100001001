-- ============================================================
-- 006_unify_single_seller_and_clean_accounts.sql
-- 1. Unifica el sistema en UN SOLO VENDEDOR de pruebas
--    ('Panadería & Café El Alba' - ID: 89622431-d367-4160-8d6d-74e888eb535b).
-- 2. Reasigna todos los productos/servicios a este vendedor único.
-- 3. Elimina vendedores secundarios ('Negocio nuevo de prueba').
-- 4. Elimina cuentas publicitarias y anunciantes duplicados.
-- 5. Asegura 1 sola cuenta de anunciante y saldo aprobado para pruebas.
-- 6. Agrega restricciones UNIQUE para evitar duplicados en el futuro.
-- ============================================================

DO $$
DECLARE
  v_main_seller_id uuid := '89622431-d367-4160-8d6d-74e888eb535b';
  v_adv_id uuid;
  v_acc_id uuid;
BEGIN
  -- 1. Asegurar que el vendedor principal existe
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_main_seller_id) THEN
    -- Si no existía con ese ID exacto, tomar el primer vendedor disponible
    SELECT id INTO v_main_seller_id FROM public.seller ORDER BY created_at ASC LIMIT 1;
  END IF;

  -- 2. Reasignar todos los listings al vendedor principal
  UPDATE public.listing
  SET seller_id = v_main_seller_id
  WHERE seller_id IS DISTINCT FROM v_main_seller_id;

  -- 3. Reasignar solicitudes de recarga al vendedor principal
  UPDATE public.ad_recharge_request
  SET seller_id = v_main_seller_id
  WHERE seller_id IS DISTINCT FROM v_main_seller_id;

  -- 4. Eliminar otros vendedores de prueba duplicados
  DELETE FROM public.seller
  WHERE id <> v_main_seller_id;

  -- 5. Limpiar anunciantes y cuentas duplicadas
  -- Primero eliminamos wallet_transactions huérfanas si hubiere
  DELETE FROM public.wallet_transaction
  WHERE ad_account_id NOT IN (
    SELECT id FROM public.ad_account WHERE advertiser_id IN (
      SELECT id FROM public.advertiser WHERE seller_id = v_main_seller_id
    )
  );

  -- 6. Buscar o crear el anunciante único para el vendedor principal
  SELECT id INTO v_adv_id 
  FROM public.advertiser 
  WHERE seller_id = v_main_seller_id 
  ORDER BY created_at ASC 
  LIMIT 1;

  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_main_seller_id, 'Panadería & Café El Alba', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  -- Eliminar cualquier otro anunciante duplicado
  DELETE FROM public.ad_account WHERE advertiser_id <> v_adv_id;
  DELETE FROM public.advertiser WHERE id <> v_adv_id;

  -- 7. Buscar o crear la cuenta publicitaria única
  SELECT id INTO v_acc_id 
  FROM public.ad_account 
  WHERE advertiser_id = v_adv_id 
  ORDER BY balance DESC, created_at ASC 
  LIMIT 1;

  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 50000)
    RETURNING id INTO v_acc_id;
  ELSE
    -- Asegurar saldo de pruebas (al menos 50.000 COP)
    UPDATE public.ad_account
    SET balance = GREATEST(balance, 50000)
    WHERE id = v_acc_id;
  END IF;

  -- Eliminar cuentas duplicadas para este mismo anunciante
  DELETE FROM public.ad_account 
  WHERE advertiser_id = v_adv_id AND id <> v_acc_id;

  -- Vincular solicitudes de recarga a la cuenta única
  UPDATE public.ad_recharge_request
  SET ad_account_id = v_acc_id;

  -- Vincular órdenes publicitarias a la cuenta única
  UPDATE public.ad_order
  SET ad_account_id = v_acc_id;

END;
$$;

-- 8. Restricciones UNIQUE para prevenir duplicados en el futuro
ALTER TABLE public.advertiser DROP CONSTRAINT IF EXISTS uq_advertiser_seller;
ALTER TABLE public.advertiser ADD CONSTRAINT uq_advertiser_seller UNIQUE (seller_id);

ALTER TABLE public.ad_account DROP CONSTRAINT IF EXISTS uq_ad_account_advertiser;
ALTER TABLE public.ad_account ADD CONSTRAINT uq_ad_account_advertiser UNIQUE (advertiser_id);

-- 9. Política para permitir que administradores puedan gestionar sellers
DROP POLICY IF EXISTS "sellers_admin_all" ON public.seller;
CREATE POLICY "sellers_admin_all"
  ON public.seller FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Recargar caché de PostgREST
NOTIFY pgrst, 'reload schema';
