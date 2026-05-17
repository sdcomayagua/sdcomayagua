// SD COMAYAGUA POS - subir foto desde celular y galería v1.4.8
(function(){
  const MAIN_SIZE = 1100;
  const MAIN_QUALITY = 0.78;
  const GALLERY_SIZE = 900;
  const GALLERY_QUALITY = 0.72;
  const MAX_GALLERY_FILES = 12;

  function escapeAttr(value){
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[ch]));
  }

  function notify(message, type='ok'){
    if(window.SD_POS?.toast) return window.SD_POS.toast(message, type);
    if(window.SD_POS?.state) console.info(message);
  }

  function dispatchField(field){
    if(!field) return;
    field.dispatchEvent(new Event('input', { bubbles:true }));
    field.dispatchEvent(new Event('change', { bubbles:true }));
  }

  function galleryLines(value){
    return String(value || '')
      .split(/\r?\n+/)
      .map(x => x.trim())
      .filter(Boolean);
  }

  function writeGallery(field, lines){
    if(!field) return;
    const unique=[];
    const seen = new Set();
    lines.map(x => String(x || '').trim()).filter(Boolean).forEach(line => {
      if(seen.has(line)) return;
      seen.add(line);
      unique.push(line);
    });
    field.value = unique.join('\n');
    dispatchField(field);
  }

  function compressImage(file, options={}){
    const maxSize = options.maxSize || MAIN_SIZE;
    const quality = options.quality || MAIN_QUALITY;
    return new Promise((resolve,reject)=>{
      if(!file || !file.type || !file.type.startsWith('image/')) return reject(new Error('Selecciona una imagen válida.'));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
        img.onload = () => {
          let { width, height } = img;
          const ratio = Math.min(1, maxSize / Math.max(width, height));
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0,0,width,height);
          ctx.drawImage(img,0,0,width,height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function enhanceImageField(input){
    if(!input || input.dataset.sdcUploadReady === '1') return;
    input.dataset.sdcUploadReady = '1';
    const label = input.closest('label') || input.parentElement;
    const form = input.form || input.closest('form');
    const galleryField = form?.elements?.galeria || form?.querySelector('[name="galeria"]');
    const box = document.createElement('div');
    box.className = 'sdc-image-uploader';
    box.innerHTML = `
      <div class="sdc-image-preview" data-image-preview>
        <span>Sin foto cargada</span>
      </div>
      <div class="sdc-image-actions">
        <label class="btn primary sdc-upload-btn">
          📷 Subir foto desde mi celular
          <input type="file" accept="image/*" capture="environment" data-image-file hidden>
        </label>
        <label class="btn secondary sdc-gallery-upload-btn">
          🖼️ Subir foto desde galería
          <input type="file" accept="image/*" multiple data-gallery-files hidden>
        </label>
        <button type="button" class="btn secondary" data-image-clear>Quitar foto</button>
      </div>
      <div class="sdc-gallery-preview" data-gallery-preview>
        <div class="sdc-gallery-preview-title"><span>Galería</span><strong>0 fotos</strong></div>
        <div class="sdc-gallery-empty">Puedes seleccionar 4, 5 o más fotos y se agregan automáticamente.</div>
      </div>
      <small class="sdc-image-help">La foto principal y las fotos de galería se comprimen automáticamente para guardarse con el artículo.</small>
    `;
    label.insertAdjacentElement('afterend', box);

    const preview = box.querySelector('[data-image-preview]');
    const fileInput = box.querySelector('[data-image-file]');
    const galleryInput = box.querySelector('[data-gallery-files]');
    const clearBtn = box.querySelector('[data-image-clear]');
    const galleryPreview = box.querySelector('[data-gallery-preview]');

    function updatePreview(){
      const value = input.value.trim();
      if(value){
        preview.innerHTML = `<img src="${escapeAttr(value)}" alt="Vista previa" onerror="this.parentElement.innerHTML='<span>No se pudo mostrar la foto</span>'">`;
      }else{
        preview.innerHTML = '<span>Sin foto cargada</span>';
      }
    }

    function updateGalleryPreview(){
      if(!galleryPreview) return;
      if(!galleryField){
        galleryPreview.innerHTML = '<div class="sdc-gallery-empty">Este formulario no tiene campo de galería.</div>';
        return;
      }
      const lines = galleryLines(galleryField.value);
      if(!lines.length){
        galleryPreview.innerHTML = `
          <div class="sdc-gallery-preview-title"><span>Galería</span><strong>0 fotos</strong></div>
          <div class="sdc-gallery-empty">Puedes seleccionar 4, 5 o más fotos y se agregan automáticamente.</div>`;
        return;
      }
      galleryPreview.innerHTML = `
        <div class="sdc-gallery-preview-title"><span>Galería</span><strong>${lines.length} foto${lines.length===1?'':'s'}</strong></div>
        <div class="sdc-gallery-thumbs">
          ${lines.slice(0,12).map((src,i)=>`<div class="sdc-gallery-thumb"><img src="${escapeAttr(src)}" alt="Foto de galería ${i+1}" onerror="this.parentElement.style.display='none'"></div>`).join('')}
        </div>`;
    }

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if(!file) return;
      preview.innerHTML = '<span>Procesando foto...</span>';
      try{
        const dataUrl = await compressImage(file, { maxSize: MAIN_SIZE, quality: MAIN_QUALITY });
        input.value = dataUrl;
        dispatchField(input);
        updatePreview();
        notify('Foto principal lista para guardar.', 'ok');
      }catch(error){
        preview.innerHTML = `<span>${escapeAttr(error.message || 'No se pudo cargar la foto.')}</span>`;
      }finally{
        fileInput.value = '';
      }
    });

    galleryInput.addEventListener('change', async () => {
      const files = Array.from(galleryInput.files || []).filter(file => file.type && file.type.startsWith('image/')).slice(0, MAX_GALLERY_FILES);
      if(!files.length) return;
      box.classList.add('sdc-gallery-busy');
      galleryPreview.innerHTML = `<div class="sdc-gallery-empty">Procesando ${files.length} foto${files.length===1?'':'s'}...</div>`;
      try{
        const compressed = [];
        for(const file of files){
          compressed.push(await compressImage(file, { maxSize: GALLERY_SIZE, quality: GALLERY_QUALITY }));
        }
        let photos = compressed;
        if(!input.value.trim() && photos.length){
          input.value = photos[0];
          dispatchField(input);
          photos = photos.slice(1);
          updatePreview();
        }
        if(galleryField && photos.length){
          writeGallery(galleryField, galleryLines(galleryField.value).concat(photos));
        }else if(galleryField){
          dispatchField(galleryField);
        }
        updateGalleryPreview();
        notify(`Galería actualizada: ${files.length} foto${files.length===1?'':'s'} agregada${files.length===1?'':'s'}.`, 'ok');
      }catch(error){
        galleryPreview.innerHTML = `<div class="sdc-gallery-empty">${escapeAttr(error.message || 'No se pudieron cargar las fotos.')}</div>`;
      }finally{
        box.classList.remove('sdc-gallery-busy');
        galleryInput.value = '';
      }
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      fileInput.value = '';
      dispatchField(input);
      updatePreview();
    });

    input.addEventListener('input', updatePreview);
    input.addEventListener('change', updatePreview);
    galleryField?.addEventListener('input', updateGalleryPreview);
    galleryField?.addEventListener('change', updateGalleryPreview);
    setTimeout(() => { updatePreview(); updateGalleryPreview(); }, 50);
  }

  function run(){
    document.querySelectorAll('input[name="imagen"]').forEach(enhanceImageField);
  }

  let scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;run();});
  }

  document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
