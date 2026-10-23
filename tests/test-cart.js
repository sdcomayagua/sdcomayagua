const assert = require('node:assert/strict');
const C = require('../assets/js/core.js');
const P=(name,price,stock,codAllowed=true,discounts='')=>({id:name,name,price,stock,codAllowed,active:true,discounts});
function cart(...lines){return lines.map(([product,qty])=>({product,qty}));}
const yes=cart([P('Mouse',200,5),2]);
assert.equal(C.quote(yes,'cod',{codMinimum:350,codRate:.1}).codAllowed,true);
assert.equal(C.quote(yes,'cod',{codMinimum:350,codRate:.1}).total,561); // 400+110+51 =561
assert.equal(C.quote(cart([P('Mouse',390,3),1]),'cod').codAllowed,true);
assert.equal(C.quote(cart([P('Mouse',100,3),3]),'cod').codAllowed,false); // menos L350
assert.equal(C.quote(cart([P('Mouse',200,4),2],[P('Excluido',100,4,false),1]),'cod').codAllowed,false);
assert.equal(C.quote(cart([P('Mouse',200,4),2]),'transfer').total,510);
assert.equal(C.quote(cart([P('Mouse',200,4),2]),'tigo',{tigoRate:.07}).total,547); // 545.7 -> 546 + 1
assert.equal(C.quote(cart([P('Mouse',200,4),2]),'cod',{codRate:.1}).balance,400);
assert.equal(C.quote(cart([P('Mouse',200,4),2]),'cod',{codRate:.1}).deposit,161);
assert.equal(C.num('L1.050,00'),1050);
assert.equal(C.num('L250,00'),250);
assert.equal(C.unitPrice(P('Dedales',25,50,true,'6:23,15:20'),7),23);
assert.equal(C.unitPrice(P('Dedales',25,50,true,'6:23,15:20'),16),20);
assert.equal(C.integerTotal(374.5),376); // siguiente entero + L 1
assert.equal(C.integerTotal(375),375);
assert.notEqual(C.number(),C.number());
console.log('PASS pruebas básicas: COD restringido, modalidad Tigo Money, envío 110, descuentos, moneda y número único.');

// Reglas de pago al recibir solicitadas (envío + comisión de anticipo).
const c40=C.quote(cart([P('Dedales V1',25,50,true,'20:20'),40]),'cod');
assert.deepEqual([c40.subtotal,c40.shipping,c40.fee,c40.total,c40.deposit,c40.balance],[800,110,91,1001,201,800]);
const combo=C.quote(cart([P('Cargador',250,3),1],[P('Adaptador',120,3),1]),'cod');
assert.deepEqual([combo.subtotal,combo.shipping,combo.fee,combo.total,combo.deposit,combo.balance],[370,110,48,528,158,370]);
const rounding=C.quote(cart([P('Uno',365,5),2]),'cod');
assert.equal(rounding.deposit,194); // P=730, base=840, comisión L84
const decimal=C.quote(cart([P('Combo A',300,5),1],[P('Combo B',65,5),1]),'cod');
assert.deepEqual([decimal.subtotal,decimal.fee,decimal.total,decimal.deposit,decimal.balance],[365,49,524,159,365]);
const w=C.waMessage(cart([P('Dedales V1',25,50,true,'20:20'),40]),c40,'GC-TEST');
assert.match(w,/ANTICIPO A DEPOSITAR.*L 201/);assert.match(w,/SALDO EN EFECTIVO.*L 800/);
console.log('PASS ejemplos reales: L 800 => L 201/L 800; L 370 => L 158/L 370; decimales; WhatsApp.');

// El mínimo depende del subtotal después de descuentos, sin exigir unidades.
for(const [price,total,deposit] of [[700,891,191],[900,1111,211]]){
 const q=C.quote(cart([P('Producto único',price,1),1]),'cod');
 assert.equal(q.codAllowed,true);
 assert.deepEqual([q.subtotal,q.total,q.deposit,q.balance],[price,total,deposit,price]);
 assert.deepEqual(q.reasons,[]);
}
assert.equal(C.quote(cart([P('Mínimo exacto',350,1),1]),'cod').codAllowed,true);
assert.equal(C.quote(cart([P('Bajo mínimo',349,1),1]),'cod').codAllowed,false);
assert.equal(C.quote(cart([P('Varios baratos',100,10),3]),'cod').codAllowed,false);
assert.equal(C.quote(cart([P('Varios suficientes',125,10),3]),'cod').codAllowed,true);
assert.equal(C.quote(cart([P('Con descuento',400,5,true,'1:340'),1]),'cod').codAllowed,false);
assert.equal(C.quote(cart([{...P('Promoción',400,5),promoPrice:340},1]),'cod').codAllowed,false);
assert.equal(C.quote(cart([P('Restringido',900,1,false),1]),'cod').codAllowed,false);
assert.equal(C.quote([], 'cod').codAllowed,false);
assert.equal(C.quote(cart([P('Configuración antigua',700,1),1]),'cod',{codMinimum:350,codMinimumUnits:10}).codAllowed,true);
assert.equal(C.quote(cart([P('Mínimo configurable',700,1),1]),'cod',{codMinimum:750}).codAllowed,false);
console.log('PASS mínimo por importe: una unidad, límite exacto, descuentos, restricciones y configuración antigua.');

// Los datos de destino son opcionales y solo pasan al mensaje solicitado.
const destination=C.waMessage(yes,C.quote(yes,'transfer'),'GC-DESTINO',{name:'Cliente de prueba',department:'Comayagua',city:'Ajuterique',address:'Barrio central'});
assert.match(destination,/DATOS PARA EL ENVÍO/);assert.match(destination,/Municipio \/ ciudad: Ajuterique/);
assert.ok(!C.waMessage(yes,C.quote(yes,'transfer'),'GC-SIN-DESTINO').includes('DATOS PARA EL ENVÍO'));
assert.equal(C.matchesSearch('Adaptador USB-C, código OTG-001','otg-001 adaptador'),true);
assert.equal(C.matchesSearch('Cámara inalámbrica','camara inalambrica'),true);
assert.equal(C.matchesSearch('Adaptador USB-C','mouse'),false);

// El lempira adicional se aplica solo cuando hay fracción, una vez por cotización.
for(const [raw,expected] of [[374.01,376],[374.5,376],[374.99,376],[375,375],[375.00000000001,375],[0,0]])assert.equal(C.integerTotal(raw),expected);
for(const mode of ['transfer','tigo','cod'])assert.equal(C.quote([],mode).total,0);
const fraction=C.quote(cart([P('Con fracción',264.5,2),1]),'transfer');
assert.equal(fraction.total,376);assert.equal(fraction.deposit,376);
const tigo=C.quote(yes,'tigo'),tigoMessage=C.waMessage(yes,tigo,'GC-PRUEBA');
assert.equal(tigo.total,547);assert.equal(tigo.fee,37);assert.match(tigoMessage,/TOTAL: L 547/);
assert.ok(!/redondeo|adicional|porcentaje|7%/i.test(tigoMessage),'El ajuste forma parte del total, sin una línea adicional');
assert.equal(decimal.deposit+decimal.balance,decimal.total);
console.log('PASS redondeo solicitado: siguiente entero más L 1 solo si hay fracción, mismo cálculo en cada modalidad y sin duplicar ajuste.');

// Cada cotización elige su entrega; las tarifas generales y reglas de pago siguen vigentes.
const order=cart([P('Cargador',250,3),1],[P('Cable',120,3),1]),config={shipping:110,codMinimum:350,codRate:.1,tigoRate:.07};
for(const [delivery,shipping,label] of [[{},110,'Envío nacional'],[{mode:'local',amount:50},50,'Envío en Comayagua'],[{mode:'local',amount:'0'},0,'Envío en Comayagua'],[{mode:'pickup'},0,'Retiro en tienda'],[{mode:'free',note:'Entrega en mi ruta'},0,'Envío gratis']]){
 for(const mode of ['transfer','tigo','cod']){
  const q=C.quote(order,mode,config,delivery);
  assert.equal(q.delivery.valid,true);assert.equal(q.shipping,shipping);assert.equal(q.delivery.label,label);
  assert.equal(q.total,C.integerTotal((370+shipping)*(mode==='cod'?1.1:mode==='tigo'?1.07:1)));
  assert.equal(q.deposit+q.balance,q.total);
  const message=C.waMessage(order,q,'GC-ENTREGA');assert.ok(message.includes('Entrega: '+label));assert.ok(message.includes('Envío: '+C.money(shipping)));assert.ok(message.includes('TOTAL: '+C.money(q.total)));
 }
}
assert.equal(config.shipping,110,'Una cotización no cambia la tarifa nacional');
assert.equal(C.quote(order,'transfer',config).total,480);
assert.equal(C.quote(order,'transfer',config,{mode:'free'}).total,370);
assert.equal(C.quote(order,'transfer',config,{mode:'local',amount:50}).total,420);
assert.equal(C.quote(order,'cod',config,{mode:'free'}).deposit,37);
assert.equal(C.quote(order,'cod',config,{mode:'free'}).balance,370);
assert.equal(C.quote(order,'tigo',config,{mode:'free'}).total,397);
assert.equal(C.quote(order,'transfer',{shipping:180},{mode:'national'}).shipping,180);
assert.equal(C.quote(order,'transfer',{shipping:180},{mode:'local',amount:50}).shipping,50);
for(const amount of ['', ' ',null,undefined,-1,'-50',1.5,'0.50',NaN,Infinity,'texto',1000001,true,{}]){
 const q=C.quote(order,'transfer',config,{mode:'local',amount});assert.equal(q.delivery.valid,false,'Rechazar costo inválido: '+String(amount));assert.ok(q.delivery.error);
}
assert.equal(C.deliveryOption(config,{mode:'local',amount:1000000}).valid,true);
assert.equal(C.deliveryOption(config,{mode:'constructor'}).valid,false);
assert.equal(C.deliveryOption(config,{mode:'desconocido'}).valid,false);
assert.equal(C.quote(cart([P('Restringido',400,1,false),1]),'cod',config,{mode:'free'}).codAllowed,false);
assert.equal(C.quote(cart([P('Bajo mínimo',349,1),1]),'cod',config,{mode:'pickup'}).codAllowed,false);
for(const mode of ['free','pickup','local'])assert.equal(C.quote([],'transfer',config,{mode,amount:50}).total,0);
const freeQuote=C.quote(order,'transfer',config,{mode:'free',note:'  Compra grande  '});assert.equal(freeQuote.delivery.note,'Compra grande');
assert.match(C.waMessage(order,freeQuote,'GC-GRATIS'),/Motivo del envío gratis: Compra grande/);
assert.equal(C.quote(order,'transfer',config,{mode:'national',note:'Texto anterior'}).delivery.note,'');
assert.match(C.waMessage(order,C.quote(order,'cod',config,{mode:'pickup'}),'GC-RETIRO'),/SALDO EN EFECTIVO AL RETIRAR/);
console.log('PASS entrega por cotización: nacional, Comayagua, retiro, gratis, costos inválidos, comisiones, anticipo, restricciones y WhatsApp.');

