const assert=require('node:assert/strict'),M=require('../assets/js/photo-product-model.js');
// Fragments captured from actual packaging photos, including the failed reader.
const cable=M.combine([
 {text:'DATA CABLE\n70C CABLE\nFAST CHARGING\nX176-48 60 W\nC-C',confidence:75},
 {text:'KOUVOUSEN\nDATA CABLE',confidence:65},
 {text:'C T0 C CABLE\nMODEL:X176 | X176',confidence:56},
 {text:'100\nCM',confidence:77}
],'IMG-20261021-WA0072.jpg');
assert.equal(cable.name,'Cable KOUVOLSEN X176 USB-C a USB-C 60 W');
assert.equal(cable.details.length,100);assert.equal(cable.details.measureUnit,'cm');assert.equal(cable.price,null);assert.equal(cable.stock,null);
assert.equal(M.parse('DATA CABLE\n100 LENGTH\nCM').details.length,100);
const hub=M.parse('Model:\nKOS-9044\n6.5¢m\n7-RORT\nType-C 3.0 HUB');
assert.equal(hub.details.model,'KOS-9044');assert.equal(hub.details.length,6.5);assert.equal(hub.details.size,'7 puertos');
assert.equal(M.parse('FAST DATA CABLE\nX36 3A TC-48\nUSB-TC').details.model,'X36');
assert.equal(M.parse('[<oovousen | 20+U120W |').confidence,'empty','Garbled letters must not produce a successful reading');
assert.equal(M.parse('DATA CABLE\nX176-48 60v\nC-C').details.voltage,undefined,'A stylized power W misread as v must not invent a voltage');
assert.equal(M.parse('DATA CABLE\n2A 8\nLENGT!').details.current,undefined,'An isolated noisy numeric cluster must not become a current rating');
const contradictory=M.combine(['DATA CABLE\nKOUVOLSEN\nMODEL:X176\n60 W\n100 CM','DATA CABLE\n120 W\n1 M']);
assert.equal(contradictory.details.power,undefined);assert.equal(contradictory.details.length,undefined);assert.doesNotMatch(contradictory.description,/60 W|120 W|100 cm|1 m/);assert.match(contradictory.notes.join(' '),/Lecturas diferentes/);
const boundary=M.combine(['DATA CABLE\n100','CM\n60','W']);assert.equal(boundary.details.power,undefined);assert.equal(boundary.details.length,undefined,'Separate OCR regions must not join into a fabricated measurement');
const same=M.combine(['DATA CABLE\n60W','DATA CABLE\n60 W']);assert.equal(same.details.power,'60 W');
assert.equal(M.parse('AIRPODS\nUSB-C').name,'Audífonos tipo AirPods · USB-C','Do not invent a Pro variant');
const numbers=M.parse('28 93 7\n2026','28 93 7.jpg');
assert.equal(numbers.name,'','Una secuencia de números aislados no puede ser el nombre del artículo.');
assert.equal(M.safeProductName('28 93 7'),false);
const solar=M.parse('SOLAR PANEL\nPANEL SOLAR\n100W\nMODELO: PV-100','IMG_28937.jpg');
assert.match(solar.name,/^Panel solar/,'Debe reconocer paneles solares');
assert.equal(solar.category,'Paneles solares');
assert.match(solar.name,/100 W/,'Solo menciona potencia si aparece explícita en la caja.');
assert.equal(solar.price,null,'No inventar precio si no figura en la caja.');
assert.equal(solar.stock,null,'No inventar existencias.');
const garbage=M.parse('roo swil\n90h','34239.jpg');
assert.equal(garbage.name,'','No usar la lectura errónea roo swil como nombre de audífonos.');
assert.equal(garbage.category,'','No inventar la categoría desde letras sueltas.');
const headphones=M.parse('WIRELESS HEADPHONES\n90h\nStereo Sound','34239.jpg');
assert.equal(headphones.name,'Audífonos inalámbricos','Identificar el artículo por el nombre de categoría legible, nunca 90h como modelo.');
assert.equal(headphones.details.model,undefined);
assert.equal(M.parse('EXTENDED ENDURANCE 90h\nroo swil','foto-1.png').name,'');
console.log('PASS reconocimiento: fragmentos reales, marca mal leída, modelo, unidades partidas, puertos, texto ilegible y atributos ambiguos.');
