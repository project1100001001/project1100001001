-- ============================================================
-- 001_auth_and_core.sql
-- Conecta Supabase Auth (auth.users) con el modelo del marketplace.
-- Ejecutar en el SQL Editor de Supabase, o con:
--   supabase db push
-- ============================================================

-- --------------------------------------------------------------
-- 1. app_user: espejo de auth.users con los campos que sí usamos
-- --------------------------------------------------------------
-- No duplicamos email/password (eso vive en auth.users, gestionado
-- por Supabase). Esta tabla guarda solo lo que el marketplace necesita.

create table public.app_user (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  role          text not null default 'buyer',  -- buyer|seller|admin
  city          text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- Se crea automáticamente un app_user cada vez que alguien se registra
-- en Supabase Auth. Sin esto, tendrías que acordarte de insertarlo
-- manualmente en cada flujo de registro (email, Google, magic link...).

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.app_user (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- --------------------------------------------------------------
-- 2. seller (igual que en el esquema del marketplace)
-- --------------------------------------------------------------

create table public.seller (
  id              uuid primary key default gen_random_uuid(),
  owner_user_id   uuid not null references public.app_user(id) on delete cascade,
  business_name   text not null,
  business_type   text,
  city            text,
  description     text,
  phone           text,
  whatsapp        text,
  verified        boolean not null default false,
  verified_at     timestamptz,
  rating_avg      numeric(3,2) default 0,
  rating_count    int default 0,
  status          text not null default 'active',
  created_at      timestamptz not null default now()
);
create index on public.seller (owner_user_id);

-- Un usuario pasa a rol 'seller' automáticamente al crear su primer negocio
create function public.handle_new_seller()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.app_user set role = 'seller' where id = new.owner_user_id and role = 'buyer';
  return new;
end;
$$;

create trigger on_seller_created
  after insert on public.seller
  for each row execute procedure public.handle_new_seller();

-- --------------------------------------------------------------
-- 3. advertiser: mismo negocio, visto como anunciante
-- --------------------------------------------------------------

create table public.advertiser (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid references public.seller(id) on delete cascade,
  legal_name    text not null,
  status        text not null default 'active',
  created_at    timestamptz not null default now()
);

-- --------------------------------------------------------------
-- 4. Row Level Security — cada tabla debe decir explícitamente
--    quién puede ver y modificar qué. Sin esto, con RLS activado
--    (default en Supabase) nadie puede leer nada.
-- --------------------------------------------------------------

alter table public.app_user enable row level security;
alter table public.seller   enable row level security;
alter table public.advertiser enable row level security;

-- app_user: cada quien ve y edita su propio perfil
create policy "select_own_profile"
  on public.app_user for select
  using (auth.uid() = id);

create policy "update_own_profile"
  on public.app_user for update
  using (auth.uid() = id);

-- seller: perfiles de negocio son públicos para lectura (es un marketplace,
-- todos deben poder ver el negocio), pero solo el dueño edita
create policy "sellers_public_read"
  on public.seller for select
  using (true);

create policy "sellers_owner_insert"
  on public.seller for insert
  with check (auth.uid() = owner_user_id);

create policy "sellers_owner_update"
  on public.seller for update
  using (auth.uid() = owner_user_id);

-- advertiser: solo el dueño del seller asociado lo ve/edita
create policy "advertiser_owner_all"
  on public.advertiser for all
  using (
    exists (
      select 1 from public.seller s
      where s.id = advertiser.seller_id
      and s.owner_user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------
-- 5. Rol admin: acceso total vía función helper
--    (úsala en las políticas de listing, ad_order, etc. más adelante)
-- --------------------------------------------------------------

create function public.is_admin()
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.app_user
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Ejemplo de cómo se usará en las próximas migraciones (listing, ad_order):
--   create policy "admin_full_access" on public.listing for all using (is_admin());
