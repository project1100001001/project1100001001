# Políticas Oficiales de Publicidad (Advertising Policies)

Este documento establece las políticas comerciales, operativas y técnicas para la exhibición publicitaria de productos y servicios dentro del Marketplace. Es de cumplimiento obligatorio tanto en los **paneles de configuración de los clientes (vendedores)** como en los **paneles administrativos de configuración y moderación**.

---

## 1. Beneficio Inicial de Lanzamiento (7 Días de Publicidad Gratis)

- **Regla General**: Cuando un vendedor crea un nuevo **producto** (nuevo o usado) o un **servicio profesional**, la publicación recibe automáticamente **7 días iniciales con publicidad gratis ($0 COP)**.
- **Activación y Vigencia**:
  - El período gratuito de **7 días calendario** inicia desde la creación/aprobación de la publicación (`free_ad_starts_at` hasta `free_ad_ends_at = +7 días`).
  - Durante estos primeros 7 días, el producto o servicio goza de visibilidad promocional gratuita en las vitrinas y pasarelas del Marketplace sin descontar saldo de la billetera del anunciante.
- **Finalización del Período Gratuito**:
  - Una vez cumplidos los 7 días iniciales de publicidad gratuita, la publicación continúa activa en el catálogo general, y el vendedor puede adquirir cualquiera de los **Planes de Publicidad Pagada (Individual o en Combo)** para mantener o potenciar su exposición destacada.

---

## 2. Planes y Tarifas Oficiales de Publicidad (Post-Periodo Inicial)

Finalizados los 7 días iniciales gratuitos (o en cualquier momento en que el vendedor desee impulsar su publicación), el sistema ofrece dos modalidades de contratación por ciclos de **7 días de exhibición**:

### 2.1 Planes Individuales

| Plan | Ubicación de Exhibición | Duración | Tarifa Oficial (COP) | Descripción |
| :--- | :--- | :---: | :---: | :--- |
| **Plan Individual: Gran Vitrina** | **Gran Vitrina Principal** (*Hero Runway* en Portada `/`) | 7 días | **$20.000 COP** | Exhibición destacada en el recuadro principal superior de la portada con galería fotográfica, ficha técnica e integración directa a WhatsApp. |
| **Plan Individual: Pasarela** | **Pasarelas Especializadas y Pasarela de Vendedores** (*Servicios, Usados, Nuevos y Vendedores/Comercios*) | 7 días | **$10.000 COP** | Exhibición patrocinada en el carrusel continuo correspondiente al tipo de publicación (**Pasarela de Servicios**, **Pasarela de Usados** o **Pasarela de Nuevos**) y posicionamiento prioritario del negocio en la **Pasarela de Vendedores / Marcas y Comercios** (`MerchantsRunway`). |

### 2.2 Plan en Combo (Las Dos Ubicaciones)

| Plan | Ubicación de Exhibición | Duración | Tarifa Oficial (COP) | Beneficio / Ahorro |
| :--- | :--- | :---: | :---: | :--- |
| **Plan en Combo: Gran Vitrina + Pasarela** | **Las dos ubicaciones simultáneamente** (*Gran Vitrina Principal + Pasarelas de Rubro y Pasarela de Vendedores*) | 7 días | **$25.000 COP** | **Ahorro de $5.000 COP** respecto a la contratación individual ($20.000 + $10.000 = $30.000 COP). Máxima visibilidad simultánea en Gran Vitrina, Pasarela de categoría y Pasarela de Vendedores. |

---

## 3. Reglas en los Paneles de Configuración de Clientes (Vendedores)

1. **Creación de Producto o Servicio (`/publicar`, `/inventario`, `/mis-servicios`)**:
   - El formulario informa explícitamente al vendedor que su nueva publicación incluye **7 días iniciales con publicidad gratis**.
   - Se asignan automáticamente los metadatos de vigencia gratuita (`free_trial_days: 7`, `free_ad_starts_at`, `free_ad_ends_at`) y se registra su cobertura promocional inicial sin costo.
2. **Panel de Recarga de Saldo (`/promocionar?tab=recharge`)**:
   - El vendedor puede seleccionar directamente el monto exacto según el plan que desea adquirir:
     - **Pasarela (Individual)**: **$10.000 COP**
     - **Gran Vitrina (Individual)**: **$20.000 COP**
     - **Combo (Gran Vitrina + Pasarela)**: **$25.000 COP**
3. **Panel de Configuración de Campaña (`/promocionar?tab=campaign`)**:
   - Se desbloquea a partir del valor del plan mínimo (**$10.000 COP**).
   - Muestra el estado de los **7 días de publicidad gratis inicial** de cada producto o servicio del vendedor.
   - Permite elegir entre **Plan Individual Gran Vitrina ($20.000)**, **Plan Individual Pasarela ($10.000)** o **Plan en Combo las dos por $25.000**.
4. **Historial de Mis Campañas (`/mis-campanas`)**:
   - Visualiza las políticas vigentes, el estado de las publicaciones con publicidad gratuita de 7 días y las métricas en tiempo real (impresiones, clics, contactos de WhatsApp y CTR) de los planes contratados.

---

## 4. Reglas en los Paneles Administrativos de Configuración (`/admin`)

1. **Configuración y Control de Políticas Publicitarias (`/admin?section=ads`)**:
   - El panel de administración exhibe la matriz oficial de políticas publicitarias:
     - **Cortesía Inicial**: 7 días gratis al crear producto o servicio ($0 COP).
     - **Plan Individual Gran Vitrina**: $20.000 COP.
     - **Plan Individual Pasarela**: $10.000 COP.
     - **Plan en Combo (Las dos)**: $25.000 COP.
   - Incluye la herramienta administrativa para sincronizar y restablecer los paquetes oficiales en la base de datos (`public.ad_package`) y supervisar en qué ubicación se exhibe cada campaña.
2. **Moderación de Publicaciones (`/admin?section=listings`)**:
   - Indica para cada producto o servicio el estado de su beneficio de **7 días de publicidad gratis**.
   - Al aprobar una publicación, el administrador activa y garantiza sus 7 días completos de publicidad gratuita inicial a partir del momento de publicación.
3. **Billeteras y Recargas (`/admin?section=balances`)**:
   - Los accesos rápidos de acreditación manual y validación de comprobantes están alineados con los precios oficiales (**+$10.000 Pasarela**, **+$20.000 Gran Vitrina**, **+$25.000 Combo las dos**, **+$50.000 Doble Combo**).
