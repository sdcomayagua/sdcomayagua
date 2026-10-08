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
assert.equal(C.quote(cart([P('Mouse',200,4),2]),'cod',{codRate:.1}).balance,451);
assert.equal(C.num('L1.050,00'),1050);
assert.equal(C.num('L250,00'),250);
assert.equal(C.unitPrice(P('Dedales',25,50,true,'6:23,15:20'),7),23);
assert.equal(C.unitPrice(P('Dedales',25,50,true,'6:23,15:20'),16),20);
assert.equal(C.integerTotal(374.5),376); // ceil + 1 oculto
assert.equal(C.integerTotal(375),375);
assert.notEqual(C.number(),C.number());
console.log('PASS 13 pruebas: COD restringido, modalidad Tigo Money, envío 110, descuentos, moneda y número único.');
