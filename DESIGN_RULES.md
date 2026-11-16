# Reglas de Diseño y Arquitectura de Interfaz (Design Rules)

Este documento registra los fundamentos y decisiones de diseño aprobadas por el usuario. **Cualquier nuevo desarrollo, funcionalidad o agente DEBE seguir estas reglas sin excepción.**

---

## 1. Navegación Lateral Izquierda Obligatoria (Left Sidebar Navigation)
- **Ubicación exclusiva**: La barra de navegación principal debe ubicarse SIEMPRE al **costado izquierdo** de la interfaz (Sidebar lateral).
- **Abatimiento / Guardado con botón de fácil visualización e indicación**:
  - La barra lateral debe poder **abatirse o guardarse** en cualquier momento para maximizar el área de lectura y trabajo del usuario.
  - El control de guardado y despliegue cuenta con botones altamente visibles e intuitivos:
    - **Para guardar / abatir la barra (cuando está visible)**: Botón con icono y etiqueta clara en la cabecera del sidebar: `[◀ Guardar menú]` (`Collapse sidebar`).
    - **Para mostrar / desplegar la barra (cuando está guardada)**: Botón flotante adosado al borde izquierdo de la pantalla con fondo destacado, sombra e indicación inequívoca: `[▶ Mostrar menú]` (`Show sidebar`), accesible en todo momento para volver a abrir el menú con un solo clic.
    - **En dispositivos móviles**: Botón visible `[☰ MENÚ]` en la barra superior móvil y botón de cierre `[✕]` en la cabecera del cajón lateral (*drawer*).
- **Estructura jerárquica con Opciones y Subopciones**:
  - Toda la navegación se agrupa en secciones desplegables/colapsables o con subopciones indentadas:
    1. **Inicio (`/`)**
    2. **Catálogo & Categorías (`/catalogo`)**:
       - *Todos los Anuncios*
       - *Alimentos artesanales*
       - *Servicios para el hogar*
       - *Belleza y Estilo*
       - *Ropa y Accesorios*
       - *Clases y Educación*
       - *Otros*
    3. **Directorio de Vendedores (`/directorio`)**: Enlace directo al directorio de comercios (los filtros de rubro, ciudad, verificación y contacto residen exclusivamente en la ventana principal).
    4. **Mis Publicaciones (`/mis-publicaciones`)**:
       - *Ver mis Anuncios*
       - *Publicar Anuncio (`/publicar`)*
    5. **Mis Campañas (`/mis-campanas`)**:
       - *Historial de Campañas (`/mis-campanas`)*
       - *Recarga de Saldo (`/promocionar?tab=recharge`)*
       - *Configurar Campaña (`/promocionar?tab=campaign`)*
    6. **Administración y Moderación (`/admin`)**:
       - *Moderación de Anuncios (`/admin?section=listings`)*
       - *Campañas Patrocinadas (`/admin?section=ads`)*
       - *Billeteras y Recargas (`/admin?section=balances`)*
       - *Usuarios y Roles (`/admin?section=users`)*
    7. **Preferencias y Sesión (Pie del Sidebar)**:
       - *Selector de Idioma (`ES | EN`)*
       - *Alternador de Modo Claro / Oscuro*
       - *Perfil / Iniciar Sesión / Cerrar Sesión*
- **Prohibición de enlaces de navegación en el centro de las publicaciones**:
  - **NO dejar ningún enlace de navegación, barra de navegación horizontal ni menú duplicado en la parte central de la pantalla o de las publicaciones**.
  - La zona central está reservada exclusivamente para el contenido (feed de tarjetas, filtros de búsqueda contextuales, formulario de publicación, fotos, ficha técnica del producto, botón de contacto directo por WhatsApp con el vendedor).
- **Adaptabilidad Móvil (Mobile First)**:
  - En pantallas móviles y tablets, la navegación lateral se repliega en un **Sidebar Drawer** que se desliza desde la izquierda al presionar el botón de menú superior izquierdo. Mantiene exactamente las mismas opciones y subopciones ordenadas.

---

## 2. Internacionalización (i18n) Nativa
- Todo nuevo texto, botón, mensaje de error o distintivo debe pasar por el sistema de diccionarios `lib/i18n/` (`types.ts`, `dictionaries/es.ts`, `dictionaries/en.ts`) y consumirse mediante el hook `useTranslation()`.
- Nunca escribir textos directamente fijos en español en el JSX/HTML.

---

## 3. Identidad Cromática Corporativa (Color Dorado Oficial) y Teoría del Color
- **Color Corporativo Oficial (Dorado — Imagen del Producto)**:
  - El **Dorado (`Amber / Gold`: `#f59e0b` `amber-500`, `#fbbf24` `amber-400`, `#d97706` `amber-600`)** es el color corporativo oficial que representa la identidad visual del producto **Indie Clasificados**, en sintonía directa con la esfera geodésica dorada del logo (`/img/logo.png` y `/img/icon.ico`).
  - Todo elemento institucional (esfera de carga 3D, barras de progreso, indicadores principales de navegación activa en Inicio/Dashboard, subtítulos de marca `"Economía en Circulación"`, selección de texto, bordes destacados y destellos de luz) debe emplear la paleta dorada corporativa.
- **Armonización por Teoría del Color (Títulos, Textos, Fondos y Categorías)**:
  - Tomando el **Dorado Corporativo (`~43° HSL`)** como eje cromático central, todos los colores de la interfaz se combinan bajo reglas estrictas de compatibilidad visual y contraste:
    1. **Fondos y Superficies (Contraste Acromático Cálido / Obsidiana)**:
       - **Modo Claro**: Fondos en Marfil/Alabastro neutro (`#fafafa` / `bg-zinc-50`) y tarjetas blancas (`#ffffff` / `bg-white`) con bordes sutiles (`border-zinc-200/80` y realces `border-amber-300/60`), permitiendo que los acentos dorados destaquen con limpieza sin saturar la vista.
       - **Modo Oscuro**: Fondos en Obsidiana/Carbón profundo (`#09090b` / `bg-zinc-950` y `#18181b` / `bg-zinc-900`) con halos ambientales dorados (`bg-amber-500/10`, `border-amber-500/30`), generando el contraste de máximo prestigio (**Oro sobre Obsidiana**) donde la luz dorada proyecta profundidad y legibilidad inmediata.
    2. **Títulos y Textos (Jerarquía Tipográfica Compatible)**:
       - **Títulos Principales (`h1`, `h2`, `h3`)**: Carbón profundo (`text-zinc-900`) en modo claro y Blanco Marfil (`text-zinc-50`) en modo oscuro, combinados con acentos de sección y etiquetas superiores en Dorado Corporativo (`text-amber-700 dark:text-amber-400`).
       - **Textos Descriptivos y Secundarios**: Gris Pizarra equilibrado (`text-zinc-600 dark:text-zinc-300` para cuerpo de lectura y `text-zinc-500 dark:text-zinc-400` para metadatos), garantizando contraste WCAG AAA sin competir con el dorado ni con los distintivos semánticos.
    3. **Compatibilidad con la Codificación Semántica de Objetos (Nuevos, Usados, Servicios y Usuarios)**:
       - Se conserva la identificación visual de cada línea de negocio, armonizada geométricamente en el círculo cromático respecto al **Dorado Corporativo (`43°`)**:
         - **Marca Corporativa, Vitrina Principal y Barras de Carga**: **Dorado Luminoso (`amber-400` / `amber-500`, `#fbbf24` / `#f59e0b`)** con efectos de sombra de luz dorada.
         - **Artículos Usados (`type=article`)**: **Ámbar Bronce (`amber-600` / `amber-700` en claro, `amber-400` en oscuro)** — *Armonía Análoga* que conecta la economía en circulación directamente con el ADN dorado de la marca.
         - **Productos Nuevos (`type=product`)**: **Azul Zafiro (`blue-600` / `blue-400`)** — *Armonía Complementaria Directa (`~215°` vs `43°`)*, creando el equilibrio cálido-frío más armónico junto al dorado.
         - **Servicios Profesionales (`type=service`)**: **Púrpura Amatista (`purple-600` / `purple-400`)** — *Armonía Complementaria Dividida (`~270°` vs `43°`)*, proyectando especialización y valor premium junto al dorado.
         - **Usuarios y Solicitudes (`users` / `/solicitudes`)**: **Índigo y Turquesa (`indigo-600` / `teal-600`)** — *Armonía Triádica Equilibrada*, diferenciando perfiles de comunidad y demandas de compradores.
         - **Acción Transaccional y Verificación (WhatsApp / Activo)**: **Verde Esmeralda (`emerald-600` / `emerald-400`)** — reservado para el botón de contacto directo por WhatsApp, estados activos operativos e insignias de verificación comercial.
- **Directriz para Futuras Integraciones de Objetos**:
  - Cualquier nuevo objeto, tarjeta, modal, pasarela, gráfico, animación o componente interactivo que se integre en el futuro DEBE adoptar el **Dorado Corporativo** como color rector de marca, combinando sus títulos, textos y fondos según esta matriz cromática y respetando los colores semánticos de productos nuevos, usados, servicios y usuarios.

---

## 4. Portada Principal: Pasarelas de Presentación de Campañas (Showcase Runways)
- **Sin Campo de Búsqueda Central**: La portada principal (`/`) no lleva formulario ni campo de búsqueda invasivo en el hero. La búsqueda estructurada reside en el **Catálogo (`/catalogo`)** y el **Directorio (`/directorio`)**.
- **Pasarelas Dinámicas de Campañas**: La portada se compone de pasarelas de exhibición dinámicas, fluidas y ultralivianas:
  1. *Gran Vitrina Principal (Hero Runway)*: Exhibe publicaciones con campañas patrocinadas activas, tiempo restante de vigencia pagada, fotos de la publicación, ficha técnica y botón de contacto directo por WhatsApp.
  2. *Pasarela de Productos Destacados*: Carrusel horizontal interactivo de artículos promocionados.
  3. *Pasarela de Servicios y Soluciones*: Destaca tiempos de respuesta, duración estimada y modalidad operativa.
  4. *Pasarela de Marcas y Catálogos Comerciales*: Exhibe las marcas con campañas activas y sus mini-catálogos.
- **Rendimiento y Ligereza**: Las transiciones se ejecutan mediante CSS y estado reactivo limpio para evitar retrasos, caídas o fallas de rendimiento.
- **Directriz de Tamaño Estático de la Gran Vitrina (Invariable y Estable)**:
  - El recuadro de la **Gran Vitrina Principal (Hero Runway)** DEBE tener un **tamaño estático y fijo** (altura y dimensiones estáticas constantes).
  - **PROHIBIDO que el recuadro cambie de tamaño, brinque o se deforme con los efectos de movimiento, transiciones o rotación automática del contenido interior**.
  - No debe ocurrir ningún salto de diseño (*Layout Shift / CLS*) que desplace la ventana o las secciones inferiores de la página al rotar entre publicaciones con diferentes longitudes de texto, atributos o fotos.
  - La tipografía, espaciados y elementos interiores (titular recortado a máximo 2 líneas con `line-clamp-2`, descripción con `line-clamp-2`, botones y fotos con alturas acotadas) deben adaptarse consecuente y proporcionalmente para que cualquier publicación encaje de manera armónica dentro de las dimensiones fijas del recuadro estático.

---

## 5. Políticas Oficiales de Publicidad y Tarifas (Ver `POLITICAS_PUBLICIDAD.md`)
- **Periodo Inicial Gratuito (7 Días)**:
  - Cuando se crea un producto o servicio, dura inicialmente **7 días con publicidad gratis ($0 COP)**.
- **Planes de Publicidad Pagada (después de los 7 días iniciales)**:
  - **Plan Individual — Gran Vitrina**: **$20.000 COP** (7 días en Gran Vitrina Principal).
  - **Plan Individual — Pasarela**: **$10.000 COP** (7 días en Pasarela de Productos/Servicios/Usados).
  - **Plan en Combo (Las dos ubicaciones)**: **$25.000 COP** (Gran Vitrina + Pasarela simultáneamente por 7 días).
- **Reflejo en Paneles**:
  - Esta estructura tarifaria y de vigencia gratuita inicial debe reflejarse de manera uniforme tanto en los **paneles de configuración de los clientes** (`/publicar`, `/inventario`, `/mis-servicios`, `/promocionar`, `/mis-campanas`) como en los **paneles administrativos de configuración** (`/admin`).

