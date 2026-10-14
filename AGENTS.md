<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# REGLA FUNDAMENTAL DE DISEÑO DE INTERFAZ (OBLIGATORIA)

1. **Barra de Navegación Lateral Izquierda (Left Sidebar Navigation)**:
   - La barra de navegación DEBE estar ubicada al **costado izquierdo** de la interfaz (Sidebar lateral).
   - Se debe estructurar de manera jerárquica con las **opciones principales y sus respectivas subopciones** desplegables/colapsables:
     - Inicio (`/`)
     - Catálogo y Exploración (`/catalogo` con subopciones por categoría)
     - Directorio de Vendedores (`/directorio`)
     - Mis Publicaciones (`/mis-publicaciones` y `Publicar Anuncio`)
     - Mis Campañas (`/mis-campanas`, `Recarga de Saldo` y `Configurar Campaña`)
     - Moderación y Administración (`/admin` con subopciones para anuncios, campañas, billeteras y usuarios)
     - Configuración y Preferencias (Idioma `ES|EN`, Modo Claro/Oscuro, Sesión)
   - **Abatible / Guardable (Collapsible)**: La barra debe poder abatirse o guardarse mediante un botón claramente visible (`[◀ Guardar menú]`) y volver a desplegarse con un botón flotante visible e inequívoco en el borde izquierdo (`[▶ Mostrar menú]`).
2. **Zona Central Limpia (Prohibido enlaces de navegación en el centro)**:
   - **NO DEJAR NINGÚN ENLACE NI BARRA DE NAVEGACIÓN EN LA PARTE CENTRAL DE LA PUBLICACIÓN O DE LA PÁGINA**.
   - El centro de la pantalla está reservado exclusivamente para el contenido (feed, tarjetas de productos, ficha técnica del anuncio, botón de WhatsApp, formularios).
3. **Tamaño Estático Invariable de la Gran Vitrina Principal (Hero Runway)**:
   - El recuadro de la Gran Vitrina en el Inicio (`/`) DEBE mantener dimensiones y altura **estáticas y fijas**.
   - Bajo ninguna circunstancia debe cambiar de tamaño, brincar o deformarse con el movimiento o rotación del contenido interior, evitando cualquier desplazamiento en la ventana.
   - Los textos interiores (títulos con límite estricto de 2 líneas, descripciones acotadas y botones) deben ajustarse con coherencia para habitar el recuadro fijo sin alterar su altura.
4. **Consulta de referencia**:
   - Ver detalles adicionales en `DESIGN_RULES.md`.
