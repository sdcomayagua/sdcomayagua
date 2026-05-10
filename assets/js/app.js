// assets/js/app.js
// SD COMAYAGUA - Dashboard POS Final Pro
// Frontend estático para GitHub Pages + backend Google Apps Script.

const CONFIG = {
  storeName: "SD COMAYAGUA",
  storeFullName: "Soluciones Digitales Comayagua",
  whatsapp: "50431517755",
  currency: "Lps.",
  normalShipping: 110,
  cashOnDeliveryShipping: 100,
  cashOnDeliveryCommission: 0.06,
  localShipping: 0,
  lowStockLimit: 5,

  // Pegue aquí la URL /exec del Web App de Apps Script.
  appsScriptUrl: "",

  // Debe coincidir con API_KEY en apps-script/Code.gs
  apiKey: "SDC_POS_2026",

  // Opcional, solo referencia visual.
  sheetId: ""
};

const SAMPLE_PRODUCTS = [
  {
    "id": "prod-sdc-001",
    "codigo": "SDC-001",
    "nombre": "Dedales o Fundas para Dedos",
    "categoria": "Dedales",
    "marca": "",
    "precio": 25,
    "costo": 8,
    "stock": 227,
    "descripcion": "Dedales gamer para celular, ideales para jugar con mejor deslizamiento, comodidad y precisión. Ayudan a reducir el sudor en pantalla y funcionan muy bien para Free Fire, PUBG Mobile, Call of Duty Mobile y otros juegos táctiles.",
    "imagen": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/677652330_1500160691729334_4118015065856447884_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=107&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeHOXzeWwS8JnqwSlyAzqpSvqSikc0bVu0ypKKRzRtW7TFx0OsnlAcWUPoESVbBUbnWjTdTH8AOEU_Dpt0grcjTf&_nc_ohc=Eu6K10t0270Q7kNvwF_EGTz&_nc_oc=Adp59PX6FuzWv9K0B0EcRp4Bj04hOIrLLxAfDB04g4CuUY1OCfyol2q-ZfBySBYPB5o&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=OjSpZ7JjINzjcwKmoKCRTQ&_nc_ss=7b2a8&oh=00_Af4XyFV9Yrv_vWh2CezlRQ0FHHT-av11Tutqk1yprkHBvQ&oe=69FD3C6C",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": "1=25 | 2=50 | 3=69 | 4=92 | 5=110 | 6=132 | 7=154 | 8=168 | 9=189 | 10=200"
  },
  {
    "id": "prod-sdc-002",
    "codigo": "SDC-002",
    "nombre": "Gatillos Gamer Pro / Triggers Pro para celular",
    "categoria": "Gamer Móvil",
    "marca": "",
    "precio": 400,
    "costo": 190,
    "stock": 12,
    "descripcion": "Trigger gamer para celular, ideal para mejorar el control al apuntar, disparar y moverse en juegos móviles. Práctico para Free Fire, PUBG Mobile, Call of Duty Mobile y otros juegos de acción.",
    "imagen": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/676041307_1622203069066456_833207036229297481_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=102&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeF1LpcG2ri2R6BK98WklS8WLaI0EGwoyC0tojQQbCjILUIr3DzyFRM3mRk8YlU_bSjsiNU3ramv9chW3Cf55Ipx&_nc_ohc=EvmNhQh0PGYQ7kNvwG0FjQD&_nc_oc=AdpTc1H49mRkgUooNvg7BQfR1hVVVHr7Vl7mS2-DIv4lV8nHG9EwR1gALGa5F7gpkjI&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=9nznnTo5vJ8b9ldgDx1vXw&_nc_ss=7b2a8&oh=00_Af4GYjPnQecbgvrnlL4JwaiW73U31yudqWnaMAUAuSdDtg&oe=69FD62AB",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-003",
    "codigo": "SDC-003",
    "nombre": "Enfriador X112",
    "categoria": "Enfriador Gamer para Celular",
    "marca": "X112",
    "precio": 400,
    "costo": 250,
    "stock": 2,
    "descripcion": "Enfriador para celular, ayuda a reducir la temperatura del equipo durante partidas largas, manteniendo un mejor rendimiento y mayor comodidad al jugar.",
    "imagen": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t39.84726-6/678969681_1863159007733174_8930140486556014096_n.jpg?stp=dst-jpg_s960x960_tt6&_nc_cat=103&ccb=1-7&_nc_sid=92e707&_nc_eui2=AeGxhI97-NJM92kUUWF1RwZ0awEZrbtLW5NrARmtu0tbk9DqMP09lIeReeCPoBA7JfEIZcbp4W5ahJX7az21i7tI&_nc_ohc=ovc6pnU9rwgQ7kNvwFfKyxV&_nc_oc=AdpRlWWanDrYmaiG89EucQY8q6AjOFO1ASdld4-gaPwUl3ZAXKoqSa5FzMpMYe_7f5M&_nc_zt=14&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=7bJJa9204AqiiFdLg8sd4w&_nc_ss=7b2a8&oh=00_Af77IRQCxtgOu4A0iQdZ4zXKjI6gqOPlKBj9EGP0n00wUA&oe=69FD770A",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-005",
    "codigo": "SDC-005",
    "nombre": "Dedales o Fundas para Dedos Gamer V2 para Celular",
    "categoria": "Dedales",
    "marca": "",
    "precio": 50,
    "costo": 0,
    "stock": 1,
    "descripcion": "Dedales gamer versión V2 para celular, con tacto cómodo y buena respuesta en pantalla. Recomendados para quienes buscan más control, mejor deslizamiento y comodidad durante partidas largas.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-006",
    "codigo": "SDC-006",
    "nombre": "Dedales Gamer Pro Hilo de Plata para Celular",
    "categoria": "Dedales",
    "marca": "",
    "precio": 190,
    "costo": 0,
    "stock": 1,
    "descripcion": "Dedales Memo para gaming móvil, diseñados para mejorar la sensibilidad al tocar la pantalla y mantener un deslizamiento más estable. Ideales para jugadores de Free Fire, PUBG Mobile, COD Mobile y juegos similares.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-004",
    "codigo": "SDC-004",
    "nombre": "Guantes Hilo de Plata – Marca Memo",
    "categoria": "Gamer Móvil",
    "marca": "MEMO",
    "precio": 360,
    "costo": 110,
    "stock": 2,
    "descripcion": "Guantes Memo para gaming móvil, pensados para mayor comodidad, mejor agarre y menos sudor al jugar. Ayudan a mantener un toque más limpio y preciso en la pantalla durante partidas largas.",
    "imagen": "https://accmovilhn.com/wp-content/uploads/2022/02/Glovem.jpg",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-007",
    "codigo": "SDC-007",
    "nombre": "Enfriador Memo CX15 PRO | Cooler Magnético para Celular",
    "categoria": "Enfriador Gamer para Celular",
    "marca": "MEMO",
    "precio": 850,
    "costo": 0,
    "stock": 1,
    "descripcion": "Enfriador CX15 para celular, práctico para controlar el calentamiento del teléfono durante juegos o uso intenso. Ideal para mantener el dispositivo más fresco y estable.",
    "imagen": "https://cdn2.blanxer.com/uploads/66fee8ef11201b5cb450cf97/product_image-img_0537-1238.webp",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-008",
    "codigo": "SDC-008",
    "nombre": "Audifonos QKZ",
    "categoria": "Audio",
    "marca": "QKZ",
    "precio": 0,
    "costo": 0,
    "stock": 0,
    "descripcion": "Audífonos QKZ con cable, ideales para escuchar música, jugar y realizar llamadas con sonido claro. Diseño cómodo para uso diario y buena experiencia de audio.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-009",
    "codigo": "SDC-009",
    "nombre": "Audifonos Tipo C",
    "categoria": "Audio",
    "marca": "",
    "precio": 0,
    "costo": 0,
    "stock": 0,
    "descripcion": "Audífonos Tipo C para celulares con entrada USB-C, ideales para música, llamadas, videos y juegos. Una opción práctica para teléfonos que no tienen entrada auxiliar 3.5 mm.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-010",
    "codigo": "SDC-010",
    "nombre": "Adaptador MicroSD – USB 2.0",
    "categoria": "Tecnología / Accesorios",
    "marca": "",
    "precio": 60,
    "costo": 0,
    "stock": 1,
    "descripcion": "Adaptador para tarjeta MicroSD, útil para convertir una microSD a tamaño SD y facilitar la transferencia de fotos, videos, documentos y otros archivos en computadoras o lectores compatibles.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-011",
    "codigo": "SDC-011",
    "nombre": "Secador de Zapatos 2 en 1 (Seca y Quita el Mal Olor) – Temporizador hasta 120 min",
    "categoria": "Hogar",
    "marca": "",
    "precio": 350,
    "costo": 0,
    "stock": 1,
    "descripcion": "Secador de zapatos práctico para ayudar a eliminar humedad del calzado después de lluvia, lavado o uso diario. Ideal para mantener los zapatos más secos, cómodos y con mejor olor.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-012",
    "codigo": "SDC-012",
    "nombre": "Termo Stanley Rosado",
    "categoria": "Termos / Hogar",
    "marca": "Stanley",
    "precio": 0,
    "costo": 0,
    "stock": 0,
    "descripcion": "Termo estilo Stanley color rosado, ideal para llevar bebidas frías o calientes por más tiempo. Diseño moderno, práctico y bonito para uso diario, trabajo, estudio, viajes o gimnasio.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-013",
    "codigo": "SDC-013",
    "nombre": "Enfriador PRO para Celular – Juega sin LAG, sin Calor",
    "categoria": "Enfriador Gamer para Celular",
    "marca": "",
    "precio": 360,
    "costo": 0,
    "stock": 1,
    "descripcion": "Enfriador PRO para celular, ideal para ayudar a controlar el calentamiento durante juegos, transmisiones o uso intenso. Recomendado para mantener el equipo más fresco y cómodo en partidas largas.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-014",
    "codigo": "SDC-014",
    "nombre": "Enfriador o Cooler Gamer para Celular",
    "categoria": "Enfriador Gamer para Celular",
    "marca": "",
    "precio": 150,
    "costo": 0,
    "stock": 1,
    "descripcion": "Cooler gamer para celular, práctico para reducir la temperatura del teléfono mientras jugás. Ayuda a mantener un mejor rendimiento y mayor comodidad durante sesiones prolongadas.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-015",
    "codigo": "SDC-015",
    "nombre": "Dedales SARAFOX - Hilo de Plata",
    "categoria": "Dedales",
    "marca": "Sarafox",
    "precio": 400,
    "costo": 0,
    "stock": 1,
    "descripcion": "Dedales SARAFOX con hilo de plata para gaming móvil, diseñados para brindar mejor sensibilidad, deslizamiento y precisión en pantalla. Ideales para Free Fire, PUBG Mobile, COD Mobile y juegos táctiles.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-016",
    "codigo": "SDC-016",
    "nombre": "Dedales V2 para Gaming Móvil – Precisión y Comodidad",
    "categoria": "Dedales",
    "marca": "",
    "precio": 90,
    "costo": 0,
    "stock": 1,
    "descripcion": "Dedales V2 para gaming móvil, cómodos y ligeros para mejorar el control de los dedos en pantalla. Ayudan a reducir el sudor y facilitan movimientos más suaves durante la partida.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-017",
    "codigo": "SDC-017",
    "nombre": "Gamepad con Cooler para Celular | Android & iOS",
    "categoria": "Controles / Gamepad",
    "marca": "",
    "precio": 490,
    "costo": 0,
    "stock": 1,
    "descripcion": "Gamepad con cooler para celular, compatible con Android y iOS según el equipo. Combina mejor agarre, controles físicos y enfriamiento para jugar con más comodidad.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-018",
    "codigo": "SDC-018",
    "nombre": "Gamepad MEMO para Celular 4 Gatillos Personalizables Android & iOS",
    "categoria": "Controles / Gamepad",
    "marca": "MEMO",
    "precio": 400,
    "costo": 0,
    "stock": 1,
    "descripcion": "Gamepad MEMO para celular con 4 gatillos personalizables, pensado para juegos de acción y disparos. Brinda mejor control, agarre firme y una experiencia más cómoda en Android y iOS.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-019",
    "codigo": "SDC-019",
    "nombre": "GAMEPAD CON COOLER Y JOYSTICK",
    "categoria": "Controles / Gamepad",
    "marca": "",
    "precio": 300,
    "costo": 0,
    "stock": 1,
    "descripcion": "Gamepad con cooler y joystick para celular, ideal para quienes buscan mejor control y comodidad al jugar. Su diseño ayuda a sujetar mejor el teléfono y mantenerlo más fresco.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-020",
    "codigo": "SDC-020",
    "nombre": "Control PRO Inalámbrico Bluetooth Android / iOS / PC / Switch Turbo + Macro",
    "categoria": "Controles / Gamepad",
    "marca": "",
    "precio": 490,
    "costo": 0,
    "stock": 1,
    "descripcion": "Control PRO inalámbrico Bluetooth para Android, iOS, PC y Nintendo Switch. Incluye funciones Turbo y Macro para una experiencia más completa en juegos compatibles.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-021",
    "codigo": "SDC-021",
    "nombre": "Control Gamer con Soporte para Celular",
    "categoria": "Controles / Gamepad",
    "marca": "",
    "precio": 420,
    "costo": 0,
    "stock": 1,
    "descripcion": "Control gamer con soporte para celular, ideal para jugar con mejor agarre y mayor precisión. Su soporte permite colocar el teléfono de forma cómoda para partidas largas.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-022",
    "codigo": "SDC-022",
    "nombre": "Mousepad Xtech Rosa con Soporte de Muñeca 23×18cm",
    "categoria": "Mousepad",
    "marca": "Xtech",
    "precio": 150,
    "costo": 0,
    "stock": 1,
    "descripcion": "Mousepad Xtech color rosa con soporte de muñeca, tamaño 23×18 cm. Brinda una superficie cómoda para el mouse y ayuda a descansar la muñeca durante estudio, oficina o gaming casual.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-023",
    "codigo": "SDC-023",
    "nombre": "Tira de Esponja para Puertas y Ventanas 70cm Anti Polvo e Insectos",
    "categoria": "Hogar",
    "marca": "",
    "precio": 80,
    "costo": 0,
    "stock": 1,
    "descripcion": "Tira de esponja para puertas y ventanas de 70 cm, útil para ayudar a bloquear polvo, insectos y corrientes de aire. Ideal para mejorar el sellado de espacios en el hogar.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-024",
    "codigo": "SDC-024",
    "nombre": "Fuente de Agua para Gato o Perro 3L USB + Filtro",
    "categoria": "Mascotas",
    "marca": "",
    "precio": 270,
    "costo": 0,
    "stock": 1,
    "descripcion": "Fuente de agua para gato o perro de 3 litros con conexión USB y filtro. Mantiene el agua en movimiento para incentivar a las mascotas a beber con mayor frecuencia.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-025",
    "codigo": "SDC-025",
    "nombre": "Funda Protectora para Refrigeradora / Lavadora (Anti Polvo) + Bolsillos",
    "categoria": "Hogar",
    "marca": "",
    "precio": 150,
    "costo": 0,
    "stock": 1,
    "descripcion": "Funda protectora para refrigeradora o lavadora, ideal para ayudar a proteger contra polvo y salpicaduras. Incluye bolsillos laterales para guardar artículos pequeños del hogar.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-026",
    "codigo": "SDC-026",
    "nombre": "Funda para Moto Impermeable Metalizada 140×240cm (Protección Sol/Lluvia/Polvo)",
    "categoria": "Hogar / Automotriz",
    "marca": "",
    "precio": 200,
    "costo": 0,
    "stock": 1,
    "descripcion": "Funda para moto impermeable metalizada de 140×240 cm, diseñada para proteger contra sol, lluvia y polvo. Práctica para cuidar la motocicleta cuando permanece estacionada.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-027",
    "codigo": "SDC-027",
    "nombre": "Juego de Destornilladores de Precisión 115 en 1 (PC y Celular)",
    "categoria": "Herramientas",
    "marca": "",
    "precio": 300,
    "costo": 0,
    "stock": 1,
    "descripcion": "Juego de destornilladores de precisión 115 en 1, ideal para reparación de celulares, computadoras, laptops, consolas y electrónicos pequeños. Incluye puntas variadas para diferentes trabajos.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-028",
    "codigo": "SDC-028",
    "nombre": "Cosmetiquera con Espejo LED | 3 tipos de luz (Natural/Fría/Cálida)",
    "categoria": "Belleza",
    "marca": "",
    "precio": 290,
    "costo": 0,
    "stock": 1,
    "descripcion": "Cosmetiquera con espejo LED y 3 tipos de luz: natural, fría y cálida. Perfecta para organizar maquillaje y retocarse con mejor iluminación en casa o de viaje.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-029",
    "codigo": "SDC-029",
    "nombre": "Afilador de Cuchillos – 3 Niveles",
    "categoria": "Cocina / Hogar",
    "marca": "",
    "precio": 100,
    "costo": 0,
    "stock": 1,
    "descripcion": "Afilador de cuchillos de 3 niveles, práctico para recuperar y mantener el filo de cuchillos de cocina. Compacto, fácil de usar y útil para el hogar.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-030",
    "codigo": "SDC-030",
    "nombre": "Mouse Gamer X12 – 3200DPI",
    "categoria": "Mouse / Tecnología",
    "marca": "",
    "precio": 300,
    "costo": 0,
    "stock": 1,
    "descripcion": "Mouse gamer X12 de 3200 DPI, ideal para juegos, estudio y uso diario en computadora. Diseño cómodo con buen agarre para movimientos más precisos.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-031",
    "codigo": "SDC-031",
    "nombre": "Memoria USB 3.2 – 256GB",
    "categoria": "Memorias USB",
    "marca": "MEMO",
    "precio": 1050,
    "costo": 0,
    "stock": 1,
    "descripcion": "Memoria USB 3.2 de 256GB, ideal para guardar fotos, videos, documentos, música y respaldos importantes. Portátil, práctica y fácil de usar en computadoras compatibles.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-032",
    "codigo": "SDC-032",
    "nombre": "Memoria USB 3.2 – 128GB",
    "categoria": "Memorias USB",
    "marca": "MEMO",
    "precio": 620,
    "costo": 0,
    "stock": 1,
    "descripcion": "Memoria USB 3.2 de 128GB, excelente para transportar archivos, tareas, fotos y videos. Una opción práctica para estudio, trabajo y respaldo de información.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-033",
    "codigo": "SDC-033",
    "nombre": "Memoria USB 3.2 – 64GB",
    "categoria": "Memorias USB",
    "marca": "MEMO",
    "precio": 320,
    "costo": 0,
    "stock": 1,
    "descripcion": "Memoria USB 3.2 de 64GB, compacta y útil para guardar documentos, música, fotos y archivos de uso diario. Ideal para estudiantes, oficina y respaldo rápido.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-034",
    "codigo": "SDC-034",
    "nombre": "Memoria USB 3.2 – 32GB",
    "categoria": "Memorias USB",
    "marca": "MEMO",
    "precio": 240,
    "costo": 0,
    "stock": 1,
    "descripcion": "Memoria USB 3.2 de 32GB, práctica para transferir y guardar documentos, tareas, fotos y archivos pequeños. Fácil de llevar y usar en computadoras compatibles.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-035",
    "codigo": "SDC-035",
    "nombre": "Memoria USB - 16GB",
    "categoria": "Memorias USB",
    "marca": "MEMO",
    "precio": 190,
    "costo": 0,
    "stock": 1,
    "descripcion": "Memoria USB de 16GB, ideal para guardar documentos, tareas, música y archivos personales. Una opción económica y práctica para uso diario.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-036",
    "codigo": "SDC-036",
    "nombre": "Memoria MicroSD 256GB – V30 / U3 / A1",
    "categoria": "Memorias MicroSD",
    "marca": "MEMO",
    "precio": 1350,
    "costo": 0,
    "stock": 1,
    "descripcion": "Memoria MicroSD 256GB V30 / U3 / A1, recomendada para celulares, cámaras y dispositivos compatibles. Ideal para ampliar almacenamiento y guardar fotos, videos y aplicaciones.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-037",
    "codigo": "SDC-037",
    "nombre": "Maxell MicroSD 128GB – Alta Velocidad",
    "categoria": "Memorias MicroSD",
    "marca": "Maxell",
    "precio": 920,
    "costo": 0,
    "stock": 1,
    "descripcion": "Memoria Maxell MicroSD 128GB de alta velocidad, ideal para ampliar almacenamiento en celulares, cámaras y otros equipos compatibles. Perfecta para fotos, videos y archivos.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-038",
    "codigo": "SDC-038",
    "nombre": "Maxell MicroSD 64GB – Clase 10",
    "categoria": "Memorias MicroSD",
    "marca": "Maxell",
    "precio": 450,
    "costo": 0,
    "stock": 1,
    "descripcion": "Memoria Maxell MicroSD 64GB Clase 10, práctica para celulares, cámaras y dispositivos compatibles. Buena opción para guardar fotos, música, videos y documentos.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-039",
    "codigo": "SDC-039",
    "nombre": "Maxell MicroSD 32GB – Clase 10",
    "categoria": "Memorias MicroSD",
    "marca": "Maxell",
    "precio": 290,
    "costo": 0,
    "stock": 1,
    "descripcion": "Memoria Maxell MicroSD 32GB Clase 10, ideal para ampliar almacenamiento en equipos compatibles. Útil para fotos, música, documentos y archivos de uso diario.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-040",
    "codigo": "SDC-040",
    "nombre": "Maxell MicroSD 16GB – Clase 10",
    "categoria": "Memorias MicroSD",
    "marca": "Maxell",
    "precio": 230,
    "costo": 0,
    "stock": 1,
    "descripcion": "Memoria Maxell MicroSD 16GB Clase 10, opción práctica para guardar archivos básicos, música, fotos y documentos en celulares o dispositivos compatibles.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  },
  {
    "id": "prod-sdc-041",
    "codigo": "SDC-041",
    "nombre": "Ubicación Tienda SD-COMAYAGUA (Piedras Bonitas) | WhatsApp 3151-7755",
    "categoria": "Tienda / Información",
    "marca": "",
    "precio": 0,
    "costo": 0,
    "stock": 1,
    "descripcion": "Publicación informativa con la ubicación de SD-COMAYAGUA en Piedras Bonitas y contacto por WhatsApp 3151-7755. Sirve para orientar al cliente y facilitar la visita a la tienda.",
    "imagen": "",
    "activo": true,
    "updatedAt": "2026-05-10T04:25:23",
    "promos": ""
  }
];

const STORAGE_KEYS = {
  theme: "sd_pos_theme",
  products: "sd_pos_cached_products",
  invoices: "sd_pos_invoices",
  lastSync: "sd_pos_last_sync"
};

const state = {
  products: SAMPLE_PRODUCTS.filter(product => product.activo !== false),
  activeCategory: "Todos",
  cart: [],
  invoices: [],
  editingInvoiceId: null,
  draftCode: "",
  sync: {
    loading: false,
    online: false,
    lastSync: localStorage.getItem(STORAGE_KEYS.lastSync) || ""
  }
};

const dom = {
  themeToggle: document.getElementById("themeToggle"),
  themeText: document.getElementById("themeText"),
  syncNowBtn: document.getElementById("syncNowBtn"),
  syncStatePill: document.getElementById("syncStatePill"),
  quickWhatsapp: document.getElementById("quickWhatsapp"),

  metricsGrid: document.getElementById("metricsGrid"),
  stockAlerts: document.getElementById("stockAlerts"),
  recentInvoices: document.getElementById("recentInvoices"),

  productCount: document.getElementById("productCount"),
  searchInput: document.getElementById("searchInput"),
  categoryFilters: document.getElementById("categoryFilters"),
  productGrid: document.getElementById("productGrid"),

  productForm: document.getElementById("productForm"),
  productFormTitle: document.getElementById("productFormTitle"),
  productIdInput: document.getElementById("productIdInput"),
  productCodeInput: document.getElementById("productCodeInput"),
  productNameInput: document.getElementById("productNameInput"),
  productCategoryInput: document.getElementById("productCategoryInput"),
  productBrandInput: document.getElementById("productBrandInput"),
  productPriceInput: document.getElementById("productPriceInput"),
  productCostInput: document.getElementById("productCostInput"),
  productStockInput: document.getElementById("productStockInput"),
  productImageInput: document.getElementById("productImageInput"),
  productDescriptionInput: document.getElementById("productDescriptionInput"),
  productActiveInput: document.getElementById("productActiveInput"),
  resetProductFormBtn: document.getElementById("resetProductFormBtn"),
  cancelProductEditBtn: document.getElementById("cancelProductEditBtn"),

  cartList: document.getElementById("cartList"),
  cartCount: document.getElementById("cartCount"),
  totalsBox: document.getElementById("totalsBox"),
  clearCartBtn: document.getElementById("clearCartBtn"),
  saveInvoiceBtn: document.getElementById("saveInvoiceBtn"),
  quoteWhatsappBtn: document.getElementById("quoteWhatsappBtn"),

  invoiceList: document.getElementById("invoiceList"),
  invoiceCount: document.getElementById("invoiceCount"),
  configGrid: document.getElementById("configGrid"),
  editingLabel: document.getElementById("editingLabel"),
  toast: document.getElementById("toast"),

  customerName: document.getElementById("customerName"),
  customerPhone: document.getElementById("customerPhone"),
  departmentInput: document.getElementById("departmentInput"),
  municipalityInput: document.getElementById("municipalityInput"),
  addressInput: document.getElementById("addressInput"),
  shippingType: document.getElementById("shippingType"),
  discountInput: document.getElementById("discountInput"),
  invoiceStatus: document.getElementById("invoiceStatus")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  loadTheme();
  loadCachedData();
  bindEvents();
  renderAll();
  updateSyncState();

  if (CONFIG.appsScriptUrl) {
    await syncFromCloud({ silent: true });
  }

  notifyQuoteChanged();
}

function bindEvents() {
  document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.querySelectorAll("[data-jump]").forEach(button => {
    button.addEventListener("click", () => switchView(button.dataset.jump));
  });

  dom.themeToggle.addEventListener("click", toggleTheme);
  dom.syncNowBtn.addEventListener("click", () => syncFromCloud({ silent: false }));

  dom.quickWhatsapp.addEventListener("click", () => {
    openWhatsapp(CONFIG.whatsapp, `Hola 😊\nNecesito información de ${CONFIG.storeName}.`);
  });

  dom.searchInput.addEventListener("input", renderProducts);

  dom.categoryFilters.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.activeCategory = button.dataset.category;
    renderCategoryFilters();
    renderProducts();
  });

  dom.productGrid.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-product]");
    const whatsappButton = event.target.closest("[data-product-whatsapp]");
    const editButton = event.target.closest("[data-edit-product]");

    if (addButton) addToCart(addButton.dataset.addProduct);

    if (whatsappButton) {
      const product = findProduct(whatsappButton.dataset.productWhatsapp);
      if (product) sendProductWhatsapp(product);
    }

    if (editButton) {
      const product = findProduct(editButton.dataset.editProduct);
      if (product) {
        fillProductForm(product);
        switchView("admin");
      }
    }
  });

  dom.productForm.addEventListener("submit", saveProductFromForm);
  dom.resetProductFormBtn.addEventListener("click", resetProductForm);
  dom.cancelProductEditBtn.addEventListener("click", resetProductForm);

  dom.cartList.addEventListener("click", event => {
    const plus = event.target.closest("[data-qty-plus]");
    const minus = event.target.closest("[data-qty-minus]");
    const remove = event.target.closest("[data-remove-item]");

    if (plus) changeQuantity(plus.dataset.qtyPlus, 1);
    if (minus) changeQuantity(minus.dataset.qtyMinus, -1);
    if (remove) removeFromCart(remove.dataset.removeItem);
  });

  dom.cartList.addEventListener("input", event => {
    const input = event.target.closest("[data-qty-input]");
    if (!input) return;
    setQuantity(input.dataset.qtyInput, Number(input.value));
  });

  [
    dom.customerName,
    dom.customerPhone,
    dom.departmentInput,
    dom.municipalityInput,
    dom.addressInput,
    dom.shippingType,
    dom.discountInput,
    dom.invoiceStatus
  ].forEach(input => {
    input.addEventListener("input", () => {
      renderCart();
      notifyQuoteChanged();
    });
    input.addEventListener("change", () => {
      renderCart();
      notifyQuoteChanged();
    });
  });

  dom.clearCartBtn.addEventListener("click", clearCurrentQuote);
  dom.saveInvoiceBtn.addEventListener("click", saveInvoice);
  dom.quoteWhatsappBtn.addEventListener("click", sendQuoteWhatsapp);

  dom.invoiceList.addEventListener("click", event => {
    const loadButton = event.target.closest("[data-load-invoice]");
    const deleteButton = event.target.closest("[data-delete-invoice]");

    if (loadButton) loadInvoice(loadButton.dataset.loadInvoice);
    if (deleteButton) deleteInvoice(deleteButton.dataset.deleteInvoice);
  });
}

function renderAll() {
  renderDashboard();
  renderCategoryFilters();
  renderProducts();
  renderCart();
  renderInvoices();
  renderConfig();
}

function switchView(viewName) {
  document.querySelectorAll(".view").forEach(view => {
    view.classList.toggle("active", view.id === `view-${viewName}`);
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "tech";
  applyTheme(savedTheme);
}

function toggleTheme() {
  const isTech = document.body.classList.contains("theme-tech");
  applyTheme(isTech ? "pro" : "tech");
}

function applyTheme(theme) {
  document.body.classList.toggle("theme-tech", theme === "tech");
  document.body.classList.toggle("theme-pro", theme === "pro");
  dom.themeText.textContent = theme === "tech" ? "Modo Gamer" : "Modo Pro";
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function loadCachedData() {
  try {
    const cachedProducts = JSON.parse(localStorage.getItem(STORAGE_KEYS.products)) || [];
    if (cachedProducts.length) {
      state.products = cachedProducts.filter(product => product.activo !== false);
    }
  } catch (error) {
    console.warn("No se pudieron cargar productos locales.", error);
  }

  try {
    state.invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.invoices)) || [];
  } catch (error) {
    state.invoices = [];
    console.warn("No se pudieron cargar facturas locales.", error);
  }
}

function persistLocalData() {
  localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(state.products));
  localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(state.invoices));
}

function updateSyncState(message = "") {
  if (!dom.syncStatePill || !dom.syncNowBtn) return;

  dom.syncNowBtn.classList.remove("is-ok", "is-error");

  if (!CONFIG.appsScriptUrl) {
    dom.syncStatePill.textContent = "Local";
    return;
  }

  if (state.sync.online) {
    dom.syncStatePill.textContent = "Sheets conectado";
    dom.syncNowBtn.classList.add("is-ok");
  } else {
    dom.syncStatePill.textContent = message || "Sheets pendiente";
    dom.syncNowBtn.classList.add("is-error");
  }
}

async function syncFromCloud({ silent = false } = {}) {
  if (!CONFIG.appsScriptUrl) {
    if (!silent) showToast("Pegue primero la URL de Apps Script en CONFIG.appsScriptUrl.");
    updateSyncState();
    return;
  }

  try {
    state.sync.loading = true;
    const response = await apiGet("getAll");

    if (!response.ok) throw new Error(response.error || "Respuesta inválida de Apps Script.");

    const remoteProducts = Array.isArray(response.products) ? response.products : [];
    const remoteInvoices = Array.isArray(response.invoices) ? response.invoices : [];

    if (remoteProducts.length) {
      state.products = remoteProducts.map(normalizeProductFromApi).filter(product => product.activo !== false);
    }

    state.invoices = remoteInvoices.map(normalizeInvoiceFromApi);

    state.sync.online = true;
    state.sync.lastSync = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.lastSync, state.sync.lastSync);
    persistLocalData();
    renderAll();
    updateSyncState();

    if (!silent) showToast("Sincronización completada con Google Sheets.");
  } catch (error) {
    console.error(error);
    state.sync.online = false;
    updateSyncState("Sin conexión");
    if (!silent) showToast(`No se pudo sincronizar: ${error.message}`);
  } finally {
    state.sync.loading = false;
  }
}

async function apiGet(action, params = {}) {
  const url = new URL(CONFIG.appsScriptUrl);
  url.searchParams.set("action", action);
  url.searchParams.set("apiKey", CONFIG.apiKey);
  url.searchParams.set("_", Date.now());

  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const res = await fetch(url.toString(), {
    method: "GET",
    redirect: "follow",
    cache: "no-store"
  });

  return res.json();
}

async function apiPost(action, payload = {}) {
  if (!CONFIG.appsScriptUrl) return { ok: false, error: "Apps Script URL no configurada." };

  const res = await fetch(CONFIG.appsScriptUrl, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, apiKey: CONFIG.apiKey, payload })
  });

  return res.json();
}

function renderDashboard() {
  const totalProducts = state.products.length;
  const stockTotal = state.products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const saleValue = state.products.reduce((sum, product) => sum + Number(product.precio || 0) * Number(product.stock || 0), 0);
  const investedValue = state.products.reduce((sum, product) => sum + Number(product.costo || 0) * Number(product.stock || 0), 0);
  const projectedProfit = saleValue - investedValue;
  const soldProfit = getRealProfit();
  const outOfStock = state.products.filter(product => Number(product.stock || 0) === 0).length;
  const lowStock = state.products.filter(product => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= CONFIG.lowStockLimit).length;

  const metrics = [
    { label: "Productos", value: totalProducts, icon: "📦", note: "Activos" },
    { label: "Stock", value: stockTotal, icon: "📊", note: "Unidades" },
    { label: "Valor venta", value: money(saleValue), icon: "💰", note: "Precio x stock" },
    { label: "Invertido", value: money(investedValue), icon: "🏷️", note: "Costo x stock" },
    { label: "Ganancia proy.", value: money(projectedProfit), icon: "📈", note: "Venta - costo" },
    { label: "Ganancia real", value: money(soldProfit), icon: "✅", note: "Facturas pagadas" },
    { label: "Agotados", value: outOfStock, icon: "⚠️", note: "Stock cero" },
    { label: "Bajo stock", value: lowStock, icon: "🔔", note: `1 a ${CONFIG.lowStockLimit}` }
  ];

  dom.metricsGrid.innerHTML = metrics.map(metric => `
    <article class="metric-card">
      <span class="metric-icon">${metric.icon}</span>
      <p class="metric-label">${metric.label}</p>
      <p class="metric-value">${metric.value}</p>
      <p class="metric-note">${metric.note}</p>
    </article>
  `).join("");

  renderStockAlerts();
  renderRecentInvoices();
}

function renderStockAlerts() {
  const alerts = state.products
    .filter(product => Number(product.stock || 0) <= CONFIG.lowStockLimit)
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    .slice(0, 8);

  if (!alerts.length) {
    dom.stockAlerts.innerHTML = `<p class="empty-state">Todo el inventario está en buen estado.</p>`;
    return;
  }

  dom.stockAlerts.innerHTML = alerts.map(product => `
    <div class="list-item">
      <div class="item-row">
        <p class="item-title">${escapeHtml(product.nombre)}</p>
        ${stockBadge(product)}
      </div>
      <p class="item-meta">${product.codigo} · ${product.categoria} · Stock: ${product.stock}</p>
    </div>
  `).join("");
}

function renderRecentInvoices() {
  const recent = [...state.invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

  if (!recent.length) {
    dom.recentInvoices.innerHTML = `<p class="empty-state">Todavía no hay facturas o cotizaciones guardadas.</p>`;
    return;
  }

  dom.recentInvoices.innerHTML = recent.map(invoice => `
    <div class="list-item">
      <div class="item-row">
        <p class="item-title">${invoice.code}</p>
        <span class="invoice-status ${statusClass(invoice.status)}">${invoice.status}</span>
      </div>
      <p class="item-meta">${invoice.client.name || "Cliente sin nombre"} · ${money(invoice.totals.total)} · ${formatDate(invoice.createdAt)}</p>
    </div>
  `).join("");
}

function renderCategoryFilters() {
  const categories = ["Todos", ...new Set(state.products.map(product => product.categoria || "Sin categoría"))];

  dom.categoryFilters.innerHTML = categories.map(category => `
    <button class="chip-btn ${state.activeCategory === category ? "active" : ""}" data-category="${escapeHtml(category)}" type="button">
      ${escapeHtml(category)}
    </button>
  `).join("");
}

function renderProducts() {
  const query = normalizeText(dom.searchInput.value);

  const filteredProducts = state.products.filter(product => {
    const matchesCategory = state.activeCategory === "Todos" || product.categoria === state.activeCategory;
    const searchable = normalizeText([product.nombre, product.codigo, product.categoria, product.marca, product.descripcion].join(" "));
    return matchesCategory && searchable.includes(query);
  });

  dom.productCount.textContent = `${filteredProducts.length} productos`;

  if (!filteredProducts.length) {
    dom.productGrid.innerHTML = `<p class="empty-state">No se encontraron productos con ese filtro.</p>`;
    return;
  }

  dom.productGrid.innerHTML = filteredProducts.map(product => {
    const profit = Number(product.precio || 0) - Number(product.costo || 0);
    const stock = Number(product.stock || 0);
    const isOut = stock === 0;

    return `
      <article class="product-card">
        <div class="product-image-wrap">
          <img class="product-image" src="${product.imagen || placeholderSvg(product)}" alt="${escapeHtml(product.nombre)}" loading="lazy" />
        </div>

        <div class="product-body">
          <div class="product-kicker">
            <span class="product-code">${escapeHtml(product.codigo || "SDC")}</span>
            ${stockBadge(product)}
          </div>

          <h3 class="product-title">${escapeHtml(product.nombre)}</h3>
          <p class="product-desc">${escapeHtml(product.descripcion || "Producto disponible en SD COMAYAGUA.")}</p>

          <div class="product-price-line">
            <strong class="price-main">${money(product.precio)}</strong>
            <span class="price-sub">Stock ${stock} · G ${money(profit).replace(CONFIG.currency + " ", "")}</span>
          </div>

          <div class="card-actions">
            <button class="primary-btn compact" data-add-product="${product.id}" type="button" ${isOut ? "disabled" : ""}>
              ${isOut ? "Agotado" : "Agregar"}
            </button>
            <button class="whatsapp-btn compact" data-product-whatsapp="${product.id}" type="button">WhatsApp</button>
            <button class="ghost-btn compact edit-product-btn" data-edit-product="${product.id}" type="button">Editar</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function stockBadge(product) {
  const status = getStockStatus(product);
  return `<span class="stock-badge stock-${status.key}">${status.label}</span>`;
}

function getStockStatus(product) {
  const stock = Number(product.stock || 0);
  if (stock <= 0) return { key: "agotado", label: "Agotado" };
  if (stock <= CONFIG.lowStockLimit) return { key: "bajo", label: "Bajo stock" };
  return { key: "disponible", label: "Disponible" };
}

async function saveProductFromForm(event) {
  event.preventDefault();
  const product = collectProductForm();

  if (!product.nombre) return showToast("Ingrese el nombre del producto.");
  if (!product.categoria) return showToast("Ingrese la categoría del producto.");

  upsertProductLocal(product);
  persistLocalData();
  renderCategoryFilters();
  renderProducts();
  renderDashboard();
  renderConfig();
  showToast("Producto guardado localmente.");

  if (CONFIG.appsScriptUrl) {
    try {
      const result = await apiPost("upsertProduct", { product });
      if (!result.ok) throw new Error(result.error || "No se guardó en Google Sheets.");
      state.sync.online = true;
      state.sync.lastSync = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.lastSync, state.sync.lastSync);
      updateSyncState();
      showToast("Producto sincronizado con Google Sheets.");
    } catch (error) {
      console.error(error);
      state.sync.online = false;
      updateSyncState("Error");
      showToast("No se pudo guardar en Sheets. Quedó respaldo local.");
    }
  }

  resetProductForm();
}

function collectProductForm() {
  const currentId = dom.productIdInput.value.trim();
  const code = dom.productCodeInput.value.trim() || generateProductCode();

  return {
    id: currentId || createProductId(code),
    codigo: code,
    nombre: dom.productNameInput.value.trim(),
    categoria: dom.productCategoryInput.value.trim(),
    marca: dom.productBrandInput.value.trim(),
    precio: Math.max(0, Math.round(Number(dom.productPriceInput.value) || 0)),
    costo: Math.max(0, Math.round(Number(dom.productCostInput.value) || 0)),
    stock: Math.max(0, Math.round(Number(dom.productStockInput.value) || 0)),
    descripcion: dom.productDescriptionInput.value.trim(),
    imagen: dom.productImageInput.value.trim(),
    activo: dom.productActiveInput.checked,
    updatedAt: new Date().toISOString()
  };
}

function upsertProductLocal(product) {
  const existingIndex = state.products.findIndex(item => item.id === product.id);
  if (existingIndex >= 0) state.products[existingIndex] = product;
  else state.products.unshift(product);

  state.products = state.products.filter(item => item.activo !== false);

  if (state.activeCategory !== "Todos" && !state.products.some(item => item.categoria === state.activeCategory)) {
    state.activeCategory = "Todos";
  }
}

function fillProductForm(product) {
  dom.productFormTitle.textContent = "Editar producto";
  dom.productIdInput.value = product.id || "";
  dom.productCodeInput.value = product.codigo || "";
  dom.productNameInput.value = product.nombre || "";
  dom.productCategoryInput.value = product.categoria || "";
  dom.productBrandInput.value = product.marca || "";
  dom.productPriceInput.value = Number(product.precio || 0);
  dom.productCostInput.value = Number(product.costo || 0);
  dom.productStockInput.value = Number(product.stock || 0);
  dom.productImageInput.value = product.imagen || "";
  dom.productDescriptionInput.value = product.descripcion || "";
  dom.productActiveInput.checked = product.activo !== false;
}

function resetProductForm() {
  dom.productFormTitle.textContent = "Agregar producto";
  dom.productIdInput.value = "";
  dom.productCodeInput.value = "";
  dom.productNameInput.value = "";
  dom.productCategoryInput.value = "";
  dom.productBrandInput.value = "";
  dom.productPriceInput.value = "0";
  dom.productCostInput.value = "0";
  dom.productStockInput.value = "0";
  dom.productImageInput.value = "";
  dom.productDescriptionInput.value = "";
  dom.productActiveInput.checked = true;
}

function createProductId(code) {
  const clean = normalizeText(code).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return clean ? `prod-${clean}` : cryptoSafeId();
}

function generateProductCode() {
  const count = state.products.length + 1;
  return `SDC-${String(count).padStart(4, "0")}`;
}

function addToCart(productId) {
  const product = findProduct(productId);
  if (!product) return;

  if (Number(product.stock || 0) <= 0) {
    showToast("Este producto está agotado.");
    return;
  }

  if (!state.draftCode) state.draftCode = generateInvoiceCode(new Date());

  const existing = state.cart.find(item => item.id === product.id);

  if (existing) {
    if (Number(existing.qty) >= Number(product.stock)) {
      showToast("No hay stock suficiente.");
      return;
    }
    existing.qty += 1;
  } else {
    state.cart.push({
      id: product.id,
      codigo: product.codigo,
      nombre: product.nombre,
      categoria: product.categoria,
      marca: product.marca,
      precio: Number(product.precio || 0),
      costo: Number(product.costo || 0),
      stock: Number(product.stock || 0),
      descripcion: product.descripcion,
      qty: 1
    });
  }

  renderCart();
  notifyQuoteChanged();
  showToast(`${product.nombre} agregado.`);
}

function renderCart() {
  dom.editingLabel.textContent = state.editingInvoiceId ? "Editando" : "Nueva";
  dom.cartCount.textContent = `${state.cart.reduce((sum, item) => sum + Number(item.qty || 0), 0)} ítems`;

  if (!state.cart.length) {
    dom.cartList.innerHTML = `<p class="empty-state">Agregue productos desde el catálogo interno.</p>`;
  } else {
    dom.cartList.innerHTML = state.cart.map(item => `
      <div class="cart-item">
        <div class="cart-top">
          <div>
            <p class="cart-name">${escapeHtml(item.nombre)}</p>
            <p class="cart-meta">${item.codigo} · ${money(item.precio)} c/u · Stock: ${item.stock}</p>
          </div>
          <strong>${money(item.precio * item.qty)}</strong>
        </div>

        <div class="item-row">
          <div class="qty-control">
            <button type="button" data-qty-minus="${item.id}">−</button>
            <input type="number" min="1" max="${item.stock}" value="${item.qty}" data-qty-input="${item.id}" aria-label="Cantidad de ${escapeHtml(item.nombre)}" />
            <button type="button" data-qty-plus="${item.id}">+</button>
          </div>

          <button class="mini-btn" data-remove-item="${item.id}" type="button">Quitar</button>
        </div>
      </div>
    `).join("");
  }

  const totals = calculateTotals();

  dom.totalsBox.innerHTML = `
    <div class="total-row"><span>Total de productos</span><strong>${money(totals.subtotal)}</strong></div>
    <div class="total-row"><span>Envío</span><strong>${money(totals.shipping)}</strong></div>
    <div class="total-row"><span>Comisión Pagar al Recibir</span><strong>${money(totals.commission)}</strong></div>
    <div class="total-row"><span>Descuento</span><strong>${money(totals.discount)}</strong></div>
    <div class="total-row final"><span>Total final</span><strong>${money(totals.total)}</strong></div>
  `;

  renderDashboard();
  notifyQuoteChanged();
}

function changeQuantity(productId, delta) {
  const item = state.cart.find(cartItem => cartItem.id === productId);
  if (!item) return;
  setQuantity(productId, Number(item.qty || 1) + delta);
}

function setQuantity(productId, quantity) {
  const item = state.cart.find(cartItem => cartItem.id === productId);
  if (!item) return;

  const cleanQty = Math.max(1, Math.min(Number(quantity) || 1, Number(item.stock || 1)));
  if (Number(quantity) > Number(item.stock)) showToast("La cantidad se ajustó al stock disponible.");

  item.qty = cleanQty;
  renderCart();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.id !== productId);
  renderCart();
}

function clearCurrentQuote() {
  state.cart = [];
  state.editingInvoiceId = null;
  state.draftCode = "";
  resetClientForm();
  renderCart();
  notifyQuoteChanged();
  showToast("Cotización limpia.");
}

function calculateTotals() {
  const subtotal = state.cart.reduce((sum, item) => sum + Number(item.precio || 0) * Number(item.qty || 0), 0);
  const shippingType = dom.shippingType.value;
  const department = normalizeText(dom.departmentInput.value);
  const municipality = normalizeText(dom.municipalityInput.value);

  let shipping = CONFIG.normalShipping;
  let commission = 0;

  if (!state.cart.length) shipping = 0;
  else if (shippingType === "cod") {
    shipping = CONFIG.cashOnDeliveryShipping;
    commission = Math.round((subtotal + shipping) * CONFIG.cashOnDeliveryCommission);
  } else if (shippingType === "local") {
    const isLocal = department === "comayagua" && municipality === "comayagua";
    shipping = isLocal ? CONFIG.localShipping : CONFIG.normalShipping;
  } else {
    shipping = CONFIG.normalShipping;
  }

  const rawDiscount = Number(dom.discountInput.value) || 0;
  const discount = Math.max(0, Math.min(rawDiscount, subtotal + shipping + commission));
  const total = Math.max(0, subtotal + shipping + commission - discount);

  return {
    subtotal,
    shipping,
    commission,
    discount,
    total,
    shippingType,
    shippingLabel: getShippingLabel(shippingType)
  };
}

async function saveInvoice() {
  if (!state.cart.length) return showToast("Agregue al menos un producto antes de guardar.");

  const now = new Date();
  const totals = calculateTotals();
  const client = getClientData();
  const existing = state.editingInvoiceId ? getExistingInvoice(state.editingInvoiceId) : null;

  const invoice = {
    id: state.editingInvoiceId || cryptoSafeId(),
    code: existing?.code || state.draftCode || generateInvoiceCode(now),
    createdAt: existing?.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
    status: dom.invoiceStatus.value,
    client,
    items: state.cart.map(item => ({ ...item })),
    totals
  };

  upsertLocalInvoice(invoice);
  state.editingInvoiceId = invoice.id;
  state.draftCode = invoice.code;
  persistLocalData();
  renderAll();
  notifyQuoteChanged();
  showToast("Cotización guardada localmente.");

  if (CONFIG.appsScriptUrl) {
    try {
      const result = await apiPost("saveInvoice", { invoice });
      if (!result.ok) throw new Error(result.error || "No se guardó en Google Sheets.");
      state.sync.online = true;
      state.sync.lastSync = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.lastSync, state.sync.lastSync);
      updateSyncState();
      showToast("Cotización sincronizada con Google Sheets.");
    } catch (error) {
      console.error(error);
      state.sync.online = false;
      updateSyncState("Error");
      showToast("No se pudo guardar en Sheets. Quedó respaldo local.");
    }
  }
}

function upsertLocalInvoice(invoice) {
  const existingIndex = state.invoices.findIndex(saved => saved.id === invoice.id);
  if (existingIndex >= 0) state.invoices[existingIndex] = invoice;
  else state.invoices.unshift(invoice);
}

function renderInvoices() {
  dom.invoiceCount.textContent = `${state.invoices.length} guardadas`;

  if (!state.invoices.length) {
    dom.invoiceList.innerHTML = `<p class="empty-state">Todavía no hay facturas o cotizaciones guardadas.</p>`;
    return;
  }

  dom.invoiceList.innerHTML = state.invoices.map(invoice => `
    <article class="invoice-item">
      <div class="invoice-top">
        <div>
          <h3>${invoice.code}</h3>
          <p class="invoice-meta">${formatDate(invoice.updatedAt || invoice.createdAt)} · ${escapeHtml(invoice.client.name || "Cliente sin nombre")}</p>
        </div>
        <span class="invoice-status ${statusClass(invoice.status)}">${invoice.status}</span>
      </div>

      <p class="invoice-meta">${invoice.items.length} producto(s) · ${escapeHtml(invoice.client.department || "Sin departamento")}, ${escapeHtml(invoice.client.municipality || "Sin municipio")} · ${escapeHtml(invoice.totals.shippingLabel || "")}</p>

      <div class="total-row final">
        <span>Total</span>
        <strong>${money(invoice.totals.total)}</strong>
      </div>

      <div class="invoice-actions">
        <button class="primary-btn compact" data-load-invoice="${invoice.id}" type="button">Cargar y editar</button>
        <button class="danger-btn compact" data-delete-invoice="${invoice.id}" type="button">Eliminar</button>
      </div>
    </article>
  `).join("");
}

function loadInvoice(invoiceId) {
  const invoice = getExistingInvoice(invoiceId);
  if (!invoice) return;

  state.editingInvoiceId = invoice.id;
  state.draftCode = invoice.code;
  state.cart = invoice.items.map(item => ({ ...item }));

  dom.customerName.value = invoice.client.name || "";
  dom.customerPhone.value = invoice.client.phone || "";
  dom.departmentInput.value = invoice.client.department || "";
  dom.municipalityInput.value = invoice.client.municipality || "";
  dom.addressInput.value = invoice.client.address || "";
  dom.shippingType.value = invoice.totals.shippingType || "normal";
  dom.discountInput.value = invoice.totals.discount || 0;
  dom.invoiceStatus.value = invoice.status || "Cotización";

  renderCart();
  notifyQuoteChanged();
  switchView("pos");
  showToast("Factura cargada. Puede editarla y exportarla.");
}

async function deleteInvoice(invoiceId) {
  const invoice = getExistingInvoice(invoiceId);
  if (!invoice) return;

  if (!confirm(`¿Eliminar ${invoice.code}?`)) return;

  state.invoices = state.invoices.filter(saved => saved.id !== invoiceId);
  if (state.editingInvoiceId === invoiceId) {
    state.editingInvoiceId = null;
    state.draftCode = "";
  }

  persistLocalData();
  renderAll();
  showToast("Factura eliminada localmente.");

  if (CONFIG.appsScriptUrl) {
    try {
      const result = await apiPost("deleteInvoice", { id: invoiceId });
      if (!result.ok) throw new Error(result.error || "No se eliminó en Google Sheets.");
      showToast("Factura eliminada también de Google Sheets.");
    } catch (error) {
      console.error(error);
      showToast("No se pudo eliminar en Sheets. Revise sincronización.");
    }
  }
}

function sendProductWhatsapp(product) {
  const message = [
    "Hola 😊",
    "Le comparto información del producto:",
    "",
    `Producto: ${product.nombre}`,
    `Precio: ${money(product.precio)}`,
    `Stock: ${product.stock}`,
    `Características: ${product.descripcion || "Producto disponible en SD COMAYAGUA."}`,
    "",
    "¿Desea que le ayude con disponibilidad y envío?"
  ].join("\n");

  openWhatsapp(CONFIG.whatsapp, message);
}

function sendQuoteWhatsapp() {
  if (!state.cart.length) return showToast("Agregue productos antes de generar la cotización.");

  const client = getClientData();
  const totals = calculateTotals();
  const targetPhone = normalizePhone(client.phone) || CONFIG.whatsapp;

  const lines = [
    "Hola 😊",
    `Le comparto su cotización de ${CONFIG.storeName}:`,
    "",
    `Código: ${state.draftCode || "Cotización"}`,
    `Cliente: ${client.name || "Cliente"}`,
    `Destino: ${client.department || "Sin departamento"}, ${client.municipality || "Sin municipio"}`,
    `Tipo de envío: ${totals.shippingLabel}`,
    "",
    "Productos:",
    ...state.cart.map((item, index) => `${index + 1}. ${item.nombre} x ${item.qty} — ${money(item.precio * item.qty)} (${money(item.precio)} c/u)`),
    "",
    `Subtotal: ${money(totals.subtotal)}`,
    `Envío: ${money(totals.shipping)}`,
    `Comisión por Pagar al Recibir: ${money(totals.commission)}`,
    `Descuento: ${money(totals.discount)}`,
    "",
    `Total a pagar: ${money(totals.total)}`,
    "",
    "Quedo atento para ayudarle con su pedido."
  ];

  openWhatsapp(targetPhone, lines.join("\n"));
}

function openWhatsapp(phone, message) {
  const cleanPhone = normalizePhone(phone) || CONFIG.whatsapp;
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function renderConfig() {
  const rows = [
    ["Tienda", CONFIG.storeName],
    ["WhatsApp", `+${CONFIG.whatsapp}`],
    ["Moneda", CONFIG.currency],
    ["Google Sheets", CONFIG.appsScriptUrl ? "Activado" : "Pendiente de URL"],
    ["Última sincronización", state.sync.lastSync ? formatDate(state.sync.lastSync) : "Sin sincronizar"],
    ["Envío Normal", money(CONFIG.normalShipping)],
    ["Pagar al Recibir", money(CONFIG.cashOnDeliveryShipping)],
    ["Comisión", `${Math.round(CONFIG.cashOnDeliveryCommission * 100)}%`],
    ["Bajo stock", `${CONFIG.lowStockLimit} unidades o menos`],
    ["Apps Script URL", CONFIG.appsScriptUrl || "Pegue aquí su URL en assets/js/app.js"],
    ["Google Sheet ID", CONFIG.sheetId || "Opcional"]
  ];

  dom.configGrid.innerHTML = rows.map(([label, value]) => `
    <div class="config-item">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");
  updateSyncState();
}

function getClientData() {
  return {
    name: dom.customerName.value.trim(),
    phone: dom.customerPhone.value.trim(),
    department: dom.departmentInput.value.trim(),
    municipality: dom.municipalityInput.value.trim(),
    address: dom.addressInput.value.trim()
  };
}

function getCurrentQuote() {
  if (!state.draftCode && state.cart.length) {
    state.draftCode = generateInvoiceCode(new Date());
  }

  return {
    id: state.editingInvoiceId || "",
    code: state.draftCode || "SDC-COTIZACION",
    createdAt: new Date().toISOString(),
    status: dom.invoiceStatus.value || "Cotización",
    client: getClientData(),
    items: state.cart.map(item => ({ ...item })),
    totals: calculateTotals(),
    store: {
      name: CONFIG.storeName,
      fullName: CONFIG.storeFullName,
      phone: CONFIG.whatsapp,
      currency: CONFIG.currency
    }
  };
}

function notifyQuoteChanged() {
  if (window.SDExport && typeof window.SDExport.renderCurrentPreview === "function") {
    window.SDExport.renderCurrentPreview();
  }
}

function resetClientForm() {
  dom.customerName.value = "";
  dom.customerPhone.value = "";
  dom.departmentInput.value = "";
  dom.municipalityInput.value = "";
  dom.addressInput.value = "";
  dom.shippingType.value = "normal";
  dom.discountInput.value = 0;
  dom.invoiceStatus.value = "Cotización";
}

function getRealProfit() {
  return state.invoices
    .filter(invoice => invoice.status === "Pagado")
    .reduce((sum, invoice) => {
      const invoiceProfit = invoice.items.reduce((itemSum, item) => itemSum + (Number(item.precio || 0) - Number(item.costo || 0)) * Number(item.qty || 0), 0);
      return sum + invoiceProfit;
    }, 0);
}

function getExistingInvoice(invoiceId) {
  return state.invoices.find(invoice => invoice.id === invoiceId);
}

function findProduct(productId) {
  return state.products.find(product => product.id === productId);
}

function getShippingLabel(type) {
  const labels = {
    normal: "Envío Normal",
    cod: "Pagar al Recibir",
    forza: "Forza",
    cargo: "Cargo Expreso",
    c807: "C807",
    local: "Entrega local"
  };
  return labels[type] || "Envío Normal";
}

function normalizeProductFromApi(product) {
  return {
    id: String(product.id || cryptoSafeId()),
    codigo: String(product.codigo || ""),
    nombre: String(product.nombre || "Producto sin nombre"),
    categoria: String(product.categoria || "Sin categoría"),
    marca: String(product.marca || ""),
    precio: Number(product.precio || 0),
    costo: Number(product.costo || 0),
    stock: Number(product.stock || 0),
    descripcion: String(product.descripcion || ""),
    imagen: String(product.imagen || ""),
    activo: parseBool(product.activo),
    updatedAt: product.updatedAt || ""
  };
}

function normalizeInvoiceFromApi(invoice) {
  return {
    id: String(invoice.id || cryptoSafeId()),
    code: String(invoice.code || invoice.codigo || generateInvoiceCode(new Date())),
    createdAt: invoice.createdAt || new Date().toISOString(),
    updatedAt: invoice.updatedAt || invoice.createdAt || new Date().toISOString(),
    status: invoice.status || "Cotización",
    client: invoice.client || {},
    items: Array.isArray(invoice.items) ? invoice.items : [],
    totals: invoice.totals || { subtotal: 0, shipping: 0, commission: 0, discount: 0, total: 0, shippingType: "normal", shippingLabel: "Envío Normal" }
  };
}

function parseBool(value) {
  if (typeof value === "boolean") return value;
  const clean = normalizeText(value);
  if (["false", "no", "0", "inactivo"].includes(clean)) return false;
  return true;
}

function generateInvoiceCode(date) {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SDC-${year}${month}${day}-${random}`;
}

function cryptoSafeId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function money(value) {
  const number = Math.round(Number(value) || 0);
  return `${CONFIG.currency} ${number.toLocaleString("es-HN")}`;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("504")) return digits;
  if (digits.length === 8) return `504${digits}`;
  return digits;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("es-HN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return "Fecha no disponible";
  }
}

function statusClass(status) {
  return `status-${normalizeText(status).replace(/\s+/g, "-")}`;
}

function placeholderSvg(product) {
  const title = encodeURIComponent(String(product.nombre || "Producto").slice(0, 22));
  const category = encodeURIComponent(String(product.categoria || "SDC"));
  const colorA = Number(product.stock || 0) === 0 ? "475569" : "0ea5e9";
  const colorB = Number(product.stock || 0) === 0 ? "1e293b" : "22d3ee";

  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#03111f"/>
          <stop offset="50%" stop-color="#${colorA}"/>
          <stop offset="100%" stop-color="#${colorB}"/>
        </linearGradient>
      </defs>
      <rect width="900" height="900" rx="76" fill="url(#g)"/>
      <circle cx="450" cy="330" r="152" fill="rgba(255,255,255,.14)" stroke="rgba(255,255,255,.55)" stroke-width="4"/>
      <text x="450" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="84" font-weight="800" fill="#ffffff">SD</text>
      <text x="450" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="800" fill="#ffffff">${title}</text>
      <text x="450" y="620" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="rgba(255,255,255,.82)">${category}</text>
    </svg>
  `)}`;
}

let toastTimer = null;
function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove("show"), 2600);
}

window.SDApp = {
  getCurrentQuote,
  money,
  escapeHtml,
  formatDate,
  getLogoUrl: () => "assets/img/logo-sdc-2026.png",
  storeConfig: CONFIG,
  showToast
};
