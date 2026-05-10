/* Datos base editables. El separador de categorías es coma, punto y coma o barra vertical. */
window.SDC_CONFIG = {
  storeName: 'SD COMAYAGUA',
  whatsapp: '+504 3151-7755',
  whatsappNumber: '50431517755',
  accessKey: '199311',
  codPercent: 6,
  lowStockLimit: 3,
  currency: 'Lps.'
};

window.SDC_DEPARTMENTS = [
  'Atlántida','Colón','Comayagua','Copán','Cortés','Choluteca','El Paraíso','Francisco Morazán','Gracias a Dios','Intibucá','Islas de la Bahía','La Paz','Lempira','Ocotepeque','Olancho','Santa Bárbara','Valle','Yoro'
];

window.SDC_MUNICIPALITIES = {
  'Atlántida':['La Ceiba','El Porvenir','Esparta','Jutiapa','La Masica','San Francisco','Tela','Arizona'],
  'Colón':['Trujillo','Balfate','Iriona','Limón','Sabá','Santa Fe','Santa Rosa de Aguán','Sonaguera','Tocoa','Bonito Oriental'],
  'Comayagua':['Comayagua','Ajuterique','El Rosario','Esquías','Humuya','La Libertad','Lamaní','La Trinidad','Lejamaní','Meámbar','Minas de Oro','Ojos de Agua','San Jerónimo','San José de Comayagua','San José del Potrero','San Luis','San Sebastián','Siguatepeque','Villa de San Antonio','Las Lajas','Taulabé'],
  'Copán':['Santa Rosa de Copán','Cabañas','Concepción','Copán Ruinas','Corquín','Cucuyagua','Dolores','Dulce Nombre','El Paraíso','Florida','La Jigua','La Unión','Nueva Arcadia','San Agustín','San Antonio','San Jerónimo','San José','San Juan de Opoa','San Nicolás','San Pedro','Santa Rita','Trinidad de Copán','Veracruz'],
  'Cortés':['San Pedro Sula','Choloma','Omoa','Pimienta','Potrerillos','Puerto Cortés','San Antonio de Cortés','San Francisco de Yojoa','San Manuel','Santa Cruz de Yojoa','Villanueva','La Lima'],
  'Choluteca':['Choluteca','Apacilagua','Concepción de María','Duyure','El Corpus','El Triunfo','Marcovia','Morolica','Namasigüe','Orocuina','Pespire','San Antonio de Flores','San Isidro','San José','San Marcos de Colón','Santa Ana de Yusguare'],
  'El Paraíso':['Yuscarán','Alauca','Danlí','El Paraíso','Güinope','Jacaleapa','Liure','Morocelí','Oropolí','Potrerillos','San Antonio de Flores','San Lucas','San Matías','Soledad','Teupasenti','Texiguat','Vado Ancho','Yauyupe','Trojes'],
  'Francisco Morazán':['Distrito Central','Alubarén','Cedros','Curarén','El Porvenir','Guaimaca','La Libertad','La Venta','Lepaterique','Maraita','Marale','Nueva Armenia','Ojojona','Orica','Reitoca','Sabanagrande','San Antonio de Oriente','San Buenaventura','San Ignacio','San Juan de Flores','San Miguelito','Santa Ana','Santa Lucía','Talanga','Tatumbla','Valle de Ángeles','Villa de San Francisco','Vallecillo'],
  'Gracias a Dios':['Puerto Lempira','Brus Laguna','Ahuas','Juan Francisco Bulnes','Ramón Villeda Morales','Wampusirpi'],
  'Intibucá':['La Esperanza','Camasca','Colomoncagua','Concepción','Dolores','Intibucá','Jesús de Otoro','Magdalena','Masaguara','San Antonio','San Isidro','San Juan','San Marcos de la Sierra','San Miguel Guancapla','Santa Lucía','Yamaranguila','San Francisco de Opalaca'],
  'Islas de la Bahía':['Roatán','Guanaja','José Santos Guardiola','Utila'],
  'La Paz':['La Paz','Aguanqueterique','Cabañas','Cane','Chinacla','Guajiquiro','Lauterique','Marcala','Mercedes de Oriente','Opatoro','San Antonio del Norte','San José','San Juan','San Pedro de Tutule','Santa Ana','Santa Elena','Santa María','Santiago de Puringla','Yarula'],
  'Lempira':['Gracias','Belén','Candelaria','Cololaca','Erandique','Gualcince','Guarita','La Campa','La Iguala','Las Flores','La Unión','La Virtud','Lepaera','Mapulaca','Piraera','San Andrés','San Francisco','San Juan Guarita','San Manuel Colohete','San Rafael','San Sebastián','Santa Cruz','Talgua','Tambla','Tomalá','Valladolid','Virginia','San Marcos de Caiquín'],
  'Ocotepeque':['Ocotepeque','Belén Gualcho','Concepción','Dolores Merendón','Fraternidad','La Encarnación','La Labor','Lucerna','Mercedes','San Fernando','San Francisco del Valle','San Jorge','San Marcos','Santa Fe','Sensenti','Sinuapa'],
  'Olancho':['Juticalpa','Campamento','Catacamas','Concordia','Dulce Nombre de Culmí','El Rosario','Esquipulas del Norte','Gualaco','Guarizama','Guata','Guayape','Jano','La Unión','Mangulile','Manto','Salamá','San Esteban','San Francisco de Becerra','San Francisco de la Paz','Santa María del Real','Silca','Yocón','Patuca'],
  'Santa Bárbara':['Santa Bárbara','Arada','Atima','Azacualpa','Ceguaca','Concepción del Norte','Concepción del Sur','Chinda','El Níspero','Gualala','Ilama','Las Vegas','Macuelizo','Naranjito','Nuevo Celilac','Petoa','Protección','Quimistán','San Francisco de Ojuera','San José de Colinas','San Luis','San Marcos','San Nicolás','San Pedro Zacapa','San Vicente Centenario','Santa Rita','Trinidad'],
  'Valle':['Nacaome','Alianza','Amapala','Aramecina','Caridad','Goascorán','Langue','San Francisco de Coray','San Lorenzo'],
  'Yoro':['Yoro','Arenal','El Negrito','El Progreso','Jocón','Morazán','Olanchito','Santa Rita','Sulaco','Victoria','Yorito']
};

window.SDC_DEFAULT_PRODUCTS = [
  {id:'SDC-001',name:'Dedales V1',categories:'Dedales, Gamer Móvil',price:25,cost:0,stock:227,image:'',description:'Dedales gamer táctiles para mejor control en juegos móviles.',promos:'3=69\n6=132\n8=168\n10=200\n12=240\n20=400'},
  {id:'SDC-002',name:'Gatillos Gamer para Celular',categories:'Gamer Móvil, Gatillos',price:400,cost:190,stock:12,image:'',description:'Gatillos para juegos móviles, cómodos y rápidos.',promos:''},
  {id:'SDC-003',name:'Enfriador Gamer para Celular',categories:'Gamer Móvil, Tecnología',price:400,cost:250,stock:2,image:'',description:'Enfriador para celular con ventilación potente.',promos:''}
];

window.SDC_PLACEHOLDERS = {
  gamer:'assets/placeholders/gamer.svg',
  tecnología:'assets/placeholders/tecnologia.svg',
  tecnologia:'assets/placeholders/tecnologia.svg',
  hogar:'assets/placeholders/hogar.svg',
  cocina:'assets/placeholders/hogar.svg',
  default:'assets/placeholders/no-image.svg'
};
