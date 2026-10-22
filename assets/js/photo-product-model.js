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
 function parse(raw,filename='',categories=[]){
  const text=String(raw||'').slice(0,16000),n=normalized(text),upper=n.toUpperCase(),details={},notes=[];
  const brandRules=[[/KOUVOLSEN/i,'KOUVOLSEN'],[/ARGOM\s*(?:TECH)?/i,'ArgomTech'],[/VOLTRAX/i,'VOLTRAX'],[/\bMEMO\b/i,'MEMO'],[/\bMAXELL\b/i,'Maxell'],[/\bPRIMUS\b/i,'Primus'],[/\bSARAFOX\b/i,'SARAFOX'],[/\bAOAS\b/i,'AOAS'],[/\bAOC\b/i,'AOC'],[/\bANDOWL\b/i,'Andowl'],[/\bREDRAGON\b/i,'Redragon']];
  for(const [re,brand] of brandRules)if(re.test(n)){details.brand=brand;break;}
  const model=n.match(/\b(?:MODEL(?:O)?\s*[:.#-]?\s*)([A-Z0-9][A-Z0-9-]{1,24})\b/i)||n.match(/\b(KOS-\d{3,6}|CX\d{2}(?:\s*PRO)?|X176|VC07)\b/i);
  if(model)details.model=clean(model[1]).toUpperCase();
  const power=n.match(/\b(\d{1,4}(?:[.,]\d{1,2})?)[ \t]{0,2}W(?:ATT(?:S)?)?\b/);
  const current=n.match(/\b(\d{1,2}(?:[.,]\d{1,2})?)[ \t]{0,2}A(?:MP(?:ERES|S)?)?\b/);
  if(power)details.power=power[1].replace(',','.')+' W';
  if(current)details.current=current[1].replace(',','.')+' A';
  const length=n.match(/\b(\d{1,4}(?:[.,]\d{1,2})?)\s*(CM|MM|METROS?|M)\b/i);
  if(length){details.length=Number(length[1].replace(',','.'));details.measureUnit=/^METRO|^M$/i.test(length[2])?'m':length[2].toLowerCase();}
  if(/\bC\s*(?:TO|A|-)\s*C\b|USB[-\s]?C\s*(?:A|TO)\s*USB[-\s]?C/i.test(n))details.connection='USB-C a USB-C';
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
  else if(/\bHUB\b/i.test(n)){category='Adaptador';type='hub';name='Hub USB'+(details.brand?' '+details.brand:'')+(details.model?' '+details.model:'');const ports=n.match(/\b([2-9]|1[0-2])\s*[- ]?\s*PORT(?:S)?\b/i);if(ports)details.size=ports[1]+' puertos';}
  else if(/AIR\s*PODS/i.test(n)){category='Audio';type='audio';name='Audífonos tipo AirPods Pro'+(/2ND\s*GEN|2\.?\s*GEN/i.test(n)?' · 2.ª generación':'')+(details.connection?' · '+details.connection:'');notes.push('Confirmá la marca y originalidad antes de publicar.');}
  else if(/DATA\s*CABLE|\bCABLE\b/i.test(n)){category='Cables USB-C';type='cable';name='Cable'+(details.brand?' '+details.brand:'')+(details.model?' '+details.model:'')+(details.connection?' '+details.connection:'')+(details.power?' '+details.power:'');}
  else if(/CHARGER|CARGADOR/i.test(n)){category='Cargador para Celular';type='cargador';name='Cargador'+(details.brand?' '+details.brand:'')+(details.model?' '+details.model:'')+(details.power?' '+details.power:'');}
  else if(/MOUSE\s*PAD/i.test(n)){category='Mousepad';type='mousepad';name='Mousepad'+(details.brand?' '+details.brand:'');}
  else if(/\bMOUSE\b/i.test(n)){category='Mouse';type='mouse';name='Mouse'+(details.brand?' '+details.brand:'')+(details.model?' '+details.model:'');}
  else if(/GAME\s*PAD|CONTROL\s*(?:GAMER|INALAMBRICO)/i.test(n)){category='Gamepad';type='control';name='Control'+(details.brand?' '+details.brand:'')+(details.model?' '+details.model:'');}
  const fromFile=filenameName(filename);
  if(!name&&fromFile)name=fromFile;
  if(!name){
   const title=text.split(/\n/).map(clean).find(line=>line.length>=6&&line.length<=90&&/[A-Za-zÀ-ÿ]{4}/.test(line)&&!/(?:ENVIO|COMAYAGUA|WHATSAPP|LLAMANOS|TALLAS|QUALITY|CHARGING|LENGTH|MODELO?\s*:)/i.test(normalized(line)));
   if(title)name=title;
  }
  const prices=[...n.matchAll(/(?:\bLPS\.?|\bHNL|\bL\.|\bPRECIO\s*[:=])\s*(\d[\d.,]*(?:\s*\d{3})?)/gi)].map(m=>amount(m[1])).filter(v=>v!==null);
  const unique=[...new Set(prices)];const price=unique.length===1?unique[0]:null;
  if(unique.length>1)notes.push('Se detectaron varios precios: elegí el de venta.');
  if(price===null)notes.push('Precio de venta pendiente de confirmar.');
  const depositOnly=/SOLO\s*DEPOSITO|SOLO\s*TRANSFERENCIA|PAGAR\s+AL\s+RECIBIR\s*\(?NO\s*DISPONIBLE/i.test(n);
  const freeShipping=/ENVIO\s*GRATIS|ENVIO\s+INCLUIDO/i.test(n);
  let description=type==='kit'?'Kit gamer Mobilador V'+kit[1]+'.':type?name+'.':'';
  if(details.included)description+=' Incluye '+details.included+'.';
  const specs=[details.power&&'Potencia indicada en el empaque: '+details.power,details.current&&'Corriente indicada: '+details.current,details.length&&'Largo: '+details.length+' '+details.measureUnit,details.size,details.material];
  if(specs.some(Boolean))description+=' '+specs.filter(Boolean).join('. ')+'.';
  if(depositOnly)description+=' Pago solo por depósito o transferencia.';
  if(freeShipping)notes.push('La imagen anuncia envío gratis. Confirmá esa condición en la ficha antes de activarla.');
  notes.push('Existencias pendientes de confirmar.');
  return {name:clean(name).slice(0,180),category:categoryName(category,categories),price,stock:null,codAllowed:!depositOnly,freeShipping,description:clean(description),details,notes,text,confidence:text.replace(/[^A-Za-zÀ-ÿ]/g,'').length>=12?'review':'empty'};
 }
 return {parse,filenameName,amount};
});
