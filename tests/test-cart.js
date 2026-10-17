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
assert.equal(C.quote(cart([P('Mouse',200,4),2]),'tigo',{tigoRate:.07}).total,546); // 545.7 -> 546
assert.equal(C.quote(cart([P('Mouse',200,4),2]),'cod',{codRate:.1}).balance,400);
assert.equal(C.quote(cart([P('Mouse',200,4),2]),'cod',{codRate:.1}).deposit,161);
assert.equal(C.num('L1.050,00'),1050);
assert.equal(C.num('L250,00'),250);
assert.equal(C.unitPrice(P('Dedales',25,50,true,'6:23,15:20'),7),23);
assert.equal(C.unitPrice(P('Dedales',25,50,true,'6:23,15:20'),16),20);
assert.equal(C.integerTotal(374.5),375); // siguiente entero
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
assert.deepEqual([decimal.subtotal,decimal.fee,decimal.total,decimal.deposit,decimal.balance],[365,48,523,158,365]);
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
