-- ============================================================
-- 005_ads_permissions_and_reload.sql
-- Módulo completo de Publicidad (Ads v1) y Contacto:
-- Crea las tablas faltantes (ad_account, ad_slot, ad_package, 
-- ad_order, wallet_transaction, ad_asset_check, contact_event, review),
-- configura índices, permisos, políticas RLS, semillas iniciales
-- y recarga el schema cache de PostgREST.
--
-- Ejecuta este script completo en el SQL Editor de Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Creación de Tablas (DDL) con IF NOT EXISTS
-- ------------------------------------------------------------

-- Aseguramos que advertiser exista (definida en 001_auth_and_core.sql)
CREATE TABLE IF NOT EXISTS public.advertiser (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     uuid REFERENCES public.seller(id) ON DELETE CASCADE,
  legal_name    text NOT NULL,
  status        text NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Cuenta publicitaria y balance prepago
CREATE TABLE IF NOT EXISTS public.ad_account (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id   uuid NOT NULL REFERENCES public.advertiser(id) ON DELETE CASCADE,
  balance         bigint NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT balance_non_negative CHECK (balance >= 0)
);
CREATE INDEX IF NOT EXISTS idx_ad_account_advertiser_id ON public.ad_account (advertiser_id);

-- Movimientos de saldo (recargas, cobro por orden, reembolsos)
CREATE TABLE IF NOT EXISTS public.wallet_transaction (
  id              bigserial PRIMARY KEY,
  ad_account_id   uuid NOT NULL REFERENCES public.ad_account(id) ON DELETE CASCADE,
  kind            text NOT NULL,   -- topup|spend|refund
  amount          bigint NOT NULL,
  balance_after   bigint NOT NULL,
  ref_type        text,            -- payment|ad_order|dispute
  ref_id          text,
  idempotency_key text UNIQUE,     -- obligatorio: evita duplicar recargas
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_transaction_account_id ON public.wallet_transaction (ad_account_id);

-- Espacios o ubicaciones publicitarias
CREATE TABLE IF NOT EXISTS public.ad_slot (
  id            text PRIMARY KEY,   -- 'search.top', 'category.banner', 'home.carousel'
  surface       text NOT NULL,      -- search|category|home|listing_page
  formats       text[] NOT NULL,
  max_ads       int NOT NULL DEFAULT 3
);

-- Paquetes de publicidad (precios fijos y duración)
CREATE TABLE IF NOT EXISTS public.ad_package (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  slot_id           text NOT NULL REFERENCES public.ad_slot(id) ON DELETE CASCADE,
  duration_days     int NOT NULL,
  price             bigint NOT NULL,
  max_active_slots  int NOT NULL DEFAULT 1,
  active            boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_ad_package_slot_id ON public.ad_package (slot_id);

-- Órdenes publicitarias / campañas de los vendedores
CREATE TABLE IF NOT EXISTS public.ad_order (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id   uuid NOT NULL REFERENCES public.ad_account(id) ON DELETE CASCADE,
  package_id      uuid NOT NULL REFERENCES public.ad_package(id) ON DELETE RESTRICT,
  listing_id      uuid REFERENCES public.listing(id) ON DELETE SET NULL,

  headline        text NOT NULL,
  body            text,
  image_url       text NOT NULL,
  cta_label       text DEFAULT 'Ver más',
  target_city     text,
  target_category text,

  status          text NOT NULL DEFAULT 'draft',
                  -- draft|submitted|in_review|approved|scheduled|live|rejected|paused|ended|cancelled
  reject_reason   text,
  reviewed_by     uuid REFERENCES public.app_user(id) ON DELETE SET NULL,
  reviewed_at     timestamptz,

  starts_at       timestamptz,
  ends_at         timestamptz,
  price_paid      bigint NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  submitted_at    timestamptz
);
CREATE INDEX IF NOT EXISTS idx_ad_order_ad_account_id ON public.ad_order (ad_account_id);
CREATE INDEX IF NOT EXISTS idx_ad_order_package_id ON public.ad_order (package_id);
CREATE INDEX IF NOT EXISTS idx_ad_order_listing_id ON public.ad_order (listing_id);
CREATE INDEX IF NOT EXISTS idx_ad_order_status ON public.ad_order (status);
CREATE INDEX IF NOT EXISTS idx_ad_order_live ON public.ad_order (starts_at, ends_at) WHERE status = 'live';

-- Validación técnica y automática de creatividades
CREATE TABLE IF NOT EXISTS public.ad_asset_check (
  ad_order_id     uuid PRIMARY KEY REFERENCES public.ad_order(id) ON DELETE CASCADE,
  width           int,
  height          int,
  size_kb         int,
  format_ok       boolean,
  size_ok         boolean,
  nsfw_score      numeric(4,3),
  text_length_ok  boolean,
  auto_flag       text   -- null|dimension_mismatch|too_heavy|nsfw_risk|profanity
);

-- Métricas diarias agregadas de anuncios
CREATE TABLE IF NOT EXISTS public.ad_stats_daily (
  day           date NOT NULL,
  ad_order_id   uuid NOT NULL REFERENCES public.ad_order(id) ON DELETE CASCADE,
  impressions   bigint NOT NULL DEFAULT 0,
  clicks        bigint NOT NULL DEFAULT 0,
  contacts      bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (day, ad_order_id)
);
CREATE INDEX IF NOT EXISTS idx_ad_stats_daily_order ON public.ad_stats_daily (ad_order_id);

-- Evento de contacto (WhatsApp / llamada)
CREATE TABLE IF NOT EXISTS public.contact_event (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid NOT NULL REFERENCES public.listing(id) ON DELETE CASCADE,
  buyer_user_id   uuid REFERENCES public.app_user(id) ON DELETE SET NULL,
  channel         text NOT NULL,   -- whatsapp|internal_message|phone
  ad_order_id     uuid REFERENCES public.ad_order(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contact_event_listing_id ON public.contact_event (listing_id);
CREATE INDEX IF NOT EXISTS idx_contact_event_ad_order_id ON public.contact_event (ad_order_id);

-- Reseñas
CREATE TABLE IF NOT EXISTS public.review (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    uuid NOT NULL REFERENCES public.listing(id) ON DELETE CASCADE,
  seller_id     uuid NOT NULL REFERENCES public.seller(id) ON DELETE CASCADE,
  buyer_user_id uuid NOT NULL REFERENCES public.app_user(id) ON DELETE CASCADE,
  rating        int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text,
  status        text NOT NULL DEFAULT 'published', -- published|hidden
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_review_listing_id ON public.review (listing_id);
CREATE INDEX IF NOT EXISTS idx_review_seller_id ON public.review (seller_id);

-- Solicitudes de recarga / compra de paquete publicitario (Billetera)
CREATE TABLE IF NOT EXISTS public.ad_recharge_request (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id   uuid NOT NULL REFERENCES public.ad_account(id) ON DELETE CASCADE,
  seller_id       uuid NOT NULL REFERENCES public.seller(id) ON DELETE CASCADE,
  package_id      uuid REFERENCES public.ad_package(id) ON DELETE SET NULL,
  amount          bigint NOT NULL,
  payment_method  text NOT NULL,       -- nequi|daviplata|bancolombia|transferencia|efectivo
  reference_code  text,                -- nro de comprobante / ref
  proof_image_url text,                -- comprobante adjunto
  notes           text,
  status          text NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  admin_notes     text,
  approved_by     uuid REFERENCES public.app_user(id) ON DELETE SET NULL,
  approved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recharge_request_account ON public.ad_recharge_request (ad_account_id);
CREATE INDEX IF NOT EXISTS idx_recharge_request_seller ON public.ad_recharge_request (seller_id);
CREATE INDEX IF NOT EXISTS idx_recharge_request_status ON public.ad_recharge_request (status);

-- ------------------------------------------------------------
-- 2. Permisos para los roles de Supabase (anon, authenticated, service_role)
-- ------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.advertiser TO authenticated, service_role;
GRANT SELECT ON TABLE public.advertiser TO anon;

GRANT ALL ON TABLE public.ad_account TO authenticated, service_role;
GRANT ALL ON TABLE public.wallet_transaction TO authenticated, service_role;
GRANT ALL ON TABLE public.ad_slot TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ad_package TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ad_order TO authenticated, service_role;
GRANT SELECT ON TABLE public.ad_order TO anon;
GRANT ALL ON TABLE public.ad_asset_check TO authenticated, service_role;
GRANT ALL ON TABLE public.ad_stats_daily TO authenticated, service_role;

GRANT ALL ON TABLE public.contact_event TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.review TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ad_recharge_request TO authenticated, service_role;
GRANT SELECT ON TABLE public.ad_recharge_request TO anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- ------------------------------------------------------------
-- 3. Semillas iniciales para slots y paquetes si no existen
-- ------------------------------------------------------------
INSERT INTO public.ad_slot (id, surface, formats, max_ads)
VALUES 
  ('search.top', 'search', ARRAY['card'], 3),
  ('category.banner', 'category', ARRAY['banner'], 2),
  ('home.carousel', 'home', ARRAY['carousel', 'banner'], 5)
ON CONFLICT (id) DO UPDATE SET
  surface = EXCLUDED.surface,
  formats = EXCLUDED.formats,
  max_ads = EXCLUDED.max_ads;

INSERT INTO public.ad_package (id, name, slot_id, duration_days, price, max_active_slots, active)
VALUES 
  ('d1000000-0000-0000-0000-000000000001', 'Destacado 7 días', 'search.top', 7, 30000, 1, true),
  ('d1000000-0000-0000-0000-000000000002', 'Destacado 14 días', 'search.top', 14, 50000, 1, true),
  ('d1000000-0000-0000-0000-000000000003', 'Banner Top 3 días', 'home.carousel', 3, 40000, 1, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slot_id = EXCLUDED.slot_id,
  duration_days = EXCLUDED.duration_days,
  price = EXCLUDED.price,
  max_active_slots = EXCLUDED.max_active_slots,
  active = EXCLUDED.active;

-- ------------------------------------------------------------
-- 4. Políticas de Seguridad RLS
-- ------------------------------------------------------------

-- advertiser
ALTER TABLE public.advertiser ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "advertiser_owner_all" ON public.advertiser;
CREATE POLICY "advertiser_owner_all"
  ON public.advertiser FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.seller s
      WHERE s.id = advertiser.seller_id
        AND s.owner_user_id = auth.uid()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.seller s
      WHERE s.id = advertiser.seller_id
        AND s.owner_user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- ad_account
ALTER TABLE public.ad_account ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_account_owner_all" ON public.ad_account;
CREATE POLICY "ad_account_owner_all"
  ON public.ad_account FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.advertiser a
      JOIN public.seller s ON s.id = a.seller_id
      WHERE a.id = ad_account.advertiser_id
        AND s.owner_user_id = auth.uid()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.advertiser a
      JOIN public.seller s ON s.id = a.seller_id
      WHERE a.id = ad_account.advertiser_id
        AND s.owner_user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- ad_slot (lectura pública)
ALTER TABLE public.ad_slot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_slot_public_read" ON public.ad_slot;
CREATE POLICY "ad_slot_public_read"
  ON public.ad_slot FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "ad_slot_admin_all" ON public.ad_slot;
CREATE POLICY "ad_slot_admin_all"
  ON public.ad_slot FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ad_package (lectura pública)
ALTER TABLE public.ad_package ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_package_public_read" ON public.ad_package;
CREATE POLICY "ad_package_public_read"
  ON public.ad_package FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "ad_package_admin_all" ON public.ad_package;
CREATE POLICY "ad_package_admin_all"
  ON public.ad_package FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ad_order
ALTER TABLE public.ad_order ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_order_owner_select" ON public.ad_order;
CREATE POLICY "ad_order_owner_select"
  ON public.ad_order FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_account a
      JOIN public.advertiser adv ON adv.id = a.advertiser_id
      JOIN public.seller s ON s.id = adv.seller_id
      WHERE a.id = ad_order.ad_account_id
        AND s.owner_user_id = auth.uid()
    )
    OR public.is_admin()
    OR status = 'live'
  );

DROP POLICY IF EXISTS "ad_order_owner_insert" ON public.ad_order;
CREATE POLICY "ad_order_owner_insert"
  ON public.ad_order FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ad_account a
      JOIN public.advertiser adv ON adv.id = a.advertiser_id
      JOIN public.seller s ON s.id = adv.seller_id
      WHERE a.id = ad_order.ad_account_id
        AND s.owner_user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "ad_order_admin_update" ON public.ad_order;
CREATE POLICY "ad_order_admin_update"
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
  )
  WITH CHECK (
    public.is_admin()
    OR status IN ('draft', 'submitted', 'paused')
  );

-- wallet_transaction
ALTER TABLE public.wallet_transaction ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallet_tx_owner_select" ON public.wallet_transaction;
CREATE POLICY "wallet_tx_owner_select"
  ON public.wallet_transaction FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_account a
      JOIN public.advertiser adv ON adv.id = a.advertiser_id
      JOIN public.seller s ON s.id = adv.seller_id
      WHERE a.id = wallet_transaction.ad_account_id
        AND s.owner_user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "wallet_tx_admin_all" ON public.wallet_transaction;
CREATE POLICY "wallet_tx_admin_all"
  ON public.wallet_transaction FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "wallet_tx_owner_insert" ON public.wallet_transaction;
CREATE POLICY "wallet_tx_owner_insert"
  ON public.wallet_transaction FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ad_account a
      JOIN public.advertiser adv ON adv.id = a.advertiser_id
      JOIN public.seller s ON s.id = adv.seller_id
      WHERE a.id = wallet_transaction.ad_account_id
        AND s.owner_user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- ad_asset_check
ALTER TABLE public.ad_asset_check ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_asset_check_all" ON public.ad_asset_check;
CREATE POLICY "ad_asset_check_all"
  ON public.ad_asset_check FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_order o
      JOIN public.ad_account a ON a.id = o.ad_account_id
      JOIN public.advertiser adv ON adv.id = a.advertiser_id
      JOIN public.seller s ON s.id = adv.seller_id
      WHERE o.id = ad_asset_check.ad_order_id
        AND s.owner_user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- ad_stats_daily
ALTER TABLE public.ad_stats_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_stats_daily_select" ON public.ad_stats_daily;
CREATE POLICY "ad_stats_daily_select"
  ON public.ad_stats_daily FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ad_order o
      JOIN public.ad_account a ON a.id = o.ad_account_id
      JOIN public.advertiser adv ON adv.id = a.advertiser_id
      JOIN public.seller s ON s.id = adv.seller_id
      WHERE o.id = ad_stats_daily.ad_order_id
        AND s.owner_user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- contact_event
ALTER TABLE public.contact_event ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_event_insert_anyone" ON public.contact_event;
CREATE POLICY "contact_event_insert_anyone"
  ON public.contact_event FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "contact_event_seller_select" ON public.contact_event;
CREATE POLICY "contact_event_seller_select"
  ON public.contact_event FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listing l
      JOIN public.seller s ON s.id = l.seller_id
      WHERE l.id = contact_event.listing_id
        AND s.owner_user_id = auth.uid()
    )
    OR auth.uid() = buyer_user_id
    OR public.is_admin()
  );

-- review
ALTER TABLE public.review ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_public_read" ON public.review;
CREATE POLICY "review_public_read"
  ON public.review FOR SELECT
  USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "review_authenticated_insert" ON public.review;
CREATE POLICY "review_authenticated_insert"
  ON public.review FOR INSERT
  WITH CHECK (auth.uid() = buyer_user_id);

-- ad_recharge_request
ALTER TABLE public.ad_recharge_request ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recharge_request_owner_select" ON public.ad_recharge_request;
CREATE POLICY "recharge_request_owner_select"
  ON public.ad_recharge_request FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.seller s
      WHERE s.id = ad_recharge_request.seller_id
        AND s.owner_user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "recharge_request_owner_insert" ON public.ad_recharge_request;
CREATE POLICY "recharge_request_owner_insert"
  ON public.ad_recharge_request FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.seller s
      WHERE s.id = ad_recharge_request.seller_id
        AND s.owner_user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "recharge_request_admin_all" ON public.ad_recharge_request;
CREATE POLICY "recharge_request_admin_all"
  ON public.ad_recharge_request FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- 5. Funciones Administrativas de Saldo y Billetera (Top-up)
-- ------------------------------------------------------------

-- Función atómica para acreditar/autorizar saldo desde el perfil de administrador
CREATE OR REPLACE FUNCTION public.admin_topup_balance(
  p_account_id uuid,
  p_amount bigint,
  p_ref_type text DEFAULT 'admin_topup',
  p_ref_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance bigint;
  v_tx_id bigint;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: se requieren permisos de administrador';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto a acreditar debe ser mayor a 0';
  END IF;

  -- Actualizar saldo de la cuenta publicitaria
  UPDATE public.ad_account
  SET balance = balance + p_amount
  WHERE id = p_account_id
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta publicitaria no encontrada';
  END IF;

  -- Registrar movimiento en auditoría de wallet_transaction
  INSERT INTO public.wallet_transaction (
    ad_account_id,
    kind,
    amount,
    balance_after,
    ref_type,
    ref_id,
    idempotency_key
  )
  VALUES (
    p_account_id,
    'topup',
    p_amount,
    v_new_balance,
    coalesce(p_ref_type, 'admin_topup'),
    p_ref_id,
    'topup_' || p_account_id::text || '_' || extract(epoch from now())::bigint || '_' || floor(random() * 100000)::text
  )
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'account_id', p_account_id,
    'amount', p_amount,
    'balance_after', v_new_balance,
    'transaction_id', v_tx_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_topup_balance(uuid, bigint, text, text) TO authenticated, service_role;

-- Función para inicializar cuenta publicitaria de un vendedor si aún no existe
CREATE OR REPLACE FUNCTION public.admin_get_or_create_ad_account(
  p_seller_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_adv_id uuid;
  v_acc_id uuid;
  v_seller_name text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: se requieren permisos de administrador';
  END IF;

  SELECT business_name INTO v_seller_name FROM public.seller WHERE id = p_seller_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendedor no encontrado';
  END IF;

  -- Buscar o crear advertiser
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = p_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (p_seller_id, coalesce(v_seller_name, 'Anunciante'), 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  -- Buscar o crear ad_account
  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 0)
    RETURNING id INTO v_acc_id;
  END IF;

  RETURN v_acc_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_or_create_ad_account(uuid) TO authenticated, service_role;

-- Función atómica para aprobar solicitud de recarga y acreditar saldo
CREATE OR REPLACE FUNCTION public.admin_approve_recharge_request(
  p_request_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req record;
  v_new_balance bigint;
  v_tx_id bigint;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: se requieren permisos de administrador';
  END IF;

  SELECT * INTO v_req
  FROM public.ad_recharge_request
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud de recarga no encontrada';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'La solicitud ya fue procesada anteriormente';
  END IF;

  -- 1. Actualizar estado de la solicitud
  UPDATE public.ad_recharge_request
  SET
    status = 'approved',
    admin_notes = p_admin_notes,
    approved_by = auth.uid(),
    approved_at = now()
  WHERE id = p_request_id;

  -- 2. Acreditar saldo en ad_account
  UPDATE public.ad_account
  SET balance = balance + v_req.amount
  WHERE id = v_req.ad_account_id
  RETURNING balance INTO v_new_balance;

  -- 3. Registrar movimiento en wallet_transaction
  INSERT INTO public.wallet_transaction (
    ad_account_id,
    kind,
    amount,
    balance_after,
    ref_type,
    ref_id,
    idempotency_key
  )
  VALUES (
    v_req.ad_account_id,
    'topup',
    v_req.amount,
    v_new_balance,
    v_req.payment_method,
    v_req.reference_code,
    'recharge_req_' || p_request_id::text
  )
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'amount', v_req.amount,
    'balance_after', v_new_balance,
    'transaction_id', v_tx_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_recharge_request(uuid, text) TO authenticated, service_role;

-- Función para rechazar solicitud de recarga
CREATE OR REPLACE FUNCTION public.admin_reject_recharge_request(
  p_request_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: se requieren permisos de administrador';
  END IF;

  UPDATE public.ad_recharge_request
  SET
    status = 'rejected',
    admin_notes = p_admin_notes,
    approved_by = auth.uid(),
    approved_at = now()
  WHERE id = p_request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud de recarga no encontrada o ya procesada';
  END IF;

  RETURN jsonb_build_object('success', true, 'request_id', p_request_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reject_recharge_request(uuid, text) TO authenticated, service_role;

-- ------------------------------------------------------------
-- 6. Notificar a PostgREST para reconstruir el Schema Cache
-- ------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
