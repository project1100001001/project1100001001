-- ============================================================
-- 002_listing.sql
-- Catálogo unificado: producto, servicio y artículo en una sola tabla.
-- Depende de: seller, app_user (ya creadas en 001_auth_and_core.sql)
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- --------------------------------------------------------------
-- 1. category
-- --------------------------------------------------------------

create table public.category (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid references public.category(id),
  name          text not null,
  slug          text not null unique,
  applies_to    text not null default 'both'  -- product|service|both
);

alter table public.category enable row level security;

-- Las categorías son de lectura pública, las gestiona solo el admin
create policy "category_public_read"
  on public.category for select
  using (true);

create policy "category_admin_write"
  on public.category for all
  using (public.is_admin())
  with check (public.is_admin());

-- Semillas iniciales mínimas (ajusta o amplía desde el panel admin luego)
insert into public.category (name, slug, applies_to) values
  ('Alimentos', 'alimentos', 'product'),
  ('Servicios del hogar', 'servicios-hogar', 'service'),
  ('Belleza y cuidado personal', 'belleza', 'both'),
  ('Ropa y accesorios', 'ropa-accesorios', 'product'),
  ('Clases y educación', 'clases-educacion', 'service'),
  ('Otros', 'otros', 'both');

-- --------------------------------------------------------------
-- 2. listing — la tabla central del proyecto
-- --------------------------------------------------------------

create table public.listing (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references public.seller(id) on delete cascade,
  category_id     uuid not null references public.category(id),
  type            text not null,   -- product|service|article
  title           text not null,
  description     text,
  price           bigint,          -- null = "cotización a solicitud"
  price_unit      text,            -- unidad|hora|servicio|kg...
  city            text,
  status          text not null default 'draft',
                  -- draft|submitted|pending_review|published|rejected|paused|archived
  reject_reason   text,
  stock           int,             -- null = no aplica (servicios)
  attrs           jsonb not null default '{}',
  views_count     int not null default 0,
  contact_count   int not null default 0,
  created_at      timestamptz not null default now(),
  published_at    timestamptz,

  constraint listing_type_valid check (type in ('product','service','article')),
  constraint listing_status_valid check (
    status in ('draft','submitted','pending_review','published','rejected','paused','archived')
  )
);

create index on public.listing (status, category_id);
create index on public.listing (seller_id);
create index idx_listing_attrs on public.listing using gin (attrs);

-- Autocompleta published_at la primera vez que pasa a 'published'
create function public.handle_listing_published()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create trigger on_listing_status_change
  before update on public.listing
  for each row execute procedure public.handle_listing_published();

alter table public.listing enable row level security;

-- Lectura pública SOLO de listings publicados (es lo que ve un comprador)
create policy "listing_public_read_published"
  on public.listing for select
  using (status = 'published');

-- El dueño del seller ve todos sus propios listings, sin importar el estado
create policy "listing_owner_read_all"
  on public.listing for select
  using (
    exists (
      select 1 from public.seller s
      where s.id = listing.seller_id and s.owner_user_id = auth.uid()
    )
  );

-- El dueño crea listings solo para su propio seller
create policy "listing_owner_insert"
  on public.listing for insert
  with check (
    exists (
      select 1 from public.seller s
      where s.id = listing.seller_id and s.owner_user_id = auth.uid()
    )
  );

-- El dueño edita su listing, pero no puede autopublicarse saltándose moderación:
-- solo puede mover status entre draft y submitted. approved/rejected es tarea del admin.
create policy "listing_owner_update"
  on public.listing for update
  using (
    exists (
      select 1 from public.seller s
      where s.id = listing.seller_id and s.owner_user_id = auth.uid()
    )
  )
  with check (
    status in ('draft','submitted','paused','archived')
  );

-- El admin ve y modifica todo (necesario para la cola de moderación)
create policy "listing_admin_all"
  on public.listing for all
  using (public.is_admin())
  with check (public.is_admin());

-- --------------------------------------------------------------
-- 3. listing_media
-- --------------------------------------------------------------

create table public.listing_media (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references public.listing(id) on delete cascade,
  url           text not null,
  kind          text not null default 'image',  -- image|video
  position      int not null default 0
);
create index on public.listing_media (listing_id);

alter table public.listing_media enable row level security;

-- Las fotos son visibles si el listing al que pertenecen es visible
create policy "listing_media_read"
  on public.listing_media for select
  using (
    exists (
      select 1 from public.listing l
      where l.id = listing_media.listing_id
      and (
        l.status = 'published'
        or exists (select 1 from public.seller s where s.id = l.seller_id and s.owner_user_id = auth.uid())
        or public.is_admin()
      )
    )
  );

-- Solo el dueño del listing sube/gestiona sus propias fotos
create policy "listing_media_owner_write"
  on public.listing_media for all
  using (
    exists (
      select 1 from public.listing l
      join public.seller s on s.id = l.seller_id
      where l.id = listing_media.listing_id and s.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listing l
      join public.seller s on s.id = l.seller_id
      where l.id = listing_media.listing_id and s.owner_user_id = auth.uid()
    )
  );

create policy "listing_media_admin_all"
  on public.listing_media for all
  using (public.is_admin())
  with check (public.is_admin());
