import { exportBackup, exportProductsCSV, exportProductsJSON, importBackupFile, importProductsJSON, clearLocalCache } from './data.js';
import { toast, confirmDialog } from './ui.js';

export function bindBackupEvents(root=document) {
  root.querySelector('[data-export-backup]')?.addEventListener('click', () => { exportBackup(); toast('Respaldo descargado.', 'ok'); });
  root.querySelector('[data-export-products-json]')?.addEventListener('click', exportProductsJSON);
  root.querySelector('[data-export-products-csv]')?.addEventListener('click', exportProductsCSV);
  root.querySelector('[data-import-backup]')?.addEventListener('change', async e => {
    try { await importBackupFile(e.target.files[0]); toast('Respaldo importado correctamente.', 'ok'); }
    catch (error) { toast(error.message, 'err'); }
  });
  root.querySelector('[data-import-products-json]')?.addEventListener('change', async e => {
    try { await importProductsJSON(e.target.files[0]); toast('Productos importados correctamente.', 'ok'); }
    catch (error) { toast(error.message, 'err'); }
  });
  root.querySelector('[data-clear-cache]')?.addEventListener('click', async () => {
    const ok = await confirmDialog({ title:'Limpiar caché local', message:'Esto borra datos guardados en este navegador y recarga los ejemplos iniciales. Haz respaldo antes.', confirmText:'Limpiar', danger:true });
    if (ok) { clearLocalCache(); toast('Caché local limpiada.', 'ok'); }
  });
}
