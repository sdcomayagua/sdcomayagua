// SD COMAYAGUA POS - subir foto desde celular v1.4.7
(function(){
  const MAX_SIZE = 1100;
  const QUALITY = 0.78;

  function compressImage(file){
    return new Promise((resolve,reject)=>{
      if(!file || !file.type.startsWith('image/')) return reject(new Error('Selecciona una imagen válida.'));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
        img.onload = () => {
          let { width, height } = img;
          const ratio = Math.min(1, MAX_SIZE / Math.max(width, height));
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0,0,width,height);
          ctx.drawImage(img,0,0,width,height);
          resolve(canvas.toDataURL('image/jpeg', QUALITY));
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
        <button type="button" class="btn secondary" data-image-clear>Quitar foto</button>
      </div>
      <small class="sdc-image-help">La foto se comprime automáticamente para guardarse con el artículo.</small>
    `;
    label.insertAdjacentElement('afterend', box);

    const preview = box.querySelector('[data-image-preview]');
    const fileInput = box.querySelector('[data-image-file]');
    const clearBtn = box.querySelector('[data-image-clear]');

    function updatePreview(){
      const value = input.value.trim();
      if(value){
        preview.innerHTML = `<img src="${value}" alt="Vista previa" onerror="this.parentElement.innerHTML='<span>No se pudo mostrar la foto</span>'">`;
      }else{
        preview.innerHTML = '<span>Sin foto cargada</span>';
      }
    }

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if(!file) return;
      preview.innerHTML = '<span>Procesando foto...</span>';
      try{
        const dataUrl = await compressImage(file);
        input.value = dataUrl;
        input.dispatchEvent(new Event('input', { bubbles:true }));
        input.dispatchEvent(new Event('change', { bubbles:true }));
        updatePreview();
        if(window.SD_POS?.state) console.info('Foto guardada en el campo imagen del producto.');
      }catch(error){
        preview.innerHTML = `<span>${error.message || 'No se pudo cargar la foto.'}</span>`;
      }
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      fileInput.value = '';
      input.dispatchEvent(new Event('input', { bubbles:true }));
      input.dispatchEvent(new Event('change', { bubbles:true }));
      updatePreview();
    });

    input.addEventListener('input', updatePreview);
    input.addEventListener('change', updatePreview);
    setTimeout(updatePreview, 50);
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
