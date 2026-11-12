/* BlynsOS power controller — password check, second confirmation, then a 2s fade. */
(() => {
  'use strict';
  let config = {};
  let active = false;
  let busy = false;
  const delay = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  function configure(options = {}) {
    config = { ...config, ...options };
  }

  async function verifyPassword(value) {
    const stored = localStorage.getItem('blyns_password_hash') || '';
    if (stored && window.BlynsSecurity?.verifyPassword) {
      return window.BlynsSecurity.verifyPassword(value, stored);
    }
    const legacy = localStorage.getItem('mac_p') || '';
    if (legacy && value === legacy && window.BlynsSecurity?.hashPassword) {
      const hash = await window.BlynsSecurity.hashPassword(value);
      localStorage.setItem('blyns_password_hash', hash);
      localStorage.removeItem('mac_p');
      return true;
    }
    return false;
  }

  function closeDialog() {
    document.getElementById('power-auth-dialog')?.remove();
    active = false;
    busy = false;
  }

  function makeDialog(action) {
    closeDialog();
    active = true;
    const isRestart = action === 'restart';
    const label = isRestart ? 'Restart' : 'Shut Down';
    const dialog = document.createElement('div');
    dialog.id = 'power-auth-dialog';
    dialog.className = 'power-auth-backdrop';
    dialog.innerHTML = `
      <section class="power-auth-card" role="dialog" aria-modal="true" aria-labelledby="power-auth-title">
        <div class="power-auth-symbol">⏻</div>
        <h2 id="power-auth-title">Confirm ${label.toLowerCase()}</h2>
        <p class="power-auth-copy">Enter your BlynsOS account password to continue.</p>
        <form id="power-auth-form">
          <label class="power-auth-label" for="power-auth-password">Account password</label>
          <input id="power-auth-password" class="power-auth-input" type="password" autocomplete="current-password" required>
          <p id="power-auth-error" class="power-auth-error" role="alert"></p>
          <div class="power-auth-actions">
            <button type="button" class="power-auth-cancel" id="power-auth-cancel">Cancel</button>
            <button type="submit" class="power-auth-primary" id="power-auth-next">Continue</button>
          </div>
        </form>
      </section>`;
    document.body.appendChild(dialog);
    const form = document.getElementById('power-auth-form');
    const field = document.getElementById('power-auth-password');
    const error = document.getElementById('power-auth-error');
    const cancel = document.getElementById('power-auth-cancel');
    const next = document.getElementById('power-auth-next');

    cancel.onclick = closeDialog;
    dialog.addEventListener('pointerdown', event => {
      if (event.target === dialog) closeDialog();
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;
      if (!field.value) { error.textContent = 'Enter your password.'; field.focus(); return; }
      busy = true; field.disabled = true; next.disabled = true;
      error.textContent = '';
      try {
        const valid = await verifyPassword(field.value);
        if (!valid) {
          error.textContent = 'The password is not correct. Try again.';
          field.value = '';
          field.disabled = false; next.disabled = false; busy = false; field.focus();
          return;
        }
        dialog.querySelector('.power-auth-copy').textContent =
          isRestart ? 'Password verified. Restart BlynsOS now?' : 'Password verified. Shut down BlynsOS now?';
        dialog.querySelector('.power-auth-label').remove();
        field.remove();
        error.textContent = '';
        next.textContent = isRestart ? 'Restart' : 'Shut Down';
        next.type = 'button';
        cancel.textContent = 'Not now';
        next.onclick = async () => {
          if (busy) return;
          busy = true;
          closeDialog();
          await execute(action);
        };
        busy = false;
      } catch (err) {
        error.textContent = err?.message || 'Password verification is unavailable.';
        field.disabled = false; next.disabled = false; busy = false;
      }
    });
    field.focus();
  }

  async function execute(action) {
    if (!['shutdown', 'restart'].includes(action) || active) return false;
    if (busy) return false;
    busy = true;
    try {
      if (typeof config.beforeTransition === 'function') config.beforeTransition(action);
      const overlay = document.getElementById('power-transition');
      if (overlay) {
        overlay.classList.remove('active');
        void overlay.offsetWidth;
        overlay.classList.add('active');
      }
      let duration = 2000;
      try {
        const prefs = JSON.parse(localStorage.getItem('macos_273_preferences') || '{}');
        if (prefs.reduceMotion) duration = 0;
      } catch (_) {}
      await delay(duration);
      if (action === 'shutdown') {
        if (typeof config.finishShutdown === 'function') config.finishShutdown();
      } else {
        if (typeof config.finishRestart === 'function') config.finishRestart();
      }
      overlay?.classList.remove('active');
      return true;
    } finally {
      busy = false;
    }
  }

  function request(action) {
    if (active || busy) return false;
    if (!['shutdown', 'restart'].includes(action)) return false;
    makeDialog(action);
    return true;
  }

  // Only route 0 to shutdown from the lock screen or desktop. It remains usable
  // inside password fields because 0 may be part of the user's password.
  window.addEventListener('keydown', event => {
    if (event.key !== '0' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    const typing = event.target && (
      /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable
    );
    if (typing) return;
    if (active || busy) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    const screen = document.querySelector('.ph.on');
    if (!screen || !['desk', 'lock'].includes(screen.id)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    request('shutdown');
  }, true);

  window.BlynsOff = Object.freeze({ configure, request, execute });
})();
