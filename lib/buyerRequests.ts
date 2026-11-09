// lib/buyerRequests.ts
// Modelo de datos, almacenamiento sincronizado y semillas realistas para el Módulo de Clasificados de Solicitudes (Demanda de Compradores)

export type BuyerRequestType = 'service' | 'product'
export type BuyerRequestUrgency = 'immediate' | '24_48h' | 'scheduled' | 'flexible'
export type BuyerRequestModality = 'home' | 'in_person' | 'virtual' | 'flexible'
export type BuyerRequestStatus = 'open' | 'in_attention' | 'completed' | 'rated' | 'closed'

export interface BuyerRequestProposal {
  id: string
  requestId: string
  sellerUserId: string
  sellerId?: string | null
  sellerBusinessName: string
  sellerCity: string
  sellerWhatsapp: string
  sellerPhone?: string | null
  sellerVerified: boolean
  sellerRatingAvg: number
  sellerRatingCount: number
  linkedListingId?: string | null
  linkedListingTitle?: string | null
  offeredPriceCop: number | null // null = A cotizar en visita / diagnóstico
  estimatedTime: string // ej. 'Llegada en 45 min', 'Entrega en 24 horas'
  warrantyOffered: string // ej. 'Garantía escrita de 3 meses'
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface BuyerRequestReviewRecord {
  rating: number // 1 a 5 estrellas
  comment: string
  recommend: boolean
  reviewedAt: string
  sellerId?: string | null
  sellerBusinessName: string
}

export type ContractMilestoneType =
  | 'conditions_proposed'
  | 'buyer_accepted_conditions'
  | 'seller_accepted_conditions'
  | 'contract_activated'
  | 'progress_update'
  | 'service_delivered'
  | 'buyer_conformity'
  | 'observation'

export interface BuyerRequestContractLog {
  id: string
  actorRole: 'buyer' | 'seller' | 'system'
  actorName: string
  milestoneType: ContractMilestoneType
  title: string
  detail: string
  createdAt: string
}

export interface BuyerRequestContract {
  contractCode: string // ej. #CTO-748291
  saleReferenceCode: string // ej. #VTA-502914 (Registro de venta/orden independiente)
  proposalId: string
  buyerUserId: string
  buyerName: string
  sellerUserId: string
  sellerId?: string | null
  sellerBusinessName: string
  sellerWhatsapp: string
  // Condiciones pactadas entre Comprador y Vendedor
  agreedPriceCop: number
  agreedScope: string
  agreedTimeline: string
  agreedWarranty: string
  paymentTerms: string
  // Doble aceptación de condiciones (Comprador + Vendedor)
  buyerAcceptedConditions: boolean
  buyerAcceptedAt: string | null
  sellerAcceptedConditions: boolean
  sellerAcceptedAt: string | null
  // Estado operativo del contrato pactado
  contractStatus:
    | 'pending_mutual_acceptance'
    | 'active_in_execution'
    | 'delivered_pending_approval'
    | 'completed_fulfilled'
  progressPercent: number // 0 a 100
  trackingLogs: BuyerRequestContractLog[]
  createdAt: string
  updatedAt: string
}

export interface BuyerClassifiedRequest {
  id: string
  referenceCode: string // ej. #SOL-849201
  buyerUserId: string
  buyerName: string
  buyerCity: string
  buyerPhone?: string | null
  buyerWhatsapp?: string | null
  requestType: BuyerRequestType // Prioridad a 'service'
  categoryName: string
  categorySlug: string
  title: string
  description: string
  // Estructura prioritaria de Servicio + soporte de Producto
  urgency: BuyerRequestUrgency
  urgencyLabel: string
  modality: BuyerRequestModality
  modalityLabel: string
  preferredSchedule: string // ej. 'Mañana entre 8:00 AM y 12:00 PM'
  budgetMinCop?: number | null
  budgetMaxCop: number | null // null = 'Abierto a Cotizaciones'
  budgetUnit: string // ej. 'servicio completo', 'hora', 'unidad', 'proyecto'
  requiredExperienceOrSpec: string // ej. 'Técnico certificado con herramienta propia' o 'Nuevo sellado / Usado buen estado'
  quantityOrScope: string // ej. '1 visita técnica + reparación' o '2 unidades'
  status: BuyerRequestStatus
  selectedProposalId?: string | null
  proposals: BuyerRequestProposal[]
  contract?: BuyerRequestContract | null
  review?: BuyerRequestReviewRecord | null
  viewsCount: number
  createdAt: string
}

export const BUYER_REQUESTS_STORAGE_KEY = 'marketplace_buyer_requests_v1'
export const BUYER_REQUESTS_SLOT_ID = 'config.buyer_requests'

export const INITIAL_BUYER_REQUESTS: BuyerClassifiedRequest[] = [
  {
    id: 'req-service-001',
    referenceCode: '#SOL-901204',
    buyerUserId: 'a1000000-0000-0000-0000-000000000001',
    buyerName: 'Camila Torres',
    buyerCity: 'Bogotá',
    buyerPhone: '573001112201',
    buyerWhatsapp: '573001112201',
    requestType: 'service',
    categoryName: 'Servicios del hogar',
    categorySlug: 'servicios-hogar',
    title: 'Urgente: Detección y reparación de filtración de agua en baño principal',
    description:
      'Se presenta humedad en la pared del baño principal y baja presión en el agua caliente. Busco técnico plomero con geófono o experiencia en redes hidráulicas sin romper enchape innecesariamente.',
    urgency: 'immediate',
    urgencyLabel: '⚡ Urgente / Hoy mismo',
    modality: 'home',
    modalityLabel: '🏠 A Domicilio',
    preferredSchedule: 'Hoy o mañana entre 8:00 AM y 2:00 PM',
    budgetMinCop: 90000,
    budgetMaxCop: 160000,
    budgetUnit: 'servicio completo',
    requiredExperienceOrSpec: 'Plomero con herramienta eléctrica y garantía escrita sobre la reparación',
    quantityOrScope: 'Diagnóstico + reparación de punto hidráulico',
    status: 'open',
    selectedProposalId: null,
    proposals: [
      {
        id: 'prop-001',
        requestId: 'req-service-001',
        sellerUserId: 'b1000000-0000-0000-0000-000000000001',
        sellerId: 'c1000000-0000-0000-0000-000000000001',
        sellerBusinessName: 'Plomería & Redes Hidráulicas Pro',
        sellerCity: 'Bogotá',
        sellerWhatsapp: '573102223301',
        sellerPhone: '573102223301',
        sellerVerified: true,
        sellerRatingAvg: 4.9,
        sellerRatingCount: 15,
        linkedListingId: 'd1000000-0001-0000-0000-000000000002',
        linkedListingTitle: 'Reparación de Fugas y Filtraciones Ocultas',
        offeredPriceCop: 120000,
        estimatedTime: 'Llegada en 60 minutos a domicilio',
        warrantyOffered: 'Garantía certificada de 90 días por escrito',
        message:
          'Hola Camila, contamos con detector ultrasónico de fugas para no romper tus baldosas. Podemos desplazarnos hoy mismo con todos los repuestos.',
        status: 'pending',
        createdAt: '2026-11-08T14:20:00.000Z',
      },
    ],
    contract: {
      contractCode: '#CTO-101204',
      saleReferenceCode: '#VTA-701204',
      proposalId: 'prop-001',
      buyerUserId: 'a1000000-0000-0000-0000-000000000001',
      buyerName: 'Camila Torres',
      sellerUserId: 'b1000000-0000-0000-0000-000000000001',
      sellerId: 'c1000000-0000-0000-0000-000000000001',
      sellerBusinessName: 'Plomería & Redes Hidráulicas Pro',
      sellerWhatsapp: '573102223301',
      agreedPriceCop: 120000,
      agreedScope: 'Detección ultrasónica con geófono + reparación de punto hidráulico en baño principal sin romper enchape extra',
      agreedTimeline: 'Llegada en 60 minutos y ejecución el mismo día',
      agreedWarranty: 'Garantía certificada de 90 días por escrito sobre la reparación',
      paymentTerms: 'Pago al finalizar la reparación y verificar ausencia de humedad/fuga',
      buyerAcceptedConditions: false,
      buyerAcceptedAt: null,
      sellerAcceptedConditions: true,
      sellerAcceptedAt: '2026-11-08T14:20:00.000Z',
      contractStatus: 'pending_mutual_acceptance',
      progressPercent: 15,
      trackingLogs: [
        {
          id: 'log-101',
          actorRole: 'seller',
          actorName: 'Plomería & Redes Hidráulicas Pro (Vendedor)',
          milestoneType: 'seller_accepted_conditions',
          title: 'El Vendedor registró propuesta y aceptó las condiciones del contrato',
          detail: 'Tarifa propuesta: $120.000 COP con llegada en 60 minutos y garantía escrita de 90 días. Pendiente aceptación del Comprador.',
          createdAt: '2026-11-08T14:20:00.000Z',
        },
      ],
      createdAt: '2026-11-08T14:20:00.000Z',
      updatedAt: '2026-11-08T14:20:00.000Z',
    },
    review: null,
    viewsCount: 38,
    createdAt: '2026-11-08T12:10:00.000Z',
  },
  {
    id: 'req-service-002',
    referenceCode: '#SOL-902518',
    buyerUserId: 'a1000000-0000-0000-0000-000000000002',
    buyerName: 'Andrés Gómez',
    buyerCity: 'Medellín',
    buyerPhone: '573001112202',
    buyerWhatsapp: '573001112202',
    requestType: 'service',
    categoryName: 'Servicios del hogar',
    categorySlug: 'servicios-hogar',
    title: 'Mantenimiento preventivo y recarga de gas para 2 Aires Acondicionados Inverter',
    description:
      'Necesito técnico en refrigeración para limpieza profunda de serpentines, revisión de tarjeta electrónica y medición de presión de gas en dos equipos Mini Split de 12.000 BTU en El Poblado.',
    urgency: '24_48h',
    urgencyLabel: '⏱️ En 24 a 48 horas',
    modality: 'home',
    modalityLabel: '🏠 A Domicilio',
    preferredSchedule: 'Entre semana de 9:00 AM a 5:00 PM',
    budgetMinCop: 140000,
    budgetMaxCop: 220000,
    budgetUnit: 'por los 2 equipos',
    requiredExperienceOrSpec: 'Técnico certificado en sistemas Inverter con bomba de vacío y manómetros',
    quantityOrScope: '2 aires acondicionados Mini Split 12.000 BTU',
    status: 'open',
    selectedProposalId: null,
    proposals: [
      {
        id: 'prop-002',
        requestId: 'req-service-002',
        sellerUserId: 'b1000000-0000-0000-0000-000000000002',
        sellerId: 'c1000000-0000-0000-0000-000000000002',
        sellerBusinessName: 'ElectroHogar: Reparación & Mantenimiento',
        sellerCity: 'Medellín',
        sellerWhatsapp: '573102223302',
        sellerPhone: '573102223302',
        sellerVerified: true,
        sellerRatingAvg: 4.85,
        sellerRatingCount: 18,
        linkedListingId: 'd1000000-0002-0000-0000-000000000001',
        linkedListingTitle: 'Mantenimiento y Reparación de Aires Acondicionados',
        offeredPriceCop: 170000,
        estimatedTime: 'Programación en 24 horas (2 horas de trabajo)',
        warrantyOffered: '60 días de garantía total en funcionamiento',
        message:
          'Hola Andrés, realizamos hidrolavado con funda recolectora sin ensuciar paredes y verificación de presión R410A. Precio incluye ambos equipos.',
        status: 'pending',
        createdAt: '2026-11-08T15:05:00.000Z',
      },
    ],
    contract: {
      contractCode: '#CTO-202518',
      saleReferenceCode: '#VTA-702518',
      proposalId: 'prop-002',
      buyerUserId: 'a1000000-0000-0000-0000-000000000002',
      buyerName: 'Andrés Gómez',
      sellerUserId: 'b1000000-0000-0000-0000-000000000002',
      sellerId: 'c1000000-0000-0000-0000-000000000002',
      sellerBusinessName: 'ElectroHogar: Reparación & Mantenimiento',
      sellerWhatsapp: '573102223302',
      agreedPriceCop: 170000,
      agreedScope: 'Hidrolavado con funda recolectora + medición y ajuste de carga R410A para 2 Mini Split 12.000 BTU',
      agreedTimeline: 'Programación en 24 horas (2 horas de servicio en sitio)',
      agreedWarranty: '60 días de garantía total en enfriamiento y funcionamiento',
      paymentTerms: 'Pago contra entrega tras prueba de temperatura en ambos equipos',
      buyerAcceptedConditions: true,
      buyerAcceptedAt: '2026-11-08T15:30:00.000Z',
      sellerAcceptedConditions: false,
      sellerAcceptedAt: null,
      contractStatus: 'pending_mutual_acceptance',
      progressPercent: 20,
      trackingLogs: [
        {
          id: 'log-201',
          actorRole: 'buyer',
          actorName: 'Andrés Gómez (Comprador)',
          milestoneType: 'buyer_accepted_conditions',
          title: 'El Comprador pre-aprobó las condiciones por $170.000 COP',
          detail: 'De acuerdo con el valor por los 2 equipos. Pendiente confirmación final de agenda y aceptación de condiciones por parte del Vendedor.',
          createdAt: '2026-11-08T15:30:00.000Z',
        },
      ],
      createdAt: '2026-11-08T15:05:00.000Z',
      updatedAt: '2026-11-08T15:30:00.000Z',
    },
    review: null,
    viewsCount: 29,
    createdAt: '2026-11-08T11:30:00.000Z',
  },
  {
    id: 'req-service-003',
    referenceCode: '#SOL-903774',
    buyerUserId: 'a1000000-0000-0000-0000-000000000005',
    buyerName: 'Mariana Ospina',
    buyerCity: 'Bucaramanga',
    buyerPhone: '573001112205',
    buyerWhatsapp: '573001112205',
    requestType: 'service',
    categoryName: 'Clases y educación',
    categorySlug: 'clases-educacion',
    title: 'Asesoría contable para Declaración de Renta y formalización de Pyme ante DIAN',
    description:
      'Requiero contador público titulado para elaborar declaración de renta persona natural con actividad comercial y estructurar facturación electrónica para mi emprendimiento.',
    urgency: 'scheduled',
    urgencyLabel: '📅 Fecha Programada (Esta semana)',
    modality: 'virtual',
    modalityLabel: '💻 Virtual / Remoto',
    preferredSchedule: 'Reunión por videollamada en horario de tarde (3:00 PM - 6:00 PM)',
    budgetMinCop: 150000,
    budgetMaxCop: 280000,
    budgetUnit: 'asesoría + declaración',
    requiredExperienceOrSpec: 'Contador Público con tarjeta profesional vigente y experiencia en régimen simple',
    quantityOrScope: 'Declaración + habilitación de facturación electrónica',
    status: 'in_attention',
    selectedProposalId: 'prop-003',
    proposals: [
      {
        id: 'prop-003',
        requestId: 'req-service-003',
        sellerUserId: 'b1000000-0000-0000-0000-000000000005',
        sellerId: 'c1000000-0000-0000-0000-000000000005',
        sellerBusinessName: 'Asesorías Contables & Tributarias SAS',
        sellerCity: 'Bucaramanga',
        sellerWhatsapp: '573102223305',
        sellerPhone: '573102223305',
        sellerVerified: true,
        sellerRatingAvg: 4.95,
        sellerRatingCount: 22,
        linkedListingId: 'd1000000-0005-0000-0000-000000000001',
        linkedListingTitle: 'Elaboración de Declaración de Renta DIAN',
        offeredPriceCop: 210000,
        estimatedTime: 'Entrega en 48 horas tras revisión de soportes',
        warrantyOffered: 'Acompañamiento tributario post-presentación por 6 meses',
        message:
          'Hola Mariana, somos especialistas en Pymes y Régimen Simple. Te entregamos planeación tributaria, declaración lista para firma y configuración en DIAN.',
        status: 'accepted',
        createdAt: '2026-11-08T10:00:00.000Z',
      },
    ],
    contract: {
      contractCode: '#CTO-303774',
      saleReferenceCode: '#VTA-883774',
      proposalId: 'prop-003',
      buyerUserId: 'a1000000-0000-0000-0000-000000000005',
      buyerName: 'Mariana Ospina',
      sellerUserId: 'b1000000-0000-0000-0000-000000000005',
      sellerId: 'c1000000-0000-0000-0000-000000000005',
      sellerBusinessName: 'Asesorías Contables & Tributarias SAS',
      sellerWhatsapp: '573102223305',
      agreedPriceCop: 210000,
      agreedScope: 'Declaración de Renta Persona Natural + Habilitación de Facturación Electrónica DIAN',
      agreedTimeline: 'Entrega en 48 horas tras recepción de soportes contables',
      agreedWarranty: 'Acompañamiento tributario post-presentación por 6 meses',
      paymentTerms: '50% al iniciar revisión documental y 50% contra entrega de borrador y resolución DIAN',
      buyerAcceptedConditions: true,
      buyerAcceptedAt: '2026-11-08T10:35:00.000Z',
      sellerAcceptedConditions: true,
      sellerAcceptedAt: '2026-11-08T10:00:00.000Z',
      contractStatus: 'active_in_execution',
      progressPercent: 65,
      trackingLogs: [
        {
          id: 'log-301',
          actorRole: 'seller',
          actorName: 'Asesorías Contables & Tributarias SAS (Vendedor)',
          milestoneType: 'seller_accepted_conditions',
          title: 'Condiciones técnicas y tarifa propuestas y aceptadas por el Vendedor',
          detail: 'Tarifa pactada en $210.000 COP con entrega en 48h y garantía tributaria de 6 meses.',
          createdAt: '2026-11-08T10:00:00.000Z',
        },
        {
          id: 'log-302',
          actorRole: 'buyer',
          actorName: 'Mariana Ospina (Comprador)',
          milestoneType: 'buyer_accepted_conditions',
          title: 'Condiciones aceptadas por el Comprador • Contrato Pactado Activo',
          detail: 'Acepto las condiciones de alcance, tiempo y valor. Se envía certificado de ingresos y extractos.',
          createdAt: '2026-11-08T10:35:00.000Z',
        },
        {
          id: 'log-303',
          actorRole: 'seller',
          actorName: 'Asesorías Contables & Tributarias SAS (Vendedor)',
          milestoneType: 'progress_update',
          title: 'Avance de ejecución del servicio (65%)',
          detail: 'Depuración patrimonial completada y formulario 210 preliquidado. Mañana realizamos habilitación de numeración en portal DIAN.',
          createdAt: '2026-11-08T15:20:00.000Z',
        },
      ],
      createdAt: '2026-11-08T10:00:00.000Z',
      updatedAt: '2026-11-08T15:20:00.000Z',
    },
    review: null,
    viewsCount: 44,
    createdAt: '2026-11-07T19:45:00.000Z',
  },
  {
    id: 'req-service-004',
    referenceCode: '#SOL-904882',
    buyerUserId: 'a1000000-0000-0000-0000-000000000006',
    buyerName: 'Daniel Vargas',
    buyerCity: 'Cartagena',
    buyerPhone: '573001112206',
    buyerWhatsapp: '573001112206',
    requestType: 'service',
    categoryName: 'Otros',
    categorySlug: 'otros',
    title: 'Cubrimiento fotográfico y reel audiovisual para lanzamiento de restaurante local',
    description:
      'Busco fotógrafo o productor audiovisual con iluminación portátil para sesión de 15 platos gastronómicos del menú y 2 reels verticales para redes sociales.',
    urgency: 'scheduled',
    urgencyLabel: '📅 Fecha Programada (Este fin de semana)',
    modality: 'in_person',
    modalityLabel: '📍 Presencial en Local',
    preferredSchedule: 'Sábado de 10:00 AM a 2:00 PM',
    budgetMinCop: 250000,
    budgetMaxCop: 420000,
    budgetUnit: 'sesión completa editada',
    requiredExperienceOrSpec: 'Portafolio en fotografía gastronómica o comercial y entrega en alta resolución',
    quantityOrScope: '15 fotografías retocadas + 2 videos verticales 4K',
    status: 'rated',
    selectedProposalId: 'prop-004',
    proposals: [
      {
        id: 'prop-004',
        requestId: 'req-service-004',
        sellerUserId: 'b1000000-0000-0000-0000-000000000006',
        sellerId: 'c1000000-0000-0000-0000-000000000006',
        sellerBusinessName: 'Fotografía & Audiovisuales Luz Creativa',
        sellerCity: 'Cartagena',
        sellerWhatsapp: '573102223306',
        sellerPhone: '573102223306',
        sellerVerified: true,
        sellerRatingAvg: 4.92,
        sellerRatingCount: 19,
        linkedListingId: 'd1000000-0006-0000-0000-000000000001',
        linkedListingTitle: 'Sesión Fotográfica de Producto y Gastronomía',
        offeredPriceCop: 320000,
        estimatedTime: 'Sesión de 4 horas + entrega editada en 72 horas',
        warrantyOffered: '2 rondas de ajustes de color y edición incluidas',
        message:
          'Hola Daniel, llevamos estudio móvil de iluminación continua y lentes macro para resaltar texturas gastronómicas.',
        status: 'accepted',
        createdAt: '2026-11-06T16:15:00.000Z',
      },
    ],
    contract: {
      contractCode: '#CTO-404882',
      saleReferenceCode: '#VTA-994882',
      proposalId: 'prop-004',
      buyerUserId: 'a1000000-0000-0000-0000-000000000006',
      buyerName: 'Daniel Vargas',
      sellerUserId: 'b1000000-0000-0000-0000-000000000006',
      sellerId: 'c1000000-0000-0000-0000-000000000006',
      sellerBusinessName: 'Fotografía & Audiovisuales Luz Creativa',
      sellerWhatsapp: '573102223306',
      agreedPriceCop: 320000,
      agreedScope: '15 fotografías gastronómicas retocadas en alta resolución + 2 Reels verticales 4K',
      agreedTimeline: 'Sesión presencial de 4 horas + entrega digital en 72 horas',
      agreedWarranty: '2 rondas de retoque de color y edición incluidas',
      paymentTerms: 'Pago contra entrega del material audiovisual final',
      buyerAcceptedConditions: true,
      buyerAcceptedAt: '2026-11-06T17:00:00.000Z',
      sellerAcceptedConditions: true,
      sellerAcceptedAt: '2026-11-06T16:15:00.000Z',
      contractStatus: 'completed_fulfilled',
      progressPercent: 100,
      trackingLogs: [
        {
          id: 'log-401',
          actorRole: 'seller',
          actorName: 'Fotografía & Audiovisuales Luz Creativa (Vendedor)',
          milestoneType: 'seller_accepted_conditions',
          title: 'Condiciones propuestas y aceptadas por el Vendedor',
          detail: 'Estudio móvil confirmado para el sábado a las 10:00 AM por $320.000 COP.',
          createdAt: '2026-11-06T16:15:00.000Z',
        },
        {
          id: 'log-402',
          actorRole: 'buyer',
          actorName: 'Daniel Vargas (Comprador)',
          milestoneType: 'buyer_accepted_conditions',
          title: 'Condiciones aceptadas por el Comprador • Contrato Pactado Formalizado',
          detail: 'Condiciones aprobadas. Tendremos los 15 platos listos para emplatar durante la sesión.',
          createdAt: '2026-11-06T17:00:00.000Z',
        },
        {
          id: 'log-403',
          actorRole: 'seller',
          actorName: 'Fotografía & Audiovisuales Luz Creativa (Vendedor)',
          milestoneType: 'service_delivered',
          title: 'Entrega total del material fotográfico y reels 4K (100%)',
          detail: 'Se entrega carpeta en la nube con las 15 fotos masterizadas y los 2 reels editados.',
          createdAt: '2026-11-08T08:40:00.000Z',
        },
        {
          id: 'log-404',
          actorRole: 'buyer',
          actorName: 'Daniel Vargas (Comprador)',
          milestoneType: 'buyer_conformity',
          title: 'Recibido a conformidad por el Comprador y Calificación 5.0 ★ otorgada',
          detail: 'Material recibido cumpliendo todas las condiciones pactadas en el contrato.',
          createdAt: '2026-11-08T09:30:00.000Z',
        },
      ],
      createdAt: '2026-11-06T16:15:00.000Z',
      updatedAt: '2026-11-08T09:30:00.000Z',
    },
    review: {
      rating: 5,
      comment:
        'Excelente atención al requerimiento. Llegaron puntuales con todo el equipo de luces y las fotos de los platos aumentaron nuestras reservas.',
      recommend: true,
      reviewedAt: '2026-11-08T09:30:00.000Z',
      sellerId: 'c1000000-0000-0000-0000-000000000006',
      sellerBusinessName: 'Fotografía & Audiovisuales Luz Creativa',
    },
    viewsCount: 62,
    createdAt: '2026-11-06T12:00:00.000Z',
  },
  {
    id: 'req-product-005',
    referenceCode: '#SOL-905319',
    buyerUserId: 'a1000000-0000-0000-0000-000000000003',
    buyerName: 'Valentina Morales',
    buyerCity: 'Cali',
    buyerPhone: '573001112203',
    buyerWhatsapp: '573001112203',
    requestType: 'product',
    categoryName: 'Alimentos',
    categorySlug: 'alimentos',
    title: 'Busco proveedor de Café Especial de Origen (5 kg en grano) + Servicio de Molienda',
    description:
      'Para evento empresarial en Cali requerimos 5 kilos de café especial colombiano tostión media, preferiblemente con perfil achocolatado y entrega a domicilio con empaque valvulado.',
    urgency: '24_48h',
    urgencyLabel: '⏱️ En 24 a 48 horas',
    modality: 'home',
    modalityLabel: '🏠 Entrega a Domicilio',
    preferredSchedule: 'Entrega antes del viernes al mediodía',
    budgetMinCop: 220000,
    budgetMaxCop: 310000,
    budgetUnit: 'lote de 5 kg',
    requiredExperienceOrSpec: 'Tostión fresca menor a 15 días, registro sanitario y factura comercial',
    quantityOrScope: '10 bolsas de 500g (3 kg en grano + 2 kg molienda media)',
    status: 'open',
    selectedProposalId: null,
    proposals: [],
    review: null,
    viewsCount: 25,
    createdAt: '2026-11-08T16:10:00.000Z',
  },
  {
    id: 'req-service-006',
    referenceCode: '#SOL-906410',
    buyerUserId: 'a1000000-0000-0000-0000-000000000009',
    buyerName: 'Natalia Rincón',
    buyerCity: 'Santa Marta',
    buyerPhone: '573001112209',
    buyerWhatsapp: '573001112209',
    requestType: 'service',
    categoryName: 'Servicios del hogar',
    categorySlug: 'servicios-hogar',
    title: 'Revisión de frenos y escáner automotriz a domicilio antes de viaje por carretera',
    description:
      'Busco mecánico automotriz con escáner multimarca para revisión preventiva de pastillas de freno, batería y fluidos de camioneta familiar en rodadero.',
    urgency: 'immediate',
    urgencyLabel: '⚡ Urgente / Hoy mismo',
    modality: 'home',
    modalityLabel: '🏠 A Domicilio',
    preferredSchedule: 'Hoy en la tarde o mañana a primera hora (7:30 AM)',
    budgetMinCop: 80000,
    budgetMaxCop: 150000,
    budgetUnit: 'diagnóstico + ajuste',
    requiredExperienceOrSpec: 'Mecánico con escáner OBD2 profesional y herramienta móvil completa',
    quantityOrScope: '1 vehículo SUV automática',
    status: 'open',
    selectedProposalId: null,
    proposals: [
      {
        id: 'prop-006',
        requestId: 'req-service-006',
        sellerUserId: 'b1000000-0000-0000-0000-000000000009',
        sellerId: 'c1000000-0000-0000-0000-000000000009',
        sellerBusinessName: 'Mecánica & Frenos Móvil Express',
        sellerCity: 'Santa Marta',
        sellerWhatsapp: '573102223309',
        sellerPhone: '573102223309',
        sellerVerified: true,
        sellerRatingAvg: 4.88,
        sellerRatingCount: 14,
        linkedListingId: 'd1000000-0009-0000-0000-000000000001',
        linkedListingTitle: 'Diagnóstico con Escáner Automotriz a Domicilio',
        offeredPriceCop: 95000,
        estimatedTime: 'Llegada en 40 minutos con taller móvil',
        warrantyOffered: 'Reporte impreso de escáner + garantía de mano de obra',
        message:
          'Hola Natalia, contamos con unidad móvil en Santa Marta. Revisamos espesor de pastillas, líquido de frenos con probador digital y escaneo completo.',
        status: 'pending',
        createdAt: '2026-11-08T17:15:00.000Z',
      },
    ],
    review: null,
    viewsCount: 31,
    createdAt: '2026-11-08T15:40:00.000Z',
  },
]

export function sanitizeBuyerRequestsList(raw?: any): BuyerClassifiedRequest[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return INITIAL_BUYER_REQUESTS
  }
  return raw.map((item, idx) => ({
    id: String(item?.id || `req-${idx}`),
    referenceCode: String(item?.referenceCode || `#SOL-90${1000 + idx}`),
    buyerUserId: String(item?.buyerUserId || ''),
    buyerName: String(item?.buyerName || 'Comprador Verificado'),
    buyerCity: String(item?.buyerCity || 'Bogotá'),
    buyerPhone: item?.buyerPhone ? String(item.buyerPhone) : null,
    buyerWhatsapp: item?.buyerWhatsapp ? String(item.buyerWhatsapp) : null,
    requestType: item?.requestType === 'product' ? 'product' : 'service',
    categoryName: String(item?.categoryName || 'Servicios Profesionales'),
    categorySlug: String(item?.categorySlug || 'servicios-hogar'),
    title: String(item?.title || 'Solicitud de Servicio'),
    description: String(item?.description || ''),
    urgency:
      item?.urgency === 'immediate' ||
      item?.urgency === '24_48h' ||
      item?.urgency === 'scheduled' ||
      item?.urgency === 'flexible'
        ? item.urgency
        : '24_48h',
    urgencyLabel: String(item?.urgencyLabel || '⏱️ En 24 a 48 horas'),
    modality:
      item?.modality === 'home' ||
      item?.modality === 'in_person' ||
      item?.modality === 'virtual' ||
      item?.modality === 'flexible'
        ? item.modality
        : 'home',
    modalityLabel: String(item?.modalityLabel || '🏠 A Domicilio'),
    preferredSchedule: String(item?.preferredSchedule || 'Horario a convenir'),
    budgetMinCop: item?.budgetMinCop ? Number(item.budgetMinCop) : null,
    budgetMaxCop: item?.budgetMaxCop !== null && item?.budgetMaxCop !== undefined ? Number(item.budgetMaxCop) : null,
    budgetUnit: String(item?.budgetUnit || 'servicio completo'),
    requiredExperienceOrSpec: String(
      item?.requiredExperienceOrSpec || 'Experiencia comprobable y atención garantizada'
    ),
    quantityOrScope: String(item?.quantityOrScope || '1 servicio'),
    status:
      item?.status === 'open' ||
      item?.status === 'in_attention' ||
      item?.status === 'completed' ||
      item?.status === 'rated' ||
      item?.status === 'closed'
        ? item.status
        : 'open',
    selectedProposalId: item?.selectedProposalId ? String(item.selectedProposalId) : null,
    proposals: Array.isArray(item?.proposals) ? item.proposals : [],
    contract: item?.contract || null,
    review: item?.review || null,
    viewsCount: Number(item?.viewsCount || 12),
    createdAt: String(item?.createdAt || new Date().toISOString()),
  }))
}

export function decodeBuyerRequestsFromSlots(slots?: any[] | null): BuyerClassifiedRequest[] {
  if (!slots || !Array.isArray(slots)) {
    return INITIAL_BUYER_REQUESTS
  }
  const slot = slots.find((s) => s.id === BUYER_REQUESTS_SLOT_ID)
  if (slot && Array.isArray(slot.formats) && slot.formats[0]) {
    try {
      const parsed = JSON.parse(slot.formats[0])
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sanitizeBuyerRequestsList(parsed)
      }
    } catch {
      // Fallback a semillas iniciales
    }
  }
  return INITIAL_BUYER_REQUESTS
}

export function encodeBuyerRequestsToSlot(requests: BuyerClassifiedRequest[]) {
  return {
    id: BUYER_REQUESTS_SLOT_ID,
    surface: 'buyer_requests_board',
    formats: [JSON.stringify(requests)],
    max_ads: requests.length,
  }
}

export function buildBuyerRequestWhatsappUrl(
  phone: string | null | undefined,
  recipientName: string,
  request: BuyerClassifiedRequest,
  mode: 'seller_offering_help' | 'buyer_contacting_seller',
  sellerBusinessName?: string
): string | null {
  if (!phone) return null
  const cleanPhone = phone.replace(/\D/g, '')
  if (!cleanPhone) return null
  const finalPhone = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone

  const budgetStr = request.budgetMaxCop
    ? `$${request.budgetMaxCop.toLocaleString('es-CO')} COP (${request.budgetUnit})`
    : 'A cotizar'

  const message =
    mode === 'seller_offering_help'
      ? [
          `Hola ${recipientName}, vi tu solicitud publicada en *Indie Clasificados*:`,
          `📌 *Referencia:* ${request.referenceCode}`,
          `🛠️ *Necesidad:* ${request.title}`,
          `📍 *Ciudad / Modalidad:* ${request.buyerCity} (${request.modalityLabel})`,
          `💰 *Presupuesto referencial:* ${budgetStr}`,
          sellerBusinessName
            ? `Te escribo de *${sellerBusinessName}* porque cuento con la disponibilidad para atender tu requerimiento.`
            : `Cuento con el servicio/producto disponible para atender tu solicitud. ¿Coordinamos los detalles?`,
        ].join('\n')
      : [
          `Hola *${recipientName}*, te contacto desde *Indie Clasificados* por tu propuesta para atender mi solicitud:`,
          `📌 *Referencia:* ${request.referenceCode} — ${request.title}`,
          `📍 *Ciudad:* ${request.buyerCity}`,
          `Quedo atento(a) para coordinar la prestación del servicio y calificación en la plataforma.`,
        ].join('\n')

  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`
}
