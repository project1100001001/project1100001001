import os
import json

# Categorías existentes en la base de datos Supabase
CAT_ALIMENTOS = 'dfa36695-6f3d-498e-af49-011029e2e1bc'
CAT_SERVICIOS_HOGAR = 'a9234c76-daa7-4b49-9450-3afb5f7645a9'
CAT_BELLEZA = 'df1fb8ab-82aa-460d-94fa-0e76a548f3a5'
CAT_ROPA = '0690f53d-60f3-4294-8f59-54eafb29ca69'
CAT_CLASES = '94696852-336b-4498-9b41-6088f637029a'
CAT_OTROS = '6669f0ad-812e-4a14-84f6-01a89d3f8e76'

buyers = [
    ('comprador1@marketplace.com', 'Camila Torres', 'Bogotá', '3001112201'),
    ('comprador2@marketplace.com', 'Andrés Gómez', 'Medellín', '3001112202'),
    ('comprador3@marketplace.com', 'Valentina Morales', 'Cali', '3001112203'),
    ('comprador4@marketplace.com', 'Santiago Restrepo', 'Barranquilla', '3001112204'),
    ('comprador5@marketplace.com', 'Mariana Ospina', 'Bucaramanga', '3001112205'),
    ('comprador6@marketplace.com', 'Daniel Vargas', 'Cartagena', '3001112206'),
    ('comprador7@marketplace.com', 'Laura Castro', 'Pereira', '3001112207'),
    ('comprador8@marketplace.com', 'Felipe Herrera', 'Manizales', '3001112208'),
    ('comprador9@marketplace.com', 'Natalia Rincón', 'Santa Marta', '3001112209'),
    ('comprador10@marketplace.com', 'Esteban Jaramillo', 'Cúcuta', '3001112210'),
]

service_sellers = [
    ('servicio1@marketplace.com', 'Carlos Plomero', 'Plomería & Redes Hidráulicas Pro', 'Servicios del Hogar', 'Bogotá', '3102223301', CAT_SERVICIOS_HOGAR, [
        ('Destape de Cañerías con Sonda Eléctrica', 85000, 'servicio', 'Limpieza y destape rápido sin romper baldosas ni tuberías.'),
        ('Reparación de Fugas y Filtraciones Ocultas', 120000, 'servicio', 'Detección de humedades y arreglo de tuberías de agua potable.'),
        ('Instalación y Mantenimiento de Calentadores', 95000, 'servicio', 'Revisión técnica de calentadores a gas y eléctricos.'),
        ('Instalación de Griferías y Sanitarios Modernos', 75000, 'servicio', 'Montaje profesional de griferías, lavamanos y duchas.'),
        ('Mantenimiento y Lavado de Tanques de Agua', 140000, 'servicio', 'Desinfección profunda certificada para casas y edificios.'),
        ('Aumento de Presión de Agua e Hidroflores', 160000, 'servicio', 'Instalación y calibración de bombas hidroneumáticas residenciales.'),
        ('Impermeabilización de Terrazas y Techos', 220000, 'servicio', 'Protección contra goteras con manto asfáltico y emulsión acrílica.'),
        ('Cambio de Válvulas y Llaves de Paso Principales', 60000, 'servicio', 'Sustitución de válvulas desgastadas con garantía de 6 meses.'),
        ('Mantenimiento de Trampas de Grasa en Cocinas', 110000, 'servicio', 'Extracción y limpieza especializada para restaurantes y hogares.'),
        ('Inspección de Redes Hidráulicas con Geófono', 180000, 'servicio', 'Diagnóstico no invasivo de fugas subterráneas de alta precisión.')
    ]),
    ('servicio2@marketplace.com', 'Mauricio Técnico', 'ElectroHogar: Reparación & Mantenimiento', 'Servicios del Hogar', 'Medellín', '3102223302', CAT_SERVICIOS_HOGAR, [
        ('Mantenimiento Preventivo de Lavadoras y Secadoras', 70000, 'visita', 'Limpieza de tinas, filtros y engrase de transmisión.'),
        ('Reparación de Neveras y Nevecones No-Frost', 90000, 'revisión', 'Carga de gas refrigerante, cambio de termostato y sensores.'),
        ('Mantenimiento de Aires Acondicionados Split', 85000, 'unidad', 'Lavado químico a presión, desinfección y revisión de amperaje.'),
        ('Reparación de Hornos Microondas y Eléctricos', 55000, 'servicio', 'Sustitución de magnetrón, fusibles y tarjeta electrónica.'),
        ('Instalación de Campanas Extractoras de Cocina', 65000, 'instalación', 'Montaje en pared o isla con conexión eléctrica segura.'),
        ('Reparación de Estufas a Gas y Cubiertas de Cristal', 60000, 'servicio', 'Calibración de espreas, limpieza de quemadores y válvulas.'),
        ('Mantenimiento de Freidoras de Aire y Hornos AirFryer', 45000, 'servicio', 'Diagnóstico de resistencias térmicas y ventiladores.'),
        ('Reparación de Televisores LED y Smart TV', 80000, 'diagnóstico', 'Cambio de tiras LED de iluminación de fondo y fuentes de poder.'),
        ('Mantenimiento de Aspiradoras Robot e Industriales', 50000, 'servicio', 'Sustitución de baterías, motores de succión y cepillos.'),
        ('Instalación de Soportes para TV y Centro de Entretenimiento', 40000, 'montaje', 'Fijación segura con anclajes para todo tipo de pared.')
    ]),
    ('servicio3@marketplace.com', 'Prof. David Morales', 'Tutorías & Clases Académicas Éxito', 'Educación', 'Cali', '3102223303', CAT_CLASES, [
        ('Clases Personalizadas de Matemáticas y Cálculo', 45000, 'hora', 'Refuerzo escolar y universitario: álgebra, trigonometría y cálculo.'),
        ('Curso de Inglés Conversacional Intensivo', 50000, 'hora', 'Metodología práctica para ganar fluidez y confianza al hablar.'),
        ('Tutorías de Física Mecánica y Electromagnetismo', 45000, 'hora', 'Resolución de talleres, preparación de exámenes y laboratorios.'),
        ('Preparación Integral para Pruebas Saber 11 / ICFES', 280000, 'módulo', 'Simulacros y estrategias en lectura crítica, ciencias y matemáticas.'),
        ('Clases de Programación Python y Desarrollo Web', 60000, 'hora', 'Aprende a programar desde cero con proyectos prácticos.'),
        ('Taller de Lectura Crítica y Redacción de Ensayos', 40000, 'hora', 'Desarrollo de habilidades de argumentación y normas APA.'),
        ('Clases de Francés Básico y Preparación DELF', 50000, 'hora', 'Gramática, pronunciación y comprensión auditiva A1-B2.'),
        ('Asesoría en Química General y Orgánica', 45000, 'hora', 'Balanceo de ecuaciones, estechiometría y grupos funcionales.'),
        ('Clases de Guitarra Acústica y Eléctrica', 40000, 'hora', 'Técnica, acordes, ritmo y canciones favoritas paso a paso.'),
        ('Taller de Oratoria y Expresión Corporal', 55000, 'hora', 'Pierde el miedo escénico y habla en público con seguridad.')
    ]),
    ('servicio4@marketplace.com', 'Julián Barbero', 'Barbería & Estilo Urbano VIP', 'Belleza', 'Barranquilla', '3102223304', CAT_BELLEZA, [
        ('Corte Clásico o Degradado Fade con Lavado', 30000, 'corte', 'Corte moderno con máquina y tijera, incluye lavado refrescante.'),
        ('Perfilado y Arreglo de Barba con Toalla Caliente', 25000, 'servicio', 'Vaporizador, toalla caliente y aceites hidratantes esenciales.'),
        ('Combo VIP: Corte + Barba + Mascarilla Negra', 50000, 'combo', 'El servicio completo para renovar tu imagen y limpiar tu piel.'),
        ('Pigmentación Semipermanente de Barba y Cejas', 35000, 'sesión', 'Definición de contornos con tinte orgánico de larga duración.'),
        ('Tratamiento de Exfoliación Facial Profunda', 40000, 'sesión', 'Eliminación de puntos negros e impurezas con microdermoabrasión.'),
        ('Alisado y Keratina para Cabello Masculino', 80000, 'tratamiento', 'Control de frizz y volumen con brillo natural duradero.'),
        ('Diseño de Figuras y Líneas Tribales en Cabello', 20000, 'diseño', 'Arte libre y freestyle en corte degradado.'),
        ('Tinte y Decoloración Platinada Polar', 90000, 'proceso', 'Platinados perfectos con protección capilar Olaplex.'),
        ('Masaje Capilar Antiestrés con Tónicos de Romero', 25000, 'sesión', 'Estimula el crecimiento y alivia la tensión del cuero cabelludo.'),
        ('Depilación Facial con Cera Elástica en Nariz y Orejas', 15000, 'servicio', 'Rápida, higiénica y prácticamente indolora.')
    ]),
    ('servicio5@marketplace.com', 'Dra. Beatriz Contadora', 'Asesorías Contables & Tributarias SAS', 'Servicios Empresariales', 'Bucaramanga', '3102223305', CAT_OTROS, [
        ('Elaboración de Declaración de Renta Persona Natural', 150000, 'declaración', 'Optimización legal de deducciones y cumplimiento ante la DIAN.'),
        ('Gestión y Liquidación de Nómina Electrónica', 80000, 'mes', 'Cálculo de seguridad social, prestaciones y parafiscales.'),
        ('Implementación de Facturación Electrónica DIAN', 120000, 'paquete', 'Habilitación de software y parametrización de certificados.'),
        ('Asesoría en Creación y Formalización de Empresas SAS', 250000, 'trámite', 'Estatutos, registro mercantil en Cámara de Comercio y RUT.'),
        ('Revisión y Auditoría de Estados Financieros', 350000, 'informe', 'Diagnóstico contable con balance general y estado de resultados.'),
        ('Planeación Tributaria Estratégica para Pymes', 200000, 'sesión', 'Reducción legal de carga impositiva y prevención de sanciones.'),
        ('Liquidación de Impuestos IVA y Retención en la Fuente', 110000, 'periodo', 'Cálculo y presentación puntual de formularios bimestrales.'),
        ('Inscripción y Actualización de RUT en Línea', 40000, 'trámite', 'Actualización de actividades económicas y responsabilidades.'),
        ('Asesoría Financiera para Solicitud de Créditos', 130000, 'análisis', 'Flujo de caja proyectado y cartas de contador certificadas.'),
        ('Capacitación en Manejo de Software Contable Siigo/Alegra', 90000, 'hora', 'Aprende a registrar compras, ventas e inventarios.')
    ]),
    ('servicio6@marketplace.com', 'Santiago Fotógrafo', 'Fotografía & Audiovisuales Luz Creativa', 'Otros', 'Cartagena', '3102223306', CAT_OTROS, [
        ('Sesión Fotográfica Profesional de Productos (E-commerce)', 150000, 'sesión', '15 fotos editadas sobre fondo blanco o ambientado.'),
        ('Cobertura Fotográfica de Eventos y Celebraciones', 220000, 'evento', 'Fotografía digital de alta resolución con entrega express.'),
        ('Retratos Profesionales para LinkedIn y Marca Personal', 90000, 'sesión', '5 fotos retocadas en estudio o locación exterior.'),
        ('Grabación de Video Corporativo en Formato 4K', 350000, 'video', 'Video promocional de 60 segundos con música y locución.'),
        ('Fotografía Aérea con Dron Profesional', 200000, 'vuelo', 'Panorámicas y tomas en alta definición para bienes raíces y turismo.'),
        ('Sesión de Fotos para Parejas y Bodas en la Playa', 280000, 'sesión', 'Recuerdos inolvidables con iluminación cálida de atardecer.'),
        ('Producción de Reels y TikToks para Redes Sociales', 180000, 'pack', 'Pack de 3 videos dinámicos con edición, subtítulos y tendencias.'),
        ('Restauración Digital de Fotografías Antiguas', 45000, 'foto', 'Corrección de roturas, manchas y colorización de recuerdos familiares.'),
        ('Fotografía Gastronómica para Menús y Apps de Domicilios', 160000, 'sesión', 'Iluminación apetitosa para platos principales y bebidas.'),
        ('Transmisión en Vivo Multicámara para Conferencias', 450000, 'transmisión', 'Streaming estable a YouTube y Facebook con audio profesional.')
    ]),
    ('servicio7@marketplace.com', 'Gloria Limpieza', 'Limpieza & Desinfección Empresarial Clean', 'Servicios del Hogar', 'Pereira', '3102223307', CAT_SERVICIOS_HOGAR, [
        ('Limpieza Profunda de Hogar por Días (8 Horas)', 85000, 'día', 'Aseo exhaustivo de cocina, baños, pisos, ventanas y habitaciones.'),
        ('Lavado y Desinfección de Muebles y Sofás a Vapor', 90000, 'sala', 'Extracción profunda de ácaros, manchas de café y malos olores.'),
        ('Lavado de Colchones con Máquina de Inyección-Succión', 75000, 'colchón', 'Desinfección con productos biodegradables no tóxicos.'),
        ('Limpieza y Desmanchado de Tapicería de Vehículos', 95000, 'auto', 'Lavado de silletería, techo, alfombras y baúl.'),
        ('Aseo Post-Construcción y Fin de Obra', 180000, 'inmueble', 'Eliminación de restos de pintura, cemento y polvillo fino.'),
        ('Lavado y Cristalizado de Pisos de Mármol y Granito', 150000, 'área', 'Devuelve el brillo de espejo natural a tus pisos.'),
        ('Desinfección y Fumigación contra Plagas e Insectos', 110000, 'fumigación', 'Control seguro de cucarachas, hormigas y roedores.'),
        ('Limpieza de Fachadas y Vidrios en Alturas', 250000, 'jornada', 'Personal certificado en trabajo seguro en alturas con arnés.'),
        ('Mantenimiento y Desinfección de Alfombras Fijas', 80000, 'habitación', 'Shampoo especializado y secado rápido anti-humedad.'),
        ('Organización Profesional de Clósets y Alacenas (Home Organizer)', 95000, 'espacio', 'Optimización de espacios y categorización funcional.')
    ]),
    ('servicio8@marketplace.com', 'Dra. Paula Veterinaria', 'Veterinaria & Guardería Canina Huellitas', 'Otros', 'Manizales', '3102223308', CAT_OTROS, [
        ('Consulta Veterinaria Médica a Domicilio', 50000, 'consulta', 'Examen físico general, pesaje y fórmula médica en casa.'),
        ('Baño Canino con Hidratación y Corte de Uñas', 35000, 'baño', 'Shampoo medicado o antipulgas con secado con turbina.'),
        ('Plan de Vacunación Canina Completa (Séxtuple + Rabia)', 70000, 'dosis', 'Biológicos de primera calidad con carnet oficial.'),
        ('Desparasitación Interna y Externa con Pipeta', 28000, 'tratamiento', 'Control preventivo de pulgas, garrapatas y parásitos intestinales.'),
        ('Paseo y Ejercicio Canino Personalizado (1 Hora)', 20000, 'paseo', 'Rutas seguras de socialización y juego para liberar energía.'),
        ('Hospedaje y Guardería Campestre por Noche', 45000, 'noche', 'Espacios amplios sin jaulas, supervisión 24 horas y fotos diarias.'),
        ('Profilaxis Dental Canina con Ultrasonido', 120000, 'procedimiento', 'Eliminación de sarro bacteriano y prevención de gingivitis.'),
        ('Corte de Pelo de Raza y Peinado Especializado', 45000, 'grooming', 'Acabado estético profesional según la raza de tu mascota.'),
        ('Adiestramiento Básico en Obediencia y Convivencia', 60000, 'sesión', 'Órdenes básicas: sentado, quieto, llamado y paseo sin jalar.'),
        ('Prueba Rápida de Diagnóstico de Sangre en Mascotas', 65000, 'examen', 'Resultados inmediatos en hemograma y función hepática.')
    ]),
    ('servicio9@marketplace.com', 'Óscar Mecánico', 'Mecánica & Frenos Móvil Express', 'Servicios del Hogar', 'Santa Marta', '3102223309', CAT_SERVICIOS_HOGAR, [
        ('Cambio de Pastillas de Freno Delanteras y Traseras', 65000, 'eje', 'Mano de obra experta con purga de líquido de frenos DOT4.'),
        ('Auxilio Vial y Desvare de Batería con Cables', 35000, 'servicio', 'Arranque rápido a domicilio o venta de batería nueva a cambio.'),
        ('Alineación Computarizada y Balanceo de Llantas', 55000, 'vehículo', 'Corrección de convergencia y eliminación de vibraciones al volante.'),
        ('Sincronización de Motor y Limpieza de Inyectores', 110000, 'servicio', 'Limpieza por ultrasonido y cambio de bujías para ahorrar gasolina.'),
        ('Cambio de Kit de Embrague / Clutch', 190000, 'reemplazo', 'Prensa, disco y balinera con calibración suave del pedal.'),
        ('Mantenimiento y Reparación de Suspensión (Amortiguadores)', 130000, 'par', 'Inspección de terminales, bujes, tijeras y rótulas.'),
        ('Revisión Precompra / Peritaje Mecánico para Autos Usados', 120000, 'peritaje', 'Evaluación de compresión de motor, chasis y pintura antes de comprar.'),
        ('Cambio de Correa de Repartición / Distribución', 140000, 'instalación', 'Previene daños graves de válvulas en tu motor.'),
        ('Reparación y Mantenimiento de Alternadores y Motores de Arranque', 85000, 'servicio', 'Sustitución de carbones, regulador de voltaje y rodamientos.'),
        ('Lavado de Motor en Seco con Desengrasante Dieléctrico', 40000, 'lavado', 'Limpieza profunda segura sin dañar sensores ni bobinas.')
    ]),
    ('servicio10@marketplace.com', 'Hernando Constructor', 'Instalaciones & Reformas Locales', 'Servicios del Hogar', 'Cúcuta', '3102223310', CAT_SERVICIOS_HOGAR, [
        ('Instalación de Paneles de Yeso Drywall y Cielos Rasos', 35000, 'm2', 'Acabado liso, resistente y moderno con estructura metálica.'),
        ('Pintura Interior y Exterior para Casas y Locales', 12000, 'm2', 'Aplicación de dos manos de pintura vinilo lavable tipo 1.'),
        ('Instalación de Enchape de Cerámica y Porcelanato', 28000, 'm2', 'Nivelación perfecta con crucetas y pegacor de alta adherencia.'),
        ('Armado y Montaje de Muebles Modulares RTA', 50000, 'mueble', 'Armado experto de clósets, escritorios y centros de TV.'),
        ('Instalación de Redes Eléctricas y Tableros de Breakers', 90000, 'punto', 'Cableado certificado con polo a tierra según norma RETIE.'),
        ('Montaje de Puertas de Madera y Cerraduras de Seguridad', 60000, 'unidad', 'Instalación precisa con bisagras reforzadas y pomo.'),
        ('Reparación de Tejas Rotas y Sellado de Goteras', 75000, 'tramo', 'Cambio de tejas de barro o zinc con cinta tapagoteras impermeable.'),
        ('Soldadura y Reparación de Rejas y Portones Metálicos', 85000, 'trabajo', 'Refuerzo de bisagras, cerrojos y pintura anticorrosiva.'),
        ('Instalación de Cortinas Enrollables y Persianas', 30000, 'unidad', 'Fijación con chazos de expansión en muros de ladrillo o drywall.'),
        ('Construcción de Mesones en Granito Natural y Mármol', 320000, 'metro', 'Diseño a medida para cocinas integrales y baños modernos.')
    ])
]

used_sellers = [
    ('usados1@marketplace.com', 'Don Mario Usados', 'Compraventa & Usados La 50', 'Artículos y Usados', 'Bogotá', '3113334401', CAT_OTROS, [
        ('Televisor Samsung 43 Pulgadas Full HD Usado', 420000, 'unidad', 'En perfecto estado estético y funcional, incluye control remoto original.'),
        ('Consola PlayStation 4 Slim 1TB con 2 Controles Usada', 850000, 'combo', 'Excelente estado térmico, incluye 3 juegos físicos originales.'),
        ('Bicicleta de Montaña Rin 29 Marco en Aluminio Usada', 480000, 'unidad', 'Cambios Shimano de 21 velocidades y frenos de disco mecánicos.'),
        ('Nevera Haceb 240 Litros No Frost de Segunda Mano', 520000, 'unidad', 'Enfriando perfectamente, bandejas de vidrio templado completas.'),
        ('Taladro Percutor DeWalt 1/2 Pulgada 650W Usado', 180000, 'unidad', 'Herramienta industrial original en caja de transporte plástica.'),
        ('Guitarra Acústica Yamaha F310 Segunda Mano', 320000, 'unidad', 'Sonido cálido y equilibrado, cuerdas nuevas DAddario recién puestas.'),
        ('Juego de Comedor 4 Puestos en Madera Maciza Usado', 380000, 'juego', 'Mesa cuadrada con 4 sillas tapizadas en tela antifluido.'),
        ('Lavadora Whirlpool 16 Kg Carga Superior Usada', 620000, 'unidad', 'Tina de acero inoxidable con agitador de doble acción probado.'),
        ('Laptop HP Core i5 8GB RAM Disco SSD 256GB Reacondicionado', 790000, 'unidad', 'Batería con 3 horas de autonomía, cargador original incluido.'),
        ('Horno Tostador y Freidor Oster Compacto Usado', 130000, 'unidad', 'Ideal para hornear, calentar y dorar porciones medianas.')
    ]),
    ('usados2@marketplace.com', 'Juliana Vintage', 'Vintage & Moda Circular El Rastrillo', 'Ropa y Accesorios', 'Medellín', '3113334402', CAT_ROPA, [
        ('Chaqueta de Cuero Genuino Estilo Biker Vintage', 160000, 'unidad', 'Cuero auténtico con pátina natural clásica de los años 90.'),
        ('Saco de Lana Tejido a Mano Oversize Vintage', 55000, 'unidad', 'Diseño único en tonos tierra, cálido y suave al tacto.'),
        ('Jeans Levis 501 Originales Talla 32 Segunda Mano', 85000, 'unidad', 'Corte recto clásico americano en denim pesado de alta resistencia.'),
        ('Vestido Bohemio Floral de Algodón Años 80 Usado', 60000, 'unidad', 'Estampado floral retro con botones frontales de nácar.'),
        ('Bolso de Hombro en Cuero Marrón Retro Usado', 75000, 'unidad', 'Compartimento amplio con herrajes dorados en perfecto estado.'),
        ('Camisa Hawaiana Estampada Rayón Vintage', 45000, 'unidad', 'Tela fresca y transpirable, corte holgado ideal para clima cálido.'),
        ('Gafas de Sol Estilo Aviador Retro con Estuche', 40000, 'unidad', 'Marco metálico dorado con filtro UV400 verificado.'),
        ('Falda Midi Plisada Clásica Segunda Mano', 48000, 'unidad', 'Pretina elástica cómoda en tejido suave de caída elegante.'),
        ('Botines de Cuero Genuino para Mujer Talla 37 Usados', 90000, 'par', 'Tacón bajo cómodo con suela de caucho antideslizante.'),
        ('Bufanda de Cachemira y Lana Escocesa Vintage', 35000, 'unidad', 'Patrón clásico tartán en excelente conservación sin motas.')
    ]),
    ('usados3@marketplace.com', 'Ernesto Libros', 'Librería de Segunda & Joyas Literarias', 'Otros', 'Cali', '3113334403', CAT_OTROS, [
        ('Cien Años de Soledad - Gabriel García Márquez (Edición Rara)', 45000, 'libro', 'Tapa dura en excelente conservación, sin rayas ni humedad.'),
        ('Colección Trilogía El Señor de los Anillos Usada', 95000, 'pack', 'Los tres tomos completos en estuche contenedor de colección.'),
        ('El Principito - Antoine de Saint-Exupéry Ilustrado Usado', 25000, 'libro', 'Edición clásica con acuarelas originales del autor.'),
        ('Rayuela - Julio Cortázar Edición Conmemorativa Segunda Mano', 35000, 'libro', 'Incluye el tablero de dirección de lectura original intacto.'),
        ('Enciclopedia Británica Ilustrada Tomos Seleccionados', 120000, 'colección', '5 tomos ilustrados con mapas históricos a todo color.'),
        ('Sapiens: De Animales a Dioses - Yuval Noah Harari Usado', 40000, 'libro', 'Bestseller mundial en perfecto estado de páginas limpias.'),
        ('Lote de 5 Novelas de Misterio y Policiales de Segunda', 50000, 'pack', 'Obras de Agatha Christie y Arthur Conan Doyle.'),
        ('Diccionario de la Lengua Española RAE 2 Tomos Usado', 65000, 'juego', 'Edición encuadernada en tela editorial con letras doradas.'),
        ('Hábitos Atómicos - James Clear Segunda Mano', 38000, 'libro', 'Guía práctica para transformar tu vida diaria con hábitos clave.'),
        ('Colección de Revistas National Geographic Años 90 (10 Unidades)', 45000, 'lote', 'Reportajes legendarios con mapas desplegables originales.')
    ]),
    ('usados4@marketplace.com', 'Roberto Autopartes', 'Autopartes & Repuestos Recuperados', 'Servicios del Hogar', 'Barranquilla', '3113334404', CAT_SERVICIOS_HOGAR, [
        ('Alternador Original Bosch para Chevrolet Spark Usado', 140000, 'unidad', 'Bobinado verificado y carbones nuevos con salida de 14.2V.'),
        ('Juego de Farolas Delanteras Originales Renault Logan Usadas', 180000, 'par', 'Policarbonato pulido transparente sin soportes rotos.'),
        ('Cremallera de Dirección Mecánica para Hyundai Accent Usada', 220000, 'unidad', 'Sin fugas en retenes ni juego interno en la barra axial.'),
        ('Motor de Arranque Denso para Toyota Hilux Reacondicionado', 260000, 'unidad', 'Automático y piñón bendix recién probados en banco.'),
        ('Juego de Rines 15 Pulgadas en Aluminio 4 Huecos Usados', 450000, 'juego', 'Sin golpes ni fisuras, balanceo perfecto listo para instalar.'),
        ('Bomba de Gasolina Completa con Flotador para Mazda 3 Usada', 130000, 'unidad', 'Presión de combustible probada a 45 PSI estable.'),
        ('Retrovisores Eléctricos Originales para Kia Rio Usados', 120000, 'par', 'Motores de inclinación y desempañador funcionando al 100%.'),
        ('Compresor de Aire Acondicionado Sanden Reacondicionado', 290000, 'unidad', 'Compresión óptima y embrague magnético comprobado.'),
        ('Computadora de Motor / ECU Original para Aveo 1.6 Usada', 250000, 'unidad', 'Inmovilizador liberado, lista para instalar plug and play.'),
        ('Radiador de Aluminio y Plástico para Nissan Sentra Usado', 110000, 'unidad', 'Limpieza y prueba de presión a 15 PSI sin pérdidas.')
    ]),
    ('usados5@marketplace.com', 'Fabián Músico', 'Guitarras & Instrumentos Segunda Nota', 'Otros', 'Bucaramanga', '3113334405', CAT_OTROS, [
        ('Guitarra Eléctrica Fender Squier Stratocaster Usada', 580000, 'unidad', 'Configuración SSS con mástil recto y trasteo calibrado.'),
        ('Teclado Musical Yamaha PSR-E363 de 61 Teclas Usado', 490000, 'unidad', 'Teclas sensibles al tacto, incluye atril y fuente original.'),
        ('Pedal de Distorsión Boss DS-1 para Guitarra Usado', 160000, 'unidad', 'El sonido clásico del rock en carcasa metálica indestructible.'),
        ('Bajo Eléctrico Ibanez GSR200 4 Cuerdas Activo Usado', 650000, 'unidad', 'Circuito Phat II Bass Boost para graves potentes y definidos.'),
        ('Micrófono de Condensador Audio-Technica AT2020 Usado', 280000, 'unidad', 'Cápsula diafragma de baja masa ideal para voces e instrumentos.'),
        ('Amplificador de Guitarra Fender Champion 20W Usado', 340000, 'unidad', 'Efectos digitales integrados de reverb, chorus y delay.'),
        ('Saxofón Alto Dorado con Estuche Rígido Segunda Mano', 980000, 'unidad', 'Zapatillas herméticas recién niveladas y boquilla completa.'),
        ('Batería Electrónica Alesis Nitro Mesh Kit Usada', 1350000, 'kit', 'Pads de malla silenciosos con módulo de 40 kits de batería.'),
        ('Ukelele Concierto de Caoba Fender Usado', 140000, 'unidad', 'Sonido dulce y brillante, clavijeros sellados que afinan bien.'),
        ('Interfaz de Audio USB Focusrite Scarlett Solo 3ra Gen Usada', 320000, 'unidad', 'Preamplificador de alta ganancia con modo Air funcional.')
    ]),
    ('usados6@marketplace.com', 'Doña Cecilia Muebles', 'Muebles & Reliquias Retro Bogotá', 'Servicios del Hogar', 'Bogotá', '3113334406', CAT_SERVICIOS_HOGAR, [
        ('Aparador / Bufet Años 60 en Cedro Caquetá Usado', 580000, 'unidad', 'Tres cajones amplios y dos puertas con manijas originales de bronce.'),
        ('Mecedoras Clásicas de Madera y Mimbre (Par) Usadas', 260000, 'par', 'Madera maciza inmunizada con tejido de junco tradicional.'),
        ('Escritorio Ejecutivo Vintage en Roble Restaurado', 420000, 'unidad', 'Seis gavetas laterales con cerradura y llave funcional.'),
        ('Espejo Clásico con Marco Tallado en Madera Dorada Usado', 190000, 'unidad', 'Cristal biselado auténtico de 80x60 cm sin manchas de óxido.'),
        ('Biblioteca Modular Rústica en Madera de Pino Usada', 280000, 'unidad', 'Cuatro entrepaños reforzados con capacidad para 150 libros.'),
        ('Mesa de Centro Estilo Mid-Century con Vidrio Ahumado', 160000, 'unidad', 'Patas cónicas de madera con puntas metálicas retro.'),
        ('Baúl Antiguo de Viaje con Herrajes de Hierro Forjado', 240000, 'unidad', 'Excelente como elemento decorativo de sala o pie de cama.'),
        ('Sillas de Comedor Thonet Curvadas (Juego de 4) Usadas', 320000, 'juego', 'Estructura clásica de haya curvada al vapor muy resistente.'),
        ('Cama Doble en Bronce Clásica de Segunda Mano', 550000, 'unidad', 'Cabecero y piecero en tubos macizos de latón dorado.'),
        ('Lámpara de Pie Vintage con Pantalla de Tela Plisada', 110000, 'unidad', 'Base pesada de hierro fundido con interruptor de pedal.')
    ]),
    ('usados7@marketplace.com', 'Kevin Tech', 'TechOutlet: Celulares Reacondicionados', 'Otros', 'Medellín', '3113334407', CAT_OTROS, [
        ('iPhone 11 64GB Negro Reacondicionado Grado A', 950000, 'unidad', 'Batería al 87%, libre para cualquier operador nacional.'),
        ('Samsung Galaxy S20 FE 128GB Usado Como Nuevo', 720000, 'unidad', 'Pantalla Super AMOLED 120Hz sin rayones, cargador rápido.'),
        ('Xiaomi Redmi Note 11 128GB / 6GB RAM Usado', 430000, 'unidad', 'Excelente batería de 5000mAh, incluye funda protectora.'),
        ('iPad 8va Generación 32GB Wi-Fi Usado', 790000, 'unidad', 'Compatible con Apple Pencil, pantalla Retina nítida.'),
        ('Reloj Inteligente Apple Watch Series 5 44mm Usado', 550000, 'unidad', 'Pantalla siempre activa, sensor ECG y correa deportiva original.'),
        ('Audífonos Sony WH-1000XM4 con Cancelación de Ruido Usados', 620000, 'unidad', 'Audio Hi-Res, batería de 30 horas y almohadillas en buen estado.'),
        ('Consola Nintendo Switch V2 con Joy-Cons Usada', 820000, 'consola', 'Incluye dock para TV, cables y estuche de transporte viajero.'),
        ('Kindle Paperwhite 10ma Generación 8GB Usado', 260000, 'unidad', 'Luz cálida ajustable y protección contra agua para lectura.'),
        ('Monitor Gamer LG 24 Pulgadas IPS 75Hz Usado', 340000, 'unidad', 'Resolución Full HD con entradas HDMI y bordes ultradelgados.'),
        ('Parlante Bluetooth JBL Charge 4 Resistente al Agua Usado', 290000, 'unidad', 'Sonido potente con bajos profundos y función powerbank.')
    ]),
    ('usados8@marketplace.com', 'Don Pedro Herramientas', 'Herramientas de Ocasión Don Pedro', 'Servicios del Hogar', 'Cali', '3113334408', CAT_SERVICIOS_HOGAR, [
        ('Pulidora Angular Bosch 4 1/2 Pulgadas 750W Usada', 130000, 'unidad', 'Motor sellado antipolvo con guarda de protección original.'),
        ('Sierra Circular Makita 7 1/4 Pulgadas 1800W Usada', 280000, 'unidad', 'Cortes precisos en madera, incluye disco de 40 dientes.'),
        ('Compresor de Aire Campbell Hausfeld 2 HP 24 Litros Usado', 390000, 'unidad', 'Manómetros de presión calibrados, incluye manguera espiral.'),
        ('Caja de Herramientas Stanley Metálica con 65 Piezas Usada', 190000, 'set', 'Copas, raches, llaves mixtas y alicates de cromo vanadio.'),
        ('Soldador Inverter MMA 200 Amperios Portátil Usado', 320000, 'unidad', 'Tecnología IGBT para electrodo 6013 y 7018 con careta.'),
        ('Escalera Tijera de Aluminio Werner 6 Pasos Usada', 160000, 'unidad', 'Capacidad 150 kg con peldaños estriados antideslizantes.'),
        ('Hidrolavadora Kärcher K2 Compact 1600 PSI Usada', 220000, 'unidad', 'Lanza vario power y boquilla turbo para lavado a presión.'),
        ('Lijadora Orbital de Palma DeWalt 1/4 de Hoja Usada', 110000, 'unidad', 'Sistema de recolección de polvo y abrazaderas rápidas.'),
        ('Nivel Láser Autonivelante de Líneas Cruzadas Usado', 140000, 'unidad', 'Línea verde de alta visibilidad para instalación de cuadros y muros.'),
        ('Prensa de Banco / Tornillo de Banco de 5 Pulgadas Usado', 150000, 'unidad', 'Hierro fundido reforzado con base giratoria de 360 grados.')
    ]),
    ('usados9@marketplace.com', 'Andrés Ciclista', 'Bicicletas Usadas & Taller Ruta', 'Otros', 'Pereira', '3113334409', CAT_OTROS, [
        ('Bicicleta de Ruta GW Flamma Marco en Aluminio Usada', 950000, 'unidad', 'Grupo Shimano Claris 8x2, tenedor en carbono y rines doble pared.'),
        ('Bicicleta MTB Venzo Rin 29 Monoplato 1x11 Usada', 890000, 'unidad', 'Frenos hidráulicos Shimano MT200 y suspensión con bloqueo al hombro.'),
        ('Bicicleta Urbana Clásica Estilo Holandés con Canastilla', 340000, 'unidad', 'Monovelocidad cómoda con guardabarros y timbre vintage.'),
        ('Casco de Ciclismo Giro Savant Talla M Usado', 90000, 'unidad', 'Estructura In-Mold con 25 canales de ventilación aerodinámica.'),
        ('Rodillo de Entrenamiento para Ciclismo de Segunda', 230000, 'unidad', 'Resistencia magnética regulable con soporte para rueda delantera.'),
        ('Juego de Luces Delantera y Trasera LED Recargables Usadas', 35000, 'set', '1000 lúmenes de potencia con batería de larga duración.'),
        ('Ciclocomputador GPS Garmin Edge 130 Plus Usado', 420000, 'unidad', 'Sincronización con Strava, altímetro barométrico y navegación.'),
        ('Zapatillas de Ciclismo MTB con Calas SPD Talla 41 Usadas', 120000, 'par', 'Ajuste milimétrico BOA y suela rígida de transferencia de energía.'),
        ('Bomba de Pie / Inflador de Taller con Manómetro Usada', 45000, 'unidad', 'Válvula dual para Presta y Schrader hasta 160 PSI.'),
        ('Bolsa Alforja Impermeable para Bicicleta de Segunda', 50000, 'unidad', 'Montaje rápido sobre parrilla trasera con detalles reflectivos.')
    ]),
    ('usados10@marketplace.com', 'Don Gonzalo Coleccionista', 'Antigüedades & Numismática El Cofre', 'Otros', 'Cartagena', '3113334410', CAT_OTROS, [
        ('Reloj de Bolsillo Suizo en Plata Siglo XIX Usado', 480000, 'unidad', 'Cuerda manual original en funcionamiento con esfera esmaltada.'),
        ('Colección de Monedas Antiguas Colombianas de Plata (Lote de 10)', 220000, 'lote', 'Piezas de medio peso y un peso de los años 1920 a 1945.'),
        ('Plancha de Carbón Tradicional en Hierro Fundido Antigua', 75000, 'unidad', 'Pieza rústica original con cierre de gallito decorativo.'),
        ('Molino de Café Manual de Madera y Manivela de Bronce', 95000, 'unidad', 'Muelas cónicas de acero ajustables para café fresco.'),
        ('Cámara Fotográfica Analógica Kodak Brownie Años 50', 130000, 'unidad', 'Cuerpo de baquelita original con lente limpio de colección.'),
        ('Radio de Tubos Clásico en Madera Estilo Catedral', 390000, 'unidad', 'Receptor de onda corta y AM restaurado estéticamente.'),
        ('Lámpara de Aceite / Quinqué de Vidrio Soplado Antigua', 85000, 'unidad', 'Mecha de algodón regulable con chimenea de cristal fino.'),
        ('Teléfono Antiguo de Disco Negro en Baquelita Ericsson', 190000, 'unidad', 'Diseño de mesa con timbre interno de campanas metálicas.'),
        ('Juego de Cubiertos en Plata Alemana Sellada (24 Piezas)', 340000, 'juego', 'Cucharas, tenedores y cuchillos con grabado victoriano.'),
        ('Balana de Farmacia o Botica con Pesas de Bronce', 170000, 'unidad', 'Platillos suspendidos en mástil dorado con caja de pesas.')
    ])
]

new_sellers = [
    ('nuevos1@marketplace.com', 'Germán Calzado', 'Calzado & Marroquinería Real', 'Ropa y Accesorios', 'Bogotá', '3124445501', CAT_ROPA, [
        ('Zapatos Oxford Clásicos en Cuero Vacuno Genuino Nuevos', 185000, 'par', 'Diseño formal británico con costura Goodyear welt y suela de cuero.'),
        ('Botas Chelsea de Cuero Nobuk para Hombre Nuevas', 220000, 'par', 'Elásticos laterales de alta densidad y plantilla anatómica acolchada.'),
        ('Mocasines Casuales de Gamuza Italiana para Hombre Nuevos', 160000, 'par', 'Conducción y confort diario con suela tipo driving moccasin.'),
        ('Zapatos de Tacón Stiletto Clásicos en Charol Nuevos', 145000, 'par', 'Elegancia atemporal con tacón de 8 cm y forro suave transpirable.'),
        ('Billetera Tríptico en Cuero Genuino con Bloqueo RFID Nueva', 55000, 'unidad', 'Protección contra clonación de tarjetas y 8 ranuras para crédito.'),
        ('Cinturón Reversible de Cuero Negro y Café Nuevo', 48000, 'unidad', 'Hebilla giratoria de aleación de zinc resistente a rayaduras.'),
        ('Maletín Ejecutivo Porta-Laptop en Cuero Legítimo Nuevo', 290000, 'unidad', 'Compartimento acolchado para computadores de hasta 15.6 pulgadas.'),
        ('Sandalias Playeras de Cuero Hechas a Mano Nuevas', 75000, 'par', 'Suela anatómica de corcho natural con correas ajustables.'),
        ('Sneakers Urbanos Blancos en Cuero Suave Nuevos', 170000, 'par', 'Diseño minimalista premium con cordones 100% de algodón.'),
        ('Bolso Tote Grande en Cuero Graneado para Mujer Nuevo', 210000, 'unidad', 'Espacio generoso con cremallera principal y bolsillo interior.')
    ]),
    ('nuevos2@marketplace.com', 'Chef Carolina', 'Pastelería & Repostería Dulce Aroma', 'Alimentos', 'Medellín', '3124445502', CAT_ALIMENTOS, [
        ('Torta Red Velvet Especial con Crema de Queso Nueva', 65000, 'torta', 'Bizcocho terciopelo rojo húmedo con frosting artesanal para 12 personas.'),
        ('Cheesecake de Frutos Rojos Silvestres Horneado Nuevo', 70000, 'unidad', 'Base crocante de galleta con compota casera de fresas y moras.'),
        ('Caja de Macarons Franceses Surtidos (12 Unidades) Nueva', 45000, 'caja', 'Sabores: pistacho, frutos rojos, chocolate belga, maracuyá y café.'),
        ('Torta de Chocolate Supremo con Ganache al 70% Nueva', 68000, 'torta', 'Rellena de arequipe y cubierta con chocolate amargo premium.'),
        ('Caja de Cupcakes Personalizados con Diseños (6 Unidades) Nueva', 32000, 'caja', 'Vainilla francesa y chocolate con crema de mantequilla decorada.'),
        ('Croissants Artesanales de Mantequilla de Almendras (Pack de 4) Nuevos', 28000, 'pack', 'Hojaldre crujiente francés relleno de frangipane de almendras.'),
        ('Tarta de Manzana Caramelizada con Toque de Canela Nueva', 55000, 'unidad', 'Masa brisa quebradiza con finas láminas de manzana dorada.'),
        ('Brownies Melcochudos de Chocolate y Nueces (Pack de 6) Nuevos', 24000, 'caja', 'Textura densa y húmeda con centro de caramelo y trozos de nuez.'),
        ('Postre Tres Leches Tradicional en Bandeja Familiar Nuevo', 48000, 'bandeja', 'Bizcochuelo bañado en salsa de tres leches y canela molida.'),
        ('Galletas Gourmet Rellenas Estilo New York (Caja de 4) Nuevas', 26000, 'caja', 'Chispas de chocolate, Nutella líquida y masa crujiente dorada.')
    ]),
    ('nuevos3@marketplace.com', 'Valeria Diseñadora', 'Boutique Bella Época Moda Femenina', 'Ropa y Accesorios', 'Cali', '3124445503', CAT_ROPA, [
        ('Blusa en Satín de Seda con Cuello Camisero Nueva', 75000, 'unidad', 'Caída fluida elegante ideal para oficina y eventos de noche.'),
        ('Pantalón Palazzo de Tiro Alto en Lino Colombiano Nuevo', 110000, 'unidad', 'Corte amplio y fresco con bolsillos laterales y pretina ancha.'),
        ('Vestido Maxi Playero Estampado Floral en Chifón Nuevo', 135000, 'unidad', 'Silueta fluida con escote en V y forro interior suave.'),
        ('Blazer Entallado de Estructura Formal para Mujer Nuevo', 165000, 'unidad', 'Solapa clásica con forro completo y bolsillos ojal decorativos.'),
        ('Falda Tubo Midi con Abertura Frontal Sofisticada Nueva', 80000, 'unidad', 'Tejido elástico de alta densidad que moldea la figura.'),
        ('Enterizo Jumpsuit Casual de Rayón con Cinturón Nuevo', 125000, 'unidad', 'Comodidad total en una sola pieza con botones delanteros.'),
        ('Cardigan Largo Tejido en Hilo Fino para Clima Frío Nuevo', 85000, 'unidad', 'Abierto sin botones con bolsillos tipo parche funcionales.'),
        ('Top Corsetero Estructurado con Copas Prehormadas Nuevo', 60000, 'unidad', 'Cierre trasero de cremallera metálica y varillas flexibles.'),
        ('Short de Algodón y Lino con Pretina Paperbag Nuevo', 58000, 'unidad', 'Incluye lazo a juego para anudar a la cintura.'),
        ('Kimono Estampado Bohemio con Flecos en el Ruedo Nuevo', 65000, 'unidad', 'El complemento perfecto para vestidos básicos o traje de baño.')
    ]),
    ('nuevos4@marketplace.com', 'Dra. Liliana Naturista', 'Naturista & Suplementos Vida Pura', 'Belleza', 'Barranquilla', '3124445504', CAT_BELLEZA, [
        ('Colágeno Hidrolizado Marino con Vitamina C y Biotina Nuevo', 68000, 'frasco', 'Polvo de rápida absorción para firmeza de piel, uñas y cabello.'),
        ('Aceite de Argán Puro de Marruecos Prensado en Frío Nuevo', 42000, 'gotero', 'Nutrición intensa para puntas resecas y brillo capilar sin grasa.'),
        ('Cápsulas de Omega 3 Aceite de Pescado 1000mg (100 Cápsulas) Nuevas', 52000, 'frasco', 'Apoyo cardiovascular y cerebral sin regusto a pescado.'),
        ('Miel de Abejas Pura Multifloral de Origen Andino (500g) Nueva', 28000, 'frasco', '100% natural sin pasteurizar directamente de apicultores locales.'),
        ('Suplemento de Magnesio Citrato Puro en Polvo (300g) Nuevo', 45000, 'tarro', 'Mejora el descanso nocturno y alivia calambres musculares.'),
        ('Shampoo Sin Sulfatos de Cebolla Roja y Romero Nuevo', 36000, 'botella', 'Fórmula anticaída que estimula el crecimiento del folículo.'),
        ('Crema Hidratante Facial con Ácido Hialurónico y Niacinamida Nueva', 48000, 'pote', 'Textura en gel de rápida absorción para todo tipo de piel.'),
        ('Té Verde Matcha Japonés Orgánico Ceremonial (100g) Nuevo', 55000, 'lata', 'Poderoso antioxidante natural que aporta energía y concentración.'),
        ('Proteína Vegana en Polvo de Arveja y Sacha Inchi (900g) Nueva', 92000, 'tarro', '24g de proteína por porción sabor vainilla sin azúcar añadida.'),
        ('Jabones Artesanales Exfoliantes de Café y Avena (Pack de 3) Nuevos', 25000, 'pack', 'Elaborados con glicerina vegetal para renovar la piel suavemente.')
    ]),
    ('nuevos5@marketplace.com', 'Marcela Cosméticos', 'Distribuidora Glam Cosméticos & Spa', 'Belleza', 'Bucaramanga', '3124445505', CAT_BELLEZA, [
        ('Paleta de Sombras de Ojos de 18 Tonos Ultra Pigmentados Nueva', 58000, 'unidad', 'Acabados mate y satinados de larga duración sin pliegues.'),
        ('Base de Maquillaje Líquida Cobertura Media-Alta Mate Nueva', 46000, 'frasco', 'Fórmula resistente al agua y al sudor con acabado natural.'),
        ('Kit de Brochas de Maquillaje Profesionales (12 Piezas) Nuevo', 62000, 'set', 'Fibras sintéticas ultrasuaves con estuche de viaje cilíndrico.'),
        ('Labial Líquido Mate de Larga Duración e Intransferible Nuevo', 28000, 'unidad', 'No reseca los labios gracias a su infusión de vitamina E.'),
        ('Pestañina / Máscara de Pestañas Efecto Volumen y Alargamiento Nueva', 32000, 'unidad', 'Cepillo curvo con microfibras para mirada impactante.'),
        ('Corrector Líquido de Ojeras de Alta Cobertura Nuevo', 26000, 'unidad', 'Disimula ojeras e imperfecciones con textura ligera.'),
        ('Polvo Traslúcido Suelto para Sellar y Controlar Brillo Nuevo', 35000, 'caja', 'Efecto filtro aterciopelado sin rebote de flash en fotos.'),
        ('Iluminador Facial en Polvo Tono Champán Dorado Nuevo', 30000, 'unidad', 'Brillo radiante modulable para pómulos y arco de cupido.'),
        ('Tónico Facial Hidratante de Rosas y Hamamelis (250ml) Nuevo', 24000, 'spray', 'Equilibra el pH y refresca la piel antes del maquillaje.'),
        ('Desmaquillante Bifásico para Ojos y Labios Waterproof Nuevo', 29000, 'frasco', 'Retira maquillaje pesado sin necesidad de frotar.')
    ]),
    ('nuevos6@marketplace.com', 'Don Jairo Ferretero', 'Ferretería & Bombillería LED La Central', 'Servicios del Hogar', 'Bogotá', '3124445506', CAT_SERVICIOS_HOGAR, [
        ('Pack de 10 Bombillos LED 9W Luz Blanca Ahorradores Nuevos', 35000, 'pack', 'Ahorro del 85% de energía con vida útil de 15,000 horas.'),
        ('Cinta LED RGB 5 Metros con Control Remoto y Fuente Nueva', 48000, 'kit', 'Cambio de 16 colores con adhesivo 3M para decoración.'),
        ('Reflector LED Exterior 50W Impermeable IP66 Nuevo', 45000, 'unidad', 'Iluminación potente para patios, fachadas y parqueaderos.'),
        ('Cerradura Digital Inteligente con Huella y Clave Nueva', 280000, 'unidad', 'Desbloqueo biométrico, tarjeta RFID y llave de emergencia.'),
        ('Juego de Destornilladores de Precisión Imantados (24 Piezas) Nuevo', 38000, 'set', 'Ideal para reparación de celulares, relojes y electrónica.'),
        ('Regleta Multitoma de 6 Salidas con 3 Puertos USB Nueva', 42000, 'unidad', 'Protección contra sobretensiones y cable reforzado de 2 metros.'),
        ('Cinta Métrica Flexómetro de 5 Metros Uso Rudo Nuevo', 18000, 'unidad', 'Cinta ancha de fácil lectura con freno magnético rápido.'),
        ('Pistola de Silicona Caliente de 60W con 10 Barras Nueva', 26000, 'kit', 'Calentamiento rápido en 3 minutos para manualidades y arreglos.'),
        ('Sensor de Movimiento Infrarrojo para Lámparas Nuevo', 29000, 'unidad', 'Encendido automático de luces al detectar presencia.'),
        ('Candado de Seguridad en Latón Macizo de 50mm Nuevo', 25000, 'unidad', 'Grillete de acero endurecido anticorte con 3 llaves.')
    ]),
    ('nuevos7@marketplace.com', 'Sebastián Tech', 'SmartGadgets: Audio y Accesorios Tech', 'Otros', 'Medellín', '3124445507', CAT_OTROS, [
        ('Audífonos Inalámbricos Bluetooth TWS con Cancelación Activa Nuevos', 85000, 'par', 'Estuche de carga con pantalla LED digital y sonido estéreo.'),
        ('Cargador Inalámbrico Rápido 15W para Celular Nuevo', 42000, 'unidad', 'Base delgada con protección térmica y estándar Qi universal.'),
        ('Batería Externa Power Bank 20000mAh Carga Rápida 22.5W Nueva', 75000, 'unidad', 'Capaz de cargar hasta 4 veces un smartphone completo.'),
        ('Soporte Magnético de Celular para Rejilla de Carro Nuevo', 24000, 'unidad', 'Imanes de neodimio potentes que sujetan firme en curvas.'),
        ('Cable USB-C a USB-C de 60W de Carga Rápida Mallado (2m) Nuevo', 22000, 'unidad', 'Recubrimiento trenzado de nailon ultrarresistente al doblado.'),
        ('Trípode Flexible para Celular y Cámara con Control Bluetooth Nuevo', 34000, 'kit', 'Patas articuladas tipo pulpo que se sujetan a cualquier tubo.'),
        ('Aro de Luz LED de 26cm con Trípode Extensible a 2m Nuevo', 55000, 'set', '3 tonos de luz (fría, neutra, cálida) con regulador de brillo.'),
        ('Adaptador Hub USB-C 6 en 1 con HDMI 4K y Puertos USB 3.0 Nuevo', 68000, 'unidad', 'Expansión total para computadores portátiles y tablets.'),
        ('Mouse Ergonómico Inalámbrico Vertical 2.4GHz Silencioso Nuevo', 46000, 'unidad', 'Diseño que reduce la fatiga de muñeca y túnel carpiano.'),
        ('Organizador de Cables para Escritorio en Silicona (Pack de 5) Nuevo', 16000, 'pack', 'Mantiene tus cables ordenados y listos para conectar.')
    ]),
    ('nuevos8@marketplace.com', 'Lucía Bebés', 'Mundo Infantil: Ropa & Juguetes Bebé', 'Ropa y Accesorios', 'Cali', '3124445508', CAT_ROPA, [
        ('Set de 5 Bodies de Algodón Pima 100% para Bebé Nuevos', 65000, 'set', 'Broches libres de níquel y tejido hipoalergénico supersuave.'),
        ('Mameluco Térmico con Pies y Capucha de Osito Nuevo', 52000, 'unidad', 'Tejido peluche térmico para abrigar en noches frías.'),
        ('Mochila Pañalera Multifuncional Impermeable con Cuna Nueva', 98000, 'unidad', 'Bolsillos térmicos para biberones y cambiador acolchado.'),
        ('Sonajero Mordedor Sensorial en Silicona Libre de BPA Nuevo', 22000, 'unidad', 'Alivia las encías durante la etapa de dentición del bebé.'),
        ('Juego de Sábanas para Cuna en Algodón Estampado Nuevo', 48000, 'juego', 'Incluye sábana ajustable, sobre-sábana y funda de almohada.'),
        ('Baberos Tipo Bandana en Algodón Absorbente (Pack de 4) Nuevos', 26000, 'pack', 'Diseños modernos con doble broche ajustable al cuello.'),
        ('Tapete de Juegos Gateo Infantil Antigolpes Plegable Nuevo', 85000, 'unidad', 'Material XPE impermeable de 1cm de grosor fácil de limpiar.'),
        ('Almohada de Lactancia Materna Ergonómica con Forro Lavable Nueva', 62000, 'unidad', 'Soporte cómodo para la espalda de mamá y descanso del bebé.'),
        ('Zapatitos Suaves Antideslizantes Primeros Pasos Nuevos', 34000, 'par', 'Puntera amplia y suela de goma flexible para libre movimiento.'),
        ('Luz de Noche Infantil de Silicona Recargable en Forma de Oso Nueva', 39000, 'unidad', 'Luz cálida tenue que no interrumpe el sueño de los niños.')
    ]),
    ('nuevos9@marketplace.com', 'Don Jaime Cafetero', 'Café Origen & Granos Andinos Premium', 'Alimentos', 'Pereira', '3124445509', CAT_ALIMENTOS, [
        ('Café Especial de Origen Castillo Grano Entero (500g) Nuevo', 34000, 'bolsa', 'Notas a caramelo, chocolate con leche y acidez cítrica brillante.'),
        ('Café Variedad Geisha Edición Limitada Tostado Medio (250g) Nuevo', 55000, 'bolsa', 'Fragancia floral a jazmín y notas a bergamota y miel pura.'),
        ('Café Molido Suave Tradicional Colombiano (500g) Nuevo', 28000, 'bolsa', 'Molienda media ideal para cafetera de goteo o prensa francesa.'),
        ('Prensa Francesa de Vidrio Borosilicato y Acero Inoxidable Nueva', 48000, 'unidad', 'Prepara café con cuerpo sedoso y retención de aceites aromáticos.'),
        ('Cafetera Moka Italiana de Aluminio para 6 Tazas Nueva', 52000, 'unidad', 'El auténtico café espresso intenso sobre la estufa de casa.'),
        ('Molino de Café Manual con Muelas de Cerámica Regulables Nuevo', 46000, 'unidad', 'Muele granos frescos al instante desde fino hasta grueso.'),
        ('Café con Proceso Honey Dulce y Frutal (340g) Nuevo', 38000, 'bolsa', 'Secado con mucílago natural que intensifica la dulzura en taza.'),
        ('Taza Pocillo Térmico de Acero Inoxidable Doble Pared (350ml) Nueva', 32000, 'unidad', 'Mantiene el café caliente durante 4 horas con tapa antisalpicaduras.'),
        ('Café Descafeinado por Proceso Natural de Caña de Azúcar (500g) Nuevo', 36000, 'bolsa', 'Todo el sabor y aroma auténtico del café sin cafeína.'),
        ('Kit Barista: Espumador de Leche a Baterías y Plantillas Nuevas', 25000, 'kit', 'Crea capuchinos cremosos con espuma densa en 20 segundos.')
    ]),
    ('nuevos10@marketplace.com', 'Elena Joyería', 'Joyería Fina & Plata 925 Filigrana', 'Ropa y Accesorios', 'Cartagena', '3124445510', CAT_ROPA, [
        ('Cadena y Dije Árbol de la Vida en Plata Ley 925 Nueva', 75000, 'unidad', 'Acabado pulido brillante con circonias cúbicas incrustadas.'),
        ('Aretes Topos Circulares de Circonia Suiza en Plata 925 Nuevos', 38000, 'par', 'Brillo tipo diamante con broche de mariposa seguro.'),
        ('Pulsera Tennis Ajustable con Cristales Austriacos Nueva', 68000, 'unidad', 'Baño en rodio antialérgico con cierre deslizante adaptable.'),
        ('Anillo Solitario Clásico de Compromiso en Plata Fina Nuevo', 85000, 'unidad', 'Circonia central corte brillante de 6 puntas montada a mano.'),
        ('Aretes Colgantes de Filigrana Mompoxina Tradicional Nuevos', 95000, 'par', 'Tejido artesanal en finos hilos de plata colombiana.'),
        ('Pulsera de Cuero Trenzado con Broche Magnético en Acero Nuevo', 42000, 'unidad', 'Estilo masculino moderno y sobrio para uso diario.'),
        ('Cadena de Eslabones Cubana en Acero Inoxidable Dorado Nueva', 55000, 'unidad', 'Ancho de 5mm con baño de oro de 18K resistente al agua.'),
        ('Dijes de Letra Inicial en Plata 925 con Cadena Veneciana Nueva', 60000, 'set', 'Personaliza tu accesorio favorito con tu inicial favorita.'),
        ('Tobillera Delicada con Dijes de Estrellas en Plata 925 Nueva', 45000, 'unidad', 'Diseño sutil para lucir en días de playa y sandalias.'),
        ('Joyero Organizador Portátil de Viaje con Compartimentos Nuevo', 35000, 'unidad', 'Interior de terciopelo suave con cremallera exterior compacta.')
    ])
]

# Write SQL script
sql_lines = []
sql_lines.append("""-- ============================================================
-- 015_seed_30_sellers_and_10_buyers.sql
--
-- Genera 40 nuevos usuarios para pruebas exhaustivas:
-- 1. 10 Usuarios Compradores (buyer)
-- 2. 10 Vendedores de Servicios (10 servicios c/u = 100 servicios)
-- 3. 10 Vendedores de Productos Usados (10 artículos c/u = 100 artículos usados)
-- 4. 10 Vendedores de Productos Nuevos (10 productos c/u = 100 productos nuevos)
-- Total publicaciones nuevas: 300
--
-- Contraseña universal: Password123!
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

DO $$
DECLARE
  encrypted_pw text;
  v_user_id    uuid;
  v_seller_id  uuid;
  v_adv_id     uuid;
  v_acc_id     uuid;
  v_list_id    uuid;
BEGIN
  -- Generar hash bcrypt para 'Password123!'
  encrypted_pw := extensions.crypt('Password123!', extensions.gen_salt('bf'));

  -- ============================================================
  -- PARTE 1: 10 USUARIOS COMPRADORES
  -- ============================================================
""")

# Buyers SQL
for idx, (email, name, city, phone) in enumerate(buyers, 1):
    uid = f'a1000000-0000-0000-0000-{idx:012x}'
    sql_lines.append(f"""  -- Comprador {idx}: {name} ({email})
  v_user_id := '{uid}';
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = '{email}') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = '{email}';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{json.dumps({"full_name": name}, ensure_ascii=False)}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      '{email}', encrypted_pw, now(),
      '{{"provider":"email","providers":["email"]}}', '{json.dumps({"full_name": name}, ensure_ascii=False)}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', '{email}')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, '{name}', 'buyer', '{city}', '{phone}')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'buyer', city = EXCLUDED.city, phone = EXCLUDED.phone;
""")

# Helper function to generate sellers SQL
def generate_sellers_block(sellers_list, block_title, prefix_user, prefix_seller, prefix_list, default_type, default_condition):
    sql_lines.append(f"""
  -- ============================================================
  -- {block_title}
  -- ============================================================
""")
    for s_idx, (email, owner_name, b_name, b_type, city, phone, cat_id, items) in enumerate(sellers_list, 1):
        uid = f'{prefix_user}-0000-0000-0000-{s_idx:012x}'
        sid = f'{prefix_seller}-0000-0000-0000-{s_idx:012x}'
        escaped_bname = b_name.replace("'", "''")
        escaped_owner = owner_name.replace("'", "''")

        sql_lines.append(f"""  -- Vendedor {s_idx}: {escaped_bname} ({email})
  v_user_id := '{uid}';
  v_seller_id := '{sid}';

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = '{email}') THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = '{email}';
    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = '{json.dumps({"full_name": owner_name}, ensure_ascii=False)}'::jsonb
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, email_change_token_current,
      reauthentication_token, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      '{email}', encrypted_pw, now(),
      '{{"provider":"email","providers":["email"]}}', '{json.dumps({"full_name": owner_name}, ensure_ascii=False)}',
      now(), now(), '', '', '', '', '', '', false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      json_build_object('sub', v_user_id::text, 'email', '{email}')::jsonb,
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.app_user (id, full_name, role, city, phone)
  VALUES (v_user_id, '{escaped_owner}', 'seller', '{city}', '{phone}')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'seller', city = EXCLUDED.city, phone = EXCLUDED.phone;

  -- Registro de Comercio / Seller
  IF NOT EXISTS (SELECT 1 FROM public.seller WHERE id = v_seller_id) THEN
    INSERT INTO public.seller (
      id, owner_user_id, business_name, business_type, city, phone, whatsapp, verified, rating_avg, rating_count, description
    ) VALUES (
      v_seller_id, v_user_id, '{escaped_bname}', '{b_type}', '{city}',
      '57{phone}', '57{phone}', true, 4.90, 15,
      'Comercio formalizado en {city} especializado en {b_type.lower()}. Atención al cliente garantizada.'
    );
  ELSE
    UPDATE public.seller
    SET business_name = '{escaped_bname}',
        owner_user_id = v_user_id,
        city = '{city}',
        verified = true
    WHERE id = v_seller_id;
  END IF;

  -- Anunciante y Billetera para Campañas
  SELECT id INTO v_adv_id FROM public.advertiser WHERE seller_id = v_seller_id LIMIT 1;
  IF v_adv_id IS NULL THEN
    INSERT INTO public.advertiser (seller_id, legal_name, status)
    VALUES (v_seller_id, '{escaped_bname}', 'active')
    RETURNING id INTO v_adv_id;
  END IF;

  SELECT id INTO v_acc_id FROM public.ad_account WHERE advertiser_id = v_adv_id LIMIT 1;
  IF v_acc_id IS NULL THEN
    INSERT INTO public.ad_account (advertiser_id, balance)
    VALUES (v_adv_id, 100000)
    RETURNING id INTO v_acc_id;
  ELSE
    UPDATE public.ad_account SET balance = GREATEST(balance, 100000) WHERE id = v_acc_id;
  END IF;
""")

        # Listings for this seller
        for l_idx, (title, price, unit, desc) in enumerate(items, 1):
            lid = f'{prefix_list}-{s_idx:04x}-0000-0000-{l_idx:012x}'
            escaped_title = title.replace("'", "''")
            escaped_desc = desc.replace("'", "''")
            attrs_dict = {"condition": default_condition}
            if default_type == 'service':
                attrs_dict = {"modalidad": "Presencial / A Domicilio", "garantia": "Garantía de servicio", "tiempo_estimado": "Coordinación directa"}
            attrs_json = json.dumps(attrs_dict, ensure_ascii=False)

            sql_lines.append(f"""  -- Publicación {l_idx}/10 de {escaped_bname}
  v_list_id := '{lid}';
  IF NOT EXISTS (SELECT 1 FROM public.listing WHERE id = v_list_id) THEN
    INSERT INTO public.listing (
      id, seller_id, category_id, type, title, description, price, price_unit, city, status, stock, attrs
    ) VALUES (
      v_list_id, v_seller_id, '{cat_id}', '{default_type}',
      '{escaped_title}',
      '{escaped_desc}',
      {price}, '{unit}', '{city}', 'published', 25,
      '{attrs_json}'::jsonb
    );
  ELSE
    UPDATE public.listing
    SET title = '{escaped_title}',
        description = '{escaped_desc}',
        price = {price},
        type = '{default_type}',
        status = 'published',
        city = '{city}'
    WHERE id = v_list_id;
  END IF;
""")

generate_sellers_block(service_sellers, 'PARTE 2: 10 VENDEDORES DE SERVICIOS (100 SERVICIOS)', 'b1000000', 'c1000000', 'd1000000', 'service', 'Servicio')
generate_sellers_block(used_sellers, 'PARTE 3: 10 VENDEDORES DE PRODUCTOS USADOS (100 ARTÍCULOS USADOS)', 'b2000000', 'c2000000', 'd2000000', 'article', 'Usado')
generate_sellers_block(new_sellers, 'PARTE 4: 10 VENDEDORES DE PRODUCTOS NUEVOS (100 PRODUCTOS NUEVOS)', 'b3000000', 'c3000000', 'd3000000', 'product', 'Nuevo')

sql_lines.append("""
  -- ============================================================
  -- AUTO-CONFIRMAR TODOS LOS USUARIOS DE PRUEBA
  -- ============================================================
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE email LIKE '%@marketplace.com' AND email_confirmed_at IS NULL;

END $$;
""")

full_sql = "\n".join(sql_lines)
os.makedirs('sql', exist_ok=True)
with open('sql/015_seed_30_sellers_and_10_buyers.sql', 'w') as f:
    f.write(full_sql)

print('SQL seed generated successfully! Bytes:', len(full_sql))
