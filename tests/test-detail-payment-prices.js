/* Confirma que la ficha use exactamente el mismo cálculo que el carrito. */
const assert=require('node:assert/strict');
const C=require('../assets/js/core.js');
const prod={id:'prueba',name:'Producto de prueba',price:540,stock:5,codAllowed:true,active:true,freeShipping:false};
const s={shipping:110,codMinimum:350,codRate:.15,tigoRate:.10};
const q=m=>C.quote([{product:prod,qty:1}],m,s,{mode:'national'});
assert.deepEqual([q('transfer').total,q('tigo').total,q('cod').total],[650,715,749]);
assert.equal(q('cod').deposit,209);
assert.equal(q('cod').balance,540);
assert.equal(q('cod').codAllowed,true);
const cheap={...prod,id:'barato',price:250};
const low=C.quote([{product:cheap,qty:1}],'cod',s,{mode:'national'});
assert.equal(low.codAllowed,false);
assert.equal(low.total,414);
const noCOD={...prod,codAllowed:false};
assert.equal(C.quote([{product:noCOD,qty:1}],'cod',s).codAllowed,false);
const free={...prod,freeShipping:true};
assert.deepEqual(['transfer','tigo','cod'].map(m=>C.quote([{product:free,qty:1}],m,s).shipping),[0,0,0]);
console.log('PASS: totales de los 3 métodos, anticipo, saldo, envío gratis y restricciones.');
