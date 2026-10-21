# Documento Maestro del Proyecto
Marketplace de pequeñas empresas con centro de publicidad propio
Versión 1.0 — consolida todas las decisiones tomadas hasta ahora

---

## 1. Qué es el proyecto

Un marketplace enfocado en **pequeñas empresas** (alimentos, servicios, artículos de distintas áreas) que les permite registrarse y publicar su catálogo, con un **módulo de publicidad propio** como diferenciador — no un banner genérico, sino un centro de publicidad pensado para que el mismo tendero, el mismo prestador de servicios, pueda promocionarse sin depender de una agencia.

**No es una red social.** La red social (Facebook) sirvió como referencia para identificar los dos componentes reales del proyecto: el marketplace y la plataforma publicitaria. No se construye un feed, ni un grafo social, ni mensajería estilo red social.

### Principio rector, válido para todo el proyecto

> **El usuario aporta el recurso. La plataforma intermedia.**

El vendedor trae su producto, su foto, su precio, su texto publicitario. La plataforma da el espacio, verifica, conecta, cobra su comisión o su tarifa, y reporta resultados. Esto aplica al catálogo, a los anuncios, y a cualquier función futura: la plataforma no genera contenido por el usuario, lo facilita y lo intermedia.

---

## 2. Nicho y validación

**Nicho:** apoyo a pequeñas empresas para que publiquen y vendan — alimentos, servicios, artículos varios. No es un marketplace generalista compitiendo con Mercado Libre ni una red social compitiendo con Facebook; el nicho es lo que hace el proyecto construible y defendible.

**Orden de validación:** primero demanda real de publicación y contacto (marketplace sin pagos), después disposición a pagar por visibilidad (anuncios de tarifa fija), y solo cuando haya tráfico real, publicidad sofisticada con subasta y marcas externas.

---

## 3. Qué SÍ se construye en esta fase (alcance actual)

- Registro y autenticación de usuarios (Supabase Auth) — **en progreso**
- Perfil de vendedor (`seller`)
- Catálogo unificado de producto/servicio/artículo (`listing`)
- Categorías y búsqueda
- Contacto directo comprador–vendedor (WhatsApp / mensaje interno), sin pago en plataforma
- Reseñas básicas
- Panel de administración con cola de moderación (ya prototipada) para listings y anuncios
- Módulo de anuncios v1: cuenta y saldo prepago, paquetes de precio fijo, revisión manual, sin subasta

## 4. Qué NO se construye todavía (aunque esté diseñado)

Esto es tan importante como lo anterior. Cada punto está documentado y listo para activarse, pero construirlo ahora es la forma más común de que el proyecto no llegue a lanzarse.

| No hacer ahora | Por qué |
|---|---|
| **No construir red social** (feed, seguir, likes, grafo social) | No es el producto; era solo referencia conceptual |
| **No procesar pagos de compra en plataforma** (escrow, retención de fondos) | Es lo más caro y riesgoso técnica y legalmente; se valida demanda antes |
| **No construir motor de subasta (CPC/CPM) desde el día uno** | Sin vendedores ni compradores reales, se optimiza contra datos ficticios |
| **No generar creatividad publicitaria con IA en esta fase** | El usuario aporta su propio recurso; la asistencia con IA es mejora de fase posterior, no requisito |
| **No dividir producto/servicio/artículo en tablas separadas** | Rompe la búsqueda, la moderación y los anuncios, que deben tratarlos igual |
| **No registrar un asiento contable por clic o impresión** | Un solo cierre diario por cuenta; el detalle por evento vive en agregados, no en el libro contable |
| **No usar microservicios** | Un monolito modular con un solo Postgres es correcto a esta escala; microservicios agregan complejidad sin necesidad |
| **No construir moderación 100% automática** | Un filtro automático prioriza la cola; la aprobación la da un humano mientras el volumen lo permita |
| **No vender publicidad a marcas externas (display/CPM) antes de tener tráfico propio** | Nadie paga por audiencia que no existe |
| **No dejar crédito o cartera a anunciantes** | Todo el módulo de anuncios es prepago; elimina impago y complejidad contable |
| **No construir app móvil nativa en esta fase** | Web responsive (Next.js) cubre la validación inicial |
| **No optimizar para escala desde el inicio** (Redis, colas, particionado agresivo) | Se introduce cuando el volumen lo exige, no antes — está documentado dónde y cuándo |

---

## 5. Tecnologías: libres y gratuitas, definidas hasta ahora

| Necesidad | Tecnología elegida | Por qué |
|---|---|---|
| Autenticación, base de datos, storage | **Supabase** (Postgres + Auth + Storage) | Gratis para empezar, RLS nativo, evita construir auth propio |
| Framework web | **Next.js** (App Router, TypeScript) | Server Components, un solo stack para front y backend liviano |
| Búsqueda y filtros | **Meilisearch** o **Typesense** | Libres, mucho mejor que `LIKE` de SQL para catálogo |
| Almacenamiento de imágenes/CDN | **Supabase Storage** (o MinIO / Cloudflare R2 si se migra) | Sin costo de infraestructura propia al inicio |
| Pagos (Fase 2, cuando se active) | **Wompi** o **Mercado Pago** | Soportan PSE, Nequi, split payments en Colombia |
| Moderación de imagen (NSFW) | **NSFW.js / open-nsfw** | Modelo abierto, corre en servidor propio, sin costo por llamada |
| Colas/caché (cuando se necesite) | **Redis** | Se introduce en la etapa de subasta o alto volumen, no antes |
| Facturación electrónica (cuando se cobre comisión) | Proveedor DIAN habilitado a integrar más adelante | Requisito legal, no técnico |

No se usa ningún marketplace open source ensamblado completo (Sharetribe, Medusa, etc.) como base: se construye el núcleo propio sobre estas piezas, según lo decidido — ensamblar plataformas completas ajenas genera más trabajo de integración que escribir el núcleo directamente.

---

## 6. Estructura completa de base de datos

Consolidado de todo lo acordado. Un solo Postgres (el de Supabase), con estas tablas agrupadas por dominio. `auth.users` es gestionado por Supabase y no se modifica directamente.

### 6.1 Identidad

```sql
-- Espejo de auth.users con los datos que el marketplace necesita
create table app_user (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  role          text not null default 'buyer',  -- buyer|seller|admin
  city          text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);
-- Trigger: se crea automáticamente al registrarse en Supabase Auth
```

### 6.2 Vendedores y catálogo (marketplace)

```sql
create table seller (
  id              uuid primary key default gen_random_uuid(),
  owner_user_id   uuid not null references app_user(id) on delete cascade,
  business_name   text not null,
  business_type   text,             -- persona_natural | pyme | freelance
  city            text,
  description     text,
  phone           text,
  whatsapp        text,
  verified        boolean not null default false,
  verified_at     timestamptz,
  rating_avg      numeric(3,2) default 0,
  rating_count    int default 0,
  status          text not null default 'active', -- active|suspended|banned
  created_at      timestamptz not null default now()
);
-- Trigger: al crear el primer seller, app_user.role pasa a 'seller'

create table category (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid references category(id),
  name          text not null,
  slug          text not null unique,
  applies_to    text not null   -- product|service|both
);

-- Tabla central: producto, servicio y artículo son el MISMO registro
create table listing (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references seller(id),
  category_id     uuid not null references category(id),
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
  attrs           jsonb not null default '{}',  -- atributos libres por categoría
  views_count     int not null default 0,
  contact_count   int not null default 0,
  created_at      timestamptz not null default now(),
  published_at    timestamptz
);
create index on listing (status, category_id);
create index on listing (seller_id);
create index idx_listing_attrs on listing using gin (attrs);

create table listing_media (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references listing(id) on delete cascade,
  url           text not null,
  kind          text not null default 'image', -- image|video
  position      int not null default 0
);

-- Agenda de servicios (opcional en Fase 1; puede vivir en listing.attrs como texto libre)
create table service_slot (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references listing(id) on delete cascade,
  day_of_week   int,
  start_time    time,
  end_time      time,
  capacity      int not null default 1
);
```

### 6.3 Contacto y reputación

```sql
-- Reemplaza al "carrito" mientras no haya pagos en plataforma.
-- También es el evento que mide los leads del módulo de anuncios.
create table contact_event (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references listing(id),
  buyer_user_id   uuid references app_user(id),
  channel         text not null,   -- whatsapp|internal_message|phone
  ad_order_id     uuid references ad_order(id),  -- enlaza con el anuncio de origen, si aplica
  created_at      timestamptz not null default now()
);

create table review (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references listing(id),
  seller_id     uuid not null references seller(id),
  buyer_user_id uuid not null references app_user(id),
  rating        int not null check (rating between 1 and 5),
  comment       text,
  status        text not null default 'published', -- published|hidden
  created_at    timestamptz not null default now()
);
-- Regla de negocio: solo puede reseñar quien tiene un contact_event previo
```

### 6.4 Publicidad (v1 — sin subasta)

```sql
create table advertiser (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid references seller(id),   -- mismo negocio, visto como anunciante
  legal_name    text not null,
  status        text not null default 'active',
  created_at    timestamptz not null default now()
);

create table ad_account (
  id              uuid primary key default gen_random_uuid(),
  advertiser_id   uuid not null references advertiser(id),
  balance         bigint not null default 0,
  created_at      timestamptz not null default now(),
  constraint balance_non_negative check (balance >= 0)
);

create table wallet_transaction (
  id              bigserial primary key,
  ad_account_id   uuid not null references ad_account(id),
  kind            text not null,   -- topup|spend|refund
  amount          bigint not null,
  balance_after   bigint not null,
  ref_type        text,            -- payment|ad_order|dispute
  ref_id          text,
  idempotency_key text unique,     -- obligatorio: evita duplicar recargas por reintentos de webhook
  created_at      timestamptz not null default now()
);

create table ad_slot (
  id            text primary key,   -- 'search.top', 'category.banner', 'home.carousel'
  surface       text not null,      -- search|category|home|listing_page
  formats       text[] not null,
  max_ads       int not null default 3
);

create table ad_package (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,      -- "Plan Individual: Pasarela ($10.000)", "Plan Individual: Gran Vitrina ($20.000)", "Plan en Combo: Gran Vitrina + Pasarela ($25.000)"
  slot_id           text not null references ad_slot(id),
  duration_days     int not null,
  price             bigint not null,
  max_active_slots  int not null default 1,
  active            boolean not null default true
);

-- Políticas Oficiales de Publicidad (ver POLITICAS_PUBLICIDAD.md):
-- 1. Al crear un producto o servicio dura inicialmente 7 días con publicidad gratis ($0 COP).
-- 2. Plan Individual Gran Vitrina: $20.000 COP (7 días).
-- 3. Plan Individual Pasarela: $10.000 COP (7 días).
-- 4. Plan en Combo (las dos: Gran Vitrina + Pasarela): $25.000 COP (7 días).

create table ad_order (
  id              uuid primary key default gen_random_uuid(),
  ad_account_id   uuid not null references ad_account(id),
  package_id      uuid not null references ad_package(id),
  listing_id      uuid references listing(id),

  headline        text not null,
  body            text,
  image_url       text not null,
  cta_label       text default 'Ver más',
  target_city     text,
  target_category text,

  status          text not null default 'draft',
                  -- draft|submitted|in_review|approved|scheduled|live|rejected|paused|ended|cancelled
  reject_reason   text,
  reviewed_by     uuid references app_user(id),
  reviewed_at     timestamptz,

  starts_at       timestamptz,
  ends_at         timestamptz,
  price_paid      bigint not null,
  created_at      timestamptz not null default now(),
  submitted_at    timestamptz
);
create index on ad_order (status);
create index on ad_order (starts_at, ends_at) where status = 'live';

-- Validación automática antes de que un humano revise (dimensión, peso, NSFW, texto prohibido)
create table ad_asset_check (
  ad_order_id     uuid primary key references ad_order(id),
  width           int,
  height          int,
  size_kb         int,
  format_ok       boolean,
  size_ok         boolean,
  nsfw_score      numeric(4,3),
  text_length_ok  boolean,
  auto_flag       text   -- null|dimension_mismatch|too_heavy|nsfw_risk|profanity
);

create table ad_event (
  id            uuid not null,
  event_type    text not null,   -- impression|click|contact
  occurred_at   timestamptz not null,
  ad_order_id   uuid not null,
  user_id       uuid,
  session_id    text,
  request_hash  text,
  primary key (id, occurred_at)
) partition by range (occurred_at);
create unique index on ad_event (ad_order_id, event_type, request_hash);

create table ad_stats_daily (
  day           date not null,
  ad_order_id   uuid not null,
  impressions   bigint not null default 0,
  clicks        bigint not null default 0,
  contacts      bigint not null default 0,
  primary key (day, ad_order_id)
);
```

### 6.5 Cómo se relaciona todo

```
auth.users (Supabase) ── app_user ──┬── seller ──┬── listing ──┬── listing_media
                                     │             │             ├── service_slot
                                     │             │             ├── review
                                     │             │             └── contact_event ── (opcional) ad_order
                                     │             │
                                     │             └── advertiser ── ad_account ── wallet_transaction
                                     │                                    │
                                     │                                    └── ad_order ──┬── ad_asset_check
                                     │                                                    ├── ad_event
                                     └── (admin revisa listing y ad_order)                └── ad_stats_daily
```

`seller` y `advertiser` son el mismo negocio visto desde dos ángulos — por eso `advertiser.seller_id` los conecta. `contact_event.ad_order_id` es la costura que mide si un contacto vino de un anuncio o del catálogo orgánico.

---

## 7. Seguridad: reglas ya definidas (RLS en Supabase)

- Cada usuario ve y edita solo su propio `app_user`.
- Los perfiles de `seller` son públicos para lectura (es un marketplace), pero solo el dueño los edita.
- `advertiser` y `ad_account` solo son visibles para el dueño del `seller` asociado.
- Existe una función `is_admin()` reutilizable, para las políticas de `listing` y `ad_order` (el admin necesita ver todo para moderar).
- Nada de contraseñas ni tokens se maneja en tablas propias: eso vive en `auth.users`, gestionado por Supabase.

---

## 8. Flujo de moderación (compartido entre listing y ad_order)

Ambos usan el mismo patrón de estados y, en el futuro, el mismo panel de administración:

```
draft → submitted → pending_review/in_review → published/approved → live
                              └──→ rejected (motivo de lista, el usuario corrige y reenvía)
```

Criterios de revisión ya definidos: fotos reales, precio coherente, sin datos de contacto directo en el texto (para forzar el uso del canal medible de la plataforma), sin contenido prohibido, sin superlativos o claims médicos no verificables.

---

## 9. Orden de construcción decidido

1. Autenticación (Supabase Auth) — **en curso**
2. `seller`, `listing`, `listing_media`, `category` + panel de publicación del vendedor
3. Búsqueda (Meilisearch/Typesense)
4. Cola de moderación de listings (reutilizando el panel ya prototipado)
5. Contacto (WhatsApp/mensaje interno) + `contact_event`
6. Reseñas
7. Módulo de anuncios v1: cuenta, saldo, paquetes fijos, cola de revisión de anuncios
8. Reportes simples para vendedor y anunciante

No se avanza al módulo de anuncios sofisticado (punto 10 de la siguiente sección) hasta que este orden esté completo y con uso real.

---

## 10. Sugerencias para versiones posteriores (NO construir ahora)

Todo lo siguiente está diseñado y documentado en detalle en las especificaciones previas, pero se deja explícitamente fuera del alcance actual. Se activa por señales de negocio, no por calendario.

| Mejora futura | Señal para activarla |
|---|---|
| **Subasta de anuncios (CPC/CPM con segundo precio, quality score, pCTR)** | Un slot de precio fijo se llena todos los días con lista de espera constante |
| **Generación de creatividad publicitaria con IA** (asistencia, no obligatoria) | Vendedores piden ayuda para diseñar su pieza; sigue siendo su recurso, la IA solo asiste |
| **Publicidad display (CPM) para marcas externas** | Ya hay tráfico propio real que justifique vender audiencia a terceros |
| **Cobro por lead (CPL) verificado para servicios** | El modelo de tarifa fija no diferencia bien producto de servicio |
| **Pagos en plataforma con retención de fondos (escrow)** | Hay tracción real y volumen de transacciones que lo justifiquen |
| **Atribución multi-ventana (post-vista, post-clic, crédito parcial)** | Se activa junto con la subasta, no antes |
| **Redis para selección de anuncios en tiempo real** | El volumen de tráfico hace lento servir anuncios directo desde Postgres |
| **Auto-aprobación de vendedores con historial limpio** | La cola de revisión manual tarda más de 24h en vaciarse |
| **Agenda estructurada de servicios (`service_slot` con reservas reales)** | Los prestadores piden gestionar disponibilidad más allá de un texto libre |
| **App móvil nativa** | La versión web (PWA) muestra retención suficiente para justificar la inversión |
| **Verificación de identidad / antecedentes para prestadores de servicios** | El volumen de servicios sensibles (ej. cuidado en el hogar) lo requiere |
| **Facturación electrónica automatizada e integración DIAN completa** | Se empieza a cobrar comisión o suscripción de forma recurrente |
| **Frequency capping y brand safety para display** | Se activa junto con la publicidad de marcas externas |

---

## 11. Estado actual (a la fecha de este documento)

- Diseño de datos y flujo del marketplace: **completo**
- Diseño de datos y flujo del módulo de anuncios v1: **completo**
- Prototipo del panel de administración (cola de revisión): **completo**
- Autenticación con Supabase: **en instalación** — migración SQL de `app_user`, `seller`, `advertiser` con RLS ya escrita; proyecto Next.js en configuración
- Pendiente de construir: `listing`, búsqueda, panel de vendedor, contacto, reseñas, panel de anuncios

Este documento se actualiza cada vez que se tome una decisión nueva de alcance, tecnología o modelo de datos, para que siga siendo la fuente única de verdad del proyecto.
