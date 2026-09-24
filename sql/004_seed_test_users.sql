-- ============================================================
-- 004_seed_test_users.sql (Versión corregida y completa)
-- Soluciona "Database error querying schema":
-- 1. Inserta en auth.identities (obligatorio para GoTrue/Auth de Supabase)
-- 2. Asegura que los campos de tokens de auth.users no queden en NULL
-- 3. Asigna roles en public.app_user y crea el negocio en public.seller
--
-- Contraseña para los 3 usuarios: Password123!
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

do $$
declare
  buyer_id uuid := 'a0000000-0000-0000-0000-000000000001';
  seller_id uuid := 'a0000000-0000-0000-0000-000000000002';
  admin_id uuid := 'a0000000-0000-0000-0000-000000000003';
  encrypted_pw text;
begin
  -- Generar hash bcrypt para 'Password123!'
  encrypted_pw := extensions.crypt('Password123!', extensions.gen_salt('bf'));

  -- -----------------------------------------------------------
  -- 1. Comprador (buyer)
  -- -----------------------------------------------------------
  if not exists (select 1 from auth.users where email = 'comprador@marketplace.com') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) values (
      '00000000-0000-0000-0000-000000000000', buyer_id, 'authenticated', 'authenticated',
      'comprador@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Carlos Comprador"}',
      now(), now(), '', '', '', '', '', '', false
    );
  else
    update auth.users
    set email_confirmed_at = now(),
        encrypted_password = encrypted_pw,
        confirmation_token = coalesce(confirmation_token, ''),
        recovery_token = coalesce(recovery_token, ''),
        email_change_token_new = coalesce(email_change_token_new, ''),
        email_change = coalesce(email_change, ''),
        email_change_token_current = coalesce(email_change_token_current, ''),
        reauthentication_token = coalesce(reauthentication_token, '')
    where email = 'comprador@marketplace.com';
    select id into buyer_id from auth.users where email = 'comprador@marketplace.com';
  end if;

  -- -----------------------------------------------------------
  -- 2. Vendedor (seller)
  -- -----------------------------------------------------------
  if not exists (select 1 from auth.users where email = 'vendedor@marketplace.com') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) values (
      '00000000-0000-0000-0000-000000000000', seller_id, 'authenticated', 'authenticated',
      'vendedor@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Valeria Vendedora"}',
      now(), now(), '', '', '', '', '', '', false
    );
  else
    update auth.users
    set email_confirmed_at = now(),
        encrypted_password = encrypted_pw,
        confirmation_token = coalesce(confirmation_token, ''),
        recovery_token = coalesce(recovery_token, ''),
        email_change_token_new = coalesce(email_change_token_new, ''),
        email_change = coalesce(email_change, ''),
        email_change_token_current = coalesce(email_change_token_current, ''),
        reauthentication_token = coalesce(reauthentication_token, '')
    where email = 'vendedor@marketplace.com';
    select id into seller_id from auth.users where email = 'vendedor@marketplace.com';
  end if;

  -- -----------------------------------------------------------
  -- 3. Administrador (admin)
  -- -----------------------------------------------------------
  if not exists (select 1 from auth.users where email = 'admin@marketplace.com') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) values (
      '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
      'admin@marketplace.com', encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Marketplace"}',
      now(), now(), '', '', '', '', '', '', false
    );
  else
    update auth.users
    set email_confirmed_at = now(),
        encrypted_password = encrypted_pw,
        confirmation_token = coalesce(confirmation_token, ''),
        recovery_token = coalesce(recovery_token, ''),
        email_change_token_new = coalesce(email_change_token_new, ''),
        email_change = coalesce(email_change, ''),
        email_change_token_current = coalesce(email_change_token_current, ''),
        reauthentication_token = coalesce(reauthentication_token, '')
    where email = 'admin@marketplace.com';
    select id into admin_id from auth.users where email = 'admin@marketplace.com';
  end if;

  -- -----------------------------------------------------------
  -- 4. auth.identities (IMPRESCINDIBLE para que el Auth de Supabase no falle)
  -- -----------------------------------------------------------
  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  select 
    u.id, 
    u.id, 
    json_build_object('sub', u.id::text, 'email', u.email)::jsonb, 
    'email', 
    u.id::text, 
    now(), 
    now(), 
    now()
  from auth.users u
  where u.email in ('comprador@marketplace.com', 'vendedor@marketplace.com', 'admin@marketplace.com')
    and not exists (select 1 from auth.identities i where i.user_id = u.id);

  -- -----------------------------------------------------------
  -- 5. Perfiles en public.app_user
  -- -----------------------------------------------------------
  insert into public.app_user (id, full_name, role, city)
  values (buyer_id, 'Carlos Comprador', 'buyer', 'Bogotá')
  on conflict (id) do update set role = 'buyer', full_name = 'Carlos Comprador';

  insert into public.app_user (id, full_name, role, city)
  values (seller_id, 'Valeria Vendedora', 'seller', 'Medellín')
  on conflict (id) do update set role = 'seller', full_name = 'Valeria Vendedora';

  insert into public.app_user (id, full_name, role, city)
  values (admin_id, 'Admin Marketplace', 'admin', 'Bogotá')
  on conflict (id) do update set role = 'admin', full_name = 'Admin Marketplace';

  -- -----------------------------------------------------------
  -- 6. Negocio para el vendedor en public.seller
  -- -----------------------------------------------------------
  if not exists (select 1 from public.seller where owner_user_id = seller_id) then
    insert into public.seller (
      owner_user_id, business_name, business_type, city, phone, whatsapp, verified, description
    ) values (
      seller_id,
      'Panadería & Café El Alba',
      'Alimentos',
      'Medellín',
      '573001234567',
      '573001234567',
      true,
      'Especialistas en panadería tradicional, café especial y repostería artesanal.'
    );
  end if;

  -- -----------------------------------------------------------
  -- 7. Limpiar campos nulos y auto-confirmar cualquier otro usuario
  -- -----------------------------------------------------------
  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, now()),
      confirmation_token = coalesce(confirmation_token, ''),
      recovery_token = coalesce(recovery_token, ''),
      email_change_token_new = coalesce(email_change_token_new, ''),
      email_change = coalesce(email_change, ''),
      email_change_token_current = coalesce(email_change_token_current, ''),
      reauthentication_token = coalesce(reauthentication_token, '')
  where confirmation_token is null or recovery_token is null;

end;
$$;
