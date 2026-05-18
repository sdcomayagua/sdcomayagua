import { DEFAULT_CONFIG, STORAGE_KEYS, REQUIRED_PRODUCT_COLUMNS } from './config.js';
import { state, setProducts, setSales, setQuotes, setCustomers, setCart, setSettings, setPendingQueue, notify } from './state.js';
import { deepClone, nowISO, safeJSONStringify, safeJSONParse, toCSV, downloadText } from './utils.js';

export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn('No se pudo leer localStorage', key, error);
    return fallback;
  }
}
export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('No se pudo guardar localStorage', key, error);
    return false;
  }
}

export const sampleProducts = [
  {
    "codigo": "SDC-001",
    "nombre": "Dedales V1 - Fibra de Carbón",
    "categoria": "Dedales",
    "marca": "SD Gamer",
    "precio": 25,
    "costo": 8,
    "stock": 205,
    "colores": "General=205",
    "imagen": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/676160714_2011033109795906_1137673825102398072_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=111&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeELYLJ4oE20mt5HXYNTPY0Y07cSBA2VwTvTtxIEDZXBOz3I9VGz6BDjAq6XHKs_6n--ayg8engCz7FmmDmppOkV&_nc_ohc=igkO9Ng_1WMQ7kNvwHiMZD1&_nc_oc=AdpEt_4wlYk_THOIPKSgbMnvDnfjw0_DRo_Po9AZxTsKGKaUMN0F2OASGzSV0gXAR0g&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=-k0VeS-1WVO13WpJV4Toug&_nc_ss=7b2a8&oh=00_Af5cCxyHuVrB3EfTLqZGaptlSI1M3zFl91upNkIbxwGmHA&oe=6A0A70E6",
    "galeria": "",
    "descripcion": "Dedales gamer para celular, ideales para jugar con mejor deslizamiento, comodidad y precisión. Ayudan a reducir el sudor en pantalla y funcionan muy bien para Free Fire, PUBG Mobile, Call of Duty Mobile y otros juegos táctiles.",
    "promos": "1=25 | 2=50 | 3=69 | 4=92 | 5=110 | 6=132 | 7=154 | 8=168 | 9=189 | 10=200",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Disponible",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-002",
    "nombre": "Dedales V2 - Fibra de Carbón",
    "categoria": "Dedales",
    "marca": "SD Gamer",
    "precio": 50,
    "costo": 0,
    "stock": 7,
    "colores": "General=7",
    "imagen": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/675990410_1784053375902397_1753047428843432918_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=111&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeFDXUwUsFv6uowsNsLqXUeENuMvp3IV1ng24y-nchXWeHz_ou5j6ag2w4mYwF8l98aSeVsdPRsdiFHxSedJ15UR&_nc_ohc=uOpsxN0gFyEQ7kNvwHt2Qve&_nc_oc=AdqpJO8eLFTBL_VBSAOnB18ujrx9TUj_3j-i3jc5ZmKfF0aTfAVwnz4elDMUESEcvDA&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=vInxUpxQUIkv2-DNLHrJVQ&_nc_ss=7b2a8&oh=00_Af6gEbpnFmfoLjBZx1DVlYfz1JBOMR07N4lT6tfntXjU3w&oe=6A0A7827",
    "galeria": "",
    "descripcion": "Dedales gamer versión V2 para celular, con tacto cómodo y buena respuesta en pantalla. Recomendados para quienes buscan más control, mejor deslizamiento y comodidad durante partidas largas.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Disponible",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-003",
    "nombre": "Dedales Gamer Pro Hilo de Plata para Celular",
    "categoria": "Dedales",
    "marca": "SD Gamer",
    "precio": 190,
    "costo": 0,
    "stock": 21,
    "colores": "General=21",
    "imagen": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/676558975_952421207407573_7762917873351242188_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=105&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeHUurhOt6_ruwTnDgAB8n_IMJlDwxYEejAwmUPDFgR6MPyb1LQZ_aLoG2wsZx_xuZe0eohyYfbqxhaQ9HmqzufD&_nc_ohc=2w2NrsSRkRkQ7kNvwFwrYPp&_nc_oc=Adp4Zm40YYUHYe0G8tMDaiXhsvrGVnD1G8h7Td1FySu6WDwl0Cbd61bGPf6AWZf9NyQ&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=c6Kt5Y9_OhkKL3pvchCHmA&_nc_ss=7b2a8&oh=00_Af4uj-GQBPhm9QMTvmf6XAxUJraJZ5F-qUfoSvkAWZ2mDg&oe=6A0A5582",
    "galeria": "",
    "descripcion": "Dedales Memo para gaming móvil, diseñados para mejorar la sensibilidad al tocar la pantalla y mantener un deslizamiento más estable. Ideales para jugadores de Free Fire, PUBG Mobile, COD Mobile y juegos similares.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Disponible",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-004",
    "nombre": "Gatillos Gamer Pro / Triggers Pro para celular",
    "categoria": "Gamer Móvil",
    "marca": "SD Gamer",
    "precio": 400,
    "costo": 190,
    "stock": 11,
    "colores": "General=11",
    "imagen": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/676041307_1622203069066456_833207036229297481_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=102&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeF1LpcG2ri2R6BK98WklS8WLaI0EGwoyC0tojQQbCjILUIr3DzyFRM3mRk8YlU_bSjsiNU3ramv9chW3Cf55Ipx&_nc_ohc=Cb2mzCXckZ8Q7kNvwHEP7zt&_nc_oc=Adru-dCEC_4E8kwYkKCKYXTMZjJIgw1ecl_kBnoUg4ZeG2WW0KyiODbEUa75VkGhwCg&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=RKOfdOxrooSQ7vhF44VQIA&_nc_ss=7b2a8&oh=00_Af7VxgdYfpVbnuYlLG8QEfhuiyqXBJWIXJO4_MaWVfly4g&oe=6A0A596B",
    "galeria": "",
    "descripcion": "Trigger gamer para celular, ideal para mejorar el control al apuntar, disparar y moverse en juegos móviles. Práctico para Free Fire, PUBG Mobile, Call of Duty Mobile y otros juegos de acción.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Disponible",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-005",
    "nombre": "Guantes Hilo de Plata – Marca Memo",
    "categoria": "Gamer Móvil",
    "marca": "MEMO",
    "precio": 360,
    "costo": 110,
    "stock": 2,
    "colores": "General=2",
    "imagen": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/637719085_1398829372273341_225217973062323190_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=110&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeE9gd3kPhEkdJAC9XgvbjnHeDqMU5ENTnZ4OoxTkQ1Odr_M-p88iNJTFY-7PeR7rE2ALLvUW3qi5YVyv0C7paYs&_nc_ohc=je-Mu7QgeysQ7kNvwHVJIOq&_nc_oc=AdqQdhrhve497APQNHd9sO53E2GDKNzdUJ_JoFY8LCZW33drFr7IX_ctP5P9zk66sgM&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=grI71Kg-qVVjEtsb-N-isg&_nc_ss=7b2a8&oh=00_Af6Zu3ZMthkPxGJfSUNhHE3ovt15cOkj3zMFWW0gnlNhWA&oe=6A0A5395",
    "galeria": "",
    "descripcion": "Guantes Memo para gaming móvil, pensados para mayor comodidad, mejor agarre y menos sudor al jugar. Ayudan a mantener un toque más limpio y preciso en la pantalla durante partidas largas.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-006",
    "nombre": "Enfriador X112",
    "categoria": "Coolers",
    "marca": "X112",
    "precio": 400,
    "costo": 250,
    "stock": 2,
    "colores": "General=2",
    "imagen": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t39.84726-6/678969681_1863159007733174_8930140486556014096_n.jpg?stp=dst-jpg_s960x960_tt6&_nc_cat=103&ccb=1-7&_nc_sid=92e707&_nc_eui2=AeGxhI97-NJM92kUUWF1RwZ0awEZrbtLW5NrARmtu0tbk9DqMP09lIeReeCPoBA7JfEIZcbp4W5ahJX7az21i7tI&_nc_ohc=ovc6pnU9rwgQ7kNvwFfKyxV&_nc_oc=AdpRlWWanDrYmaiG89EucQY8q6AjOFO1ASdld4-gaPwUl3ZAXKoqSa5FzMpMYe_7f5M&_nc_zt=14&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=7bJJa9204AqiiFdLg8sd4w&_nc_ss=7b2a8&oh=00_Af77IRQCxtgOu4A0iQdZ4zXKjI6gqOPlKBj9EGP0n00wUA&oe=69FD770A",
    "galeria": "",
    "descripcion": "Enfriador para celular, ayuda a reducir la temperatura del equipo durante partidas largas, manteniendo un mejor rendimiento y mayor comodidad al jugar.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-007",
    "nombre": "Enfriador Memo CX15 PRO | Cooler Magnético para Celular",
    "categoria": "Coolers",
    "marca": "MEMO",
    "precio": 850,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/638624337_1682356099414339_1089494987278792494_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=109&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeGCHo49oeVkT5mATzwQwmOihiNkvbqrevGGI2S9uqt68X08jBF1YRtrjFUOOWHD4375bZRZ5QmuRuD9c1hjdvPE&_nc_ohc=Yv4wPpVjDrEQ7kNvwGYkDBn&_nc_oc=Adrd3hAOLLoZ8_AdtuYi-Ya_MGE7QZNxBHBhAVZZ98Ba7Je__QUYhFfZdghGmFZcBDk&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=RvBtICTNRzJUzv07fUf6gg&_nc_ss=7b2a8&oh=00_Af7iNIx9gWgOJKjVx8wfDIf1qB_09NBJ3HKn3U1i8bUc3Q&oe=6A0A5B58",
    "galeria": "",
    "descripcion": "Enfriador CX15 para celular, práctico para controlar el calentamiento del teléfono durante juegos o uso intenso. Ideal para mantener el dispositivo más fresco y estable.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-008",
    "nombre": "Audifonos QKZ",
    "categoria": "Audio",
    "marca": "QKZ",
    "precio": 120,
    "costo": 0,
    "stock": 2,
    "colores": "General=2",
    "imagen": "https://ae-pic-a1.aliexpress-media.com/kf/S53f972891bfe4e7a9b8676de6d1f06c46.jpg",
    "galeria": "",
    "descripcion": "Audífonos QKZ con cable, ideales para escuchar música, jugar y realizar llamadas con sonido claro. Diseño cómodo para uso diario y buena experiencia de audio.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-009",
    "nombre": "Audifonos Tipo C",
    "categoria": "Audio",
    "marca": "SD Audio",
    "precio": 0,
    "costo": 0,
    "stock": 0,
    "colores": "General=0",
    "imagen": "",
    "galeria": "",
    "descripcion": "Audífonos Tipo C para celulares con entrada USB-C, ideales para música, llamadas, videos y juegos. Una opción práctica para teléfonos que no tienen entrada auxiliar 3.5 mm.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Agotado",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-010",
    "nombre": "Adaptador MicroSD – USB 2.0",
    "categoria": "Tecnología / Accesorios",
    "marca": "SD Tech",
    "precio": 60,
    "costo": 0,
    "stock": 13,
    "colores": "Gris=7; Rosado=3; Negro=2; Dorado=1",
    "imagen": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/634981608_1053118134541037_9222488998596125420_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=110&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeETQBWSBfmOKvGxARwcwUEhnsRjpSUlLnWexGOlJSUudawTVcEPDZhjy0j0nXG-EDRDt0wEfbzuCcc9Dbw47MfA&_nc_ohc=xQ69IIca9xoQ7kNvwFut4rW&_nc_oc=AdoELUWwsrCdMCwMzl1rGJQLUHQloCjahPe1yEnrqG_AKDTViRRt_0H3vYwjCM8h2J8&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=BnWVHmkwVP2Y9LoqJjliQg&_nc_ss=7b2a8&oh=00_Af4tjIlFM-Q-laJVIcbPTt4FXfZ1oalM82Z_wGwQEWIM6Q&oe=6A0A809E",
    "galeria": "",
    "descripcion": "Adaptador para tarjeta MicroSD, útil para convertir una microSD a tamaño SD y facilitar la transferencia de fotos, videos, documentos y otros archivos en computadoras o lectores compatibles.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T12:19:48.237Z",
    "json": {
      "id": "SDC-010",
      "name": "Adaptador MicroSD – USB 2.0",
      "categories": "Tecnología / Accesorios",
      "cost": 0,
      "price": 60,
      "stock": 13,
      "colors": [
        {
          "name": "Gris",
          "qty": 7
        },
        {
          "name": "Rosado",
          "qty": 3
        },
        {
          "name": "Negro",
          "qty": 2
        },
        {
          "name": "Dorado",
          "qty": 1
        }
      ],
      "colores": "Gris:7 | Rosado:3 | Negro:2 | Dorado:1",
      "image": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/634981608_1053118134541037_9222488998596125420_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=110&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeETQBWSBfmOKvGxARwcwUEhnsRjpSUlLnWexGOlJSUudawTVcEPDZhjy0j0nXG-EDRDt0wEfbzuCcc9Dbw47MfA&_nc_ohc=xQ69IIca9xoQ7kNvwFut4rW&_nc_oc=AdoELUWwsrCdMCwMzl1rGJQLUHQloCjahPe1yEnrqG_AKDTViRRt_0H3vYwjCM8h2J8&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=BnWVHmkwVP2Y9LoqJjliQg&_nc_ss=7b2a8&oh=00_Af4tjIlFM-Q-laJVIcbPTt4FXfZ1oalM82Z_wGwQEWIM6Q&oe=6A0A809E",
      "gallery": "",
      "promos": "",
      "description": "Adaptador para tarjeta MicroSD, útil para convertir una microSD a tamaño SD y facilitar la transferencia de fotos, videos, documentos y otros archivos en computadoras o lectores compatibles.",
      "active": true,
      "codigo": "SDC-010",
      "previousCodigo": "SDC-010",
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Disponible",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-011",
    "nombre": "Secador de Zapatos 2 en 1 (Seca y Quita el Mal Olor) – Temporizador hasta 120 min",
    "categoria": "Hogar",
    "marca": "SD Hogar",
    "precio": 350,
    "costo": 210,
    "stock": 5,
    "colores": "General=5",
    "imagen": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/636719338_1643166036822049_3869627812173568291_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=108&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeETEynoebnaJmb-Y_PucfSCM110FEbMdD8zXXQURsx0P0cGPb7RFf9K-yKqb-_f6ZLlj77lAYG2URqWiOOKSjGb&_nc_ohc=WipkGZuVR9sQ7kNvwHjJYl6&_nc_oc=Adqh5kY0elv3OQpwmcjVNQicYwWq2sPAWXmH7d7NNp4CjZWMi2axYdFsIOizokilOdw&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=HH4GzomSDBoEvX41b9V94A&_nc_ss=7b2a8&oh=00_Af7ZoFsyFAVuRowILA3nhqBESPsdQr6ri0yNaxE9RAKaqA&oe=6A0A6C43",
    "galeria": "",
    "descripcion": "Secador de zapatos práctico para ayudar a eliminar humedad del calzado después de lluvia, lavado o uso diario. Ideal para mantener los zapatos más secos, cómodos y con mejor olor.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Disponible",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-012",
    "nombre": "Termo Stanley Rosado",
    "categoria": "Termos / Hogar",
    "marca": "Stanley",
    "precio": 0,
    "costo": 0,
    "stock": 0,
    "colores": "General=0",
    "imagen": "",
    "galeria": "",
    "descripcion": "Termo estilo Stanley color rosado, ideal para llevar bebidas frías o calientes por más tiempo. Diseño moderno, práctico y bonito para uso diario, trabajo, estudio, viajes o gimnasio.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Agotado",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-013",
    "nombre": "Enfriador PRO para Celular – Juega sin LAG, sin Calor",
    "categoria": "Coolers",
    "marca": "SD Gamer",
    "precio": 360,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/638513478_1563676451590509_6639373606200504306_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeHUf81uFW6nZmKYq62Bb9UUqRJelXmrVr2pEl6VeatWve4NbiTG-8y-zy4Gud95_yeEjUaflkR1xvQtp9no4YSZ&_nc_ohc=uIZSdvchW18Q7kNvwFJZhqW&_nc_oc=AdomO11haIHoSFuATT_I3hv2bDnZThxy4kh_5e0RzdGTm-ze7WeJ7rt8Ont1QpTNGRU&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=6FWHXLYLk3xfIJoLHpZOZg&_nc_ss=7b2a8&oh=00_Af7Ns3AVRKqBYrNPq_bMphGgFja08M_nUHBTZEZdkHThag&oe=6A0A6DDF",
    "galeria": "",
    "descripcion": "Enfriador PRO para celular, ideal para ayudar a controlar el calentamiento durante juegos, transmisiones o uso intenso. Recomendado para mantener el equipo más fresco y cómodo en partidas largas.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-014",
    "nombre": "Enfriador o Cooler Gamer para Celular",
    "categoria": "Coolers",
    "marca": "SD Gamer",
    "precio": 150,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/638090475_1202289095220777_1624465346820150004_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=106&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeE4MT4Gcm1fmoFGwTE9g1YmAlyfAwTJqPACXJ8DBMmo8OlhOM_ctagH_Ssw4NrNKsABgAIjIaKVDs4VhHoTEwKJ&_nc_ohc=OgqegbVAMrYQ7kNvwFy6fco&_nc_oc=AdoHnV0tDW_fYZbrxHkH0vfKAsoi6rWkW-F6KeQXYb2XLOxatSHO9Z0RqZoZQ0alaAo&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=sq8_IpBXBtvzNoCWty083g&_nc_ss=7b2a8&oh=00_Af7kJnOoHH0ux_M-p1BTWozJVIItya_eNOMGS3v2Dscn0w&oe=6A0A5772",
    "galeria": "",
    "descripcion": "Cooler gamer para celular, práctico para reducir la temperatura del teléfono mientras jugás. Ayuda a mantener un mejor rendimiento y mayor comodidad durante sesiones prolongadas.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-015",
    "nombre": "Dedales SARAFOX - Hilo de Plata",
    "categoria": "Dedales",
    "marca": "Sarafox",
    "precio": 400,
    "costo": 0,
    "stock": 0,
    "colores": "General=0",
    "imagen": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/628688109_934043255731923_5064943601078365488_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=102&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeGFniKC-UvyuJzMIgxdAmy-XgwT4W75WvdeDBPhbvla98EmE1YfrD1ry8adLrMoJVVUNJI0RDqHlRnqqimmmYmO&_nc_ohc=4Sc0rFKN98YQ7kNvwEnnhZZ&_nc_oc=Adr4h1XgU-CP39KCe7-C9BgG9_I9nyX73kv-FhOLVN4YTbIq9iSPsAfzeBbVd4ctZWo&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=exXaTAq4BP_VPQDQ4JHFGQ&_nc_ss=7b2a8&oh=00_Af7XRuQjsFVY5gBC8Ze1Fetdio2EICmSmm-vtr-i9Ek5vw&oe=6A0A693C",
    "galeria": "",
    "descripcion": "Dedales SARAFOX con hilo de plata para gaming móvil, diseñados para brindar mejor sensibilidad, deslizamiento y precisión en pantalla. Ideales para Free Fire, PUBG Mobile, COD Mobile y juegos táctiles.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Agotado",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-016",
    "nombre": "Gamepad con Cooler para Celular | Android & iOS",
    "categoria": "Controles / Gamepad",
    "marca": "SD Gamer",
    "precio": 490,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/639027101_916011954460111_6170524688724565431_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=108&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeGjnOquKGyGfKM1fkp93akc9FV3lm-avC30VXeWb5q8LdZi61FfEBZnSVAOq3kZFXGiwrds4PJA7jSHo62laf7h&_nc_ohc=qgt0QpMSt6kQ7kNvwGm9eG7&_nc_oc=AdqJOA06ptoX8eZMxX5kdkIHj9gPKAknFj8htgR0uBYVnSGxpIu7ZbSYQl60tEKlqKc&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=8uAnvzt7UFWbV4Ng3K0cLw&_nc_ss=7b2a8&oh=00_Af6OaLQ6-gRFJMlMSApiYrcN9UzllA-F93hXuX0176muJw&oe=6A0A58CF",
    "galeria": "",
    "descripcion": "Gamepad con cooler para celular, compatible con Android y iOS según el equipo. Combina mejor agarre, controles físicos y enfriamiento para jugar con más comodidad.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-017",
    "nombre": "Gamepad MEMO para Celular 4 Gatillos Personalizables Android & iOS",
    "categoria": "Controles / Gamepad",
    "marca": "MEMO",
    "precio": 400,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/640328536_1738858970812086_1196949487915039456_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=107&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeFs0KbnTmwuWhcXN0ToD0Yn_NcKzHEfe7r81wrMcR97uhV-ZtEdpqWqxllvgejEz-8LPcEsfmctPm2ZkxDqow5q&_nc_ohc=3tiptgNIv-wQ7kNvwHQtybP&_nc_oc=AdpNRYdRyfWmXe1A2HUB0tao_C9lK7yhxaBI6kOVrvPBEc6WmNc4JDj7Wca3IhobWas&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=sxqp0oCJQiV_cAKr3KnSLA&_nc_ss=7b2a8&oh=00_Af5ekD5Ko6e3wXiE7-IX-yzm-EtpAuDU-hJdrxm9hgiG0w&oe=6A0A6A54",
    "galeria": "",
    "descripcion": "Gamepad MEMO para celular con 4 gatillos personalizables, pensado para juegos de acción y disparos. Brinda mejor control, agarre firme y una experiencia más cómoda en Android y iOS.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-018",
    "nombre": "GAMEPAD CON COOLER Y JOYSTICK",
    "categoria": "Controles / Gamepad",
    "marca": "SD Gamer",
    "precio": 300,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/641512992_1602162270997657_4897317482266424208_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=109&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeFvLDZG1uRKpyBDIke1WQfBixPRFPzj1mGLE9EU_OPWYQ6XyK_nfTkBtkVLRCDCokmSeUy7IDZbN9n1Z6up4mVl&_nc_ohc=yi3eqRzdyWIQ7kNvwGvWzmG&_nc_oc=Ado1d0fNBgNXeY8bwk79fbql8EhdJW2TAouZdc1Kzw0Jhd69DUU-PmPasJm8qBi-JvA&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=FLd8AhtV3BUyOQi8qlgvMw&_nc_ss=7b2a8&oh=00_Af7YtsMH_6XAilgWsI1xi4LSrd3PSblpulI7_4wFSweAOg&oe=6A0A7B76",
    "galeria": "",
    "descripcion": "Gamepad con cooler y joystick para celular, ideal para quienes buscan mejor control y comodidad al jugar. Su diseño ayuda a sujetar mejor el teléfono y mantenerlo más fresco.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-019",
    "nombre": "Control PRO Inalámbrico Bluetooth Android / iOS / PC / Switch Turbo + Macro",
    "categoria": "Controles / Gamepad",
    "marca": "SD Gamer",
    "precio": 490,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "https://scontent.ftgu2-3.fna.fbcdn.net/v/t45.5328-4/642266149_1957713028176415_4164663008594583667_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=109&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeEmUpvtDoHe1R7OfAlvuSojisnEIqovsJSKycQiqi-wlPzrx0qaF0mWN8SBc7t00qnAqaola8gtbd8BfC7gDx4M&_nc_ohc=A8r8i9u2FegQ7kNvwEw5JYK&_nc_oc=AdqmO3YOJVquIrbj3PZmdSNK_Eo2j8IUtkWF7r-ybWIWVrlBJh7Clrv7Sv1_ivsNIps&_nc_zt=23&_nc_ht=scontent.ftgu2-3.fna&_nc_gid=RwmAoqfY_jwDEWf_AW_nfg&_nc_ss=7b2a8&oh=00_Af7KyuJNvRRjB1MMXVoKqhIbioqYfkExk-62ErCRIXrFjQ&oe=6A0A5DDD",
    "galeria": "",
    "descripcion": "Control PRO inalámbrico Bluetooth para Android, iOS, PC y Nintendo Switch. Incluye funciones Turbo y Macro para una experiencia más completa en juegos compatibles.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-020",
    "nombre": "Control Gamer con Soporte para Celular",
    "categoria": "Controles / Gamepad",
    "marca": "SD Gamer",
    "precio": 420,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/641092147_3338186259680187_3998331395686310384_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeGafZW4fyKzOwIGV0R6D_KwPiuInzeTAIs-K4ifN5MAi5wSM49CqU8tfZFVEeeh4sPUi9tvGE4Gn-zgxu0v9A82&_nc_ohc=UNhwGgQT3zgQ7kNvwG2qedm&_nc_oc=Adqs6YRhUqDod6mrhwjgXDT6v_FUbNfa6oLYlowBuCYZhXdg8VvyPLGSogRwRSYQa0g&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=Ym1y5Z-CdchqZkhZ7tZ9zQ&_nc_ss=7b2a8&oh=00_Af7Gi8G5p9J7wFU5UurFGmNed4-BS_jt7u7B1qlfGhY7Pg&oe=6A0A5EA8",
    "galeria": "",
    "descripcion": "Control gamer con soporte para celular, ideal para jugar con mejor agarre y mayor precisión. Su soporte permite colocar el teléfono de forma cómoda para partidas largas.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-021",
    "nombre": "Mousepad Xtech Rosa con Soporte de Muñeca 23×18cm",
    "categoria": "Mousepad",
    "marca": "Xtech",
    "precio": 150,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Mousepad Xtech color rosa con soporte de muñeca, tamaño 23×18 cm. Brinda una superficie cómoda para el mouse y ayuda a descansar la muñeca durante estudio, oficina o gaming casual.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-022",
    "nombre": "Tira de Esponja para Puertas y Ventanas 70cm Anti Polvo e Insectos",
    "categoria": "Hogar",
    "marca": "SD Hogar",
    "precio": 80,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Tira de esponja para puertas y ventanas de 70 cm, útil para ayudar a bloquear polvo, insectos y corrientes de aire. Ideal para mejorar el sellado de espacios en el hogar.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-023",
    "nombre": "Fuente de Agua para Gato o Perro 3L USB + Filtro",
    "categoria": "Mascotas",
    "marca": "SD Mascotas",
    "precio": 270,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Fuente de agua para gato o perro de 3 litros con conexión USB y filtro. Mantiene el agua en movimiento para incentivar a las mascotas a beber con mayor frecuencia.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-024",
    "nombre": "Funda Protectora para Refrigeradora / Lavadora (Anti Polvo) + Bolsillos",
    "categoria": "Hogar",
    "marca": "SD Hogar",
    "precio": 150,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Funda protectora para refrigeradora o lavadora, ideal para ayudar a proteger contra polvo y salpicaduras. Incluye bolsillos laterales para guardar artículos pequeños del hogar.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-025",
    "nombre": "Funda para Moto Impermeable Metalizada 140×240cm (Protección Sol/Lluvia/Polvo)",
    "categoria": "Hogar / Automotriz",
    "marca": "SD Hogar",
    "precio": 200,
    "costo": 0,
    "stock": 0,
    "colores": "General=0",
    "imagen": "",
    "galeria": "",
    "descripcion": "Funda para moto impermeable metalizada de 140×240 cm, diseñada para proteger contra sol, lluvia y polvo. Práctica para cuidar la motocicleta cuando permanece estacionada.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Agotado",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-026",
    "nombre": "Juego de Destornilladores de Precisión 115 en 1 (PC y Celular)",
    "categoria": "Herramientas",
    "marca": "SD Herramientas",
    "precio": 300,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Juego de destornilladores de precisión 115 en 1, ideal para reparación de celulares, computadoras, laptops, consolas y electrónicos pequeños. Incluye puntas variadas para diferentes trabajos.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-027",
    "nombre": "Cosmetiquera con Espejo LED | 3 tipos de luz (Natural/Fría/Cálida)",
    "categoria": "Belleza",
    "marca": "SD Belleza",
    "precio": 290,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Cosmetiquera con espejo LED y 3 tipos de luz: natural, fría y cálida. Perfecta para organizar maquillaje y retocarse con mejor iluminación en casa o de viaje.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-028",
    "nombre": "Afilador de Cuchillos – 3 Niveles",
    "categoria": "Cocina / Hogar",
    "marca": "SD Hogar",
    "precio": 100,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Afilador de cuchillos de 3 niveles, práctico para recuperar y mantener el filo de cuchillos de cocina. Compacto, fácil de usar y útil para el hogar.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-029",
    "nombre": "Mouse Gamer X12 – 3200DPI",
    "categoria": "Mouse / Tecnología",
    "marca": "SD Tech",
    "precio": 300,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Mouse gamer X12 de 3200 DPI, ideal para juegos, estudio y uso diario en computadora. Diseño cómodo con buen agarre para movimientos más precisos.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-030",
    "nombre": "Memoria USB 3.2 – 256GB",
    "categoria": "Memorias USB",
    "marca": "MEMO",
    "precio": 1050,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Memoria USB 3.2 de 256GB, ideal para guardar fotos, videos, documentos, música y respaldos importantes. Portátil, práctica y fácil de usar en computadoras compatibles.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-031",
    "nombre": "Memoria USB 3.2 – 128GB",
    "categoria": "Memorias USB",
    "marca": "MEMO",
    "precio": 620,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Memoria USB 3.2 de 128GB, excelente para transportar archivos, tareas, fotos y videos. Una opción práctica para estudio, trabajo y respaldo de información.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-032",
    "nombre": "Memoria USB 3.2 – 64GB",
    "categoria": "Memorias USB",
    "marca": "MEMO",
    "precio": 320,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Memoria USB 3.2 de 64GB, compacta y útil para guardar documentos, música, fotos y archivos de uso diario. Ideal para estudiantes, oficina y respaldo rápido.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-033",
    "nombre": "Memoria USB 3.2 – 32GB",
    "categoria": "Memorias USB",
    "marca": "MEMO",
    "precio": 240,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Memoria USB 3.2 de 32GB, práctica para transferir y guardar documentos, tareas, fotos y archivos pequeños. Fácil de llevar y usar en computadoras compatibles.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-034",
    "nombre": "Memoria USB - 16GB",
    "categoria": "Memorias USB",
    "marca": "MEMO",
    "precio": 190,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Memoria USB de 16GB, ideal para guardar documentos, tareas, música y archivos personales. Una opción económica y práctica para uso diario.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-035",
    "nombre": "Memoria MicroSD 256GB – V30 / U3 / A1",
    "categoria": "Memorias MicroSD",
    "marca": "MEMO",
    "precio": 1350,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Memoria MicroSD 256GB V30 / U3 / A1, recomendada para celulares, cámaras y dispositivos compatibles. Ideal para ampliar almacenamiento y guardar fotos, videos y aplicaciones.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-036",
    "nombre": "Maxell MicroSD 128GB – Alta Velocidad",
    "categoria": "Memorias MicroSD",
    "marca": "Maxell",
    "precio": 920,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Memoria Maxell MicroSD 128GB de alta velocidad, ideal para ampliar almacenamiento en celulares, cámaras y otros equipos compatibles. Perfecta para fotos, videos y archivos.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-037",
    "nombre": "Maxell MicroSD 64GB – Clase 10",
    "categoria": "Memorias MicroSD",
    "marca": "Maxell",
    "precio": 450,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Memoria Maxell MicroSD 64GB Clase 10, práctica para celulares, cámaras y dispositivos compatibles. Buena opción para guardar fotos, música, videos y documentos.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-038",
    "nombre": "Maxell MicroSD 32GB – Clase 10",
    "categoria": "Memorias MicroSD",
    "marca": "Maxell",
    "precio": 290,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Memoria Maxell MicroSD 32GB Clase 10, ideal para ampliar almacenamiento en equipos compatibles. Útil para fotos, música, documentos y archivos de uso diario.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-039",
    "nombre": "Maxell MicroSD 16GB – Clase 10",
    "categoria": "Memorias MicroSD",
    "marca": "Maxell",
    "precio": 230,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Memoria Maxell MicroSD 16GB Clase 10, opción práctica para guardar archivos básicos, música, fotos y documentos en celulares o dispositivos compatibles.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": false,
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-040",
    "nombre": "Ubicación Tienda SD-COMAYAGUA (Piedras Bonitas) | WhatsApp 3151-7755",
    "categoria": "Tienda / Información",
    "marca": "SD COMAYAGUA",
    "precio": 0,
    "costo": 0,
    "stock": 1,
    "colores": "General=1",
    "imagen": "https://scontent.ftgu2-2.fna.fbcdn.net/v/t45.5328-4/598893491_1788202175206187_5679804949134251976_n.jpg?stp=dst-jpg_p960x960_tt6&_nc_cat=100&ccb=1-7&_nc_sid=247b10&_nc_eui2=AeHgXW_51aUwSIdlveqoEe2UM8Fly9-sikszwWXL36yKSy6LUNKC_vYZreBxHHrtlMckkuF-ByvmBoNyOStTy5Zy&_nc_ohc=wpfHvWic07UQ7kNvwE0yEhH&_nc_oc=AdrMV7Ee5grf6iJk9FoMThdaDBid7FyTOHruDcJO8hk_NJozNC2CHB1u7lLpXIj0b60&_nc_zt=23&_nc_ht=scontent.ftgu2-2.fna&_nc_gid=gyFEt8WEVWNmPW1q2bkVWw&_nc_ss=7b2a8&oh=00_Af7XZIGgnBzsYfLB8wLKDCRfMFlo-bxcePPoSZdXRNFw2g&oe=6A0A7FDA",
    "galeria": "",
    "descripcion": "Publicación informativa con la ubicación de SD-COMAYAGUA en Piedras Bonitas y contacto por WhatsApp 3151-7755. Sirve para orientar al cliente y facilitar la visita a la tienda.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-041",
    "nombre": "Pastillas de limpieza efervescentes para lavadoras",
    "categoria": "Lavadora",
    "marca": "SD Hogar",
    "precio": 90,
    "costo": 11,
    "stock": 8,
    "colores": "General=8",
    "imagen": "",
    "galeria": "",
    "descripcion": "Producto disponible en SD COMAYAGUA. Ideal para clientes que buscan buena calidad, precio claro y atención por WhatsApp. Categoría: Producto. Disponible para cotización, venta y envío según zona.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Disponible",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-042",
    "nombre": "Cable Tipo V8 2M",
    "categoria": "Cable V8",
    "marca": "SD Tech",
    "precio": 60,
    "costo": 33,
    "stock": 2,
    "colores": "General=2",
    "imagen": "",
    "galeria": "",
    "descripcion": "Producto disponible en SD COMAYAGUA. Ideal para clientes que buscan buena calidad, precio claro y atención por WhatsApp. Categoría: Producto. Disponible para cotización, venta y envío según zona.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-043",
    "nombre": "Picador de Verduras",
    "categoria": "Cocina",
    "marca": "SD Hogar",
    "precio": 110,
    "costo": 57,
    "stock": 3,
    "colores": "General=3",
    "imagen": "",
    "galeria": "",
    "descripcion": "Producto disponible en SD COMAYAGUA. Ideal para clientes que buscan buena calidad, precio claro y atención por WhatsApp. Categoría: Producto. Disponible para cotización, venta y envío según zona.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-044",
    "nombre": "Hervidor de Agua Eléctrico",
    "categoria": "Cocina",
    "marca": "SD Hogar",
    "precio": 300,
    "costo": 185,
    "stock": 1,
    "colores": "General=1",
    "imagen": "",
    "galeria": "",
    "descripcion": "Producto disponible en SD COMAYAGUA. Ideal para clientes que buscan buena calidad, precio claro y atención por WhatsApp. Categoría: Producto. Disponible para cotización, venta y envío según zona.",
    "promos": "",
    "activo": false,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-045",
    "nombre": "Estuche de Maquillaje con Espejo",
    "categoria": "Accesorio de Dama",
    "marca": "SD Belleza",
    "precio": 350,
    "costo": 0,
    "stock": 3,
    "colores": "General=3",
    "imagen": "",
    "galeria": "",
    "descripcion": "Producto disponible en SD COMAYAGUA. Ideal para clientes que buscan buena calidad, precio claro y atención por WhatsApp. Categoría: Producto. Disponible para cotización, venta y envío según zona.",
    "promos": "",
    "activo": false,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-046",
    "nombre": "Pulidor de Faro para Carro",
    "categoria": "Automotriz",
    "marca": "SD Auto",
    "precio": 110,
    "costo": 50,
    "stock": 3,
    "colores": "General=3",
    "imagen": "",
    "galeria": "",
    "descripcion": "Producto disponible en SD COMAYAGUA. Ideal para clientes que buscan buena calidad, precio claro y atención por WhatsApp. Categoría: Producto. Disponible para cotización, venta y envío según zona.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T19:02:25Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Bajo stock",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  },
  {
    "codigo": "SDC-047",
    "nombre": "Adaptador MicroSD Gris",
    "categoria": "Adaptador MicroSD",
    "marca": "SD Tech",
    "precio": 50,
    "costo": 11,
    "stock": 13,
    "colores": "General=13",
    "imagen": "",
    "galeria": "",
    "descripcion": "Producto disponible en SD COMAYAGUA. Ideal para clientes que buscan buena calidad, precio claro y atención por WhatsApp. Categoría: Producto. Disponible para cotización, venta y envío según zona.",
    "promos": "",
    "activo": true,
    "updatedAt": "2026-05-16T04:35:56.467Z",
    "json": {
      "marca_generada": true,
      "marca_fuente": "generada automáticamente",
      "origen_catalogo": "1CATALOGO - 2026 - SDC - inventario.xlsx",
      "fecha_importacion_catalogo": "2026-05-16T19:02:25Z",
      "bajo_stock_minimo": 3,
      "estado_stock": "Disponible",
      "sin_imagen": true,
      "sin_galeria": true,
      "sin_galeria_extra": true
    },
    "syncStatus": "local"
  }
];

export function initializeData() {
  const settings = { ...deepClone(DEFAULT_CONFIG), ...readStorage(STORAGE_KEYS.settings, {}) };
  setSettings(settings);
  const storedProducts = readStorage(STORAGE_KEYS.products, null);
  const oldDemoCodes = ['SDC-0001','SDC-0002','SDC-0003'];
  const isOldDemoCatalog = Array.isArray(storedProducts)
    && storedProducts.length <= 3
    && storedProducts.every(p => oldDemoCodes.includes(String(p.codigo || '')));
  setProducts(Array.isArray(storedProducts) && !isOldDemoCatalog ? storedProducts : sampleProducts);
  setSales(readStorage(STORAGE_KEYS.sales, []));
  setQuotes(readStorage(STORAGE_KEYS.quotes, []));
  setCustomers(readStorage(STORAGE_KEYS.customers, []));
  setCart(readStorage(STORAGE_KEYS.cart, state.cart));
  setPendingQueue(readStorage(STORAGE_KEYS.queue, []));
  state.lastSync = readStorage(STORAGE_KEYS.lastSync, '');
  state.syncLog = readStorage(STORAGE_KEYS.syncLog, []);
  applySavedTheme(settings);
  notify('init');
}

export function persistAll() {
  writeStorage(STORAGE_KEYS.settings, state.settings);
  writeStorage(STORAGE_KEYS.products, state.products);
  writeStorage(STORAGE_KEYS.sales, state.sales);
  writeStorage(STORAGE_KEYS.quotes, state.quotes);
  writeStorage(STORAGE_KEYS.customers, state.customers);
  writeStorage(STORAGE_KEYS.cart, state.cart);
  writeStorage(STORAGE_KEYS.queue, state.pendingQueue);
  writeStorage(STORAGE_KEYS.lastSync, state.lastSync);
  writeStorage(STORAGE_KEYS.syncLog, state.syncLog);
}

export function applySavedTheme(settings=state.settings) {
  document.body.dataset.theme = settings.defaultTheme || 'dark';
  document.body.dataset.accent = settings.defaultAccent || 'blue';
}

export function exportBackup() {
  const payload = {
    version: '1.0.0',
    createdAt: nowISO(),
    settings: state.settings,
    products: state.products,
    sales: state.sales,
    quotes: state.quotes,
    customers: state.customers,
    queue: state.pendingQueue,
  };
  const file = `sd_comayagua_respaldo_${new Date().toISOString().slice(0,10)}.json`;
  downloadText(file, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
  saveBackupSnapshot(payload);
}
export function saveBackupSnapshot(payload) {
  const backups = readStorage(STORAGE_KEYS.backups, []);
  backups.unshift(payload);
  writeStorage(STORAGE_KEYS.backups, backups.slice(0, state.settings.backup?.maxSnapshots || 10));
}
export async function importBackupFile(file) {
  const text = await file.text();
  const payload = JSON.parse(text);
  if (!Array.isArray(payload.products)) throw new Error('El archivo no contiene productos válidos.');
  setProducts(payload.products);
  setSales(payload.sales || []);
  setQuotes(payload.quotes || []);
  setCustomers(payload.customers || []);
  setPendingQueue(payload.queue || []);
  if (payload.settings) setSettings({ ...state.settings, ...payload.settings });
  persistAll();
}
export function exportProductsCSV() {
  downloadText('sd_comayagua_productos.csv', toCSV(state.products, REQUIRED_PRODUCT_COLUMNS), 'text/csv;charset=utf-8');
}
export function exportProductsJSON() {
  downloadText('sd_comayagua_productos.json', JSON.stringify(state.products, null, 2), 'application/json;charset=utf-8');
}
export async function importProductsJSON(file) {
  const text = await file.text();
  const rows = JSON.parse(text);
  if (!Array.isArray(rows)) throw new Error('El JSON debe ser una lista de productos.');
  setProducts(rows.map(p => ({ ...p, json: safeJSONParse(p.json, p.json || {}) })));
  persistAll();
}
export function clearLocalCache() {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  initializeData();
}
