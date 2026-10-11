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
    3. **Mis Publicaciones (`/mis-publicaciones`)**:
       - *Ver mis Anuncios*
       - *+ Publicar nuevo Anuncio (`/publicar`)*
    4. **Publicidad & Campañas (`/mis-campanas`)**:
       - *Mis Campañas Patrocinadas*
       - *+ Promocionar / Recarga de Saldo (`/promocionar`)*
    5. **Administración y Moderación (`/admin`)**:
       - *Cola de Moderación*
       - *Campañas de Anuncios*
       - *Billeteras y Recargas de Saldo*
    6. **Preferencias y Sesión (Pie del Sidebar)**:
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
