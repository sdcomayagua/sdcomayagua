/* Orden de fotos con ratón, tacto, botones y teclado. Solo cambia el formulario. */
(function(){'use strict';
 const gallery=document.getElementById('galleryPreview'),A=window.GC_ADMIN;if(!gallery||!A)return;
 let drag=null,touch=null;
 function clear(){gallery.querySelectorAll('.photo-dragging,.photo-drop').forEach(el=>el.classList.remove('photo-dragging','photo-drop'));}
 function move(from,to){clear();if(A.reorderEditorPhotos(from,to))gallery.querySelector('[data-photo-grip="'+to+'"]')?.focus({preventScroll:true});}
 gallery.addEventListener('dragstart',event=>{const handle=event.target.closest('[data-photo-grip]');if(!handle||touch){event.preventDefault();return;}drag=Number(handle.dataset.photoGrip);event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',String(drag));handle.closest('[data-photo-position]').classList.add('photo-dragging');});
 gallery.addEventListener('dragover',event=>{const target=event.target.closest('[data-photo-position]');if(drag===null||!target)return;event.preventDefault();gallery.querySelectorAll('.photo-drop').forEach(el=>el.classList.remove('photo-drop'));target.classList.add('photo-drop');event.dataTransfer.dropEffect='move';});
 gallery.addEventListener('drop',event=>{const target=event.target.closest('[data-photo-position]');if(drag===null||!target)return;event.preventDefault();const from=drag;drag=null;move(from,Number(target.dataset.photoPosition));});
 gallery.addEventListener('dragend',()=>{drag=null;clear();});
 gallery.addEventListener('pointerdown',event=>{const handle=event.target.closest('[data-photo-grip]');if(!handle||event.pointerType==='mouse')return;touch={pointer:event.pointerId,from:Number(handle.dataset.photoGrip),to:Number(handle.dataset.photoGrip),x:event.clientX,y:event.clientY,moving:false};handle.setPointerCapture(event.pointerId);});
 gallery.addEventListener('pointermove',event=>{if(!touch||touch.pointer!==event.pointerId)return;if(Math.hypot(event.clientX-touch.x,event.clientY-touch.y)>7)touch.moving=true;if(!touch.moving)return;event.preventDefault();const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-photo-position]');clear();gallery.querySelector('[data-photo-position="'+touch.from+'"]')?.classList.add('photo-dragging');if(target&&gallery.contains(target)){touch.to=Number(target.dataset.photoPosition);target.classList.add('photo-drop');}});
 gallery.addEventListener('pointerup',event=>{if(!touch||touch.pointer!==event.pointerId)return;const current=touch;touch=null;clear();if(current.moving)move(current.from,current.to);});
 gallery.addEventListener('pointercancel',()=>{touch=null;clear();});
 gallery.addEventListener('click',event=>{const button=event.target.closest('[data-photo-step]');if(button){event.preventDefault();move(Number(button.dataset.photoStep),Number(button.dataset.photoStep)+Number(button.dataset.step));}});
 gallery.addEventListener('keydown',event=>{const handle=event.target.closest('[data-photo-grip]');if(!handle||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();const from=Number(handle.dataset.photoGrip),count=gallery.querySelectorAll('[data-photo-position]').length,to=event.key==='Home'?0:event.key==='End'?count-1:from+(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1);move(from,to);});
})();
