-- ============================================================
-- 007_restore_buyer_and_seed_two_sellers.sql
-- 1. Restaura comprador@marketplace.com a rol 'buyer' exclusivo.
--    Elimina cualquier vinculación como vendedor que tuviera comprador.
-- 2. Asegura vendedor@marketplace.com ('Panadería & Café El Alba').
-- 3. Crea Vendedor 2: vendedor2@marketplace.com ('Taller Moto & Auto Express').
-- 4. Crea Vendedor 3: vendedor3@marketplace.com ('Boutique & Modas Elegancia').
-- 5. Crea cuentas de anunciante (advertiser) y billeteras (ad_account)
--    con saldo aprobado para cada vendedor para permitir pruebas de campañas.
-- 6. Inserta publicaciones de prueba para los nuevos vendedores.
--
-- Contraseña para todos los usuarios: Password123!
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

DO $$
DECLARE
  v_buyer_id    uuid := 'a0000000-0000-0000-0000-000000000001';
  v_seller1_id  uuid := 'a0000000-0000-0000-0000-000000000002';
  v_admin_id    uuid := 'a0000000-0000-0000-0000-000000000003';
  v_seller2_id  uuid := 'a0000000-0000-0000-0000-000000000004';
  v_seller3_id  uuid := 'a0000000-0000-0000-0000-000000000005';
  
  encrypted_pw  text;
  
  v_s1_row_id   uuid;
  v_s2_row_id   uuid;
  v_s3_row_id   uuid;

  v_adv1_id     uuid;
  v_adv2_id     uuid;
  v_adv3_id     uuid;

  v_acc1_id     uuid;
  v_acc2_id     uuid;
  v_acc3_id     uuid;

  v_cat_serv    uuid;
  v_cat_ropa    uuid;
  v_cat_alim    uuid;
  v_cat_def     uuid;

  v_list2_1_id  uuid := 'b2000000-0000-0000-0000-000000000001';
  v_list2_2_id  uuid := 'b2000000-0000-0000-0000-000000000002';
  v_list3_1_id  uuid := 'b3000000-0000-0000-0000-000000000001';
  v_list3_2_id  uuid := 'b3000000-0000-0000-0000-000000000002';

BEGIN
  encrypted_pw := extensions.crypt('Password123!', extensions.gen_salt('bf'));

  -- ============================================================
  -- 1. RESTAURAR USUARIO COMPRADOR (comprador@marketplace.com)
  -- ============================================================
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'comprador@marketplace.com') THEN
    SELECT id INTO v_buyer_id FROM auth.users WHERE email = 'comprador@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name":"Carlos Comprador"}'::jsonb
    WHERE id = v_buyer_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_buyer_id, 'authenticated', 'authenticated',
      'comprador@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Carlos Comprador"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  -- Asegurar identidad auth
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_buyer_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_buyer_id, v_buyer_id,
      json_build_object('sub', v_buyer_id::text, 'email', 'comprador@marketplace.com')::jsonb,
      'email', v_buyer_id::text, now(), now(), now()
    );
  END IF;

  -- Restaurar perfil estrictamente a 'buyer'
  INSERT INTO public.app_user (id, full_name, role, city)
  VALUES (v_buyer_id, 'Carlos Comprador', 'buyer', 'Bogotá')
  ON CONFLICT (id) DO UPDATE SET role = 'buyer', full_name = 'Carlos Comprador';

  -- Desvincular cualquier seller que hubiera sido creado erróneamente para el comprador
  DELETE FROM public.seller WHERE owner_user_id = v_buyer_id;

  -- ============================================================
  -- 2. ASEGURAR VENDEDOR 1 (vendedor@marketplace.com - Valeria)
  -- ============================================================
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'vendedor@marketplace.com') THEN
    SELECT id INTO v_seller1_id FROM auth.users WHERE email = 'vendedor@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name":"Valeria Vendedora"}'::jsonb
    WHERE id = v_seller1_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_seller1_id, 'authenticated', 'authenticated',
      'vendedor@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Valeria Vendedora"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_seller1_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_seller1_id, v_seller1_id,
      json_build_object('sub', v_seller1_id::text, 'email', 'vendedor@marketplace.com')::jsonb,
      'email', v_seller1_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city)
  VALUES (v_seller1_id, 'Valeria Vendedora', 'seller', 'Medellín')
  ON CONFLICT (id) DO UPDATE SET role = 'seller', full_name = 'Valeria Vendedora';

  -- Obtener o crear negocio para vendedor 1
  SELECT id INTO v_s1_row_id FROM public.seller WHERE owner_user_id = v_seller1_id LIMIT 1;
  IF v_s1_row_id IS NULL THEN
    -- Si existe el registro de Panadería creado anteriormente, vincularlo a este usuario
    SELECT id INTO v_s1_row_id FROM public.seller WHERE business_name ILIKE '%Panadería%' LIMIT 1;
    IF v_s1_row_id IS NOT NULL THEN
      UPDATE public.seller SET owner_user_id = v_seller1_id WHERE id = v_s1_row_id;
    ELSE
      INSERT INTO public.seller (
        owner_user_id, business_name, business_type, city, phone, whatsapp, verified, description
      ) VALUES (
        v_seller1_id, 'Panadería & Café El Alba', 'Alimentos', 'Medellín',
        '573001234567', '573001234567', true,
        'Especialistas en panadería tradicional, café especial y repostería artesanal.'
      ) RETURNING id INTO v_s1_row_id;
    END IF;
  END IF;

  -- Anunciante y cuenta para vendedor 1
  SELECT id INTO v_adv1_id FROM public.advertiser WHERE seller_id = v_s1_row_id LIMIT 1;
  IF v_adv1_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_s1_row_id, 'Panadería & Café El Alba', 'active')
    RETURNING id INTO v_adv1_id;
  END IF;

  SELECT id INTO v_acc1_id FROM public.ad_account WHERE advertiser_id = v_adv1_id LIMIT 1;
  IF v_acc1_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv1_id, 50000)
    RETURNING id INTO v_acc1_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 50000) WHERE id = v_acc1_id;
  END IF;

  -- ============================================================
  -- 3. CREAR VENDEDOR 2 (vendedor2@marketplace.com - Mateo)
  -- ============================================================
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'vendedor2@marketplace.com') THEN
    SELECT id INTO v_seller2_id FROM auth.users WHERE email = 'vendedor2@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name":"Mateo Mecánico"}'::jsonb
    WHERE id = v_seller2_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_seller2_id, 'authenticated', 'authenticated',
      'vendedor2@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Mateo Mecánico"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_seller2_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_seller2_id, v_seller2_id,
      json_build_object('sub', v_seller2_id::text, 'email', 'vendedor2@marketplace.com')::jsonb,
      'email', v_seller2_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city)
  VALUES (v_seller2_id, 'Mateo Mecánico', 'seller', 'Bogotá')
  ON CONFLICT (id) DO UPDATE SET role = 'seller', full_name = 'Mateo Mecánico', city = 'Bogotá';

  -- Negocio para Vendedor 2
  SELECT id INTO v_s2_row_id FROM public.seller WHERE owner_user_id = v_seller2_id LIMIT 1;
  IF v_s2_row_id IS NULL THEN
    INSERT INTO public.seller (
      owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller2_id, 'Taller Moto & Auto Express', 'Servicios y Mecánica', 'Bogotá',
      '573101234567', '573101234567', true, 4.90, 14,
      'Taller automotriz especializado en mantenimiento preventivo, cambio de fluidos, frenos y escaneo computarizado.'
    ) RETURNING id INTO v_s2_row_id;
  END IF;

  -- Anunciante y cuenta para Vendedor 2
  SELECT id INTO v_adv2_id FROM public.advertiser WHERE seller_id = v_s2_row_id LIMIT 1;
  IF v_adv2_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_s2_row_id, 'Taller Moto & Auto Express', 'active')
    RETURNING id INTO v_adv2_id;
  END IF;

  SELECT id INTO v_acc2_id FROM public.ad_account WHERE advertiser_id = v_adv2_id LIMIT 1;
  IF v_acc2_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv2_id, 60000)
    RETURNING id INTO v_acc2_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 60000) WHERE id = v_acc2_id;
  END IF;

  -- ============================================================
  -- 4. CREAR VENDEDOR 3 (vendedor3@marketplace.com - Camila)
  -- ============================================================
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'vendedor3@marketplace.com') THEN
    SELECT id INTO v_seller3_id FROM auth.users WHERE email = 'vendedor3@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name":"Camila Confecciones"}'::jsonb
    WHERE id = v_seller3_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_seller3_id, 'authenticated', 'authenticated',
      'vendedor3@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Camila Confecciones"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_seller3_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_seller3_id, v_seller3_id,
      json_build_object('sub', v_seller3_id::text, 'email', 'vendedor3@marketplace.com')::jsonb,
      'email', v_seller3_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city)
  VALUES (v_seller3_id, 'Camila Confecciones', 'seller', 'Cali')
  ON CONFLICT (id) DO UPDATE SET role = 'seller', full_name = 'Camila Confecciones', city = 'Cali';

  -- Negocio para Vendedor 3
  SELECT id INTO v_s3_row_id FROM public.seller WHERE owner_user_id = v_seller3_id LIMIT 1;
  IF v_s3_row_id IS NULL THEN
    INSERT INTO public.seller (
      owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller3_id, 'Boutique & Modas Elegancia', 'Ropa y Accesorios', 'Cali',
      '573201234567', '573201234567', true, 4.85, 21,
      'Diseño y confección artesanal colombiana. Vestidos de gala, prendas de lino y accesorios sostenibles.'
    ) RETURNING id INTO v_s3_row_id;
  END IF;

  -- Anunciante y cuenta para Vendedor 3
  SELECT id INTO v_adv3_id FROM public.advertiser WHERE seller_id = v_s3_row_id LIMIT 1;
  IF v_adv3_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_s3_row_id, 'Boutique & Modas Elegancia', 'active')
    RETURNING id INTO v_adv3_id;
  END IF;

  SELECT id INTO v_acc3_id FROM public.ad_account WHERE advertiser_id = v_adv3_id LIMIT 1;
  IF v_acc3_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv3_id, 50000)
    RETURNING id INTO v_acc3_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 50000) WHERE id = v_acc3_id;
  END IF;

  -- ============================================================
  -- 5. INSERTAR PUBLICACIONES DE PRUEBA PARA VENDEDORES 2 Y 3
  -- ============================================================
  -- Detectar categorías disponibles (la tabla category se ordena por 'name')
  SELECT id INTO v_cat_serv FROM public.category WHERE slug IN ('servicios-hogar', 'servicios') LIMIT 1;
  SELECT id INTO v_cat_ropa FROM public.category WHERE slug IN ('ropa-accesorios', 'ropa') LIMIT 1;
  SELECT id INTO v_cat_alim FROM public.category WHERE slug IN ('alimentos', 'comida') LIMIT 1;
  SELECT id INTO v_cat_def  FROM public.category ORDER BY name ASC LIMIT 1;

  IF v_cat_def IS NULL THEN
    -- Si la tabla category no tuviera registros previos
    INSERT INTO public.category (name, slug, applies_to)
    VALUES ('Servicios para el hogar', 'servicios-hogar', 'service')
    RETURNING id INTO v_cat_serv;

    INSERT INTO public.category (name, slug, applies_to)
    VALUES ('Ropa y Accesorios', 'ropa-accesorios', 'product')
    RETURNING id INTO v_cat_ropa;

    v_cat_def := v_cat_serv;
  END IF;

  IF v_cat_serv IS NULL THEN v_cat_serv := v_cat_def; END IF;
  IF v_cat_ropa IS NULL THEN v_cat_ropa := v_cat_def; END IF;

  -- Publicaciones de Vendedor 2 (Taller Moto & Auto Express)
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list2_1_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list2_1_id, v_s2_row_id, v_cat_serv, 'service',
      'Mantenimiento Preventivo y Cambio de Aceite Sintético',
      'Incluye cambio de filtro de aceite, revisión de niveles de frenos, refrigerante y chequeo de 25 puntos de seguridad.',
      85000, 'servicio', 'Bogotá', 'published', 20,
      '{"modalidad":"Presencial en Taller","garantia":"3 meses","tiempo_estimado":"45 minutos"}'::jsonb
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list2_2_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list2_2_id, v_s2_row_id, v_cat_serv, 'service',
      'Diagnóstico Computarizado y Escaneo con Scanner OBD2',
      'Diagnóstico electrónico completo de motor, transmisión y sensores para vehículos a inyección electrónica.',
      50000, 'revisión', 'Bogotá', 'published', 15,
      '{"modalidad":"Presencial","informe":"Digital PDF","tiempo_estimado":"30 minutos"}'::jsonb
    );
  END IF;

  -- Publicaciones de Vendedor 3 (Boutique & Modas Elegancia)
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list3_1_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list3_1_id, v_s3_row_id, v_cat_ropa, 'product',
      'Vestido de Gala Artesanal en Seda y Lino Colombiano',
      'Diseño exclusivo con finos bordados hechos a mano por artesanas colombianas. Disponible en tallas S, M y L.',
      160000, 'unidad', 'Cali', 'published', 8,
      '{"material":"Lino y Seda","tallas":"S, M, L","envio":"Nacional gratis"}'::jsonb
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list3_2_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list3_2_id, v_s3_row_id, v_cat_ropa, 'product',
      'Guayabera Clásica Manga Larga 100% Algodón',
      'Camisa guayabera tradicional color blanco marfil con detalles alforzados frontales y botones de nácar.',
      95000, 'unidad', 'Cali', 'published', 12,
      '{"material":"100% Algodón","color":"Blanco Marfil","tallas":"M, L, XL"}'::jsonb
    );
  END IF;

  -- Auto-confirmar usuarios en auth.users
  UPDATE auth.users
  SET email_confirmed_at = coalesce(email_confirmed_at, now()),
      confirmation_token = coalesce(confirmation_token, ''),
      recovery_token = coalesce(recovery_token, '')
  WHERE email IN ('comprador@marketplace.com', 'vendedor@marketplace.com', 'vendedor2@marketplace.com', 'vendedor3@marketplace.com', 'admin@marketplace.com');

END;
$$;

-- Notificar recarga del esquema
NOTIFY pgrst, 'reload schema';
