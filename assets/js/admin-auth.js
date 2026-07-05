(() => {
  'use strict';

  const ADMIN_PIN = atob('MTk5MzEx');
  const STORAGE_KEY = 'sd_comayagua_admin_autorizado';
  const ATTEMPT_KEY = 'sd_comayagua_admin_intentos';
  const LOCK_KEY = 'sd_comayagua_admin_bloqueado_hasta';
  const MAX_ATTEMPTS = 5;
  const LOCK_SECONDS = 30;

  const html = document.documentElement;

  function isUnlocked() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function setUnlocked(value) {
    try {
      if (value) sessionStorage.setItem(STORAGE_KEY, '1');
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {}
  }

  function getAttempts() {
    try {
      return Number(sessionStorage.getItem(ATTEMPT_KEY) || '0') || 0;
    } catch (error) {
      return 0;
    }
  }

  function setAttempts(value) {
    try { sessionStorage.setItem(ATTEMPT_KEY, String(value)); } catch (error) {}
  }

  function getLockedUntil() {
    try {
      return Number(sessionStorage.getItem(LOCK_KEY) || '0') || 0;
    } catch (error) {
      return 0;
    }
  }

  function setLockedUntil(value) {
    try {
      if (value) sessionStorage.setItem(LOCK_KEY, String(value));
      else sessionStorage.removeItem(LOCK_KEY);
    } catch (error) {}
  }

  function unlock() {
    setUnlocked(true);
    setAttempts(0);
    setLockedUntil(0);
    const gate = document.getElementById('adminPinGate');
    if (gate) gate.remove();
    html.classList.remove('sd-admin-locked');
    document.body.classList.add('admin-auth-ok');
    window.dispatchEvent(new CustomEvent('sd:admin-auth-ok'));
    addLockButton();
  }

  function lock() {
    setUnlocked(false);
    html.classList.add('sd-admin-locked');
    document.body.classList.remove('admin-auth-ok');
    createGate();
  }

  function addLockButton() {
    const actions = document.querySelector('.header-actions');
    if (!actions || document.getElementById('lockAdminBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'lockAdminBtn';
    btn.className = 'btn btn-light admin-lock-btn';
    btn.type = 'button';
    btn.title = 'Bloquear el panel administrador';
    btn.innerHTML = '<span aria-hidden="true">🔒</span><span>Bloquear</span>';
    btn.addEventListener('click', () => {
      lock();
      const input = document.getElementById('adminGatePinInput');
      if (input) input.focus();
    });
    actions.insertBefore(btn, actions.firstChild);
  }

  function createGate() {
    if (!document.body || document.getElementById('adminPinGate')) return;

    const gate = document.createElement('div');
    gate.id = 'adminPinGate';
    gate.className = 'admin-pin-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'adminGatePinTitle');

    gate.innerHTML = `
      <form id="adminGatePinForm" class="admin-pin-card" autocomplete="off">
        <img class="admin-pin-logo" src="assets/img/logo-round.png" alt="SD COMAYAGUA">
        <p class="admin-pin-eyebrow">Panel privado</p>
        <h1 id="adminGatePinTitle">Acceso administrador</h1>
        <p class="admin-pin-text">Ingresa el PIN para abrir inventario, ventas, cotizaciones y edición de productos.</p>
        <label class="admin-pin-label" for="adminGatePinInput">PIN de seguridad</label>
        <div class="admin-pin-input-row">
          <input id="adminGatePinInput" class="admin-pin-input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="12" placeholder="••••••" autofocus>
          <button id="toggleAdminGatePin" class="admin-pin-toggle" type="button" aria-label="Mostrar u ocultar PIN">👁️</button>
        </div>
        <p id="adminGatePinError" class="admin-pin-error" aria-live="polite"></p>
        <button class="btn btn-primary admin-pin-submit" type="submit">Entrar al sistema</button>
        <a class="btn btn-light admin-pin-client" href="cliente.html">Ver catálogo para clientes</a>
        <p class="admin-pin-note">El acceso queda activo solo mientras esta pestaña esté abierta. Puedes bloquearlo de nuevo con el botón 🔒.</p>
      </form>
    `;

    document.body.appendChild(gate);

    const form = gate.querySelector('#adminGatePinForm');
    const input = gate.querySelector('#adminGatePinInput');
    const errorBox = gate.querySelector('#adminGatePinError');
    const toggle = gate.querySelector('#toggleAdminGatePin');

    const updateLockMessage = () => {
      const lockedUntil = getLockedUntil();
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining > 0) {
        errorBox.textContent = `Demasiados intentos. Espera ${remaining} segundos.`;
        input.disabled = true;
        form.querySelector('button[type="submit"]').disabled = true;
        setTimeout(updateLockMessage, 1000);
        return true;
      }
      input.disabled = false;
      form.querySelector('button[type="submit"]').disabled = false;
      setLockedUntil(0);
      return false;
    };

    updateLockMessage();

    toggle.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      input.focus();
    });

    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '');
      errorBox.textContent = '';
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (updateLockMessage()) return;
      const value = input.value.trim();
      if (value === ADMIN_PIN) {
        unlock();
        return;
      }
      const attempts = getAttempts() + 1;
      setAttempts(attempts);
      input.value = '';
      input.focus();
      gate.classList.remove('shake-pin');
      void gate.offsetWidth;
      gate.classList.add('shake-pin');
      if (attempts >= MAX_ATTEMPTS) {
        setAttempts(0);
        setLockedUntil(Date.now() + LOCK_SECONDS * 1000);
        updateLockMessage();
      } else {
        errorBox.textContent = `PIN incorrecto. Intento ${attempts} de ${MAX_ATTEMPTS}.`;
      }
    });

    setTimeout(() => input.focus(), 80);
  }

  function boot() {
    if (isUnlocked()) {
      html.classList.remove('sd-admin-locked');
      document.body.classList.add('admin-auth-ok');
      addLockButton();
      return;
    }
    html.classList.add('sd-admin-locked');
    createGate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
