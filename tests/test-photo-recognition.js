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
console.log('PASS reconocimiento: fragmentos reales, marca mal leída, modelo, unidades partidas, puertos, texto ilegible y atributos ambiguos.');
