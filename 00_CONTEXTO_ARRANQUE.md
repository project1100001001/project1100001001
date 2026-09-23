# Contexto de arranque

## Qué es este proyecto

Marketplace para pequeñas empresas (alimentos, servicios, artículos varios) con un
módulo de publicidad propio. Next.js (App Router, TypeScript) + Supabase (Postgres,
Auth, Storage). Principio rector: el usuario aporta el recurso (su catálogo, sus
fotos, su anuncio), la plataforma intermedia (modera, conecta, cobra).

## Importante: la base de datos YA EXISTE en la nube, no la recrees

El proyecto de Supabase ya tiene corrida la migración `001_auth_and_core.sql`,
con estas tablas activas y con RLS habilitado:

- `app_user` (espejo de auth.users, con trigger que la llena automáticamente)
- `seller` (con trigger que pasa a role='seller' al crear el primer negocio)
- `advertiser`

No vuelvas a crear estas tablas. La siguiente migración a escribir es
`002_listing.sql` (agrega `listing`, `category`, `listing_media`) — pídemela
explícitamente antes de escribir SQL nuevo, para no divergir del esquema ya
diseñado.

## Qué necesito que hagas primero

1. Inicializa un proyecto Next.js en esta carpeta (vacía):
   `npx create-next-app@latest .`
   — TypeScript: sí — src/ directory: no — App Router: sí (obligatorio)
   — Import alias @/*: sí, dejarlo por defecto

2. Instala Supabase:
   `npm install @supabase/ssr @supabase/supabase-js`

3. Crea estos tres archivos exactamente como se indica abajo (ya están
   diseñados y probados, no los cambies de estructura):
   - `lib/supabase/client.ts`
   - `lib/supabase/server.ts`
   - `middleware.ts` (en la raíz)

4. Crea `.env.local` en la raíz con dos variables (yo las lleno con mis
   valores reales de Supabase → Project Settings → API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

5. Crea una página de prueba en `app/test-auth/page.tsx` que confirme la
   conexión (código abajo).

6. Corre `npm run dev` y confírmame que `/test-auth` carga sin error.

## Alcance de esta primera sesión — NO te salgas de esto

- No construir pagos, no construir subasta de anuncios, no construir IA
  generativa de creatividad. Todo eso está diseñado para fases posteriores.
- No dividir producto/servicio/artículo en tablas separadas cuando lleguemos
  a `listing` — es una sola tabla con `type` y `attrs jsonb`.
- Un monolito Next.js + Supabase. Sin microservicios.

## Orden de lo que viene después de esta sesión

1. `listing`, `category`, `listing_media` + formulario de publicación del vendedor
2. Búsqueda (Meilisearch o Typesense)
3. Panel de moderación (cola de revisión)
4. Contacto (WhatsApp/mensaje interno) + `contact_event`
5. Reseñas
6. Módulo de anuncios v1 (cuenta, saldo, paquetes de precio fijo)

Si tienes dudas de diseño de datos o de alcance que no estén claras aquí,
pregúntame antes de decidir por tu cuenta — hay un documento maestro completo
con todo el esquema de base de datos que puedo pegarte si lo necesitas.
