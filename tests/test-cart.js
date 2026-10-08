const assert = require('node:assert/strict');
const C = require('../assets/js/core.js');
const P=(name,price,stock,codAllowed=true,discounts='')=>({id:name,name,price,stock,codAllowed,active:true,discounts});
function cart(...lines){return lines.map(([product,qty])=>({product,qty}));}
const yes=cart([P('Mouse',200,5),2]);
assert.equal(C.quote(yes,'cod',{codMinimum:350,codMinimumUnits:2,codRate:.1}).codAllowed,true);
assert.equal(C.quote(yes,'cod',{codMinimum:350,codMinimumUnits:2,codRate:.1}).total,561); // 400+110+51 =561
assert.equal(C.quote(cart([P('Mouse',390,3),1]),'cod').codAllowed,false); // producto único
assert.equal(C.quote(cart([P('Mouse',100,3),3]),'cod').codAllowed,false); // menos L350
assert.equal(C.quote(cart([P('Mouse',200,4),2],[P('Excluido',100,4,false),1]),'cod').codAllowed,false);
assert.equal(C.quote(cart([P('Mouse',200,4),2]),'transfer').total,510);
assert.equal(C.quote(cart([P('Mouse',200,4),2]),'tigo',{tigoRate:.07}).total,547); // 545.7 -> 547
assert.equal(C.quote(cart([P('Mouse',200,4),2]),'cod',{codRate:.1}).balance,400);
assert.equal(C.quote(cart([P('Mouse',200,4),2]),'cod',{codRate:.1}).deposit,161);
assert.equal(C.num('L1.050,00'),1050);
assert.equal(C.num('L250,00'),250);
assert.equal(C.unitPrice(P('Dedales',25,50,true,'6:23,15:20'),7),23);
assert.equal(C.unitPrice(P('Dedales',25,50,true,'6:23,15:20'),16),20);
assert.equal(C.integerTotal(374.5),376); // ceil + 1 oculto
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
