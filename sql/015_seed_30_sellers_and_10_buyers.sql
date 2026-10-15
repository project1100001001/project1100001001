-- ============================================================
-- 015_seed_30_sellers_and_10_buyers.sql
--
-- Genera 40 nuevos usuarios para pruebas exhaustivas:
-- 1. 10 Usuarios Compradores (buyer)
-- 2. 10 Vendedores de Servicios (10 servicios c/u = 100 servicios)
-- 3. 10 Vendedores de Productos Usados (10 artículos c/u = 100 artículos usados)
-- 4. 10 Vendedores de Productos Nuevos (10 productos c/u = 100 productos nuevos)
-- Total publicaciones nuevas: 300
--
-- Contraseña universal: Password123!
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

DO $$
DECLARE
  encrypted_pw text;
  v_user_id    uuid;
  v_seller_id  uuid;
  v_adv_id     uuid;
  v_acc_id     uuid;
  v_list_id    uuid;
BEGIN
  -- Generar hash bcrypt para 'Password123!'
  encrypted_pw := extensions.crypt('Password123!', extensions.gen_salt('bf'));

  -- ============================================================
  -- PARTE 1: 10 USUARIOS COMPRADORES
  -- ============================================================

  -- Comprador 1: Camila Torres (comprador1@marketplace.com)
  v_user_id := 'a1000000-0000-0000-0000-000000000001';
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'comprador1@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'comprador1@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Camila Torres"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'comprador1@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Camila Torres"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'comprador1@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Camila Torres', 'buyer', 'Bogotá', '3001112201')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'buyer', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Comprador 2: Andrés Gómez (comprador2@marketplace.com)
  v_user_id := 'a1000000-0000-0000-0000-000000000002';
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'comprador2@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'comprador2@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Andrés Gómez"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'comprador2@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Andrés Gómez"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'comprador2@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Andrés Gómez', 'buyer', 'Medellín', '3001112202')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'buyer', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Comprador 3: Valentina Morales (comprador3@marketplace.com)
  v_user_id := 'a1000000-0000-0000-0000-000000000003';
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'comprador3@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'comprador3@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Valentina Morales"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'comprador3@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Valentina Morales"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'comprador3@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Valentina Morales', 'buyer', 'Cali', '3001112203')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'buyer', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Comprador 4: Santiago Restrepo (comprador4@marketplace.com)
  v_user_id := 'a1000000-0000-0000-0000-000000000004';
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'comprador4@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'comprador4@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Santiago Restrepo"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'comprador4@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Santiago Restrepo"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'comprador4@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Santiago Restrepo', 'buyer', 'Barranquilla', '3001112204')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'buyer', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Comprador 5: Mariana Ospina (comprador5@marketplace.com)
  v_user_id := 'a1000000-0000-0000-0000-000000000005';
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'comprador5@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'comprador5@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Mariana Ospina"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'comprador5@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Mariana Ospina"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'comprador5@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Mariana Ospina', 'buyer', 'Bucaramanga', '3001112205')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'buyer', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Comprador 6: Daniel Vargas (comprador6@marketplace.com)
  v_user_id := 'a1000000-0000-0000-0000-000000000006';
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'comprador6@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'comprador6@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Daniel Vargas"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'comprador6@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Daniel Vargas"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'comprador6@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Daniel Vargas', 'buyer', 'Cartagena', '3001112206')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'buyer', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Comprador 7: Laura Castro (comprador7@marketplace.com)
  v_user_id := 'a1000000-0000-0000-0000-000000000007';
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'comprador7@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'comprador7@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Laura Castro"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'comprador7@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Laura Castro"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'comprador7@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Laura Castro', 'buyer', 'Pereira', '3001112207')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'buyer', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Comprador 8: Felipe Herrera (comprador8@marketplace.com)
  v_user_id := 'a1000000-0000-0000-0000-000000000008';
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'comprador8@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'comprador8@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Felipe Herrera"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'comprador8@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Felipe Herrera"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'comprador8@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Felipe Herrera', 'buyer', 'Manizales', '3001112208')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'buyer', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Comprador 9: Natalia Rincón (comprador9@marketplace.com)
  v_user_id := 'a1000000-0000-0000-0000-000000000009';
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'comprador9@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'comprador9@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Natalia Rincón"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'comprador9@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Natalia Rincón"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'comprador9@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Natalia Rincón', 'buyer', 'Santa Marta', '3001112209')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'buyer', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Comprador 10: Esteban Jaramillo (comprador10@marketplace.com)
  v_user_id := 'a1000000-0000-0000-0000-00000000000a';
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'comprador10@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'comprador10@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Esteban Jaramillo"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'comprador10@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Esteban Jaramillo"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'comprador10@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Esteban Jaramillo', 'buyer', 'Cúcuta', '3001112210')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'buyer', city = EXCLUDED.city, phone = EXCLUDED.phone;


  -- ============================================================
  -- PARTE 2: 10 VENDEDORES DE SERVICIOS (100 SERVICIOS)
  -- ============================================================

  -- Vendedor 1: Plomería & Redes Hidráulicas Pro (servicio1@marketplace.com)
  v_user_id := 'b1000000-0000-0000-0000-000000000001';
  v_seller_id := 'c1000000-0000-0000-0000-000000000001';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'servicio1@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'servicio1@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Carlos Plomero"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'servicio1@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Carlos Plomero"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'servicio1@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Carlos Plomero', 'seller', 'Bogotá', '3102223301')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Plomería & Redes Hidráulicas Pro', 'Servicios del Hogar', 'Bogotá',
      '573102223301', '573102223301', true, 4.90, 15,
      'Comercio formalizado en Bogotá especializado en servicios del hogar. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Plomería & Redes Hidráulicas Pro',
        owner_user_id = v_user_id,
        city = 'Bogotá',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Plomería & Redes Hidráulicas Pro', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Plomería & Redes Hidráulicas Pro
  v_list_id := 'd1000000-0001-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Destape de Cañerías con Sonda Eléctrica',
      'Limpieza y destape rápido sin romper baldosas ni tuberías.',
      85000, 'servicio', 'Bogotá', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Destape de Cañerías con Sonda Eléctrica',
        description = 'Limpieza y destape rápido sin romper baldosas ni tuberías.',
        price = 85000,
        type = 'service',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Plomería & Redes Hidráulicas Pro
  v_list_id := 'd1000000-0001-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Reparación de Fugas y Filtraciones Ocultas',
      'Detección de humedades y arreglo de tuberías de agua potable.',
      120000, 'servicio', 'Bogotá', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Reparación de Fugas y Filtraciones Ocultas',
        description = 'Detección de humedades y arreglo de tuberías de agua potable.',
        price = 120000,
        type = 'service',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Plomería & Redes Hidráulicas Pro
  v_list_id := 'd1000000-0001-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Instalación y Mantenimiento de Calentadores',
      'Revisión técnica de calentadores a gas y eléctricos.',
      95000, 'servicio', 'Bogotá', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Instalación y Mantenimiento de Calentadores',
        description = 'Revisión técnica de calentadores a gas y eléctricos.',
        price = 95000,
        type = 'service',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Plomería & Redes Hidráulicas Pro
  v_list_id := 'd1000000-0001-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Instalación de Griferías y Sanitarios Modernos',
      'Montaje profesional de griferías, lavamanos y duchas.',
      75000, 'servicio', 'Bogotá', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Instalación de Griferías y Sanitarios Modernos',
        description = 'Montaje profesional de griferías, lavamanos y duchas.',
        price = 75000,
        type = 'service',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Plomería & Redes Hidráulicas Pro
  v_list_id := 'd1000000-0001-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Mantenimiento y Lavado de Tanques de Agua',
      'Desinfección profunda certificada para casas y edificios.',
      140000, 'servicio', 'Bogotá', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Mantenimiento y Lavado de Tanques de Agua',
        description = 'Desinfección profunda certificada para casas y edificios.',
        price = 140000,
        type = 'service',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Plomería & Redes Hidráulicas Pro
  v_list_id := 'd1000000-0001-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Aumento de Presión de Agua e Hidroflores',
      'Instalación y calibración de bombas hidroneumáticas residenciales.',
      160000, 'servicio', 'Bogotá', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Aumento de Presión de Agua e Hidroflores',
        description = 'Instalación y calibración de bombas hidroneumáticas residenciales.',
        price = 160000,
        type = 'service',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Plomería & Redes Hidráulicas Pro
  v_list_id := 'd1000000-0001-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Impermeabilización de Terrazas y Techos',
      'Protección contra goteras con manto asfáltico y emulsión acrílica.',
      220000, 'servicio', 'Bogotá', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Impermeabilización de Terrazas y Techos',
        description = 'Protección contra goteras con manto asfáltico y emulsión acrílica.',
        price = 220000,
        type = 'service',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Plomería & Redes Hidráulicas Pro
  v_list_id := 'd1000000-0001-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Cambio de Válvulas y Llaves de Paso Principales',
      'Sustitución de válvulas desgastadas con garantía de 6 meses.',
      60000, 'servicio', 'Bogotá', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cambio de Válvulas y Llaves de Paso Principales',
        description = 'Sustitución de válvulas desgastadas con garantía de 6 meses.',
        price = 60000,
        type = 'service',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Plomería & Redes Hidráulicas Pro
  v_list_id := 'd1000000-0001-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Mantenimiento de Trampas de Grasa en Cocinas',
      'Extracción y limpieza especializada para restaurantes y hogares.',
      110000, 'servicio', 'Bogotá', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Mantenimiento de Trampas de Grasa en Cocinas',
        description = 'Extracción y limpieza especializada para restaurantes y hogares.',
        price = 110000,
        type = 'service',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Plomería & Redes Hidráulicas Pro
  v_list_id := 'd1000000-0001-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Inspección de Redes Hidráulicas con Geófono',
      'Diagnóstico no invasivo de fugas subterráneas de alta precisión.',
      180000, 'servicio', 'Bogotá', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Inspección de Redes Hidráulicas con Geófono',
        description = 'Diagnóstico no invasivo de fugas subterráneas de alta precisión.',
        price = 180000,
        type = 'service',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 2: ElectroHogar: Reparación & Mantenimiento (servicio2@marketplace.com)
  v_user_id := 'b1000000-0000-0000-0000-000000000002';
  v_seller_id := 'c1000000-0000-0000-0000-000000000002';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'servicio2@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'servicio2@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Mauricio Técnico"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'servicio2@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Mauricio Técnico"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'servicio2@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Mauricio Técnico', 'seller', 'Medellín', '3102223302')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'ElectroHogar: Reparación & Mantenimiento', 'Servicios del Hogar', 'Medellín',
      '573102223302', '573102223302', true, 4.90, 15,
      'Comercio formalizado en Medellín especializado en servicios del hogar. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'ElectroHogar: Reparación & Mantenimiento',
        owner_user_id = v_user_id,
        city = 'Medellín',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'ElectroHogar: Reparación & Mantenimiento', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de ElectroHogar: Reparación & Mantenimiento
  v_list_id := 'd1000000-0002-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Mantenimiento Preventivo de Lavadoras y Secadoras',
      'Limpieza de tinas, filtros y engrase de transmisión.',
      70000, 'visita', 'Medellín', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Mantenimiento Preventivo de Lavadoras y Secadoras',
        description = 'Limpieza de tinas, filtros y engrase de transmisión.',
        price = 70000,
        type = 'service',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de ElectroHogar: Reparación & Mantenimiento
  v_list_id := 'd1000000-0002-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Reparación de Neveras y Nevecones No-Frost',
      'Carga de gas refrigerante, cambio de termostato y sensores.',
      90000, 'revisión', 'Medellín', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Reparación de Neveras y Nevecones No-Frost',
        description = 'Carga de gas refrigerante, cambio de termostato y sensores.',
        price = 90000,
        type = 'service',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de ElectroHogar: Reparación & Mantenimiento
  v_list_id := 'd1000000-0002-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Mantenimiento de Aires Acondicionados Split',
      'Lavado químico a presión, desinfección y revisión de amperaje.',
      85000, 'unidad', 'Medellín', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Mantenimiento de Aires Acondicionados Split',
        description = 'Lavado químico a presión, desinfección y revisión de amperaje.',
        price = 85000,
        type = 'service',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de ElectroHogar: Reparación & Mantenimiento
  v_list_id := 'd1000000-0002-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Reparación de Hornos Microondas y Eléctricos',
      'Sustitución de magnetrón, fusibles y tarjeta electrónica.',
      55000, 'servicio', 'Medellín', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Reparación de Hornos Microondas y Eléctricos',
        description = 'Sustitución de magnetrón, fusibles y tarjeta electrónica.',
        price = 55000,
        type = 'service',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de ElectroHogar: Reparación & Mantenimiento
  v_list_id := 'd1000000-0002-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Instalación de Campanas Extractoras de Cocina',
      'Montaje en pared o isla con conexión eléctrica segura.',
      65000, 'instalación', 'Medellín', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Instalación de Campanas Extractoras de Cocina',
        description = 'Montaje en pared o isla con conexión eléctrica segura.',
        price = 65000,
        type = 'service',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de ElectroHogar: Reparación & Mantenimiento
  v_list_id := 'd1000000-0002-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Reparación de Estufas a Gas y Cubiertas de Cristal',
      'Calibración de espreas, limpieza de quemadores y válvulas.',
      60000, 'servicio', 'Medellín', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Reparación de Estufas a Gas y Cubiertas de Cristal',
        description = 'Calibración de espreas, limpieza de quemadores y válvulas.',
        price = 60000,
        type = 'service',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de ElectroHogar: Reparación & Mantenimiento
  v_list_id := 'd1000000-0002-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Mantenimiento de Freidoras de Aire y Hornos AirFryer',
      'Diagnóstico de resistencias térmicas y ventiladores.',
      45000, 'servicio', 'Medellín', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Mantenimiento de Freidoras de Aire y Hornos AirFryer',
        description = 'Diagnóstico de resistencias térmicas y ventiladores.',
        price = 45000,
        type = 'service',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de ElectroHogar: Reparación & Mantenimiento
  v_list_id := 'd1000000-0002-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Reparación de Televisores LED y Smart TV',
      'Cambio de tiras LED de iluminación de fondo y fuentes de poder.',
      80000, 'diagnóstico', 'Medellín', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Reparación de Televisores LED y Smart TV',
        description = 'Cambio de tiras LED de iluminación de fondo y fuentes de poder.',
        price = 80000,
        type = 'service',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de ElectroHogar: Reparación & Mantenimiento
  v_list_id := 'd1000000-0002-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Mantenimiento de Aspiradoras Robot e Industriales',
      'Sustitución de baterías, motores de succión y cepillos.',
      50000, 'servicio', 'Medellín', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Mantenimiento de Aspiradoras Robot e Industriales',
        description = 'Sustitución de baterías, motores de succión y cepillos.',
        price = 50000,
        type = 'service',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de ElectroHogar: Reparación & Mantenimiento
  v_list_id := 'd1000000-0002-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Instalación de Soportes para TV y Centro de Entretenimiento',
      'Fijación segura con anclajes para todo tipo de pared.',
      40000, 'montaje', 'Medellín', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Instalación de Soportes para TV y Centro de Entretenimiento',
        description = 'Fijación segura con anclajes para todo tipo de pared.',
        price = 40000,
        type = 'service',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 3: Tutorías & Clases Académicas Éxito (servicio3@marketplace.com)
  v_user_id := 'b1000000-0000-0000-0000-000000000003';
  v_seller_id := 'c1000000-0000-0000-0000-000000000003';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'servicio3@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'servicio3@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Prof. David Morales"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'servicio3@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Prof. David Morales"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'servicio3@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Prof. David Morales', 'seller', 'Cali', '3102223303')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Tutorías & Clases Académicas Éxito', 'Educación', 'Cali',
      '573102223303', '573102223303', true, 4.90, 15,
      'Comercio formalizado en Cali especializado en educación. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Tutorías & Clases Académicas Éxito',
        owner_user_id = v_user_id,
        city = 'Cali',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Tutorías & Clases Académicas Éxito', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Tutorías & Clases Académicas Éxito
  v_list_id := 'd1000000-0003-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '94696852-336b-4498-9b41-6088f637029a', 'service',
      'Clases Personalizadas de Matemáticas y Cálculo',
      'Refuerzo escolar y universitario: álgebra, trigonometría y cálculo.',
      45000, 'hora', 'Cali', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Clases Personalizadas de Matemáticas y Cálculo',
        description = 'Refuerzo escolar y universitario: álgebra, trigonometría y cálculo.',
        price = 45000,
        type = 'service',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Tutorías & Clases Académicas Éxito
  v_list_id := 'd1000000-0003-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '94696852-336b-4498-9b41-6088f637029a', 'service',
      'Curso de Inglés Conversacional Intensivo',
      'Metodología práctica para ganar fluidez y confianza al hablar.',
      50000, 'hora', 'Cali', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Curso de Inglés Conversacional Intensivo',
        description = 'Metodología práctica para ganar fluidez y confianza al hablar.',
        price = 50000,
        type = 'service',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Tutorías & Clases Académicas Éxito
  v_list_id := 'd1000000-0003-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '94696852-336b-4498-9b41-6088f637029a', 'service',
      'Tutorías de Física Mecánica y Electromagnetismo',
      'Resolución de talleres, preparación de exámenes y laboratorios.',
      45000, 'hora', 'Cali', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Tutorías de Física Mecánica y Electromagnetismo',
        description = 'Resolución de talleres, preparación de exámenes y laboratorios.',
        price = 45000,
        type = 'service',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Tutorías & Clases Académicas Éxito
  v_list_id := 'd1000000-0003-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '94696852-336b-4498-9b41-6088f637029a', 'service',
      'Preparación Integral para Pruebas Saber 11 / ICFES',
      'Simulacros y estrategias en lectura crítica, ciencias y matemáticas.',
      280000, 'módulo', 'Cali', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Preparación Integral para Pruebas Saber 11 / ICFES',
        description = 'Simulacros y estrategias en lectura crítica, ciencias y matemáticas.',
        price = 280000,
        type = 'service',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Tutorías & Clases Académicas Éxito
  v_list_id := 'd1000000-0003-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '94696852-336b-4498-9b41-6088f637029a', 'service',
      'Clases de Programación Python y Desarrollo Web',
      'Aprende a programar desde cero con proyectos prácticos.',
      60000, 'hora', 'Cali', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Clases de Programación Python y Desarrollo Web',
        description = 'Aprende a programar desde cero con proyectos prácticos.',
        price = 60000,
        type = 'service',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Tutorías & Clases Académicas Éxito
  v_list_id := 'd1000000-0003-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '94696852-336b-4498-9b41-6088f637029a', 'service',
      'Taller de Lectura Crítica y Redacción de Ensayos',
      'Desarrollo de habilidades de argumentación y normas APA.',
      40000, 'hora', 'Cali', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Taller de Lectura Crítica y Redacción de Ensayos',
        description = 'Desarrollo de habilidades de argumentación y normas APA.',
        price = 40000,
        type = 'service',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Tutorías & Clases Académicas Éxito
  v_list_id := 'd1000000-0003-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '94696852-336b-4498-9b41-6088f637029a', 'service',
      'Clases de Francés Básico y Preparación DELF',
      'Gramática, pronunciación y comprensión auditiva A1-B2.',
      50000, 'hora', 'Cali', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Clases de Francés Básico y Preparación DELF',
        description = 'Gramática, pronunciación y comprensión auditiva A1-B2.',
        price = 50000,
        type = 'service',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Tutorías & Clases Académicas Éxito
  v_list_id := 'd1000000-0003-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '94696852-336b-4498-9b41-6088f637029a', 'service',
      'Asesoría en Química General y Orgánica',
      'Balanceo de ecuaciones, estechiometría y grupos funcionales.',
      45000, 'hora', 'Cali', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Asesoría en Química General y Orgánica',
        description = 'Balanceo de ecuaciones, estechiometría y grupos funcionales.',
        price = 45000,
        type = 'service',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Tutorías & Clases Académicas Éxito
  v_list_id := 'd1000000-0003-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '94696852-336b-4498-9b41-6088f637029a', 'service',
      'Clases de Guitarra Acústica y Eléctrica',
      'Técnica, acordes, ritmo y canciones favoritas paso a paso.',
      40000, 'hora', 'Cali', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Clases de Guitarra Acústica y Eléctrica',
        description = 'Técnica, acordes, ritmo y canciones favoritas paso a paso.',
        price = 40000,
        type = 'service',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Tutorías & Clases Académicas Éxito
  v_list_id := 'd1000000-0003-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '94696852-336b-4498-9b41-6088f637029a', 'service',
      'Taller de Oratoria y Expresión Corporal',
      'Pierde el miedo escénico y habla en público con seguridad.',
      55000, 'hora', 'Cali', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Taller de Oratoria y Expresión Corporal',
        description = 'Pierde el miedo escénico y habla en público con seguridad.',
        price = 55000,
        type = 'service',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 4: Barbería & Estilo Urbano VIP (servicio4@marketplace.com)
  v_user_id := 'b1000000-0000-0000-0000-000000000004';
  v_seller_id := 'c1000000-0000-0000-0000-000000000004';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'servicio4@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'servicio4@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Julián Barbero"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'servicio4@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Julián Barbero"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'servicio4@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Julián Barbero', 'seller', 'Barranquilla', '3102223304')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Barbería & Estilo Urbano VIP', 'Belleza', 'Barranquilla',
      '573102223304', '573102223304', true, 4.90, 15,
      'Comercio formalizado en Barranquilla especializado en belleza. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Barbería & Estilo Urbano VIP',
        owner_user_id = v_user_id,
        city = 'Barranquilla',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Barbería & Estilo Urbano VIP', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Barbería & Estilo Urbano VIP
  v_list_id := 'd1000000-0004-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'service',
      'Corte Clásico o Degradado Fade con Lavado',
      'Corte moderno con máquina y tijera, incluye lavado refrescante.',
      30000, 'corte', 'Barranquilla', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Corte Clásico o Degradado Fade con Lavado',
        description = 'Corte moderno con máquina y tijera, incluye lavado refrescante.',
        price = 30000,
        type = 'service',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Barbería & Estilo Urbano VIP
  v_list_id := 'd1000000-0004-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'service',
      'Perfilado y Arreglo de Barba con Toalla Caliente',
      'Vaporizador, toalla caliente y aceites hidratantes esenciales.',
      25000, 'servicio', 'Barranquilla', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Perfilado y Arreglo de Barba con Toalla Caliente',
        description = 'Vaporizador, toalla caliente y aceites hidratantes esenciales.',
        price = 25000,
        type = 'service',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Barbería & Estilo Urbano VIP
  v_list_id := 'd1000000-0004-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'service',
      'Combo VIP: Corte + Barba + Mascarilla Negra',
      'El servicio completo para renovar tu imagen y limpiar tu piel.',
      50000, 'combo', 'Barranquilla', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Combo VIP: Corte + Barba + Mascarilla Negra',
        description = 'El servicio completo para renovar tu imagen y limpiar tu piel.',
        price = 50000,
        type = 'service',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Barbería & Estilo Urbano VIP
  v_list_id := 'd1000000-0004-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'service',
      'Pigmentación Semipermanente de Barba y Cejas',
      'Definición de contornos con tinte orgánico de larga duración.',
      35000, 'sesión', 'Barranquilla', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Pigmentación Semipermanente de Barba y Cejas',
        description = 'Definición de contornos con tinte orgánico de larga duración.',
        price = 35000,
        type = 'service',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Barbería & Estilo Urbano VIP
  v_list_id := 'd1000000-0004-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'service',
      'Tratamiento de Exfoliación Facial Profunda',
      'Eliminación de puntos negros e impurezas con microdermoabrasión.',
      40000, 'sesión', 'Barranquilla', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Tratamiento de Exfoliación Facial Profunda',
        description = 'Eliminación de puntos negros e impurezas con microdermoabrasión.',
        price = 40000,
        type = 'service',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Barbería & Estilo Urbano VIP
  v_list_id := 'd1000000-0004-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'service',
      'Alisado y Keratina para Cabello Masculino',
      'Control de frizz y volumen con brillo natural duradero.',
      80000, 'tratamiento', 'Barranquilla', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Alisado y Keratina para Cabello Masculino',
        description = 'Control de frizz y volumen con brillo natural duradero.',
        price = 80000,
        type = 'service',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Barbería & Estilo Urbano VIP
  v_list_id := 'd1000000-0004-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'service',
      'Diseño de Figuras y Líneas Tribales en Cabello',
      'Arte libre y freestyle en corte degradado.',
      20000, 'diseño', 'Barranquilla', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Diseño de Figuras y Líneas Tribales en Cabello',
        description = 'Arte libre y freestyle en corte degradado.',
        price = 20000,
        type = 'service',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Barbería & Estilo Urbano VIP
  v_list_id := 'd1000000-0004-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'service',
      'Tinte y Decoloración Platinada Polar',
      'Platinados perfectos con protección capilar Olaplex.',
      90000, 'proceso', 'Barranquilla', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Tinte y Decoloración Platinada Polar',
        description = 'Platinados perfectos con protección capilar Olaplex.',
        price = 90000,
        type = 'service',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Barbería & Estilo Urbano VIP
  v_list_id := 'd1000000-0004-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'service',
      'Masaje Capilar Antiestrés con Tónicos de Romero',
      'Estimula el crecimiento y alivia la tensión del cuero cabelludo.',
      25000, 'sesión', 'Barranquilla', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Masaje Capilar Antiestrés con Tónicos de Romero',
        description = 'Estimula el crecimiento y alivia la tensión del cuero cabelludo.',
        price = 25000,
        type = 'service',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Barbería & Estilo Urbano VIP
  v_list_id := 'd1000000-0004-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'service',
      'Depilación Facial con Cera Elástica en Nariz y Orejas',
      'Rápida, higiénica y prácticamente indolora.',
      15000, 'servicio', 'Barranquilla', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Depilación Facial con Cera Elástica en Nariz y Orejas',
        description = 'Rápida, higiénica y prácticamente indolora.',
        price = 15000,
        type = 'service',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 5: Asesorías Contables & Tributarias SAS (servicio5@marketplace.com)
  v_user_id := 'b1000000-0000-0000-0000-000000000005';
  v_seller_id := 'c1000000-0000-0000-0000-000000000005';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'servicio5@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'servicio5@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Dra. Beatriz Contadora"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'servicio5@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Dra. Beatriz Contadora"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'servicio5@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Dra. Beatriz Contadora', 'seller', 'Bucaramanga', '3102223305')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Asesorías Contables & Tributarias SAS', 'Servicios Empresariales', 'Bucaramanga',
      '573102223305', '573102223305', true, 4.90, 15,
      'Comercio formalizado en Bucaramanga especializado en servicios empresariales. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Asesorías Contables & Tributarias SAS',
        owner_user_id = v_user_id,
        city = 'Bucaramanga',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Asesorías Contables & Tributarias SAS', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Asesorías Contables & Tributarias SAS
  v_list_id := 'd1000000-0005-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Elaboración de Declaración de Renta Persona Natural',
      'Optimización legal de deducciones y cumplimiento ante la DIAN.',
      150000, 'declaración', 'Bucaramanga', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Elaboración de Declaración de Renta Persona Natural',
        description = 'Optimización legal de deducciones y cumplimiento ante la DIAN.',
        price = 150000,
        type = 'service',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Asesorías Contables & Tributarias SAS
  v_list_id := 'd1000000-0005-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Gestión y Liquidación de Nómina Electrónica',
      'Cálculo de seguridad social, prestaciones y parafiscales.',
      80000, 'mes', 'Bucaramanga', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Gestión y Liquidación de Nómina Electrónica',
        description = 'Cálculo de seguridad social, prestaciones y parafiscales.',
        price = 80000,
        type = 'service',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Asesorías Contables & Tributarias SAS
  v_list_id := 'd1000000-0005-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Implementación de Facturación Electrónica DIAN',
      'Habilitación de software y parametrización de certificados.',
      120000, 'paquete', 'Bucaramanga', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Implementación de Facturación Electrónica DIAN',
        description = 'Habilitación de software y parametrización de certificados.',
        price = 120000,
        type = 'service',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Asesorías Contables & Tributarias SAS
  v_list_id := 'd1000000-0005-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Asesoría en Creación y Formalización de Empresas SAS',
      'Estatutos, registro mercantil en Cámara de Comercio y RUT.',
      250000, 'trámite', 'Bucaramanga', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Asesoría en Creación y Formalización de Empresas SAS',
        description = 'Estatutos, registro mercantil en Cámara de Comercio y RUT.',
        price = 250000,
        type = 'service',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Asesorías Contables & Tributarias SAS
  v_list_id := 'd1000000-0005-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Revisión y Auditoría de Estados Financieros',
      'Diagnóstico contable con balance general y estado de resultados.',
      350000, 'informe', 'Bucaramanga', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Revisión y Auditoría de Estados Financieros',
        description = 'Diagnóstico contable con balance general y estado de resultados.',
        price = 350000,
        type = 'service',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Asesorías Contables & Tributarias SAS
  v_list_id := 'd1000000-0005-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Planeación Tributaria Estratégica para Pymes',
      'Reducción legal de carga impositiva y prevención de sanciones.',
      200000, 'sesión', 'Bucaramanga', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Planeación Tributaria Estratégica para Pymes',
        description = 'Reducción legal de carga impositiva y prevención de sanciones.',
        price = 200000,
        type = 'service',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Asesorías Contables & Tributarias SAS
  v_list_id := 'd1000000-0005-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Liquidación de Impuestos IVA y Retención en la Fuente',
      'Cálculo y presentación puntual de formularios bimestrales.',
      110000, 'periodo', 'Bucaramanga', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Liquidación de Impuestos IVA y Retención en la Fuente',
        description = 'Cálculo y presentación puntual de formularios bimestrales.',
        price = 110000,
        type = 'service',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Asesorías Contables & Tributarias SAS
  v_list_id := 'd1000000-0005-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Inscripción y Actualización de RUT en Línea',
      'Actualización de actividades económicas y responsabilidades.',
      40000, 'trámite', 'Bucaramanga', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Inscripción y Actualización de RUT en Línea',
        description = 'Actualización de actividades económicas y responsabilidades.',
        price = 40000,
        type = 'service',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Asesorías Contables & Tributarias SAS
  v_list_id := 'd1000000-0005-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Asesoría Financiera para Solicitud de Créditos',
      'Flujo de caja proyectado y cartas de contador certificadas.',
      130000, 'análisis', 'Bucaramanga', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Asesoría Financiera para Solicitud de Créditos',
        description = 'Flujo de caja proyectado y cartas de contador certificadas.',
        price = 130000,
        type = 'service',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Asesorías Contables & Tributarias SAS
  v_list_id := 'd1000000-0005-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Capacitación en Manejo de Software Contable Siigo/Alegra',
      'Aprende a registrar compras, ventas e inventarios.',
      90000, 'hora', 'Bucaramanga', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Capacitación en Manejo de Software Contable Siigo/Alegra',
        description = 'Aprende a registrar compras, ventas e inventarios.',
        price = 90000,
        type = 'service',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 6: Fotografía & Audiovisuales Luz Creativa (servicio6@marketplace.com)
  v_user_id := 'b1000000-0000-0000-0000-000000000006';
  v_seller_id := 'c1000000-0000-0000-0000-000000000006';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'servicio6@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'servicio6@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Santiago Fotógrafo"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'servicio6@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Santiago Fotógrafo"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'servicio6@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Santiago Fotógrafo', 'seller', 'Cartagena', '3102223306')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Fotografía & Audiovisuales Luz Creativa', 'Otros', 'Cartagena',
      '573102223306', '573102223306', true, 4.90, 15,
      'Comercio formalizado en Cartagena especializado en otros. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Fotografía & Audiovisuales Luz Creativa',
        owner_user_id = v_user_id,
        city = 'Cartagena',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Fotografía & Audiovisuales Luz Creativa', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Fotografía & Audiovisuales Luz Creativa
  v_list_id := 'd1000000-0006-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Sesión Fotográfica Profesional de Productos (E-commerce)',
      '15 fotos editadas sobre fondo blanco o ambientado.',
      150000, 'sesión', 'Cartagena', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Sesión Fotográfica Profesional de Productos (E-commerce)',
        description = '15 fotos editadas sobre fondo blanco o ambientado.',
        price = 150000,
        type = 'service',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Fotografía & Audiovisuales Luz Creativa
  v_list_id := 'd1000000-0006-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Cobertura Fotográfica de Eventos y Celebraciones',
      'Fotografía digital de alta resolución con entrega express.',
      220000, 'evento', 'Cartagena', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cobertura Fotográfica de Eventos y Celebraciones',
        description = 'Fotografía digital de alta resolución con entrega express.',
        price = 220000,
        type = 'service',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Fotografía & Audiovisuales Luz Creativa
  v_list_id := 'd1000000-0006-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Retratos Profesionales para LinkedIn y Marca Personal',
      '5 fotos retocadas en estudio o locación exterior.',
      90000, 'sesión', 'Cartagena', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Retratos Profesionales para LinkedIn y Marca Personal',
        description = '5 fotos retocadas en estudio o locación exterior.',
        price = 90000,
        type = 'service',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Fotografía & Audiovisuales Luz Creativa
  v_list_id := 'd1000000-0006-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Grabación de Video Corporativo en Formato 4K',
      'Video promocional de 60 segundos con música y locución.',
      350000, 'video', 'Cartagena', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Grabación de Video Corporativo en Formato 4K',
        description = 'Video promocional de 60 segundos con música y locución.',
        price = 350000,
        type = 'service',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Fotografía & Audiovisuales Luz Creativa
  v_list_id := 'd1000000-0006-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Fotografía Aérea con Dron Profesional',
      'Panorámicas y tomas en alta definición para bienes raíces y turismo.',
      200000, 'vuelo', 'Cartagena', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Fotografía Aérea con Dron Profesional',
        description = 'Panorámicas y tomas en alta definición para bienes raíces y turismo.',
        price = 200000,
        type = 'service',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Fotografía & Audiovisuales Luz Creativa
  v_list_id := 'd1000000-0006-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Sesión de Fotos para Parejas y Bodas en la Playa',
      'Recuerdos inolvidables con iluminación cálida de atardecer.',
      280000, 'sesión', 'Cartagena', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Sesión de Fotos para Parejas y Bodas en la Playa',
        description = 'Recuerdos inolvidables con iluminación cálida de atardecer.',
        price = 280000,
        type = 'service',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Fotografía & Audiovisuales Luz Creativa
  v_list_id := 'd1000000-0006-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Producción de Reels y TikToks para Redes Sociales',
      'Pack de 3 videos dinámicos con edición, subtítulos y tendencias.',
      180000, 'pack', 'Cartagena', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Producción de Reels y TikToks para Redes Sociales',
        description = 'Pack de 3 videos dinámicos con edición, subtítulos y tendencias.',
        price = 180000,
        type = 'service',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Fotografía & Audiovisuales Luz Creativa
  v_list_id := 'd1000000-0006-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Restauración Digital de Fotografías Antiguas',
      'Corrección de roturas, manchas y colorización de recuerdos familiares.',
      45000, 'foto', 'Cartagena', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Restauración Digital de Fotografías Antiguas',
        description = 'Corrección de roturas, manchas y colorización de recuerdos familiares.',
        price = 45000,
        type = 'service',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Fotografía & Audiovisuales Luz Creativa
  v_list_id := 'd1000000-0006-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Fotografía Gastronómica para Menús y Apps de Domicilios',
      'Iluminación apetitosa para platos principales y bebidas.',
      160000, 'sesión', 'Cartagena', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Fotografía Gastronómica para Menús y Apps de Domicilios',
        description = 'Iluminación apetitosa para platos principales y bebidas.',
        price = 160000,
        type = 'service',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Fotografía & Audiovisuales Luz Creativa
  v_list_id := 'd1000000-0006-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Transmisión en Vivo Multicámara para Conferencias',
      'Streaming estable a YouTube y Facebook con audio profesional.',
      450000, 'transmisión', 'Cartagena', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Transmisión en Vivo Multicámara para Conferencias',
        description = 'Streaming estable a YouTube y Facebook con audio profesional.',
        price = 450000,
        type = 'service',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 7: Limpieza & Desinfección Empresarial Clean (servicio7@marketplace.com)
  v_user_id := 'b1000000-0000-0000-0000-000000000007';
  v_seller_id := 'c1000000-0000-0000-0000-000000000007';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'servicio7@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'servicio7@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Gloria Limpieza"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'servicio7@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Gloria Limpieza"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'servicio7@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Gloria Limpieza', 'seller', 'Pereira', '3102223307')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Limpieza & Desinfección Empresarial Clean', 'Servicios del Hogar', 'Pereira',
      '573102223307', '573102223307', true, 4.90, 15,
      'Comercio formalizado en Pereira especializado en servicios del hogar. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Limpieza & Desinfección Empresarial Clean',
        owner_user_id = v_user_id,
        city = 'Pereira',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Limpieza & Desinfección Empresarial Clean', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Limpieza & Desinfección Empresarial Clean
  v_list_id := 'd1000000-0007-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Limpieza Profunda de Hogar por Días (8 Horas)',
      'Aseo exhaustivo de cocina, baños, pisos, ventanas y habitaciones.',
      85000, 'día', 'Pereira', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Limpieza Profunda de Hogar por Días (8 Horas)',
        description = 'Aseo exhaustivo de cocina, baños, pisos, ventanas y habitaciones.',
        price = 85000,
        type = 'service',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Limpieza & Desinfección Empresarial Clean
  v_list_id := 'd1000000-0007-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Lavado y Desinfección de Muebles y Sofás a Vapor',
      'Extracción profunda de ácaros, manchas de café y malos olores.',
      90000, 'sala', 'Pereira', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Lavado y Desinfección de Muebles y Sofás a Vapor',
        description = 'Extracción profunda de ácaros, manchas de café y malos olores.',
        price = 90000,
        type = 'service',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Limpieza & Desinfección Empresarial Clean
  v_list_id := 'd1000000-0007-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Lavado de Colchones con Máquina de Inyección-Succión',
      'Desinfección con productos biodegradables no tóxicos.',
      75000, 'colchón', 'Pereira', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Lavado de Colchones con Máquina de Inyección-Succión',
        description = 'Desinfección con productos biodegradables no tóxicos.',
        price = 75000,
        type = 'service',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Limpieza & Desinfección Empresarial Clean
  v_list_id := 'd1000000-0007-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Limpieza y Desmanchado de Tapicería de Vehículos',
      'Lavado de silletería, techo, alfombras y baúl.',
      95000, 'auto', 'Pereira', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Limpieza y Desmanchado de Tapicería de Vehículos',
        description = 'Lavado de silletería, techo, alfombras y baúl.',
        price = 95000,
        type = 'service',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Limpieza & Desinfección Empresarial Clean
  v_list_id := 'd1000000-0007-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Aseo Post-Construcción y Fin de Obra',
      'Eliminación de restos de pintura, cemento y polvillo fino.',
      180000, 'inmueble', 'Pereira', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Aseo Post-Construcción y Fin de Obra',
        description = 'Eliminación de restos de pintura, cemento y polvillo fino.',
        price = 180000,
        type = 'service',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Limpieza & Desinfección Empresarial Clean
  v_list_id := 'd1000000-0007-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Lavado y Cristalizado de Pisos de Mármol y Granito',
      'Devuelve el brillo de espejo natural a tus pisos.',
      150000, 'área', 'Pereira', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Lavado y Cristalizado de Pisos de Mármol y Granito',
        description = 'Devuelve el brillo de espejo natural a tus pisos.',
        price = 150000,
        type = 'service',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Limpieza & Desinfección Empresarial Clean
  v_list_id := 'd1000000-0007-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Desinfección y Fumigación contra Plagas e Insectos',
      'Control seguro de cucarachas, hormigas y roedores.',
      110000, 'fumigación', 'Pereira', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Desinfección y Fumigación contra Plagas e Insectos',
        description = 'Control seguro de cucarachas, hormigas y roedores.',
        price = 110000,
        type = 'service',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Limpieza & Desinfección Empresarial Clean
  v_list_id := 'd1000000-0007-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Limpieza de Fachadas y Vidrios en Alturas',
      'Personal certificado en trabajo seguro en alturas con arnés.',
      250000, 'jornada', 'Pereira', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Limpieza de Fachadas y Vidrios en Alturas',
        description = 'Personal certificado en trabajo seguro en alturas con arnés.',
        price = 250000,
        type = 'service',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Limpieza & Desinfección Empresarial Clean
  v_list_id := 'd1000000-0007-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Mantenimiento y Desinfección de Alfombras Fijas',
      'Shampoo especializado y secado rápido anti-humedad.',
      80000, 'habitación', 'Pereira', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Mantenimiento y Desinfección de Alfombras Fijas',
        description = 'Shampoo especializado y secado rápido anti-humedad.',
        price = 80000,
        type = 'service',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Limpieza & Desinfección Empresarial Clean
  v_list_id := 'd1000000-0007-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Organización Profesional de Clósets y Alacenas (Home Organizer)',
      'Optimización de espacios y categorización funcional.',
      95000, 'espacio', 'Pereira', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Organización Profesional de Clósets y Alacenas (Home Organizer)',
        description = 'Optimización de espacios y categorización funcional.',
        price = 95000,
        type = 'service',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 8: Veterinaria & Guardería Canina Huellitas (servicio8@marketplace.com)
  v_user_id := 'b1000000-0000-0000-0000-000000000008';
  v_seller_id := 'c1000000-0000-0000-0000-000000000008';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'servicio8@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'servicio8@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Dra. Paula Veterinaria"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'servicio8@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Dra. Paula Veterinaria"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'servicio8@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Dra. Paula Veterinaria', 'seller', 'Manizales', '3102223308')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Veterinaria & Guardería Canina Huellitas', 'Otros', 'Manizales',
      '573102223308', '573102223308', true, 4.90, 15,
      'Comercio formalizado en Manizales especializado en otros. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Veterinaria & Guardería Canina Huellitas',
        owner_user_id = v_user_id,
        city = 'Manizales',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Veterinaria & Guardería Canina Huellitas', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Veterinaria & Guardería Canina Huellitas
  v_list_id := 'd1000000-0008-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Consulta Veterinaria Médica a Domicilio',
      'Examen físico general, pesaje y fórmula médica en casa.',
      50000, 'consulta', 'Manizales', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Consulta Veterinaria Médica a Domicilio',
        description = 'Examen físico general, pesaje y fórmula médica en casa.',
        price = 50000,
        type = 'service',
        status = 'published',
        city = 'Manizales'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Veterinaria & Guardería Canina Huellitas
  v_list_id := 'd1000000-0008-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Baño Canino con Hidratación y Corte de Uñas',
      'Shampoo medicado o antipulgas con secado con turbina.',
      35000, 'baño', 'Manizales', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Baño Canino con Hidratación y Corte de Uñas',
        description = 'Shampoo medicado o antipulgas con secado con turbina.',
        price = 35000,
        type = 'service',
        status = 'published',
        city = 'Manizales'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Veterinaria & Guardería Canina Huellitas
  v_list_id := 'd1000000-0008-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Plan de Vacunación Canina Completa (Séxtuple + Rabia)',
      'Biológicos de primera calidad con carnet oficial.',
      70000, 'dosis', 'Manizales', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Plan de Vacunación Canina Completa (Séxtuple + Rabia)',
        description = 'Biológicos de primera calidad con carnet oficial.',
        price = 70000,
        type = 'service',
        status = 'published',
        city = 'Manizales'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Veterinaria & Guardería Canina Huellitas
  v_list_id := 'd1000000-0008-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Desparasitación Interna y Externa con Pipeta',
      'Control preventivo de pulgas, garrapatas y parásitos intestinales.',
      28000, 'tratamiento', 'Manizales', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Desparasitación Interna y Externa con Pipeta',
        description = 'Control preventivo de pulgas, garrapatas y parásitos intestinales.',
        price = 28000,
        type = 'service',
        status = 'published',
        city = 'Manizales'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Veterinaria & Guardería Canina Huellitas
  v_list_id := 'd1000000-0008-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Paseo y Ejercicio Canino Personalizado (1 Hora)',
      'Rutas seguras de socialización y juego para liberar energía.',
      20000, 'paseo', 'Manizales', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Paseo y Ejercicio Canino Personalizado (1 Hora)',
        description = 'Rutas seguras de socialización y juego para liberar energía.',
        price = 20000,
        type = 'service',
        status = 'published',
        city = 'Manizales'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Veterinaria & Guardería Canina Huellitas
  v_list_id := 'd1000000-0008-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Hospedaje y Guardería Campestre por Noche',
      'Espacios amplios sin jaulas, supervisión 24 horas y fotos diarias.',
      45000, 'noche', 'Manizales', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Hospedaje y Guardería Campestre por Noche',
        description = 'Espacios amplios sin jaulas, supervisión 24 horas y fotos diarias.',
        price = 45000,
        type = 'service',
        status = 'published',
        city = 'Manizales'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Veterinaria & Guardería Canina Huellitas
  v_list_id := 'd1000000-0008-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Profilaxis Dental Canina con Ultrasonido',
      'Eliminación de sarro bacteriano y prevención de gingivitis.',
      120000, 'procedimiento', 'Manizales', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Profilaxis Dental Canina con Ultrasonido',
        description = 'Eliminación de sarro bacteriano y prevención de gingivitis.',
        price = 120000,
        type = 'service',
        status = 'published',
        city = 'Manizales'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Veterinaria & Guardería Canina Huellitas
  v_list_id := 'd1000000-0008-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Corte de Pelo de Raza y Peinado Especializado',
      'Acabado estético profesional según la raza de tu mascota.',
      45000, 'grooming', 'Manizales', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Corte de Pelo de Raza y Peinado Especializado',
        description = 'Acabado estético profesional según la raza de tu mascota.',
        price = 45000,
        type = 'service',
        status = 'published',
        city = 'Manizales'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Veterinaria & Guardería Canina Huellitas
  v_list_id := 'd1000000-0008-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Adiestramiento Básico en Obediencia y Convivencia',
      'Órdenes básicas: sentado, quieto, llamado y paseo sin jalar.',
      60000, 'sesión', 'Manizales', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Adiestramiento Básico en Obediencia y Convivencia',
        description = 'Órdenes básicas: sentado, quieto, llamado y paseo sin jalar.',
        price = 60000,
        type = 'service',
        status = 'published',
        city = 'Manizales'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Veterinaria & Guardería Canina Huellitas
  v_list_id := 'd1000000-0008-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'service',
      'Prueba Rápida de Diagnóstico de Sangre en Mascotas',
      'Resultados inmediatos en hemograma y función hepática.',
      65000, 'examen', 'Manizales', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Prueba Rápida de Diagnóstico de Sangre en Mascotas',
        description = 'Resultados inmediatos en hemograma y función hepática.',
        price = 65000,
        type = 'service',
        status = 'published',
        city = 'Manizales'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 9: Mecánica & Frenos Móvil Express (servicio9@marketplace.com)
  v_user_id := 'b1000000-0000-0000-0000-000000000009';
  v_seller_id := 'c1000000-0000-0000-0000-000000000009';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'servicio9@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'servicio9@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Óscar Mecánico"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'servicio9@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Óscar Mecánico"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'servicio9@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Óscar Mecánico', 'seller', 'Santa Marta', '3102223309')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Mecánica & Frenos Móvil Express', 'Servicios del Hogar', 'Santa Marta',
      '573102223309', '573102223309', true, 4.90, 15,
      'Comercio formalizado en Santa Marta especializado en servicios del hogar. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Mecánica & Frenos Móvil Express',
        owner_user_id = v_user_id,
        city = 'Santa Marta',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Mecánica & Frenos Móvil Express', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Mecánica & Frenos Móvil Express
  v_list_id := 'd1000000-0009-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Cambio de Pastillas de Freno Delanteras y Traseras',
      'Mano de obra experta con purga de líquido de frenos DOT4.',
      65000, 'eje', 'Santa Marta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cambio de Pastillas de Freno Delanteras y Traseras',
        description = 'Mano de obra experta con purga de líquido de frenos DOT4.',
        price = 65000,
        type = 'service',
        status = 'published',
        city = 'Santa Marta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Mecánica & Frenos Móvil Express
  v_list_id := 'd1000000-0009-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Auxilio Vial y Desvare de Batería con Cables',
      'Arranque rápido a domicilio o venta de batería nueva a cambio.',
      35000, 'servicio', 'Santa Marta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Auxilio Vial y Desvare de Batería con Cables',
        description = 'Arranque rápido a domicilio o venta de batería nueva a cambio.',
        price = 35000,
        type = 'service',
        status = 'published',
        city = 'Santa Marta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Mecánica & Frenos Móvil Express
  v_list_id := 'd1000000-0009-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Alineación Computarizada y Balanceo de Llantas',
      'Corrección de convergencia y eliminación de vibraciones al volante.',
      55000, 'vehículo', 'Santa Marta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Alineación Computarizada y Balanceo de Llantas',
        description = 'Corrección de convergencia y eliminación de vibraciones al volante.',
        price = 55000,
        type = 'service',
        status = 'published',
        city = 'Santa Marta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Mecánica & Frenos Móvil Express
  v_list_id := 'd1000000-0009-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Sincronización de Motor y Limpieza de Inyectores',
      'Limpieza por ultrasonido y cambio de bujías para ahorrar gasolina.',
      110000, 'servicio', 'Santa Marta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Sincronización de Motor y Limpieza de Inyectores',
        description = 'Limpieza por ultrasonido y cambio de bujías para ahorrar gasolina.',
        price = 110000,
        type = 'service',
        status = 'published',
        city = 'Santa Marta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Mecánica & Frenos Móvil Express
  v_list_id := 'd1000000-0009-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Cambio de Kit de Embrague / Clutch',
      'Prensa, disco y balinera con calibración suave del pedal.',
      190000, 'reemplazo', 'Santa Marta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cambio de Kit de Embrague / Clutch',
        description = 'Prensa, disco y balinera con calibración suave del pedal.',
        price = 190000,
        type = 'service',
        status = 'published',
        city = 'Santa Marta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Mecánica & Frenos Móvil Express
  v_list_id := 'd1000000-0009-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Mantenimiento y Reparación de Suspensión (Amortiguadores)',
      'Inspección de terminales, bujes, tijeras y rótulas.',
      130000, 'par', 'Santa Marta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Mantenimiento y Reparación de Suspensión (Amortiguadores)',
        description = 'Inspección de terminales, bujes, tijeras y rótulas.',
        price = 130000,
        type = 'service',
        status = 'published',
        city = 'Santa Marta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Mecánica & Frenos Móvil Express
  v_list_id := 'd1000000-0009-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Revisión Precompra / Peritaje Mecánico para Autos Usados',
      'Evaluación de compresión de motor, chasis y pintura antes de comprar.',
      120000, 'peritaje', 'Santa Marta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Revisión Precompra / Peritaje Mecánico para Autos Usados',
        description = 'Evaluación de compresión de motor, chasis y pintura antes de comprar.',
        price = 120000,
        type = 'service',
        status = 'published',
        city = 'Santa Marta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Mecánica & Frenos Móvil Express
  v_list_id := 'd1000000-0009-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Cambio de Correa de Repartición / Distribución',
      'Previene daños graves de válvulas en tu motor.',
      140000, 'instalación', 'Santa Marta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cambio de Correa de Repartición / Distribución',
        description = 'Previene daños graves de válvulas en tu motor.',
        price = 140000,
        type = 'service',
        status = 'published',
        city = 'Santa Marta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Mecánica & Frenos Móvil Express
  v_list_id := 'd1000000-0009-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Reparación y Mantenimiento de Alternadores y Motores de Arranque',
      'Sustitución de carbones, regulador de voltaje y rodamientos.',
      85000, 'servicio', 'Santa Marta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Reparación y Mantenimiento de Alternadores y Motores de Arranque',
        description = 'Sustitución de carbones, regulador de voltaje y rodamientos.',
        price = 85000,
        type = 'service',
        status = 'published',
        city = 'Santa Marta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Mecánica & Frenos Móvil Express
  v_list_id := 'd1000000-0009-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Lavado de Motor en Seco con Desengrasante Dieléctrico',
      'Limpieza profunda segura sin dañar sensores ni bobinas.',
      40000, 'lavado', 'Santa Marta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Lavado de Motor en Seco con Desengrasante Dieléctrico',
        description = 'Limpieza profunda segura sin dañar sensores ni bobinas.',
        price = 40000,
        type = 'service',
        status = 'published',
        city = 'Santa Marta'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 10: Instalaciones & Reformas Locales (servicio10@marketplace.com)
  v_user_id := 'b1000000-0000-0000-0000-00000000000a';
  v_seller_id := 'c1000000-0000-0000-0000-00000000000a';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'servicio10@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'servicio10@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Hernando Constructor"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'servicio10@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Hernando Constructor"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'servicio10@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Hernando Constructor', 'seller', 'Cúcuta', '3102223310')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Instalaciones & Reformas Locales', 'Servicios del Hogar', 'Cúcuta',
      '573102223310', '573102223310', true, 4.90, 15,
      'Comercio formalizado en Cúcuta especializado en servicios del hogar. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Instalaciones & Reformas Locales',
        owner_user_id = v_user_id,
        city = 'Cúcuta',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Instalaciones & Reformas Locales', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Instalaciones & Reformas Locales
  v_list_id := 'd1000000-000a-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Instalación de Paneles de Yeso Drywall y Cielos Rasos',
      'Acabado liso, resistente y moderno con estructura metálica.',
      35000, 'm2', 'Cúcuta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Instalación de Paneles de Yeso Drywall y Cielos Rasos',
        description = 'Acabado liso, resistente y moderno con estructura metálica.',
        price = 35000,
        type = 'service',
        status = 'published',
        city = 'Cúcuta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Instalaciones & Reformas Locales
  v_list_id := 'd1000000-000a-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Pintura Interior y Exterior para Casas y Locales',
      'Aplicación de dos manos de pintura vinilo lavable tipo 1.',
      12000, 'm2', 'Cúcuta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Pintura Interior y Exterior para Casas y Locales',
        description = 'Aplicación de dos manos de pintura vinilo lavable tipo 1.',
        price = 12000,
        type = 'service',
        status = 'published',
        city = 'Cúcuta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Instalaciones & Reformas Locales
  v_list_id := 'd1000000-000a-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Instalación de Enchape de Cerámica y Porcelanato',
      'Nivelación perfecta con crucetas y pegacor de alta adherencia.',
      28000, 'm2', 'Cúcuta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Instalación de Enchape de Cerámica y Porcelanato',
        description = 'Nivelación perfecta con crucetas y pegacor de alta adherencia.',
        price = 28000,
        type = 'service',
        status = 'published',
        city = 'Cúcuta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Instalaciones & Reformas Locales
  v_list_id := 'd1000000-000a-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Armado y Montaje de Muebles Modulares RTA',
      'Armado experto de clósets, escritorios y centros de TV.',
      50000, 'mueble', 'Cúcuta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Armado y Montaje de Muebles Modulares RTA',
        description = 'Armado experto de clósets, escritorios y centros de TV.',
        price = 50000,
        type = 'service',
        status = 'published',
        city = 'Cúcuta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Instalaciones & Reformas Locales
  v_list_id := 'd1000000-000a-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Instalación de Redes Eléctricas y Tableros de Breakers',
      'Cableado certificado con polo a tierra según norma RETIE.',
      90000, 'punto', 'Cúcuta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Instalación de Redes Eléctricas y Tableros de Breakers',
        description = 'Cableado certificado con polo a tierra según norma RETIE.',
        price = 90000,
        type = 'service',
        status = 'published',
        city = 'Cúcuta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Instalaciones & Reformas Locales
  v_list_id := 'd1000000-000a-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Montaje de Puertas de Madera y Cerraduras de Seguridad',
      'Instalación precisa con bisagras reforzadas y pomo.',
      60000, 'unidad', 'Cúcuta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Montaje de Puertas de Madera y Cerraduras de Seguridad',
        description = 'Instalación precisa con bisagras reforzadas y pomo.',
        price = 60000,
        type = 'service',
        status = 'published',
        city = 'Cúcuta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Instalaciones & Reformas Locales
  v_list_id := 'd1000000-000a-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Reparación de Tejas Rotas y Sellado de Goteras',
      'Cambio de tejas de barro o zinc con cinta tapagoteras impermeable.',
      75000, 'tramo', 'Cúcuta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Reparación de Tejas Rotas y Sellado de Goteras',
        description = 'Cambio de tejas de barro o zinc con cinta tapagoteras impermeable.',
        price = 75000,
        type = 'service',
        status = 'published',
        city = 'Cúcuta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Instalaciones & Reformas Locales
  v_list_id := 'd1000000-000a-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Soldadura y Reparación de Rejas y Portones Metálicos',
      'Refuerzo de bisagras, cerrojos y pintura anticorrosiva.',
      85000, 'trabajo', 'Cúcuta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Soldadura y Reparación de Rejas y Portones Metálicos',
        description = 'Refuerzo de bisagras, cerrojos y pintura anticorrosiva.',
        price = 85000,
        type = 'service',
        status = 'published',
        city = 'Cúcuta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Instalaciones & Reformas Locales
  v_list_id := 'd1000000-000a-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Instalación de Cortinas Enrollables y Persianas',
      'Fijación con chazos de expansión en muros de ladrillo o drywall.',
      30000, 'unidad', 'Cúcuta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Instalación de Cortinas Enrollables y Persianas',
        description = 'Fijación con chazos de expansión en muros de ladrillo o drywall.',
        price = 30000,
        type = 'service',
        status = 'published',
        city = 'Cúcuta'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Instalaciones & Reformas Locales
  v_list_id := 'd1000000-000a-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'service',
      'Construcción de Mesones en Granito Natural y Mármol',
      'Diseño a medida para cocinas integrales y baños modernos.',
      320000, 'metro', 'Cúcuta', 'published', 25,
      '{"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Construcción de Mesones en Granito Natural y Mármol',
        description = 'Diseño a medida para cocinas integrales y baños modernos.',
        price = 320000,
        type = 'service',
        status = 'published',
        city = 'Cúcuta'
    WHERE id = v_list_id;
  END IF;


  -- ============================================================
  -- PARTE 3: 10 VENDEDORES DE PRODUCTOS USADOS (100 ARTÍCULOS USADOS)
  -- ============================================================

  -- Vendedor 1: Compraventa & Usados La 50 (usados1@marketplace.com)
  v_user_id := 'b2000000-0000-0000-0000-000000000001';
  v_seller_id := 'c2000000-0000-0000-0000-000000000001';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'usados1@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'usados1@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Don Mario Usados"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'usados1@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Don Mario Usados"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'usados1@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Don Mario Usados', 'seller', 'Bogotá', '3113334401')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Compraventa & Usados La 50', 'Artículos y Usados', 'Bogotá',
      '573113334401', '573113334401', true, 4.90, 15,
      'Comercio formalizado en Bogotá especializado en artículos y usados. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Compraventa & Usados La 50',
        owner_user_id = v_user_id,
        city = 'Bogotá',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Compraventa & Usados La 50', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Compraventa & Usados La 50
  v_list_id := 'd2000000-0001-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Televisor Samsung 43 Pulgadas Full HD Usado',
      'En perfecto estado estético y funcional, incluye control remoto original.',
      420000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Televisor Samsung 43 Pulgadas Full HD Usado',
        description = 'En perfecto estado estético y funcional, incluye control remoto original.',
        price = 420000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Compraventa & Usados La 50
  v_list_id := 'd2000000-0001-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Consola PlayStation 4 Slim 1TB con 2 Controles Usada',
      'Excelente estado térmico, incluye 3 juegos físicos originales.',
      850000, 'combo', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Consola PlayStation 4 Slim 1TB con 2 Controles Usada',
        description = 'Excelente estado térmico, incluye 3 juegos físicos originales.',
        price = 850000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Compraventa & Usados La 50
  v_list_id := 'd2000000-0001-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Bicicleta de Montaña Rin 29 Marco en Aluminio Usada',
      'Cambios Shimano de 21 velocidades y frenos de disco mecánicos.',
      480000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Bicicleta de Montaña Rin 29 Marco en Aluminio Usada',
        description = 'Cambios Shimano de 21 velocidades y frenos de disco mecánicos.',
        price = 480000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Compraventa & Usados La 50
  v_list_id := 'd2000000-0001-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Nevera Haceb 240 Litros No Frost de Segunda Mano',
      'Enfriando perfectamente, bandejas de vidrio templado completas.',
      520000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Nevera Haceb 240 Litros No Frost de Segunda Mano',
        description = 'Enfriando perfectamente, bandejas de vidrio templado completas.',
        price = 520000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Compraventa & Usados La 50
  v_list_id := 'd2000000-0001-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Taladro Percutor DeWalt 1/2 Pulgada 650W Usado',
      'Herramienta industrial original en caja de transporte plástica.',
      180000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Taladro Percutor DeWalt 1/2 Pulgada 650W Usado',
        description = 'Herramienta industrial original en caja de transporte plástica.',
        price = 180000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Compraventa & Usados La 50
  v_list_id := 'd2000000-0001-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Guitarra Acústica Yamaha F310 Segunda Mano',
      'Sonido cálido y equilibrado, cuerdas nuevas DAddario recién puestas.',
      320000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Guitarra Acústica Yamaha F310 Segunda Mano',
        description = 'Sonido cálido y equilibrado, cuerdas nuevas DAddario recién puestas.',
        price = 320000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Compraventa & Usados La 50
  v_list_id := 'd2000000-0001-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Juego de Comedor 4 Puestos en Madera Maciza Usado',
      'Mesa cuadrada con 4 sillas tapizadas en tela antifluido.',
      380000, 'juego', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Juego de Comedor 4 Puestos en Madera Maciza Usado',
        description = 'Mesa cuadrada con 4 sillas tapizadas en tela antifluido.',
        price = 380000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Compraventa & Usados La 50
  v_list_id := 'd2000000-0001-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Lavadora Whirlpool 16 Kg Carga Superior Usada',
      'Tina de acero inoxidable con agitador de doble acción probado.',
      620000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Lavadora Whirlpool 16 Kg Carga Superior Usada',
        description = 'Tina de acero inoxidable con agitador de doble acción probado.',
        price = 620000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Compraventa & Usados La 50
  v_list_id := 'd2000000-0001-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Laptop HP Core i5 8GB RAM Disco SSD 256GB Reacondicionado',
      'Batería con 3 horas de autonomía, cargador original incluido.',
      790000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Laptop HP Core i5 8GB RAM Disco SSD 256GB Reacondicionado',
        description = 'Batería con 3 horas de autonomía, cargador original incluido.',
        price = 790000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Compraventa & Usados La 50
  v_list_id := 'd2000000-0001-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Horno Tostador y Freidor Oster Compacto Usado',
      'Ideal para hornear, calentar y dorar porciones medianas.',
      130000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Horno Tostador y Freidor Oster Compacto Usado',
        description = 'Ideal para hornear, calentar y dorar porciones medianas.',
        price = 130000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 2: Vintage & Moda Circular El Rastrillo (usados2@marketplace.com)
  v_user_id := 'b2000000-0000-0000-0000-000000000002';
  v_seller_id := 'c2000000-0000-0000-0000-000000000002';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'usados2@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'usados2@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Juliana Vintage"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'usados2@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Juliana Vintage"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'usados2@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Juliana Vintage', 'seller', 'Medellín', '3113334402')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Vintage & Moda Circular El Rastrillo', 'Ropa y Accesorios', 'Medellín',
      '573113334402', '573113334402', true, 4.90, 15,
      'Comercio formalizado en Medellín especializado en ropa y accesorios. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Vintage & Moda Circular El Rastrillo',
        owner_user_id = v_user_id,
        city = 'Medellín',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Vintage & Moda Circular El Rastrillo', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Vintage & Moda Circular El Rastrillo
  v_list_id := 'd2000000-0002-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'article',
      'Chaqueta de Cuero Genuino Estilo Biker Vintage',
      'Cuero auténtico con pátina natural clásica de los años 90.',
      160000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Chaqueta de Cuero Genuino Estilo Biker Vintage',
        description = 'Cuero auténtico con pátina natural clásica de los años 90.',
        price = 160000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Vintage & Moda Circular El Rastrillo
  v_list_id := 'd2000000-0002-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'article',
      'Saco de Lana Tejido a Mano Oversize Vintage',
      'Diseño único en tonos tierra, cálido y suave al tacto.',
      55000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Saco de Lana Tejido a Mano Oversize Vintage',
        description = 'Diseño único en tonos tierra, cálido y suave al tacto.',
        price = 55000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Vintage & Moda Circular El Rastrillo
  v_list_id := 'd2000000-0002-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'article',
      'Jeans Levis 501 Originales Talla 32 Segunda Mano',
      'Corte recto clásico americano en denim pesado de alta resistencia.',
      85000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Jeans Levis 501 Originales Talla 32 Segunda Mano',
        description = 'Corte recto clásico americano en denim pesado de alta resistencia.',
        price = 85000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Vintage & Moda Circular El Rastrillo
  v_list_id := 'd2000000-0002-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'article',
      'Vestido Bohemio Floral de Algodón Años 80 Usado',
      'Estampado floral retro con botones frontales de nácar.',
      60000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Vestido Bohemio Floral de Algodón Años 80 Usado',
        description = 'Estampado floral retro con botones frontales de nácar.',
        price = 60000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Vintage & Moda Circular El Rastrillo
  v_list_id := 'd2000000-0002-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'article',
      'Bolso de Hombro en Cuero Marrón Retro Usado',
      'Compartimento amplio con herrajes dorados en perfecto estado.',
      75000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Bolso de Hombro en Cuero Marrón Retro Usado',
        description = 'Compartimento amplio con herrajes dorados en perfecto estado.',
        price = 75000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Vintage & Moda Circular El Rastrillo
  v_list_id := 'd2000000-0002-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'article',
      'Camisa Hawaiana Estampada Rayón Vintage',
      'Tela fresca y transpirable, corte holgado ideal para clima cálido.',
      45000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Camisa Hawaiana Estampada Rayón Vintage',
        description = 'Tela fresca y transpirable, corte holgado ideal para clima cálido.',
        price = 45000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Vintage & Moda Circular El Rastrillo
  v_list_id := 'd2000000-0002-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'article',
      'Gafas de Sol Estilo Aviador Retro con Estuche',
      'Marco metálico dorado con filtro UV400 verificado.',
      40000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Gafas de Sol Estilo Aviador Retro con Estuche',
        description = 'Marco metálico dorado con filtro UV400 verificado.',
        price = 40000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Vintage & Moda Circular El Rastrillo
  v_list_id := 'd2000000-0002-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'article',
      'Falda Midi Plisada Clásica Segunda Mano',
      'Pretina elástica cómoda en tejido suave de caída elegante.',
      48000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Falda Midi Plisada Clásica Segunda Mano',
        description = 'Pretina elástica cómoda en tejido suave de caída elegante.',
        price = 48000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Vintage & Moda Circular El Rastrillo
  v_list_id := 'd2000000-0002-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'article',
      'Botines de Cuero Genuino para Mujer Talla 37 Usados',
      'Tacón bajo cómodo con suela de caucho antideslizante.',
      90000, 'par', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Botines de Cuero Genuino para Mujer Talla 37 Usados',
        description = 'Tacón bajo cómodo con suela de caucho antideslizante.',
        price = 90000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Vintage & Moda Circular El Rastrillo
  v_list_id := 'd2000000-0002-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'article',
      'Bufanda de Cachemira y Lana Escocesa Vintage',
      'Patrón clásico tartán en excelente conservación sin motas.',
      35000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Bufanda de Cachemira y Lana Escocesa Vintage',
        description = 'Patrón clásico tartán en excelente conservación sin motas.',
        price = 35000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 3: Librería de Segunda & Joyas Literarias (usados3@marketplace.com)
  v_user_id := 'b2000000-0000-0000-0000-000000000003';
  v_seller_id := 'c2000000-0000-0000-0000-000000000003';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'usados3@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'usados3@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Ernesto Libros"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'usados3@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Ernesto Libros"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'usados3@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Ernesto Libros', 'seller', 'Cali', '3113334403')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Librería de Segunda & Joyas Literarias', 'Otros', 'Cali',
      '573113334403', '573113334403', true, 4.90, 15,
      'Comercio formalizado en Cali especializado en otros. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Librería de Segunda & Joyas Literarias',
        owner_user_id = v_user_id,
        city = 'Cali',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Librería de Segunda & Joyas Literarias', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Librería de Segunda & Joyas Literarias
  v_list_id := 'd2000000-0003-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Cien Años de Soledad - Gabriel García Márquez (Edición Rara)',
      'Tapa dura en excelente conservación, sin rayas ni humedad.',
      45000, 'libro', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cien Años de Soledad - Gabriel García Márquez (Edición Rara)',
        description = 'Tapa dura en excelente conservación, sin rayas ni humedad.',
        price = 45000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Librería de Segunda & Joyas Literarias
  v_list_id := 'd2000000-0003-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Colección Trilogía El Señor de los Anillos Usada',
      'Los tres tomos completos en estuche contenedor de colección.',
      95000, 'pack', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Colección Trilogía El Señor de los Anillos Usada',
        description = 'Los tres tomos completos en estuche contenedor de colección.',
        price = 95000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Librería de Segunda & Joyas Literarias
  v_list_id := 'd2000000-0003-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'El Principito - Antoine de Saint-Exupéry Ilustrado Usado',
      'Edición clásica con acuarelas originales del autor.',
      25000, 'libro', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'El Principito - Antoine de Saint-Exupéry Ilustrado Usado',
        description = 'Edición clásica con acuarelas originales del autor.',
        price = 25000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Librería de Segunda & Joyas Literarias
  v_list_id := 'd2000000-0003-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Rayuela - Julio Cortázar Edición Conmemorativa Segunda Mano',
      'Incluye el tablero de dirección de lectura original intacto.',
      35000, 'libro', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Rayuela - Julio Cortázar Edición Conmemorativa Segunda Mano',
        description = 'Incluye el tablero de dirección de lectura original intacto.',
        price = 35000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Librería de Segunda & Joyas Literarias
  v_list_id := 'd2000000-0003-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Enciclopedia Británica Ilustrada Tomos Seleccionados',
      '5 tomos ilustrados con mapas históricos a todo color.',
      120000, 'colección', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Enciclopedia Británica Ilustrada Tomos Seleccionados',
        description = '5 tomos ilustrados con mapas históricos a todo color.',
        price = 120000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Librería de Segunda & Joyas Literarias
  v_list_id := 'd2000000-0003-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Sapiens: De Animales a Dioses - Yuval Noah Harari Usado',
      'Bestseller mundial en perfecto estado de páginas limpias.',
      40000, 'libro', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Sapiens: De Animales a Dioses - Yuval Noah Harari Usado',
        description = 'Bestseller mundial en perfecto estado de páginas limpias.',
        price = 40000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Librería de Segunda & Joyas Literarias
  v_list_id := 'd2000000-0003-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Lote de 5 Novelas de Misterio y Policiales de Segunda',
      'Obras de Agatha Christie y Arthur Conan Doyle.',
      50000, 'pack', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Lote de 5 Novelas de Misterio y Policiales de Segunda',
        description = 'Obras de Agatha Christie y Arthur Conan Doyle.',
        price = 50000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Librería de Segunda & Joyas Literarias
  v_list_id := 'd2000000-0003-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Diccionario de la Lengua Española RAE 2 Tomos Usado',
      'Edición encuadernada en tela editorial con letras doradas.',
      65000, 'juego', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Diccionario de la Lengua Española RAE 2 Tomos Usado',
        description = 'Edición encuadernada en tela editorial con letras doradas.',
        price = 65000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Librería de Segunda & Joyas Literarias
  v_list_id := 'd2000000-0003-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Hábitos Atómicos - James Clear Segunda Mano',
      'Guía práctica para transformar tu vida diaria con hábitos clave.',
      38000, 'libro', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Hábitos Atómicos - James Clear Segunda Mano',
        description = 'Guía práctica para transformar tu vida diaria con hábitos clave.',
        price = 38000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Librería de Segunda & Joyas Literarias
  v_list_id := 'd2000000-0003-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Colección de Revistas National Geographic Años 90 (10 Unidades)',
      'Reportajes legendarios con mapas desplegables originales.',
      45000, 'lote', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Colección de Revistas National Geographic Años 90 (10 Unidades)',
        description = 'Reportajes legendarios con mapas desplegables originales.',
        price = 45000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 4: Autopartes & Repuestos Recuperados (usados4@marketplace.com)
  v_user_id := 'b2000000-0000-0000-0000-000000000004';
  v_seller_id := 'c2000000-0000-0000-0000-000000000004';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'usados4@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'usados4@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Roberto Autopartes"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'usados4@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Roberto Autopartes"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'usados4@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Roberto Autopartes', 'seller', 'Barranquilla', '3113334404')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Autopartes & Repuestos Recuperados', 'Servicios del Hogar', 'Barranquilla',
      '573113334404', '573113334404', true, 4.90, 15,
      'Comercio formalizado en Barranquilla especializado en servicios del hogar. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Autopartes & Repuestos Recuperados',
        owner_user_id = v_user_id,
        city = 'Barranquilla',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Autopartes & Repuestos Recuperados', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Autopartes & Repuestos Recuperados
  v_list_id := 'd2000000-0004-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Alternador Original Bosch para Chevrolet Spark Usado',
      'Bobinado verificado y carbones nuevos con salida de 14.2V.',
      140000, 'unidad', 'Barranquilla', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Alternador Original Bosch para Chevrolet Spark Usado',
        description = 'Bobinado verificado y carbones nuevos con salida de 14.2V.',
        price = 140000,
        type = 'article',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Autopartes & Repuestos Recuperados
  v_list_id := 'd2000000-0004-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Juego de Farolas Delanteras Originales Renault Logan Usadas',
      'Policarbonato pulido transparente sin soportes rotos.',
      180000, 'par', 'Barranquilla', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Juego de Farolas Delanteras Originales Renault Logan Usadas',
        description = 'Policarbonato pulido transparente sin soportes rotos.',
        price = 180000,
        type = 'article',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Autopartes & Repuestos Recuperados
  v_list_id := 'd2000000-0004-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Cremallera de Dirección Mecánica para Hyundai Accent Usada',
      'Sin fugas en retenes ni juego interno en la barra axial.',
      220000, 'unidad', 'Barranquilla', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cremallera de Dirección Mecánica para Hyundai Accent Usada',
        description = 'Sin fugas en retenes ni juego interno en la barra axial.',
        price = 220000,
        type = 'article',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Autopartes & Repuestos Recuperados
  v_list_id := 'd2000000-0004-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Motor de Arranque Denso para Toyota Hilux Reacondicionado',
      'Automático y piñón bendix recién probados en banco.',
      260000, 'unidad', 'Barranquilla', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Motor de Arranque Denso para Toyota Hilux Reacondicionado',
        description = 'Automático y piñón bendix recién probados en banco.',
        price = 260000,
        type = 'article',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Autopartes & Repuestos Recuperados
  v_list_id := 'd2000000-0004-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Juego de Rines 15 Pulgadas en Aluminio 4 Huecos Usados',
      'Sin golpes ni fisuras, balanceo perfecto listo para instalar.',
      450000, 'juego', 'Barranquilla', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Juego de Rines 15 Pulgadas en Aluminio 4 Huecos Usados',
        description = 'Sin golpes ni fisuras, balanceo perfecto listo para instalar.',
        price = 450000,
        type = 'article',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Autopartes & Repuestos Recuperados
  v_list_id := 'd2000000-0004-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Bomba de Gasolina Completa con Flotador para Mazda 3 Usada',
      'Presión de combustible probada a 45 PSI estable.',
      130000, 'unidad', 'Barranquilla', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Bomba de Gasolina Completa con Flotador para Mazda 3 Usada',
        description = 'Presión de combustible probada a 45 PSI estable.',
        price = 130000,
        type = 'article',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Autopartes & Repuestos Recuperados
  v_list_id := 'd2000000-0004-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Retrovisores Eléctricos Originales para Kia Rio Usados',
      'Motores de inclinación y desempañador funcionando al 100%.',
      120000, 'par', 'Barranquilla', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Retrovisores Eléctricos Originales para Kia Rio Usados',
        description = 'Motores de inclinación y desempañador funcionando al 100%.',
        price = 120000,
        type = 'article',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Autopartes & Repuestos Recuperados
  v_list_id := 'd2000000-0004-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Compresor de Aire Acondicionado Sanden Reacondicionado',
      'Compresión óptima y embrague magnético comprobado.',
      290000, 'unidad', 'Barranquilla', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Compresor de Aire Acondicionado Sanden Reacondicionado',
        description = 'Compresión óptima y embrague magnético comprobado.',
        price = 290000,
        type = 'article',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Autopartes & Repuestos Recuperados
  v_list_id := 'd2000000-0004-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Computadora de Motor / ECU Original para Aveo 1.6 Usada',
      'Inmovilizador liberado, lista para instalar plug and play.',
      250000, 'unidad', 'Barranquilla', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Computadora de Motor / ECU Original para Aveo 1.6 Usada',
        description = 'Inmovilizador liberado, lista para instalar plug and play.',
        price = 250000,
        type = 'article',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Autopartes & Repuestos Recuperados
  v_list_id := 'd2000000-0004-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Radiador de Aluminio y Plástico para Nissan Sentra Usado',
      'Limpieza y prueba de presión a 15 PSI sin pérdidas.',
      110000, 'unidad', 'Barranquilla', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Radiador de Aluminio y Plástico para Nissan Sentra Usado',
        description = 'Limpieza y prueba de presión a 15 PSI sin pérdidas.',
        price = 110000,
        type = 'article',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 5: Guitarras & Instrumentos Segunda Nota (usados5@marketplace.com)
  v_user_id := 'b2000000-0000-0000-0000-000000000005';
  v_seller_id := 'c2000000-0000-0000-0000-000000000005';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'usados5@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'usados5@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Fabián Músico"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'usados5@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Fabián Músico"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'usados5@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Fabián Músico', 'seller', 'Bucaramanga', '3113334405')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Guitarras & Instrumentos Segunda Nota', 'Otros', 'Bucaramanga',
      '573113334405', '573113334405', true, 4.90, 15,
      'Comercio formalizado en Bucaramanga especializado en otros. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Guitarras & Instrumentos Segunda Nota',
        owner_user_id = v_user_id,
        city = 'Bucaramanga',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Guitarras & Instrumentos Segunda Nota', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Guitarras & Instrumentos Segunda Nota
  v_list_id := 'd2000000-0005-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Guitarra Eléctrica Fender Squier Stratocaster Usada',
      'Configuración SSS con mástil recto y trasteo calibrado.',
      580000, 'unidad', 'Bucaramanga', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Guitarra Eléctrica Fender Squier Stratocaster Usada',
        description = 'Configuración SSS con mástil recto y trasteo calibrado.',
        price = 580000,
        type = 'article',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Guitarras & Instrumentos Segunda Nota
  v_list_id := 'd2000000-0005-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Teclado Musical Yamaha PSR-E363 de 61 Teclas Usado',
      'Teclas sensibles al tacto, incluye atril y fuente original.',
      490000, 'unidad', 'Bucaramanga', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Teclado Musical Yamaha PSR-E363 de 61 Teclas Usado',
        description = 'Teclas sensibles al tacto, incluye atril y fuente original.',
        price = 490000,
        type = 'article',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Guitarras & Instrumentos Segunda Nota
  v_list_id := 'd2000000-0005-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Pedal de Distorsión Boss DS-1 para Guitarra Usado',
      'El sonido clásico del rock en carcasa metálica indestructible.',
      160000, 'unidad', 'Bucaramanga', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Pedal de Distorsión Boss DS-1 para Guitarra Usado',
        description = 'El sonido clásico del rock en carcasa metálica indestructible.',
        price = 160000,
        type = 'article',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Guitarras & Instrumentos Segunda Nota
  v_list_id := 'd2000000-0005-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Bajo Eléctrico Ibanez GSR200 4 Cuerdas Activo Usado',
      'Circuito Phat II Bass Boost para graves potentes y definidos.',
      650000, 'unidad', 'Bucaramanga', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Bajo Eléctrico Ibanez GSR200 4 Cuerdas Activo Usado',
        description = 'Circuito Phat II Bass Boost para graves potentes y definidos.',
        price = 650000,
        type = 'article',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Guitarras & Instrumentos Segunda Nota
  v_list_id := 'd2000000-0005-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Micrófono de Condensador Audio-Technica AT2020 Usado',
      'Cápsula diafragma de baja masa ideal para voces e instrumentos.',
      280000, 'unidad', 'Bucaramanga', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Micrófono de Condensador Audio-Technica AT2020 Usado',
        description = 'Cápsula diafragma de baja masa ideal para voces e instrumentos.',
        price = 280000,
        type = 'article',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Guitarras & Instrumentos Segunda Nota
  v_list_id := 'd2000000-0005-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Amplificador de Guitarra Fender Champion 20W Usado',
      'Efectos digitales integrados de reverb, chorus y delay.',
      340000, 'unidad', 'Bucaramanga', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Amplificador de Guitarra Fender Champion 20W Usado',
        description = 'Efectos digitales integrados de reverb, chorus y delay.',
        price = 340000,
        type = 'article',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Guitarras & Instrumentos Segunda Nota
  v_list_id := 'd2000000-0005-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Saxofón Alto Dorado con Estuche Rígido Segunda Mano',
      'Zapatillas herméticas recién niveladas y boquilla completa.',
      980000, 'unidad', 'Bucaramanga', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Saxofón Alto Dorado con Estuche Rígido Segunda Mano',
        description = 'Zapatillas herméticas recién niveladas y boquilla completa.',
        price = 980000,
        type = 'article',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Guitarras & Instrumentos Segunda Nota
  v_list_id := 'd2000000-0005-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Batería Electrónica Alesis Nitro Mesh Kit Usada',
      'Pads de malla silenciosos con módulo de 40 kits de batería.',
      1350000, 'kit', 'Bucaramanga', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Batería Electrónica Alesis Nitro Mesh Kit Usada',
        description = 'Pads de malla silenciosos con módulo de 40 kits de batería.',
        price = 1350000,
        type = 'article',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Guitarras & Instrumentos Segunda Nota
  v_list_id := 'd2000000-0005-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Ukelele Concierto de Caoba Fender Usado',
      'Sonido dulce y brillante, clavijeros sellados que afinan bien.',
      140000, 'unidad', 'Bucaramanga', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Ukelele Concierto de Caoba Fender Usado',
        description = 'Sonido dulce y brillante, clavijeros sellados que afinan bien.',
        price = 140000,
        type = 'article',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Guitarras & Instrumentos Segunda Nota
  v_list_id := 'd2000000-0005-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Interfaz de Audio USB Focusrite Scarlett Solo 3ra Gen Usada',
      'Preamplificador de alta ganancia con modo Air funcional.',
      320000, 'unidad', 'Bucaramanga', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Interfaz de Audio USB Focusrite Scarlett Solo 3ra Gen Usada',
        description = 'Preamplificador de alta ganancia con modo Air funcional.',
        price = 320000,
        type = 'article',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 6: Muebles & Reliquias Retro Bogotá (usados6@marketplace.com)
  v_user_id := 'b2000000-0000-0000-0000-000000000006';
  v_seller_id := 'c2000000-0000-0000-0000-000000000006';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'usados6@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'usados6@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Doña Cecilia Muebles"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'usados6@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Doña Cecilia Muebles"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'usados6@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Doña Cecilia Muebles', 'seller', 'Bogotá', '3113334406')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Muebles & Reliquias Retro Bogotá', 'Servicios del Hogar', 'Bogotá',
      '573113334406', '573113334406', true, 4.90, 15,
      'Comercio formalizado en Bogotá especializado en servicios del hogar. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Muebles & Reliquias Retro Bogotá',
        owner_user_id = v_user_id,
        city = 'Bogotá',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Muebles & Reliquias Retro Bogotá', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Muebles & Reliquias Retro Bogotá
  v_list_id := 'd2000000-0006-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Aparador / Bufet Años 60 en Cedro Caquetá Usado',
      'Tres cajones amplios y dos puertas con manijas originales de bronce.',
      580000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Aparador / Bufet Años 60 en Cedro Caquetá Usado',
        description = 'Tres cajones amplios y dos puertas con manijas originales de bronce.',
        price = 580000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Muebles & Reliquias Retro Bogotá
  v_list_id := 'd2000000-0006-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Mecedoras Clásicas de Madera y Mimbre (Par) Usadas',
      'Madera maciza inmunizada con tejido de junco tradicional.',
      260000, 'par', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Mecedoras Clásicas de Madera y Mimbre (Par) Usadas',
        description = 'Madera maciza inmunizada con tejido de junco tradicional.',
        price = 260000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Muebles & Reliquias Retro Bogotá
  v_list_id := 'd2000000-0006-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Escritorio Ejecutivo Vintage en Roble Restaurado',
      'Seis gavetas laterales con cerradura y llave funcional.',
      420000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Escritorio Ejecutivo Vintage en Roble Restaurado',
        description = 'Seis gavetas laterales con cerradura y llave funcional.',
        price = 420000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Muebles & Reliquias Retro Bogotá
  v_list_id := 'd2000000-0006-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Espejo Clásico con Marco Tallado en Madera Dorada Usado',
      'Cristal biselado auténtico de 80x60 cm sin manchas de óxido.',
      190000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Espejo Clásico con Marco Tallado en Madera Dorada Usado',
        description = 'Cristal biselado auténtico de 80x60 cm sin manchas de óxido.',
        price = 190000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Muebles & Reliquias Retro Bogotá
  v_list_id := 'd2000000-0006-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Biblioteca Modular Rústica en Madera de Pino Usada',
      'Cuatro entrepaños reforzados con capacidad para 150 libros.',
      280000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Biblioteca Modular Rústica en Madera de Pino Usada',
        description = 'Cuatro entrepaños reforzados con capacidad para 150 libros.',
        price = 280000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Muebles & Reliquias Retro Bogotá
  v_list_id := 'd2000000-0006-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Mesa de Centro Estilo Mid-Century con Vidrio Ahumado',
      'Patas cónicas de madera con puntas metálicas retro.',
      160000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Mesa de Centro Estilo Mid-Century con Vidrio Ahumado',
        description = 'Patas cónicas de madera con puntas metálicas retro.',
        price = 160000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Muebles & Reliquias Retro Bogotá
  v_list_id := 'd2000000-0006-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Baúl Antiguo de Viaje con Herrajes de Hierro Forjado',
      'Excelente como elemento decorativo de sala o pie de cama.',
      240000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Baúl Antiguo de Viaje con Herrajes de Hierro Forjado',
        description = 'Excelente como elemento decorativo de sala o pie de cama.',
        price = 240000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Muebles & Reliquias Retro Bogotá
  v_list_id := 'd2000000-0006-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Sillas de Comedor Thonet Curvadas (Juego de 4) Usadas',
      'Estructura clásica de haya curvada al vapor muy resistente.',
      320000, 'juego', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Sillas de Comedor Thonet Curvadas (Juego de 4) Usadas',
        description = 'Estructura clásica de haya curvada al vapor muy resistente.',
        price = 320000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Muebles & Reliquias Retro Bogotá
  v_list_id := 'd2000000-0006-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Cama Doble en Bronce Clásica de Segunda Mano',
      'Cabecero y piecero en tubos macizos de latón dorado.',
      550000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cama Doble en Bronce Clásica de Segunda Mano',
        description = 'Cabecero y piecero en tubos macizos de latón dorado.',
        price = 550000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Muebles & Reliquias Retro Bogotá
  v_list_id := 'd2000000-0006-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Lámpara de Pie Vintage con Pantalla de Tela Plisada',
      'Base pesada de hierro fundido con interruptor de pedal.',
      110000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Lámpara de Pie Vintage con Pantalla de Tela Plisada',
        description = 'Base pesada de hierro fundido con interruptor de pedal.',
        price = 110000,
        type = 'article',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 7: TechOutlet: Celulares Reacondicionados (usados7@marketplace.com)
  v_user_id := 'b2000000-0000-0000-0000-000000000007';
  v_seller_id := 'c2000000-0000-0000-0000-000000000007';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'usados7@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'usados7@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Kevin Tech"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'usados7@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Kevin Tech"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'usados7@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Kevin Tech', 'seller', 'Medellín', '3113334407')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'TechOutlet: Celulares Reacondicionados', 'Otros', 'Medellín',
      '573113334407', '573113334407', true, 4.90, 15,
      'Comercio formalizado en Medellín especializado en otros. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'TechOutlet: Celulares Reacondicionados',
        owner_user_id = v_user_id,
        city = 'Medellín',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'TechOutlet: Celulares Reacondicionados', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de TechOutlet: Celulares Reacondicionados
  v_list_id := 'd2000000-0007-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'iPhone 11 64GB Negro Reacondicionado Grado A',
      'Batería al 87%, libre para cualquier operador nacional.',
      950000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'iPhone 11 64GB Negro Reacondicionado Grado A',
        description = 'Batería al 87%, libre para cualquier operador nacional.',
        price = 950000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de TechOutlet: Celulares Reacondicionados
  v_list_id := 'd2000000-0007-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Samsung Galaxy S20 FE 128GB Usado Como Nuevo',
      'Pantalla Super AMOLED 120Hz sin rayones, cargador rápido.',
      720000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Samsung Galaxy S20 FE 128GB Usado Como Nuevo',
        description = 'Pantalla Super AMOLED 120Hz sin rayones, cargador rápido.',
        price = 720000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de TechOutlet: Celulares Reacondicionados
  v_list_id := 'd2000000-0007-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Xiaomi Redmi Note 11 128GB / 6GB RAM Usado',
      'Excelente batería de 5000mAh, incluye funda protectora.',
      430000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Xiaomi Redmi Note 11 128GB / 6GB RAM Usado',
        description = 'Excelente batería de 5000mAh, incluye funda protectora.',
        price = 430000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de TechOutlet: Celulares Reacondicionados
  v_list_id := 'd2000000-0007-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'iPad 8va Generación 32GB Wi-Fi Usado',
      'Compatible con Apple Pencil, pantalla Retina nítida.',
      790000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'iPad 8va Generación 32GB Wi-Fi Usado',
        description = 'Compatible con Apple Pencil, pantalla Retina nítida.',
        price = 790000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de TechOutlet: Celulares Reacondicionados
  v_list_id := 'd2000000-0007-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Reloj Inteligente Apple Watch Series 5 44mm Usado',
      'Pantalla siempre activa, sensor ECG y correa deportiva original.',
      550000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Reloj Inteligente Apple Watch Series 5 44mm Usado',
        description = 'Pantalla siempre activa, sensor ECG y correa deportiva original.',
        price = 550000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de TechOutlet: Celulares Reacondicionados
  v_list_id := 'd2000000-0007-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Audífonos Sony WH-1000XM4 con Cancelación de Ruido Usados',
      'Audio Hi-Res, batería de 30 horas y almohadillas en buen estado.',
      620000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Audífonos Sony WH-1000XM4 con Cancelación de Ruido Usados',
        description = 'Audio Hi-Res, batería de 30 horas y almohadillas en buen estado.',
        price = 620000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de TechOutlet: Celulares Reacondicionados
  v_list_id := 'd2000000-0007-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Consola Nintendo Switch V2 con Joy-Cons Usada',
      'Incluye dock para TV, cables y estuche de transporte viajero.',
      820000, 'consola', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Consola Nintendo Switch V2 con Joy-Cons Usada',
        description = 'Incluye dock para TV, cables y estuche de transporte viajero.',
        price = 820000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de TechOutlet: Celulares Reacondicionados
  v_list_id := 'd2000000-0007-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Kindle Paperwhite 10ma Generación 8GB Usado',
      'Luz cálida ajustable y protección contra agua para lectura.',
      260000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Kindle Paperwhite 10ma Generación 8GB Usado',
        description = 'Luz cálida ajustable y protección contra agua para lectura.',
        price = 260000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de TechOutlet: Celulares Reacondicionados
  v_list_id := 'd2000000-0007-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Monitor Gamer LG 24 Pulgadas IPS 75Hz Usado',
      'Resolución Full HD con entradas HDMI y bordes ultradelgados.',
      340000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Monitor Gamer LG 24 Pulgadas IPS 75Hz Usado',
        description = 'Resolución Full HD con entradas HDMI y bordes ultradelgados.',
        price = 340000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de TechOutlet: Celulares Reacondicionados
  v_list_id := 'd2000000-0007-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Parlante Bluetooth JBL Charge 4 Resistente al Agua Usado',
      'Sonido potente con bajos profundos y función powerbank.',
      290000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Parlante Bluetooth JBL Charge 4 Resistente al Agua Usado',
        description = 'Sonido potente con bajos profundos y función powerbank.',
        price = 290000,
        type = 'article',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 8: Herramientas de Ocasión Don Pedro (usados8@marketplace.com)
  v_user_id := 'b2000000-0000-0000-0000-000000000008';
  v_seller_id := 'c2000000-0000-0000-0000-000000000008';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'usados8@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'usados8@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Don Pedro Herramientas"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'usados8@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Don Pedro Herramientas"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'usados8@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Don Pedro Herramientas', 'seller', 'Cali', '3113334408')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Herramientas de Ocasión Don Pedro', 'Servicios del Hogar', 'Cali',
      '573113334408', '573113334408', true, 4.90, 15,
      'Comercio formalizado en Cali especializado en servicios del hogar. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Herramientas de Ocasión Don Pedro',
        owner_user_id = v_user_id,
        city = 'Cali',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Herramientas de Ocasión Don Pedro', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Herramientas de Ocasión Don Pedro
  v_list_id := 'd2000000-0008-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Pulidora Angular Bosch 4 1/2 Pulgadas 750W Usada',
      'Motor sellado antipolvo con guarda de protección original.',
      130000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Pulidora Angular Bosch 4 1/2 Pulgadas 750W Usada',
        description = 'Motor sellado antipolvo con guarda de protección original.',
        price = 130000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Herramientas de Ocasión Don Pedro
  v_list_id := 'd2000000-0008-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Sierra Circular Makita 7 1/4 Pulgadas 1800W Usada',
      'Cortes precisos en madera, incluye disco de 40 dientes.',
      280000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Sierra Circular Makita 7 1/4 Pulgadas 1800W Usada',
        description = 'Cortes precisos en madera, incluye disco de 40 dientes.',
        price = 280000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Herramientas de Ocasión Don Pedro
  v_list_id := 'd2000000-0008-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Compresor de Aire Campbell Hausfeld 2 HP 24 Litros Usado',
      'Manómetros de presión calibrados, incluye manguera espiral.',
      390000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Compresor de Aire Campbell Hausfeld 2 HP 24 Litros Usado',
        description = 'Manómetros de presión calibrados, incluye manguera espiral.',
        price = 390000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Herramientas de Ocasión Don Pedro
  v_list_id := 'd2000000-0008-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Caja de Herramientas Stanley Metálica con 65 Piezas Usada',
      'Copas, raches, llaves mixtas y alicates de cromo vanadio.',
      190000, 'set', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Caja de Herramientas Stanley Metálica con 65 Piezas Usada',
        description = 'Copas, raches, llaves mixtas y alicates de cromo vanadio.',
        price = 190000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Herramientas de Ocasión Don Pedro
  v_list_id := 'd2000000-0008-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Soldador Inverter MMA 200 Amperios Portátil Usado',
      'Tecnología IGBT para electrodo 6013 y 7018 con careta.',
      320000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Soldador Inverter MMA 200 Amperios Portátil Usado',
        description = 'Tecnología IGBT para electrodo 6013 y 7018 con careta.',
        price = 320000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Herramientas de Ocasión Don Pedro
  v_list_id := 'd2000000-0008-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Escalera Tijera de Aluminio Werner 6 Pasos Usada',
      'Capacidad 150 kg con peldaños estriados antideslizantes.',
      160000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Escalera Tijera de Aluminio Werner 6 Pasos Usada',
        description = 'Capacidad 150 kg con peldaños estriados antideslizantes.',
        price = 160000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Herramientas de Ocasión Don Pedro
  v_list_id := 'd2000000-0008-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Hidrolavadora Kärcher K2 Compact 1600 PSI Usada',
      'Lanza vario power y boquilla turbo para lavado a presión.',
      220000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Hidrolavadora Kärcher K2 Compact 1600 PSI Usada',
        description = 'Lanza vario power y boquilla turbo para lavado a presión.',
        price = 220000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Herramientas de Ocasión Don Pedro
  v_list_id := 'd2000000-0008-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Lijadora Orbital de Palma DeWalt 1/4 de Hoja Usada',
      'Sistema de recolección de polvo y abrazaderas rápidas.',
      110000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Lijadora Orbital de Palma DeWalt 1/4 de Hoja Usada',
        description = 'Sistema de recolección de polvo y abrazaderas rápidas.',
        price = 110000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Herramientas de Ocasión Don Pedro
  v_list_id := 'd2000000-0008-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Nivel Láser Autonivelante de Líneas Cruzadas Usado',
      'Línea verde de alta visibilidad para instalación de cuadros y muros.',
      140000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Nivel Láser Autonivelante de Líneas Cruzadas Usado',
        description = 'Línea verde de alta visibilidad para instalación de cuadros y muros.',
        price = 140000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Herramientas de Ocasión Don Pedro
  v_list_id := 'd2000000-0008-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'article',
      'Prensa de Banco / Tornillo de Banco de 5 Pulgadas Usado',
      'Hierro fundido reforzado con base giratoria de 360 grados.',
      150000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Prensa de Banco / Tornillo de Banco de 5 Pulgadas Usado',
        description = 'Hierro fundido reforzado con base giratoria de 360 grados.',
        price = 150000,
        type = 'article',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 9: Bicicletas Usadas & Taller Ruta (usados9@marketplace.com)
  v_user_id := 'b2000000-0000-0000-0000-000000000009';
  v_seller_id := 'c2000000-0000-0000-0000-000000000009';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'usados9@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'usados9@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Andrés Ciclista"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'usados9@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Andrés Ciclista"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'usados9@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Andrés Ciclista', 'seller', 'Pereira', '3113334409')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Bicicletas Usadas & Taller Ruta', 'Otros', 'Pereira',
      '573113334409', '573113334409', true, 4.90, 15,
      'Comercio formalizado en Pereira especializado en otros. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Bicicletas Usadas & Taller Ruta',
        owner_user_id = v_user_id,
        city = 'Pereira',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Bicicletas Usadas & Taller Ruta', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Bicicletas Usadas & Taller Ruta
  v_list_id := 'd2000000-0009-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Bicicleta de Ruta GW Flamma Marco en Aluminio Usada',
      'Grupo Shimano Claris 8x2, tenedor en carbono y rines doble pared.',
      950000, 'unidad', 'Pereira', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Bicicleta de Ruta GW Flamma Marco en Aluminio Usada',
        description = 'Grupo Shimano Claris 8x2, tenedor en carbono y rines doble pared.',
        price = 950000,
        type = 'article',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Bicicletas Usadas & Taller Ruta
  v_list_id := 'd2000000-0009-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Bicicleta MTB Venzo Rin 29 Monoplato 1x11 Usada',
      'Frenos hidráulicos Shimano MT200 y suspensión con bloqueo al hombro.',
      890000, 'unidad', 'Pereira', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Bicicleta MTB Venzo Rin 29 Monoplato 1x11 Usada',
        description = 'Frenos hidráulicos Shimano MT200 y suspensión con bloqueo al hombro.',
        price = 890000,
        type = 'article',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Bicicletas Usadas & Taller Ruta
  v_list_id := 'd2000000-0009-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Bicicleta Urbana Clásica Estilo Holandés con Canastilla',
      'Monovelocidad cómoda con guardabarros y timbre vintage.',
      340000, 'unidad', 'Pereira', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Bicicleta Urbana Clásica Estilo Holandés con Canastilla',
        description = 'Monovelocidad cómoda con guardabarros y timbre vintage.',
        price = 340000,
        type = 'article',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Bicicletas Usadas & Taller Ruta
  v_list_id := 'd2000000-0009-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Casco de Ciclismo Giro Savant Talla M Usado',
      'Estructura In-Mold con 25 canales de ventilación aerodinámica.',
      90000, 'unidad', 'Pereira', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Casco de Ciclismo Giro Savant Talla M Usado',
        description = 'Estructura In-Mold con 25 canales de ventilación aerodinámica.',
        price = 90000,
        type = 'article',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Bicicletas Usadas & Taller Ruta
  v_list_id := 'd2000000-0009-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Rodillo de Entrenamiento para Ciclismo de Segunda',
      'Resistencia magnética regulable con soporte para rueda delantera.',
      230000, 'unidad', 'Pereira', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Rodillo de Entrenamiento para Ciclismo de Segunda',
        description = 'Resistencia magnética regulable con soporte para rueda delantera.',
        price = 230000,
        type = 'article',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Bicicletas Usadas & Taller Ruta
  v_list_id := 'd2000000-0009-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Juego de Luces Delantera y Trasera LED Recargables Usadas',
      '1000 lúmenes de potencia con batería de larga duración.',
      35000, 'set', 'Pereira', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Juego de Luces Delantera y Trasera LED Recargables Usadas',
        description = '1000 lúmenes de potencia con batería de larga duración.',
        price = 35000,
        type = 'article',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Bicicletas Usadas & Taller Ruta
  v_list_id := 'd2000000-0009-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Ciclocomputador GPS Garmin Edge 130 Plus Usado',
      'Sincronización con Strava, altímetro barométrico y navegación.',
      420000, 'unidad', 'Pereira', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Ciclocomputador GPS Garmin Edge 130 Plus Usado',
        description = 'Sincronización con Strava, altímetro barométrico y navegación.',
        price = 420000,
        type = 'article',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Bicicletas Usadas & Taller Ruta
  v_list_id := 'd2000000-0009-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Zapatillas de Ciclismo MTB con Calas SPD Talla 41 Usadas',
      'Ajuste milimétrico BOA y suela rígida de transferencia de energía.',
      120000, 'par', 'Pereira', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Zapatillas de Ciclismo MTB con Calas SPD Talla 41 Usadas',
        description = 'Ajuste milimétrico BOA y suela rígida de transferencia de energía.',
        price = 120000,
        type = 'article',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Bicicletas Usadas & Taller Ruta
  v_list_id := 'd2000000-0009-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Bomba de Pie / Inflador de Taller con Manómetro Usada',
      'Válvula dual para Presta y Schrader hasta 160 PSI.',
      45000, 'unidad', 'Pereira', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Bomba de Pie / Inflador de Taller con Manómetro Usada',
        description = 'Válvula dual para Presta y Schrader hasta 160 PSI.',
        price = 45000,
        type = 'article',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Bicicletas Usadas & Taller Ruta
  v_list_id := 'd2000000-0009-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Bolsa Alforja Impermeable para Bicicleta de Segunda',
      'Montaje rápido sobre parrilla trasera con detalles reflectivos.',
      50000, 'unidad', 'Pereira', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Bolsa Alforja Impermeable para Bicicleta de Segunda',
        description = 'Montaje rápido sobre parrilla trasera con detalles reflectivos.',
        price = 50000,
        type = 'article',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 10: Antigüedades & Numismática El Cofre (usados10@marketplace.com)
  v_user_id := 'b2000000-0000-0000-0000-00000000000a';
  v_seller_id := 'c2000000-0000-0000-0000-00000000000a';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'usados10@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'usados10@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Don Gonzalo Coleccionista"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'usados10@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Don Gonzalo Coleccionista"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'usados10@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Don Gonzalo Coleccionista', 'seller', 'Cartagena', '3113334410')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Antigüedades & Numismática El Cofre', 'Otros', 'Cartagena',
      '573113334410', '573113334410', true, 4.90, 15,
      'Comercio formalizado en Cartagena especializado en otros. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Antigüedades & Numismática El Cofre',
        owner_user_id = v_user_id,
        city = 'Cartagena',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Antigüedades & Numismática El Cofre', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Antigüedades & Numismática El Cofre
  v_list_id := 'd2000000-000a-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Reloj de Bolsillo Suizo en Plata Siglo XIX Usado',
      'Cuerda manual original en funcionamiento con esfera esmaltada.',
      480000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Reloj de Bolsillo Suizo en Plata Siglo XIX Usado',
        description = 'Cuerda manual original en funcionamiento con esfera esmaltada.',
        price = 480000,
        type = 'article',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Antigüedades & Numismática El Cofre
  v_list_id := 'd2000000-000a-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Colección de Monedas Antiguas Colombianas de Plata (Lote de 10)',
      'Piezas de medio peso y un peso de los años 1920 a 1945.',
      220000, 'lote', 'Cartagena', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Colección de Monedas Antiguas Colombianas de Plata (Lote de 10)',
        description = 'Piezas de medio peso y un peso de los años 1920 a 1945.',
        price = 220000,
        type = 'article',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Antigüedades & Numismática El Cofre
  v_list_id := 'd2000000-000a-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Plancha de Carbón Tradicional en Hierro Fundido Antigua',
      'Pieza rústica original con cierre de gallito decorativo.',
      75000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Plancha de Carbón Tradicional en Hierro Fundido Antigua',
        description = 'Pieza rústica original con cierre de gallito decorativo.',
        price = 75000,
        type = 'article',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Antigüedades & Numismática El Cofre
  v_list_id := 'd2000000-000a-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Molino de Café Manual de Madera y Manivela de Bronce',
      'Muelas cónicas de acero ajustables para café fresco.',
      95000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Molino de Café Manual de Madera y Manivela de Bronce',
        description = 'Muelas cónicas de acero ajustables para café fresco.',
        price = 95000,
        type = 'article',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Antigüedades & Numismática El Cofre
  v_list_id := 'd2000000-000a-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Cámara Fotográfica Analógica Kodak Brownie Años 50',
      'Cuerpo de baquelita original con lente limpio de colección.',
      130000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cámara Fotográfica Analógica Kodak Brownie Años 50',
        description = 'Cuerpo de baquelita original con lente limpio de colección.',
        price = 130000,
        type = 'article',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Antigüedades & Numismática El Cofre
  v_list_id := 'd2000000-000a-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Radio de Tubos Clásico en Madera Estilo Catedral',
      'Receptor de onda corta y AM restaurado estéticamente.',
      390000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Radio de Tubos Clásico en Madera Estilo Catedral',
        description = 'Receptor de onda corta y AM restaurado estéticamente.',
        price = 390000,
        type = 'article',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Antigüedades & Numismática El Cofre
  v_list_id := 'd2000000-000a-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Lámpara de Aceite / Quinqué de Vidrio Soplado Antigua',
      'Mecha de algodón regulable con chimenea de cristal fino.',
      85000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Lámpara de Aceite / Quinqué de Vidrio Soplado Antigua',
        description = 'Mecha de algodón regulable con chimenea de cristal fino.',
        price = 85000,
        type = 'article',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Antigüedades & Numismática El Cofre
  v_list_id := 'd2000000-000a-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Teléfono Antiguo de Disco Negro en Baquelita Ericsson',
      'Diseño de mesa con timbre interno de campanas metálicas.',
      190000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Teléfono Antiguo de Disco Negro en Baquelita Ericsson',
        description = 'Diseño de mesa con timbre interno de campanas metálicas.',
        price = 190000,
        type = 'article',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Antigüedades & Numismática El Cofre
  v_list_id := 'd2000000-000a-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Juego de Cubiertos en Plata Alemana Sellada (24 Piezas)',
      'Cucharas, tenedores y cuchillos con grabado victoriano.',
      340000, 'juego', 'Cartagena', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Juego de Cubiertos en Plata Alemana Sellada (24 Piezas)',
        description = 'Cucharas, tenedores y cuchillos con grabado victoriano.',
        price = 340000,
        type = 'article',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Antigüedades & Numismática El Cofre
  v_list_id := 'd2000000-000a-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'article',
      'Balana de Farmacia o Botica con Pesas de Bronce',
      'Platillos suspendidos en mástil dorado con caja de pesas.',
      170000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Usado"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Balana de Farmacia o Botica con Pesas de Bronce',
        description = 'Platillos suspendidos en mástil dorado con caja de pesas.',
        price = 170000,
        type = 'article',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;


  -- ============================================================
  -- PARTE 4: 10 VENDEDORES DE PRODUCTOS NUEVOS (100 PRODUCTOS NUEVOS)
  -- ============================================================

  -- Vendedor 1: Calzado & Marroquinería Real (nuevos1@marketplace.com)
  v_user_id := 'b3000000-0000-0000-0000-000000000001';
  v_seller_id := 'c3000000-0000-0000-0000-000000000001';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'nuevos1@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nuevos1@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Germán Calzado"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'nuevos1@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Germán Calzado"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'nuevos1@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Germán Calzado', 'seller', 'Bogotá', '3124445501')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Calzado & Marroquinería Real', 'Ropa y Accesorios', 'Bogotá',
      '573124445501', '573124445501', true, 4.90, 15,
      'Comercio formalizado en Bogotá especializado en ropa y accesorios. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Calzado & Marroquinería Real',
        owner_user_id = v_user_id,
        city = 'Bogotá',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Calzado & Marroquinería Real', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Calzado & Marroquinería Real
  v_list_id := 'd3000000-0001-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Zapatos Oxford Clásicos en Cuero Vacuno Genuino Nuevos',
      'Diseño formal británico con costura Goodyear welt y suela de cuero.',
      185000, 'par', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Zapatos Oxford Clásicos en Cuero Vacuno Genuino Nuevos',
        description = 'Diseño formal británico con costura Goodyear welt y suela de cuero.',
        price = 185000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Calzado & Marroquinería Real
  v_list_id := 'd3000000-0001-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Botas Chelsea de Cuero Nobuk para Hombre Nuevas',
      'Elásticos laterales de alta densidad y plantilla anatómica acolchada.',
      220000, 'par', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Botas Chelsea de Cuero Nobuk para Hombre Nuevas',
        description = 'Elásticos laterales de alta densidad y plantilla anatómica acolchada.',
        price = 220000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Calzado & Marroquinería Real
  v_list_id := 'd3000000-0001-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Mocasines Casuales de Gamuza Italiana para Hombre Nuevos',
      'Conducción y confort diario con suela tipo driving moccasin.',
      160000, 'par', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Mocasines Casuales de Gamuza Italiana para Hombre Nuevos',
        description = 'Conducción y confort diario con suela tipo driving moccasin.',
        price = 160000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Calzado & Marroquinería Real
  v_list_id := 'd3000000-0001-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Zapatos de Tacón Stiletto Clásicos en Charol Nuevos',
      'Elegancia atemporal con tacón de 8 cm y forro suave transpirable.',
      145000, 'par', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Zapatos de Tacón Stiletto Clásicos en Charol Nuevos',
        description = 'Elegancia atemporal con tacón de 8 cm y forro suave transpirable.',
        price = 145000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Calzado & Marroquinería Real
  v_list_id := 'd3000000-0001-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Billetera Tríptico en Cuero Genuino con Bloqueo RFID Nueva',
      'Protección contra clonación de tarjetas y 8 ranuras para crédito.',
      55000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Billetera Tríptico en Cuero Genuino con Bloqueo RFID Nueva',
        description = 'Protección contra clonación de tarjetas y 8 ranuras para crédito.',
        price = 55000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Calzado & Marroquinería Real
  v_list_id := 'd3000000-0001-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Cinturón Reversible de Cuero Negro y Café Nuevo',
      'Hebilla giratoria de aleación de zinc resistente a rayaduras.',
      48000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cinturón Reversible de Cuero Negro y Café Nuevo',
        description = 'Hebilla giratoria de aleación de zinc resistente a rayaduras.',
        price = 48000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Calzado & Marroquinería Real
  v_list_id := 'd3000000-0001-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Maletín Ejecutivo Porta-Laptop en Cuero Legítimo Nuevo',
      'Compartimento acolchado para computadores de hasta 15.6 pulgadas.',
      290000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Maletín Ejecutivo Porta-Laptop en Cuero Legítimo Nuevo',
        description = 'Compartimento acolchado para computadores de hasta 15.6 pulgadas.',
        price = 290000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Calzado & Marroquinería Real
  v_list_id := 'd3000000-0001-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Sandalias Playeras de Cuero Hechas a Mano Nuevas',
      'Suela anatómica de corcho natural con correas ajustables.',
      75000, 'par', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Sandalias Playeras de Cuero Hechas a Mano Nuevas',
        description = 'Suela anatómica de corcho natural con correas ajustables.',
        price = 75000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Calzado & Marroquinería Real
  v_list_id := 'd3000000-0001-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Sneakers Urbanos Blancos en Cuero Suave Nuevos',
      'Diseño minimalista premium con cordones 100% de algodón.',
      170000, 'par', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Sneakers Urbanos Blancos en Cuero Suave Nuevos',
        description = 'Diseño minimalista premium con cordones 100% de algodón.',
        price = 170000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Calzado & Marroquinería Real
  v_list_id := 'd3000000-0001-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Bolso Tote Grande en Cuero Graneado para Mujer Nuevo',
      'Espacio generoso con cremallera principal y bolsillo interior.',
      210000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Bolso Tote Grande en Cuero Graneado para Mujer Nuevo',
        description = 'Espacio generoso con cremallera principal y bolsillo interior.',
        price = 210000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 2: Pastelería & Repostería Dulce Aroma (nuevos2@marketplace.com)
  v_user_id := 'b3000000-0000-0000-0000-000000000002';
  v_seller_id := 'c3000000-0000-0000-0000-000000000002';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'nuevos2@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nuevos2@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Chef Carolina"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'nuevos2@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Chef Carolina"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'nuevos2@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Chef Carolina', 'seller', 'Medellín', '3124445502')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Pastelería & Repostería Dulce Aroma', 'Alimentos', 'Medellín',
      '573124445502', '573124445502', true, 4.90, 15,
      'Comercio formalizado en Medellín especializado en alimentos. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Pastelería & Repostería Dulce Aroma',
        owner_user_id = v_user_id,
        city = 'Medellín',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Pastelería & Repostería Dulce Aroma', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Pastelería & Repostería Dulce Aroma
  v_list_id := 'd3000000-0002-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Torta Red Velvet Especial con Crema de Queso Nueva',
      'Bizcocho terciopelo rojo húmedo con frosting artesanal para 12 personas.',
      65000, 'torta', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Torta Red Velvet Especial con Crema de Queso Nueva',
        description = 'Bizcocho terciopelo rojo húmedo con frosting artesanal para 12 personas.',
        price = 65000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Pastelería & Repostería Dulce Aroma
  v_list_id := 'd3000000-0002-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Cheesecake de Frutos Rojos Silvestres Horneado Nuevo',
      'Base crocante de galleta con compota casera de fresas y moras.',
      70000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cheesecake de Frutos Rojos Silvestres Horneado Nuevo',
        description = 'Base crocante de galleta con compota casera de fresas y moras.',
        price = 70000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Pastelería & Repostería Dulce Aroma
  v_list_id := 'd3000000-0002-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Caja de Macarons Franceses Surtidos (12 Unidades) Nueva',
      'Sabores: pistacho, frutos rojos, chocolate belga, maracuyá y café.',
      45000, 'caja', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Caja de Macarons Franceses Surtidos (12 Unidades) Nueva',
        description = 'Sabores: pistacho, frutos rojos, chocolate belga, maracuyá y café.',
        price = 45000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Pastelería & Repostería Dulce Aroma
  v_list_id := 'd3000000-0002-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Torta de Chocolate Supremo con Ganache al 70% Nueva',
      'Rellena de arequipe y cubierta con chocolate amargo premium.',
      68000, 'torta', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Torta de Chocolate Supremo con Ganache al 70% Nueva',
        description = 'Rellena de arequipe y cubierta con chocolate amargo premium.',
        price = 68000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Pastelería & Repostería Dulce Aroma
  v_list_id := 'd3000000-0002-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Caja de Cupcakes Personalizados con Diseños (6 Unidades) Nueva',
      'Vainilla francesa y chocolate con crema de mantequilla decorada.',
      32000, 'caja', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Caja de Cupcakes Personalizados con Diseños (6 Unidades) Nueva',
        description = 'Vainilla francesa y chocolate con crema de mantequilla decorada.',
        price = 32000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Pastelería & Repostería Dulce Aroma
  v_list_id := 'd3000000-0002-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Croissants Artesanales de Mantequilla de Almendras (Pack de 4) Nuevos',
      'Hojaldre crujiente francés relleno de frangipane de almendras.',
      28000, 'pack', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Croissants Artesanales de Mantequilla de Almendras (Pack de 4) Nuevos',
        description = 'Hojaldre crujiente francés relleno de frangipane de almendras.',
        price = 28000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Pastelería & Repostería Dulce Aroma
  v_list_id := 'd3000000-0002-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Tarta de Manzana Caramelizada con Toque de Canela Nueva',
      'Masa brisa quebradiza con finas láminas de manzana dorada.',
      55000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Tarta de Manzana Caramelizada con Toque de Canela Nueva',
        description = 'Masa brisa quebradiza con finas láminas de manzana dorada.',
        price = 55000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Pastelería & Repostería Dulce Aroma
  v_list_id := 'd3000000-0002-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Brownies Melcochudos de Chocolate y Nueces (Pack de 6) Nuevos',
      'Textura densa y húmeda con centro de caramelo y trozos de nuez.',
      24000, 'caja', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Brownies Melcochudos de Chocolate y Nueces (Pack de 6) Nuevos',
        description = 'Textura densa y húmeda con centro de caramelo y trozos de nuez.',
        price = 24000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Pastelería & Repostería Dulce Aroma
  v_list_id := 'd3000000-0002-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Postre Tres Leches Tradicional en Bandeja Familiar Nuevo',
      'Bizcochuelo bañado en salsa de tres leches y canela molida.',
      48000, 'bandeja', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Postre Tres Leches Tradicional en Bandeja Familiar Nuevo',
        description = 'Bizcochuelo bañado en salsa de tres leches y canela molida.',
        price = 48000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Pastelería & Repostería Dulce Aroma
  v_list_id := 'd3000000-0002-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Galletas Gourmet Rellenas Estilo New York (Caja de 4) Nuevas',
      'Chispas de chocolate, Nutella líquida y masa crujiente dorada.',
      26000, 'caja', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Galletas Gourmet Rellenas Estilo New York (Caja de 4) Nuevas',
        description = 'Chispas de chocolate, Nutella líquida y masa crujiente dorada.',
        price = 26000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 3: Boutique Bella Época Moda Femenina (nuevos3@marketplace.com)
  v_user_id := 'b3000000-0000-0000-0000-000000000003';
  v_seller_id := 'c3000000-0000-0000-0000-000000000003';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'nuevos3@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nuevos3@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Valeria Diseñadora"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'nuevos3@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Valeria Diseñadora"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'nuevos3@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Valeria Diseñadora', 'seller', 'Cali', '3124445503')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Boutique Bella Época Moda Femenina', 'Ropa y Accesorios', 'Cali',
      '573124445503', '573124445503', true, 4.90, 15,
      'Comercio formalizado en Cali especializado en ropa y accesorios. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Boutique Bella Época Moda Femenina',
        owner_user_id = v_user_id,
        city = 'Cali',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Boutique Bella Época Moda Femenina', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Boutique Bella Época Moda Femenina
  v_list_id := 'd3000000-0003-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Blusa en Satín de Seda con Cuello Camisero Nueva',
      'Caída fluida elegante ideal para oficina y eventos de noche.',
      75000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Blusa en Satín de Seda con Cuello Camisero Nueva',
        description = 'Caída fluida elegante ideal para oficina y eventos de noche.',
        price = 75000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Boutique Bella Época Moda Femenina
  v_list_id := 'd3000000-0003-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Pantalón Palazzo de Tiro Alto en Lino Colombiano Nuevo',
      'Corte amplio y fresco con bolsillos laterales y pretina ancha.',
      110000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Pantalón Palazzo de Tiro Alto en Lino Colombiano Nuevo',
        description = 'Corte amplio y fresco con bolsillos laterales y pretina ancha.',
        price = 110000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Boutique Bella Época Moda Femenina
  v_list_id := 'd3000000-0003-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Vestido Maxi Playero Estampado Floral en Chifón Nuevo',
      'Silueta fluida con escote en V y forro interior suave.',
      135000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Vestido Maxi Playero Estampado Floral en Chifón Nuevo',
        description = 'Silueta fluida con escote en V y forro interior suave.',
        price = 135000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Boutique Bella Época Moda Femenina
  v_list_id := 'd3000000-0003-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Blazer Entallado de Estructura Formal para Mujer Nuevo',
      'Solapa clásica con forro completo y bolsillos ojal decorativos.',
      165000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Blazer Entallado de Estructura Formal para Mujer Nuevo',
        description = 'Solapa clásica con forro completo y bolsillos ojal decorativos.',
        price = 165000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Boutique Bella Época Moda Femenina
  v_list_id := 'd3000000-0003-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Falda Tubo Midi con Abertura Frontal Sofisticada Nueva',
      'Tejido elástico de alta densidad que moldea la figura.',
      80000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Falda Tubo Midi con Abertura Frontal Sofisticada Nueva',
        description = 'Tejido elástico de alta densidad que moldea la figura.',
        price = 80000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Boutique Bella Época Moda Femenina
  v_list_id := 'd3000000-0003-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Enterizo Jumpsuit Casual de Rayón con Cinturón Nuevo',
      'Comodidad total en una sola pieza con botones delanteros.',
      125000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Enterizo Jumpsuit Casual de Rayón con Cinturón Nuevo',
        description = 'Comodidad total en una sola pieza con botones delanteros.',
        price = 125000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Boutique Bella Época Moda Femenina
  v_list_id := 'd3000000-0003-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Cardigan Largo Tejido en Hilo Fino para Clima Frío Nuevo',
      'Abierto sin botones con bolsillos tipo parche funcionales.',
      85000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cardigan Largo Tejido en Hilo Fino para Clima Frío Nuevo',
        description = 'Abierto sin botones con bolsillos tipo parche funcionales.',
        price = 85000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Boutique Bella Época Moda Femenina
  v_list_id := 'd3000000-0003-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Top Corsetero Estructurado con Copas Prehormadas Nuevo',
      'Cierre trasero de cremallera metálica y varillas flexibles.',
      60000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Top Corsetero Estructurado con Copas Prehormadas Nuevo',
        description = 'Cierre trasero de cremallera metálica y varillas flexibles.',
        price = 60000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Boutique Bella Época Moda Femenina
  v_list_id := 'd3000000-0003-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Short de Algodón y Lino con Pretina Paperbag Nuevo',
      'Incluye lazo a juego para anudar a la cintura.',
      58000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Short de Algodón y Lino con Pretina Paperbag Nuevo',
        description = 'Incluye lazo a juego para anudar a la cintura.',
        price = 58000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Boutique Bella Época Moda Femenina
  v_list_id := 'd3000000-0003-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Kimono Estampado Bohemio con Flecos en el Ruedo Nuevo',
      'El complemento perfecto para vestidos básicos o traje de baño.',
      65000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Kimono Estampado Bohemio con Flecos en el Ruedo Nuevo',
        description = 'El complemento perfecto para vestidos básicos o traje de baño.',
        price = 65000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 4: Naturista & Suplementos Vida Pura (nuevos4@marketplace.com)
  v_user_id := 'b3000000-0000-0000-0000-000000000004';
  v_seller_id := 'c3000000-0000-0000-0000-000000000004';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'nuevos4@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nuevos4@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Dra. Liliana Naturista"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'nuevos4@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Dra. Liliana Naturista"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'nuevos4@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Dra. Liliana Naturista', 'seller', 'Barranquilla', '3124445504')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Naturista & Suplementos Vida Pura', 'Belleza', 'Barranquilla',
      '573124445504', '573124445504', true, 4.90, 15,
      'Comercio formalizado en Barranquilla especializado en belleza. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Naturista & Suplementos Vida Pura',
        owner_user_id = v_user_id,
        city = 'Barranquilla',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Naturista & Suplementos Vida Pura', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Naturista & Suplementos Vida Pura
  v_list_id := 'd3000000-0004-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Colágeno Hidrolizado Marino con Vitamina C y Biotina Nuevo',
      'Polvo de rápida absorción para firmeza de piel, uñas y cabello.',
      68000, 'frasco', 'Barranquilla', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Colágeno Hidrolizado Marino con Vitamina C y Biotina Nuevo',
        description = 'Polvo de rápida absorción para firmeza de piel, uñas y cabello.',
        price = 68000,
        type = 'product',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Naturista & Suplementos Vida Pura
  v_list_id := 'd3000000-0004-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Aceite de Argán Puro de Marruecos Prensado en Frío Nuevo',
      'Nutrición intensa para puntas resecas y brillo capilar sin grasa.',
      42000, 'gotero', 'Barranquilla', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Aceite de Argán Puro de Marruecos Prensado en Frío Nuevo',
        description = 'Nutrición intensa para puntas resecas y brillo capilar sin grasa.',
        price = 42000,
        type = 'product',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Naturista & Suplementos Vida Pura
  v_list_id := 'd3000000-0004-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Cápsulas de Omega 3 Aceite de Pescado 1000mg (100 Cápsulas) Nuevas',
      'Apoyo cardiovascular y cerebral sin regusto a pescado.',
      52000, 'frasco', 'Barranquilla', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cápsulas de Omega 3 Aceite de Pescado 1000mg (100 Cápsulas) Nuevas',
        description = 'Apoyo cardiovascular y cerebral sin regusto a pescado.',
        price = 52000,
        type = 'product',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Naturista & Suplementos Vida Pura
  v_list_id := 'd3000000-0004-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Miel de Abejas Pura Multifloral de Origen Andino (500g) Nueva',
      '100% natural sin pasteurizar directamente de apicultores locales.',
      28000, 'frasco', 'Barranquilla', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Miel de Abejas Pura Multifloral de Origen Andino (500g) Nueva',
        description = '100% natural sin pasteurizar directamente de apicultores locales.',
        price = 28000,
        type = 'product',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Naturista & Suplementos Vida Pura
  v_list_id := 'd3000000-0004-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Suplemento de Magnesio Citrato Puro en Polvo (300g) Nuevo',
      'Mejora el descanso nocturno y alivia calambres musculares.',
      45000, 'tarro', 'Barranquilla', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Suplemento de Magnesio Citrato Puro en Polvo (300g) Nuevo',
        description = 'Mejora el descanso nocturno y alivia calambres musculares.',
        price = 45000,
        type = 'product',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Naturista & Suplementos Vida Pura
  v_list_id := 'd3000000-0004-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Shampoo Sin Sulfatos de Cebolla Roja y Romero Nuevo',
      'Fórmula anticaída que estimula el crecimiento del folículo.',
      36000, 'botella', 'Barranquilla', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Shampoo Sin Sulfatos de Cebolla Roja y Romero Nuevo',
        description = 'Fórmula anticaída que estimula el crecimiento del folículo.',
        price = 36000,
        type = 'product',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Naturista & Suplementos Vida Pura
  v_list_id := 'd3000000-0004-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Crema Hidratante Facial con Ácido Hialurónico y Niacinamida Nueva',
      'Textura en gel de rápida absorción para todo tipo de piel.',
      48000, 'pote', 'Barranquilla', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Crema Hidratante Facial con Ácido Hialurónico y Niacinamida Nueva',
        description = 'Textura en gel de rápida absorción para todo tipo de piel.',
        price = 48000,
        type = 'product',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Naturista & Suplementos Vida Pura
  v_list_id := 'd3000000-0004-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Té Verde Matcha Japonés Orgánico Ceremonial (100g) Nuevo',
      'Poderoso antioxidante natural que aporta energía y concentración.',
      55000, 'lata', 'Barranquilla', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Té Verde Matcha Japonés Orgánico Ceremonial (100g) Nuevo',
        description = 'Poderoso antioxidante natural que aporta energía y concentración.',
        price = 55000,
        type = 'product',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Naturista & Suplementos Vida Pura
  v_list_id := 'd3000000-0004-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Proteína Vegana en Polvo de Arveja y Sacha Inchi (900g) Nueva',
      '24g de proteína por porción sabor vainilla sin azúcar añadida.',
      92000, 'tarro', 'Barranquilla', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Proteína Vegana en Polvo de Arveja y Sacha Inchi (900g) Nueva',
        description = '24g de proteína por porción sabor vainilla sin azúcar añadida.',
        price = 92000,
        type = 'product',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Naturista & Suplementos Vida Pura
  v_list_id := 'd3000000-0004-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Jabones Artesanales Exfoliantes de Café y Avena (Pack de 3) Nuevos',
      'Elaborados con glicerina vegetal para renovar la piel suavemente.',
      25000, 'pack', 'Barranquilla', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Jabones Artesanales Exfoliantes de Café y Avena (Pack de 3) Nuevos',
        description = 'Elaborados con glicerina vegetal para renovar la piel suavemente.',
        price = 25000,
        type = 'product',
        status = 'published',
        city = 'Barranquilla'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 5: Distribuidora Glam Cosméticos & Spa (nuevos5@marketplace.com)
  v_user_id := 'b3000000-0000-0000-0000-000000000005';
  v_seller_id := 'c3000000-0000-0000-0000-000000000005';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'nuevos5@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nuevos5@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Marcela Cosméticos"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'nuevos5@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Marcela Cosméticos"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'nuevos5@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Marcela Cosméticos', 'seller', 'Bucaramanga', '3124445505')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Distribuidora Glam Cosméticos & Spa', 'Belleza', 'Bucaramanga',
      '573124445505', '573124445505', true, 4.90, 15,
      'Comercio formalizado en Bucaramanga especializado en belleza. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Distribuidora Glam Cosméticos & Spa',
        owner_user_id = v_user_id,
        city = 'Bucaramanga',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Distribuidora Glam Cosméticos & Spa', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Distribuidora Glam Cosméticos & Spa
  v_list_id := 'd3000000-0005-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Paleta de Sombras de Ojos de 18 Tonos Ultra Pigmentados Nueva',
      'Acabados mate y satinados de larga duración sin pliegues.',
      58000, 'unidad', 'Bucaramanga', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Paleta de Sombras de Ojos de 18 Tonos Ultra Pigmentados Nueva',
        description = 'Acabados mate y satinados de larga duración sin pliegues.',
        price = 58000,
        type = 'product',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Distribuidora Glam Cosméticos & Spa
  v_list_id := 'd3000000-0005-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Base de Maquillaje Líquida Cobertura Media-Alta Mate Nueva',
      'Fórmula resistente al agua y al sudor con acabado natural.',
      46000, 'frasco', 'Bucaramanga', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Base de Maquillaje Líquida Cobertura Media-Alta Mate Nueva',
        description = 'Fórmula resistente al agua y al sudor con acabado natural.',
        price = 46000,
        type = 'product',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Distribuidora Glam Cosméticos & Spa
  v_list_id := 'd3000000-0005-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Kit de Brochas de Maquillaje Profesionales (12 Piezas) Nuevo',
      'Fibras sintéticas ultrasuaves con estuche de viaje cilíndrico.',
      62000, 'set', 'Bucaramanga', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Kit de Brochas de Maquillaje Profesionales (12 Piezas) Nuevo',
        description = 'Fibras sintéticas ultrasuaves con estuche de viaje cilíndrico.',
        price = 62000,
        type = 'product',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Distribuidora Glam Cosméticos & Spa
  v_list_id := 'd3000000-0005-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Labial Líquido Mate de Larga Duración e Intransferible Nuevo',
      'No reseca los labios gracias a su infusión de vitamina E.',
      28000, 'unidad', 'Bucaramanga', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Labial Líquido Mate de Larga Duración e Intransferible Nuevo',
        description = 'No reseca los labios gracias a su infusión de vitamina E.',
        price = 28000,
        type = 'product',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Distribuidora Glam Cosméticos & Spa
  v_list_id := 'd3000000-0005-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Pestañina / Máscara de Pestañas Efecto Volumen y Alargamiento Nueva',
      'Cepillo curvo con microfibras para mirada impactante.',
      32000, 'unidad', 'Bucaramanga', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Pestañina / Máscara de Pestañas Efecto Volumen y Alargamiento Nueva',
        description = 'Cepillo curvo con microfibras para mirada impactante.',
        price = 32000,
        type = 'product',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Distribuidora Glam Cosméticos & Spa
  v_list_id := 'd3000000-0005-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Corrector Líquido de Ojeras de Alta Cobertura Nuevo',
      'Disimula ojeras e imperfecciones con textura ligera.',
      26000, 'unidad', 'Bucaramanga', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Corrector Líquido de Ojeras de Alta Cobertura Nuevo',
        description = 'Disimula ojeras e imperfecciones con textura ligera.',
        price = 26000,
        type = 'product',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Distribuidora Glam Cosméticos & Spa
  v_list_id := 'd3000000-0005-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Polvo Traslúcido Suelto para Sellar y Controlar Brillo Nuevo',
      'Efecto filtro aterciopelado sin rebote de flash en fotos.',
      35000, 'caja', 'Bucaramanga', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Polvo Traslúcido Suelto para Sellar y Controlar Brillo Nuevo',
        description = 'Efecto filtro aterciopelado sin rebote de flash en fotos.',
        price = 35000,
        type = 'product',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Distribuidora Glam Cosméticos & Spa
  v_list_id := 'd3000000-0005-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Iluminador Facial en Polvo Tono Champán Dorado Nuevo',
      'Brillo radiante modulable para pómulos y arco de cupido.',
      30000, 'unidad', 'Bucaramanga', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Iluminador Facial en Polvo Tono Champán Dorado Nuevo',
        description = 'Brillo radiante modulable para pómulos y arco de cupido.',
        price = 30000,
        type = 'product',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Distribuidora Glam Cosméticos & Spa
  v_list_id := 'd3000000-0005-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Tónico Facial Hidratante de Rosas y Hamamelis (250ml) Nuevo',
      'Equilibra el pH y refresca la piel antes del maquillaje.',
      24000, 'spray', 'Bucaramanga', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Tónico Facial Hidratante de Rosas y Hamamelis (250ml) Nuevo',
        description = 'Equilibra el pH y refresca la piel antes del maquillaje.',
        price = 24000,
        type = 'product',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Distribuidora Glam Cosméticos & Spa
  v_list_id := 'd3000000-0005-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5', 'product',
      'Desmaquillante Bifásico para Ojos y Labios Waterproof Nuevo',
      'Retira maquillaje pesado sin necesidad de frotar.',
      29000, 'frasco', 'Bucaramanga', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Desmaquillante Bifásico para Ojos y Labios Waterproof Nuevo',
        description = 'Retira maquillaje pesado sin necesidad de frotar.',
        price = 29000,
        type = 'product',
        status = 'published',
        city = 'Bucaramanga'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 6: Ferretería & Bombillería LED La Central (nuevos6@marketplace.com)
  v_user_id := 'b3000000-0000-0000-0000-000000000006';
  v_seller_id := 'c3000000-0000-0000-0000-000000000006';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'nuevos6@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nuevos6@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Don Jairo Ferretero"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'nuevos6@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Don Jairo Ferretero"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'nuevos6@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Don Jairo Ferretero', 'seller', 'Bogotá', '3124445506')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Ferretería & Bombillería LED La Central', 'Servicios del Hogar', 'Bogotá',
      '573124445506', '573124445506', true, 4.90, 15,
      'Comercio formalizado en Bogotá especializado en servicios del hogar. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Ferretería & Bombillería LED La Central',
        owner_user_id = v_user_id,
        city = 'Bogotá',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Ferretería & Bombillería LED La Central', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Ferretería & Bombillería LED La Central
  v_list_id := 'd3000000-0006-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'product',
      'Pack de 10 Bombillos LED 9W Luz Blanca Ahorradores Nuevos',
      'Ahorro del 85% de energía con vida útil de 15,000 horas.',
      35000, 'pack', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Pack de 10 Bombillos LED 9W Luz Blanca Ahorradores Nuevos',
        description = 'Ahorro del 85% de energía con vida útil de 15,000 horas.',
        price = 35000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Ferretería & Bombillería LED La Central
  v_list_id := 'd3000000-0006-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'product',
      'Cinta LED RGB 5 Metros con Control Remoto y Fuente Nueva',
      'Cambio de 16 colores con adhesivo 3M para decoración.',
      48000, 'kit', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cinta LED RGB 5 Metros con Control Remoto y Fuente Nueva',
        description = 'Cambio de 16 colores con adhesivo 3M para decoración.',
        price = 48000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Ferretería & Bombillería LED La Central
  v_list_id := 'd3000000-0006-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'product',
      'Reflector LED Exterior 50W Impermeable IP66 Nuevo',
      'Iluminación potente para patios, fachadas y parqueaderos.',
      45000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Reflector LED Exterior 50W Impermeable IP66 Nuevo',
        description = 'Iluminación potente para patios, fachadas y parqueaderos.',
        price = 45000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Ferretería & Bombillería LED La Central
  v_list_id := 'd3000000-0006-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'product',
      'Cerradura Digital Inteligente con Huella y Clave Nueva',
      'Desbloqueo biométrico, tarjeta RFID y llave de emergencia.',
      280000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cerradura Digital Inteligente con Huella y Clave Nueva',
        description = 'Desbloqueo biométrico, tarjeta RFID y llave de emergencia.',
        price = 280000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Ferretería & Bombillería LED La Central
  v_list_id := 'd3000000-0006-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'product',
      'Juego de Destornilladores de Precisión Imantados (24 Piezas) Nuevo',
      'Ideal para reparación de celulares, relojes y electrónica.',
      38000, 'set', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Juego de Destornilladores de Precisión Imantados (24 Piezas) Nuevo',
        description = 'Ideal para reparación de celulares, relojes y electrónica.',
        price = 38000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Ferretería & Bombillería LED La Central
  v_list_id := 'd3000000-0006-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'product',
      'Regleta Multitoma de 6 Salidas con 3 Puertos USB Nueva',
      'Protección contra sobretensiones y cable reforzado de 2 metros.',
      42000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Regleta Multitoma de 6 Salidas con 3 Puertos USB Nueva',
        description = 'Protección contra sobretensiones y cable reforzado de 2 metros.',
        price = 42000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Ferretería & Bombillería LED La Central
  v_list_id := 'd3000000-0006-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'product',
      'Cinta Métrica Flexómetro de 5 Metros Uso Rudo Nuevo',
      'Cinta ancha de fácil lectura con freno magnético rápido.',
      18000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cinta Métrica Flexómetro de 5 Metros Uso Rudo Nuevo',
        description = 'Cinta ancha de fácil lectura con freno magnético rápido.',
        price = 18000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Ferretería & Bombillería LED La Central
  v_list_id := 'd3000000-0006-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'product',
      'Pistola de Silicona Caliente de 60W con 10 Barras Nueva',
      'Calentamiento rápido en 3 minutos para manualidades y arreglos.',
      26000, 'kit', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Pistola de Silicona Caliente de 60W con 10 Barras Nueva',
        description = 'Calentamiento rápido en 3 minutos para manualidades y arreglos.',
        price = 26000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Ferretería & Bombillería LED La Central
  v_list_id := 'd3000000-0006-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'product',
      'Sensor de Movimiento Infrarrojo para Lámparas Nuevo',
      'Encendido automático de luces al detectar presencia.',
      29000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Sensor de Movimiento Infrarrojo para Lámparas Nuevo',
        description = 'Encendido automático de luces al detectar presencia.',
        price = 29000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Ferretería & Bombillería LED La Central
  v_list_id := 'd3000000-0006-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'a9234c76-daa7-4b49-9450-3afb5f7645a9', 'product',
      'Candado de Seguridad en Latón Macizo de 50mm Nuevo',
      'Grillete de acero endurecido anticorte con 3 llaves.',
      25000, 'unidad', 'Bogotá', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Candado de Seguridad en Latón Macizo de 50mm Nuevo',
        description = 'Grillete de acero endurecido anticorte con 3 llaves.',
        price = 25000,
        type = 'product',
        status = 'published',
        city = 'Bogotá'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 7: SmartGadgets: Audio y Accesorios Tech (nuevos7@marketplace.com)
  v_user_id := 'b3000000-0000-0000-0000-000000000007';
  v_seller_id := 'c3000000-0000-0000-0000-000000000007';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'nuevos7@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nuevos7@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Sebastián Tech"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'nuevos7@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Sebastián Tech"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'nuevos7@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Sebastián Tech', 'seller', 'Medellín', '3124445507')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'SmartGadgets: Audio y Accesorios Tech', 'Otros', 'Medellín',
      '573124445507', '573124445507', true, 4.90, 15,
      'Comercio formalizado en Medellín especializado en otros. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'SmartGadgets: Audio y Accesorios Tech',
        owner_user_id = v_user_id,
        city = 'Medellín',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'SmartGadgets: Audio y Accesorios Tech', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de SmartGadgets: Audio y Accesorios Tech
  v_list_id := 'd3000000-0007-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'product',
      'Audífonos Inalámbricos Bluetooth TWS con Cancelación Activa Nuevos',
      'Estuche de carga con pantalla LED digital y sonido estéreo.',
      85000, 'par', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Audífonos Inalámbricos Bluetooth TWS con Cancelación Activa Nuevos',
        description = 'Estuche de carga con pantalla LED digital y sonido estéreo.',
        price = 85000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de SmartGadgets: Audio y Accesorios Tech
  v_list_id := 'd3000000-0007-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'product',
      'Cargador Inalámbrico Rápido 15W para Celular Nuevo',
      'Base delgada con protección térmica y estándar Qi universal.',
      42000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cargador Inalámbrico Rápido 15W para Celular Nuevo',
        description = 'Base delgada con protección térmica y estándar Qi universal.',
        price = 42000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de SmartGadgets: Audio y Accesorios Tech
  v_list_id := 'd3000000-0007-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'product',
      'Batería Externa Power Bank 20000mAh Carga Rápida 22.5W Nueva',
      'Capaz de cargar hasta 4 veces un smartphone completo.',
      75000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Batería Externa Power Bank 20000mAh Carga Rápida 22.5W Nueva',
        description = 'Capaz de cargar hasta 4 veces un smartphone completo.',
        price = 75000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de SmartGadgets: Audio y Accesorios Tech
  v_list_id := 'd3000000-0007-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'product',
      'Soporte Magnético de Celular para Rejilla de Carro Nuevo',
      'Imanes de neodimio potentes que sujetan firme en curvas.',
      24000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Soporte Magnético de Celular para Rejilla de Carro Nuevo',
        description = 'Imanes de neodimio potentes que sujetan firme en curvas.',
        price = 24000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de SmartGadgets: Audio y Accesorios Tech
  v_list_id := 'd3000000-0007-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'product',
      'Cable USB-C a USB-C de 60W de Carga Rápida Mallado (2m) Nuevo',
      'Recubrimiento trenzado de nailon ultrarresistente al doblado.',
      22000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cable USB-C a USB-C de 60W de Carga Rápida Mallado (2m) Nuevo',
        description = 'Recubrimiento trenzado de nailon ultrarresistente al doblado.',
        price = 22000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de SmartGadgets: Audio y Accesorios Tech
  v_list_id := 'd3000000-0007-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'product',
      'Trípode Flexible para Celular y Cámara con Control Bluetooth Nuevo',
      'Patas articuladas tipo pulpo que se sujetan a cualquier tubo.',
      34000, 'kit', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Trípode Flexible para Celular y Cámara con Control Bluetooth Nuevo',
        description = 'Patas articuladas tipo pulpo que se sujetan a cualquier tubo.',
        price = 34000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de SmartGadgets: Audio y Accesorios Tech
  v_list_id := 'd3000000-0007-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'product',
      'Aro de Luz LED de 26cm con Trípode Extensible a 2m Nuevo',
      '3 tonos de luz (fría, neutra, cálida) con regulador de brillo.',
      55000, 'set', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Aro de Luz LED de 26cm con Trípode Extensible a 2m Nuevo',
        description = '3 tonos de luz (fría, neutra, cálida) con regulador de brillo.',
        price = 55000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de SmartGadgets: Audio y Accesorios Tech
  v_list_id := 'd3000000-0007-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'product',
      'Adaptador Hub USB-C 6 en 1 con HDMI 4K y Puertos USB 3.0 Nuevo',
      'Expansión total para computadores portátiles y tablets.',
      68000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Adaptador Hub USB-C 6 en 1 con HDMI 4K y Puertos USB 3.0 Nuevo',
        description = 'Expansión total para computadores portátiles y tablets.',
        price = 68000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de SmartGadgets: Audio y Accesorios Tech
  v_list_id := 'd3000000-0007-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'product',
      'Mouse Ergonómico Inalámbrico Vertical 2.4GHz Silencioso Nuevo',
      'Diseño que reduce la fatiga de muñeca y túnel carpiano.',
      46000, 'unidad', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Mouse Ergonómico Inalámbrico Vertical 2.4GHz Silencioso Nuevo',
        description = 'Diseño que reduce la fatiga de muñeca y túnel carpiano.',
        price = 46000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de SmartGadgets: Audio y Accesorios Tech
  v_list_id := 'd3000000-0007-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '6669f0ad-812e-4a14-84f6-01a89d3f8e76', 'product',
      'Organizador de Cables para Escritorio en Silicona (Pack de 5) Nuevo',
      'Mantiene tus cables ordenados y listos para conectar.',
      16000, 'pack', 'Medellín', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Organizador de Cables para Escritorio en Silicona (Pack de 5) Nuevo',
        description = 'Mantiene tus cables ordenados y listos para conectar.',
        price = 16000,
        type = 'product',
        status = 'published',
        city = 'Medellín'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 8: Mundo Infantil: Ropa & Juguetes Bebé (nuevos8@marketplace.com)
  v_user_id := 'b3000000-0000-0000-0000-000000000008';
  v_seller_id := 'c3000000-0000-0000-0000-000000000008';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'nuevos8@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nuevos8@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Lucía Bebés"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'nuevos8@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Lucía Bebés"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'nuevos8@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Lucía Bebés', 'seller', 'Cali', '3124445508')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Mundo Infantil: Ropa & Juguetes Bebé', 'Ropa y Accesorios', 'Cali',
      '573124445508', '573124445508', true, 4.90, 15,
      'Comercio formalizado en Cali especializado en ropa y accesorios. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Mundo Infantil: Ropa & Juguetes Bebé',
        owner_user_id = v_user_id,
        city = 'Cali',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Mundo Infantil: Ropa & Juguetes Bebé', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Mundo Infantil: Ropa & Juguetes Bebé
  v_list_id := 'd3000000-0008-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Set de 5 Bodies de Algodón Pima 100% para Bebé Nuevos',
      'Broches libres de níquel y tejido hipoalergénico supersuave.',
      65000, 'set', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Set de 5 Bodies de Algodón Pima 100% para Bebé Nuevos',
        description = 'Broches libres de níquel y tejido hipoalergénico supersuave.',
        price = 65000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Mundo Infantil: Ropa & Juguetes Bebé
  v_list_id := 'd3000000-0008-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Mameluco Térmico con Pies y Capucha de Osito Nuevo',
      'Tejido peluche térmico para abrigar en noches frías.',
      52000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Mameluco Térmico con Pies y Capucha de Osito Nuevo',
        description = 'Tejido peluche térmico para abrigar en noches frías.',
        price = 52000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Mundo Infantil: Ropa & Juguetes Bebé
  v_list_id := 'd3000000-0008-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Mochila Pañalera Multifuncional Impermeable con Cuna Nueva',
      'Bolsillos térmicos para biberones y cambiador acolchado.',
      98000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Mochila Pañalera Multifuncional Impermeable con Cuna Nueva',
        description = 'Bolsillos térmicos para biberones y cambiador acolchado.',
        price = 98000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Mundo Infantil: Ropa & Juguetes Bebé
  v_list_id := 'd3000000-0008-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Sonajero Mordedor Sensorial en Silicona Libre de BPA Nuevo',
      'Alivia las encías durante la etapa de dentición del bebé.',
      22000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Sonajero Mordedor Sensorial en Silicona Libre de BPA Nuevo',
        description = 'Alivia las encías durante la etapa de dentición del bebé.',
        price = 22000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Mundo Infantil: Ropa & Juguetes Bebé
  v_list_id := 'd3000000-0008-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Juego de Sábanas para Cuna en Algodón Estampado Nuevo',
      'Incluye sábana ajustable, sobre-sábana y funda de almohada.',
      48000, 'juego', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Juego de Sábanas para Cuna en Algodón Estampado Nuevo',
        description = 'Incluye sábana ajustable, sobre-sábana y funda de almohada.',
        price = 48000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Mundo Infantil: Ropa & Juguetes Bebé
  v_list_id := 'd3000000-0008-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Baberos Tipo Bandana en Algodón Absorbente (Pack de 4) Nuevos',
      'Diseños modernos con doble broche ajustable al cuello.',
      26000, 'pack', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Baberos Tipo Bandana en Algodón Absorbente (Pack de 4) Nuevos',
        description = 'Diseños modernos con doble broche ajustable al cuello.',
        price = 26000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Mundo Infantil: Ropa & Juguetes Bebé
  v_list_id := 'd3000000-0008-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Tapete de Juegos Gateo Infantil Antigolpes Plegable Nuevo',
      'Material XPE impermeable de 1cm de grosor fácil de limpiar.',
      85000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Tapete de Juegos Gateo Infantil Antigolpes Plegable Nuevo',
        description = 'Material XPE impermeable de 1cm de grosor fácil de limpiar.',
        price = 85000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Mundo Infantil: Ropa & Juguetes Bebé
  v_list_id := 'd3000000-0008-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Almohada de Lactancia Materna Ergonómica con Forro Lavable Nueva',
      'Soporte cómodo para la espalda de mamá y descanso del bebé.',
      62000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Almohada de Lactancia Materna Ergonómica con Forro Lavable Nueva',
        description = 'Soporte cómodo para la espalda de mamá y descanso del bebé.',
        price = 62000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Mundo Infantil: Ropa & Juguetes Bebé
  v_list_id := 'd3000000-0008-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Zapatitos Suaves Antideslizantes Primeros Pasos Nuevos',
      'Puntera amplia y suela de goma flexible para libre movimiento.',
      34000, 'par', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Zapatitos Suaves Antideslizantes Primeros Pasos Nuevos',
        description = 'Puntera amplia y suela de goma flexible para libre movimiento.',
        price = 34000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Mundo Infantil: Ropa & Juguetes Bebé
  v_list_id := 'd3000000-0008-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Luz de Noche Infantil de Silicona Recargable en Forma de Oso Nueva',
      'Luz cálida tenue que no interrumpe el sueño de los niños.',
      39000, 'unidad', 'Cali', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Luz de Noche Infantil de Silicona Recargable en Forma de Oso Nueva',
        description = 'Luz cálida tenue que no interrumpe el sueño de los niños.',
        price = 39000,
        type = 'product',
        status = 'published',
        city = 'Cali'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 9: Café Origen & Granos Andinos Premium (nuevos9@marketplace.com)
  v_user_id := 'b3000000-0000-0000-0000-000000000009';
  v_seller_id := 'c3000000-0000-0000-0000-000000000009';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'nuevos9@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nuevos9@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Don Jaime Cafetero"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'nuevos9@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Don Jaime Cafetero"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'nuevos9@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Don Jaime Cafetero', 'seller', 'Pereira', '3124445509')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Café Origen & Granos Andinos Premium', 'Alimentos', 'Pereira',
      '573124445509', '573124445509', true, 4.90, 15,
      'Comercio formalizado en Pereira especializado en alimentos. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Café Origen & Granos Andinos Premium',
        owner_user_id = v_user_id,
        city = 'Pereira',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Café Origen & Granos Andinos Premium', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Café Origen & Granos Andinos Premium
  v_list_id := 'd3000000-0009-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Café Especial de Origen Castillo Grano Entero (500g) Nuevo',
      'Notas a caramelo, chocolate con leche y acidez cítrica brillante.',
      34000, 'bolsa', 'Pereira', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Café Especial de Origen Castillo Grano Entero (500g) Nuevo',
        description = 'Notas a caramelo, chocolate con leche y acidez cítrica brillante.',
        price = 34000,
        type = 'product',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Café Origen & Granos Andinos Premium
  v_list_id := 'd3000000-0009-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Café Variedad Geisha Edición Limitada Tostado Medio (250g) Nuevo',
      'Fragancia floral a jazmín y notas a bergamota y miel pura.',
      55000, 'bolsa', 'Pereira', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Café Variedad Geisha Edición Limitada Tostado Medio (250g) Nuevo',
        description = 'Fragancia floral a jazmín y notas a bergamota y miel pura.',
        price = 55000,
        type = 'product',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Café Origen & Granos Andinos Premium
  v_list_id := 'd3000000-0009-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Café Molido Suave Tradicional Colombiano (500g) Nuevo',
      'Molienda media ideal para cafetera de goteo o prensa francesa.',
      28000, 'bolsa', 'Pereira', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Café Molido Suave Tradicional Colombiano (500g) Nuevo',
        description = 'Molienda media ideal para cafetera de goteo o prensa francesa.',
        price = 28000,
        type = 'product',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Café Origen & Granos Andinos Premium
  v_list_id := 'd3000000-0009-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Prensa Francesa de Vidrio Borosilicato y Acero Inoxidable Nueva',
      'Prepara café con cuerpo sedoso y retención de aceites aromáticos.',
      48000, 'unidad', 'Pereira', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Prensa Francesa de Vidrio Borosilicato y Acero Inoxidable Nueva',
        description = 'Prepara café con cuerpo sedoso y retención de aceites aromáticos.',
        price = 48000,
        type = 'product',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Café Origen & Granos Andinos Premium
  v_list_id := 'd3000000-0009-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Cafetera Moka Italiana de Aluminio para 6 Tazas Nueva',
      'El auténtico café espresso intenso sobre la estufa de casa.',
      52000, 'unidad', 'Pereira', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cafetera Moka Italiana de Aluminio para 6 Tazas Nueva',
        description = 'El auténtico café espresso intenso sobre la estufa de casa.',
        price = 52000,
        type = 'product',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Café Origen & Granos Andinos Premium
  v_list_id := 'd3000000-0009-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Molino de Café Manual con Muelas de Cerámica Regulables Nuevo',
      'Muele granos frescos al instante desde fino hasta grueso.',
      46000, 'unidad', 'Pereira', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Molino de Café Manual con Muelas de Cerámica Regulables Nuevo',
        description = 'Muele granos frescos al instante desde fino hasta grueso.',
        price = 46000,
        type = 'product',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Café Origen & Granos Andinos Premium
  v_list_id := 'd3000000-0009-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Café con Proceso Honey Dulce y Frutal (340g) Nuevo',
      'Secado con mucílago natural que intensifica la dulzura en taza.',
      38000, 'bolsa', 'Pereira', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Café con Proceso Honey Dulce y Frutal (340g) Nuevo',
        description = 'Secado con mucílago natural que intensifica la dulzura en taza.',
        price = 38000,
        type = 'product',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Café Origen & Granos Andinos Premium
  v_list_id := 'd3000000-0009-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Taza Pocillo Térmico de Acero Inoxidable Doble Pared (350ml) Nueva',
      'Mantiene el café caliente durante 4 horas con tapa antisalpicaduras.',
      32000, 'unidad', 'Pereira', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Taza Pocillo Térmico de Acero Inoxidable Doble Pared (350ml) Nueva',
        description = 'Mantiene el café caliente durante 4 horas con tapa antisalpicaduras.',
        price = 32000,
        type = 'product',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Café Origen & Granos Andinos Premium
  v_list_id := 'd3000000-0009-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Café Descafeinado por Proceso Natural de Caña de Azúcar (500g) Nuevo',
      'Todo el sabor y aroma auténtico del café sin cafeína.',
      36000, 'bolsa', 'Pereira', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Café Descafeinado por Proceso Natural de Caña de Azúcar (500g) Nuevo',
        description = 'Todo el sabor y aroma auténtico del café sin cafeína.',
        price = 36000,
        type = 'product',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Café Origen & Granos Andinos Premium
  v_list_id := 'd3000000-0009-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, 'dfa36695-6f3d-498e-af49-011029e2e1bc', 'product',
      'Kit Barista: Espumador de Leche a Baterías y Plantillas Nuevas',
      'Crea capuchinos cremosos con espuma densa en 20 segundos.',
      25000, 'kit', 'Pereira', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Kit Barista: Espumador de Leche a Baterías y Plantillas Nuevas',
        description = 'Crea capuchinos cremosos con espuma densa en 20 segundos.',
        price = 25000,
        type = 'product',
        status = 'published',
        city = 'Pereira'
    WHERE id = v_list_id;
  END IF;

  -- Vendedor 10: Joyería Fina & Plata 925 Filigrana (nuevos10@marketplace.com)
  v_user_id := 'b3000000-0000-0000-0000-00000000000a';
  v_seller_id := 'c3000000-0000-0000-0000-00000000000a';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'nuevos10@marketplace.com') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nuevos10@marketplace.com';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{"full_name": "Elena Joyería"}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'nuevos10@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name": "Elena Joyería"}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'nuevos10@marketplace.com')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, 'Elena Joyería', 'seller', 'Cartagena', '3124445510')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, 'Joyería Fina & Plata 925 Filigrana', 'Ropa y Accesorios', 'Cartagena',
      '573124445510', '573124445510', true, 4.90, 15,
      'Comercio formalizado en Cartagena especializado en ropa y accesorios. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = 'Joyería Fina & Plata 925 Filigrana',
        owner_user_id = v_user_id,
        city = 'Cartagena',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, 'Joyería Fina & Plata 925 Filigrana', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;

  -- Publicación 1/10 de Joyería Fina & Plata 925 Filigrana
  v_list_id := 'd3000000-000a-0000-0000-000000000001';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Cadena y Dije Árbol de la Vida en Plata Ley 925 Nueva',
      'Acabado pulido brillante con circonias cúbicas incrustadas.',
      75000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cadena y Dije Árbol de la Vida en Plata Ley 925 Nueva',
        description = 'Acabado pulido brillante con circonias cúbicas incrustadas.',
        price = 75000,
        type = 'product',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 2/10 de Joyería Fina & Plata 925 Filigrana
  v_list_id := 'd3000000-000a-0000-0000-000000000002';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Aretes Topos Circulares de Circonia Suiza en Plata 925 Nuevos',
      'Brillo tipo diamante con broche de mariposa seguro.',
      38000, 'par', 'Cartagena', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Aretes Topos Circulares de Circonia Suiza en Plata 925 Nuevos',
        description = 'Brillo tipo diamante con broche de mariposa seguro.',
        price = 38000,
        type = 'product',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 3/10 de Joyería Fina & Plata 925 Filigrana
  v_list_id := 'd3000000-000a-0000-0000-000000000003';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Pulsera Tennis Ajustable con Cristales Austriacos Nueva',
      'Baño en rodio antialérgico con cierre deslizante adaptable.',
      68000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Pulsera Tennis Ajustable con Cristales Austriacos Nueva',
        description = 'Baño en rodio antialérgico con cierre deslizante adaptable.',
        price = 68000,
        type = 'product',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 4/10 de Joyería Fina & Plata 925 Filigrana
  v_list_id := 'd3000000-000a-0000-0000-000000000004';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Anillo Solitario Clásico de Compromiso en Plata Fina Nuevo',
      'Circonia central corte brillante de 6 puntas montada a mano.',
      85000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Anillo Solitario Clásico de Compromiso en Plata Fina Nuevo',
        description = 'Circonia central corte brillante de 6 puntas montada a mano.',
        price = 85000,
        type = 'product',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 5/10 de Joyería Fina & Plata 925 Filigrana
  v_list_id := 'd3000000-000a-0000-0000-000000000005';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Aretes Colgantes de Filigrana Mompoxina Tradicional Nuevos',
      'Tejido artesanal en finos hilos de plata colombiana.',
      95000, 'par', 'Cartagena', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Aretes Colgantes de Filigrana Mompoxina Tradicional Nuevos',
        description = 'Tejido artesanal en finos hilos de plata colombiana.',
        price = 95000,
        type = 'product',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 6/10 de Joyería Fina & Plata 925 Filigrana
  v_list_id := 'd3000000-000a-0000-0000-000000000006';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Pulsera de Cuero Trenzado con Broche Magnético en Acero Nuevo',
      'Estilo masculino moderno y sobrio para uso diario.',
      42000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Pulsera de Cuero Trenzado con Broche Magnético en Acero Nuevo',
        description = 'Estilo masculino moderno y sobrio para uso diario.',
        price = 42000,
        type = 'product',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 7/10 de Joyería Fina & Plata 925 Filigrana
  v_list_id := 'd3000000-000a-0000-0000-000000000007';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Cadena de Eslabones Cubana en Acero Inoxidable Dorado Nueva',
      'Ancho de 5mm con baño de oro de 18K resistente al agua.',
      55000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Cadena de Eslabones Cubana en Acero Inoxidable Dorado Nueva',
        description = 'Ancho de 5mm con baño de oro de 18K resistente al agua.',
        price = 55000,
        type = 'product',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 8/10 de Joyería Fina & Plata 925 Filigrana
  v_list_id := 'd3000000-000a-0000-0000-000000000008';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Dijes de Letra Inicial en Plata 925 con Cadena Veneciana Nueva',
      'Personaliza tu accesorio favorito con tu inicial favorita.',
      60000, 'set', 'Cartagena', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Dijes de Letra Inicial en Plata 925 con Cadena Veneciana Nueva',
        description = 'Personaliza tu accesorio favorito con tu inicial favorita.',
        price = 60000,
        type = 'product',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 9/10 de Joyería Fina & Plata 925 Filigrana
  v_list_id := 'd3000000-000a-0000-0000-000000000009';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Tobillera Delicada con Dijes de Estrellas en Plata 925 Nueva',
      'Diseño sutil para lucir en días de playa y sandalias.',
      45000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Tobillera Delicada con Dijes de Estrellas en Plata 925 Nueva',
        description = 'Diseño sutil para lucir en días de playa y sandalias.',
        price = 45000,
        type = 'product',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;

  -- Publicación 10/10 de Joyería Fina & Plata 925 Filigrana
  v_list_id := 'd3000000-000a-0000-0000-00000000000a';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '0690f53d-60f3-4294-8f59-54eafb29ca69', 'product',
      'Joyero Organizador Portátil de Viaje con Compartimentos Nuevo',
      'Interior de terciopelo suave con cremallera exterior compacta.',
      35000, 'unidad', 'Cartagena', 'published', 25,
      '{"condition": "Nuevo"}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = 'Joyero Organizador Portátil de Viaje con Compartimentos Nuevo',
        description = 'Interior de terciopelo suave con cremallera exterior compacta.',
        price = 35000,
        type = 'product',
        status = 'published',
        city = 'Cartagena'
    WHERE id = v_list_id;
  END IF;


  -- ============================================================
  -- AUTO-CONFIRMAR TODOS LOS USUARIOS DE PRUEBA
  -- ============================================================
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE email LIKE '%@marketplace.com' AND email_confirmed_at IS NULL;

END $$;
