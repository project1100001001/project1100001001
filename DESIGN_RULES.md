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

## 3. Modo Claro / Modo Oscuro
- Todas las superficies, bordes, textos e iconos deben utilizar clases adaptables de Tailwind CSS (ej. `bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50`).

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
