(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GC_PHOTO_MODEL=api;})(typeof window==='object'?window:this,function(){
 'use strict';
 const normalized=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[‐‑–—]/g,'-');
 const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
 function filenameName(filename){
  const name=String(filename||'').replace(/\.[^.]+$/,'').replace(/\s*\(\d+\)$/,'').replace(/[_]+/g,' ').trim();
  return /^(?:IMG[- _]?\d|WhatsApp[- _]?Image|image[ (]?\d|\d{8,}|DSC[- _]?\d|photo[- _]?\d)/i.test(name)?'':name.slice(0,180);
 }
 function amount(raw){
  let s=String(raw).replace(/\s/g,'');
  if(/^[\d,]+\.\d{1,2}$/.test(s))s=s.replace(/,/g,'');
  else if(/^\d{1,3}(?:[.,]\d{3})+$/.test(s))s=s.replace(/[.,]/g,'');
  else if(/^\d+,\d{1,2}$/.test(s))s=s.replace(',','.');
  const n=Number(s);return Number.isFinite(n)&&n>0&&n<1000000?n:null;
 }
 function categoryName(wanted,categories){return (categories||[]).find(v=>normalized(v).toLowerCase()===normalized(wanted).toLowerCase())||wanted;}
 function distance(a,b){
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=0;i<a.length;i++){const next=[i+1];for(let j=0;j<b.length;j++)next.push(Math.min(next[j]+1,prev[j+1]+1,prev[j]+(a[i]===b[j]?0:1)));prev=next;}
  return prev[b.length];
 }
 function assessment(draft){
  const details=draft.details||{},fields=Object.keys(details).length;
  const identified=!!draft.type;
  const score=(identified?4:0)+(details.brand?3:0)+(details.model?4:0)+fields*2+(draft.price!==null?2:0);
  let complete=identified&&!!details.brand&&!!details.model&&fields>=3;
  if(draft.type==='cable')complete=complete&&!!details.connection&&!!details.length&&!!(details.power||details.current);
  if(draft.type==='kit')complete=!!details.model&&!!details.included;
  return {score,fields,identified,complete,confidence:identified&&(details.brand||details.model||fields>=2)?'review':identified||fields?'partial':'empty'};
 }
 function descriptionFor(draft){
  const d=draft.details,specs=[d.power&&'Potencia indicada en el empaque: '+d.power,d.current&&'Corriente indicada: '+d.current,d.voltage&&'Voltaje indicado: '+d.voltage,d.length&&'Largo: '+d.length+' '+d.measureUnit,d.size,d.material];
  return clean((draft.type?draft.name+'.':'')+(d.included?' Incluye '+d.included+'.':'')+(specs.some(Boolean)?' '+specs.filter(Boolean).join('. ')+'.':'')+(!draft.codAllowed?' Pago solo por depósito o transferencia.':''));
 }
 function parse(raw,filename='',categories=[]){
  const text=String(raw||'').slice(0,16000),n=normalized(text),upper=n.toUpperCase(),details={},notes=[];
  const brandRules=[[/KOUVOLSEN/i,'KOUVOLSEN'],[/ARGOM\s*(?:TECH)?/i,'ArgomTech'],[/VOLTRAX/i,'VOLTRAX'],[/\bMEMO\b/i,'MEMO'],[/\bMAXELL\b/i,'Maxell'],[/\bPRIMUS\b/i,'Primus'],[/\bSARAFOX\b/i,'SARAFOX'],[/\bAOAS\b/i,'AOAS'],[/\bAOC\b/i,'AOC'],[/\bANDOWL\b/i,'Andowl'],[/\bREDRAGON\b/i,'Redragon']];
  for(const [re,brand] of brandRules)if(re.test(n)){details.brand=brand;break;}
  if(!details.brand){
   const tokens=upper.match(/[A-Z0-9]{6,18}/g)||[];
   for(const [,brand] of brandRules){const word=brand.toUpperCase();if(word.length>=6&&tokens.some(token=>Math.abs(token.length-word.length)<=1&&distance(token,word)===1)){details.brand=brand;notes.push('Revisá la marca: se corrigió una letra de la lectura.');break;}}
  }
  if(!details.brand){const explicit=n.match(/\b(?:BRAND|MARCA)\s*[:=]\s*([A-Z][A-Z0-9 .-]{1,30})/i);if(explicit)details.brand=clean(explicit[1]);}
  const model=n.match(/\b(?:MODEL(?:O)?\s*[:.#-]?\s*)([A-Z0-9][A-Z0-9-]{1,24})\b/i)||n.match(/\b(KOS-\d{3,6}|CX\d{2}(?:\s*PRO)?|X\d{2,4}|VC\d{2,4})\b/i);
  if(model)details.model=clean(model[1]).toUpperCase();
  const power=upper.match(/\b(\d{1,4}(?:[.,]\d{1,2})?)[\s]{0,4}W(?:ATT(?:S)?)?\b/);
  const current=upper.match(/\b(\d{1,2}(?:[.,]\d{1,2})?)[\s]{0,4}A(?:MP(?:ERES|S)?)?\b(?![ \t]*\d)/);
  const voltage=upper.match(/\b(?:INPUT|OUTPUT|ENTRADA|SALIDA|VOLTAGE|VOLTAJE)\s*[:=]?\s*(\d{1,3}(?:[.,]\d{1,2})?(?:\s*[-/]\s*\d{1,3}(?:[.,]\d{1,2})?)?)[ \t]{0,2}V(?:OLTS?|OLTIOS?)?\b/);
  if(power)details.power=power[1].replace(',','.')+' W';
  if(current)details.current=current[1].replace(',','.')+' A';
  if(voltage)details.voltage=voltage[1].replace(',','.')+' V';
  const length=n.replace(/¢c?m\b/gi,'cm').match(/\b(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:(?:LENGTH|LARGO|LONGITUD)\s*)?(CM|MM|METROS?|M)\b/i);
  if(length){details.length=Number(length[1].replace(',','.'));details.measureUnit=/^METRO|^M$/i.test(length[2])?'m':length[2].toLowerCase();}
  if(/\bC\s*(?:T[O0]|A|-)\s*C\b|USB[-\s]?C\s*(?:A|TO)\s*USB[-\s]?C/i.test(n))details.connection='USB-C a USB-C';
  else if(/\bUSB[-\s]?(?:A|TC)\b[\s\S]{0,30}(?:TYPE[-\s]?C|TIPO\s*C)|USB\s*[-/]\s*TC/i.test(n))details.connection='USB-A a USB-C';
  else if(/TYPE[-\s]?C|TIPO\s*C|USB[-\s]?C/i.test(n))details.connection='USB-C';
  if(/BRAIDED\s+NYLON|NYLON\s+SHIELD|NAILON\s+TRENZADO/i.test(n))details.material='Nailon trenzado';
  let category='',name='',type='';
  const kit=(n+' '+filenameName(filename)).match(/M[O0]B[IL1]{1,3}AD[O0]R\s*V\s*(\d{1,2})/i);
  if(kit){
   category='KIT GAMER';name='Kit Gamer Mobilador V'+kit[1];type='kit';details.model='Mobilador V'+kit[1];delete details.brand;
   const included=[];if(/TECLADO/i.test(n))included.push('teclado');if(/\bMOUSE\b/i.test(n))included.push('mouse');if(/MOUSE\s*PAD/i.test(n))included.push('mousepad');if(/HUB\s*USB/i.test(n))included.push('hub USB');if(/SOPORTE\s+PARA\s+CELULAR/i.test(n))included.push('soporte para celular');
   if(included.length)details.included=included.join(', ');
   const dpi=n.match(/MOUSE\s+(\d[\d,.]*)\s*DPI/i);if(dpi)details.technology='Mouse '+dpi[1]+' DPI';
  }else if(/DEDALES|FINGER\s+SLEEVE/i.test(n)){category='Dedales';type='dedales';name='Dedales'+(details.brand?' '+details.brand:'')+(details.model?' '+details.model:'');}
  else if(/PHONE\s*COOLER|ENFRIADOR|\bCOOLER\b/i.test(n)){category='Coolers';type='enfriador';name='Enfriador'+(details.brand?' '+details.brand:'')+(details.model?' '+details.model:'');}
  else if(/\bHUB\b/i.test(n)){category='Adaptador';type='hub';name='Hub USB'+(details.brand?' '+details.brand:'')+(details.model?' '+details.model:'');const ports=n.match(/\b([2-9]|1[0-2])\s*[- ]?\s*[PRB]ORT(?:S)?\b/i)||n.match(/\b(?:OUTPUT\s*)?USB\s*X\s*([2-9]|1[0-2])\b/i);if(ports)details.size=ports[1]+' puertos';}
  else if(/AIR\s*PODS/i.test(n)){category='Audio';type='audio';name='Audífonos tipo AirPods'+(/\bPRO\b/i.test(n)?' Pro':'')+(/2ND\s*GEN|2\.?\s*GEN/i.test(n)?' · 2.ª generación':'')+(details.connection?' · '+details.connection:'');notes.push('Confirmá la marca y originalidad antes de publicar.');}
  else if(/DATA\s*CABLE|\bCABLE\b/i.test(n)){category='Cables USB-C';type='cable';name='Cable'+(details.brand?' '+details.brand:'')+(details.model?' '+details.model:'')+(details.connection?' '+details.connection:'')+(details.power?' '+details.power:'');}
  else if(/CHARGER|CARGADOR/i.test(n)){category='Cargador para Celular';type='cargador';name='Cargador'+(details.brand?' '+details.brand:'')+(details.model?' '+details.model:'')+(details.power?' '+details.power:'');}
  else if(/MOUSE\s*PAD/i.test(n)){category='Mousepad';type='mousepad';name='Mousepad'+(details.brand?' '+details.brand:'');}
  else if(/\bMOUSE\b/i.test(n)){category='Mouse';type='mouse';name='Mouse'+(details.brand?' '+details.brand:'')+(details.model?' '+details.model:'');}
  else if(/GAME\s*PAD|CONTROL\s*(?:GAMER|INALAMBRICO)/i.test(n)){category='Gamepad';type='control';name='Control'+(details.brand?' '+details.brand:'')+(details.model?' '+details.model:'');}
  const fromFile=filenameName(filename);
  if(!name&&fromFile)name=fromFile;
  if(!name){
   const title=text.split(/\n/).map(clean).find(line=>line.length>=8&&line.length<=90&&line.split(/\s+/).filter(word=>/^[A-Za-zÀ-ÿ]{3,}$/.test(word)).length>=2&&line.replace(/[^A-Za-zÀ-ÿ\s]/g,'').length/line.length>.85&&!/(?:ENVIO|COMAYAGUA|WHATSAPP|LLAMANOS|TALLAS|QUALITY|CHARGING|LENGTH|MODELO?\s*:)/i.test(normalized(line)));
   if(title)name=title;
  }
  const prices=[...n.matchAll(/(?:\bLPS\.?|\bHNL|\bL\.|\bPRECIO\s*[:=])\s*(\d[\d.,]*(?:\s*\d{3})?)/gi)].map(m=>amount(m[1])).filter(v=>v!==null);
  const unique=[...new Set(prices)];const price=unique.length===1?unique[0]:null;
  if(unique.length>1)notes.push('Se detectaron varios precios: elegí el de venta.');
  if(price===null)notes.push('Precio de venta pendiente de confirmar.');
  const depositOnly=/SOLO\s*DEPOSITO|SOLO\s*TRANSFERENCIA|PAGAR\s+AL\s+RECIBIR\s*\(?NO\s*DISPONIBLE/i.test(n);
  const freeShipping=/ENVIO\s*GRATIS|ENVIO\s+INCLUIDO/i.test(n);
  if(freeShipping)notes.push('La imagen anuncia envío gratis. Confirmá esa condición en la ficha antes de activarla.');
  notes.push('Existencias pendientes de confirmar.');
  const draft={name:clean(name).slice(0,180),category:categoryName(category,categories),price,stock:null,codAllowed:!depositOnly,freeShipping,details,notes,text,type};draft.description=descriptionFor(draft);
  draft.confidence=assessment(draft).confidence;return draft;
 }
 function combine(readings,filename='',categories=[]){
  const inputs=readings.map(value=>typeof value==='string'?{text:value}:value).filter(value=>value&&String(value.text||'').trim());
  // Each pass is separated by a sentinel so digits from unrelated regions never
  // turn into a new measurement at the boundary between two OCR results.
  const draft=parse(inputs.map(value=>value.text).join('\n\n---\n\n'),filename,categories),parsed=inputs.map(value=>parse(value.text,'',categories));
  const conflicts=[];
  for(const key of ['power','current','voltage','length','size']){
   const values=[...new Set(parsed.filter(d=>d.details[key]!==undefined).map(d=>key==='length'?JSON.stringify([d.details.length,d.details.measureUnit]):String(d.details[key])))];
   if(values.length>1){delete draft.details[key];if(key==='length')delete draft.details.measureUnit;conflicts.push(({power:'potencia',current:'corriente',voltage:'voltaje',length:'largo',size:'puertos'})[key]);}
  }
  if(conflicts.length){draft.notes.push('Lecturas diferentes de '+conflicts.join(', ')+': confirmá esos datos en la caja.');
   // Rebuild the generated name and description without an ambiguous number.
   draft.name=draft.name.replace(/\s+\d+(?:[.,]\d+)? W\b/g,draft.details.power?' '+draft.details.power:'');
  }
  draft.description=descriptionFor(draft);
  draft.notes=[...new Set(draft.notes)];draft.confidence=assessment(draft).confidence;return draft;
 }
 return {parse,combine,assessment,filenameName,amount};
});
