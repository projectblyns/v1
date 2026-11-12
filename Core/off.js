/* BlynsOS power controller — one password check for power actions; two checks for erase. */
(() => {
  'use strict';
  let config = {};
  let active = false;
  let busy = false;
  let dialogToken = 0;
  const delay = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  function configure(options = {}) {
    config = { ...config, ...options };
  }

  function dialogHost() {
    let host = document.getElementById('dlg');
    if (!host) {
      host = document.createElement('div');
      host.id = 'dlg';
      document.body.appendChild(host);
    }
    return host;
  }

  function closeDialog() {
    dialogToken++;
    const host = dialogHost();
    host.classList.remove('on');
    host.replaceChildren();
    active = false;
    busy = false;
  }

  function openDialog(content) {
    const host = dialogHost();
    host.innerHTML = `<div class="dbx power-auth-box">${content}</div>`;
    host.classList.add('on');
    host.onpointerdown = event => {
      if (event.target === host && !busy) closeDialog();
    };
    return host;
  }

  async function verifyPassword(value) {
    try {
      // Core's verifier also waits for any legacy-password migration to finish.
      if (typeof window.verifyBlynsPassword === 'function') {
        return await window.verifyBlynsPassword(value);
      }
      const stored = localStorage.getItem('blyns_password_hash') || '';
      if (stored && window.BlynsSecurity?.verifyPassword) {
        return await window.BlynsSecurity.verifyPassword(value, stored);
      }
      const legacy = localStorage.getItem('mac_p') || '';
      if (legacy && value === legacy && window.BlynsSecurity?.hashPassword) {
        const hash = await window.BlynsSecurity.hashPassword(value);
        localStorage.setItem('blyns_password_hash', hash);
        localStorage.removeItem('mac_p');
        return true;
      }
      return false;
    } catch (error) {
      console.error('BlynsOS password validation failed.', error);
      throw new Error(error?.message || 'Password verification is unavailable.');
    }
  }

  function actionMarkup(action) {
    const isRestart = action === 'restart';
    const label = isRestart ? 'Restart' : 'Shut Down';
    return `
      <h3>${label}</h3>
      <p class="power-auth-copy">Enter your account password to ${isRestart ? 'restart' : 'shut down'} BlynsOS.</p>
      <form id="power-auth-form" class="power-auth-form">
        <label class="power-auth-label" for="power-auth-password">Password</label>
        <input id="power-auth-password" class="power-auth-input" type="password" autocomplete="current-password" required>
        <p id="power-auth-error" class="power-auth-error" role="alert"></p>
        <div class="power-auth-actions">
          <button type="button" class="pb power-auth-cancel" id="power-auth-cancel" style="background:#666">Cancel</button>
          <button type="submit" class="pb power-auth-primary" id="power-auth-submit">${label}</button>
        </div>
      </form>`;
  }

  function makeDialog(action) {
    closeDialog();
    active = true;
    const token = ++dialogToken;
    const host = openDialog(actionMarkup(action));
    const form = host.querySelector('#power-auth-form');
    const field = host.querySelector('#power-auth-password');
    const error = host.querySelector('#power-auth-error');
    const submit = host.querySelector('#power-auth-submit');
    host.querySelector('#power-auth-cancel').onclick = closeDialog;

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy || token !== dialogToken) return;
      if (!field.value) { error.textContent = 'Enter your password.'; field.focus(); return; }
      busy = true;
      field.disabled = true;
      submit.disabled = true;
      error.textContent = '';
      try {
        const valid = await verifyPassword(field.value);
        if (token !== dialogToken || !active) return;
        if (!valid) {
          error.textContent = 'The password is not correct. Try again.';
          field.value = '';
          field.disabled = false;
          submit.disabled = false;
          busy = false;
          field.focus();
          return;
        }
        // A valid password immediately begins the transition. There is no second
        // confirmation button, so the old permanently-disabled button state cannot recur.
        closeDialog();
        await execute(action);
      } catch (err) {
        if (token !== dialogToken || !active) return;
        error.textContent = err?.message || 'Password verification is unavailable.';
        field.disabled = false;
        submit.disabled = false;
        busy = false;
        field.focus();
      }
    });
    field.focus();
  }

  function request(action) {
    if (active || busy) return false;
    if (!['shutdown', 'restart'].includes(action)) return false;
    makeDialog(action);
    return true;
  }

  function requestErase(options = {}) {
    if (active || busy) return false;
    const accountName = String(options.accountName ?? localStorage.getItem('mac_n') ?? '').trim();
    const onConfirm = options.onConfirm;
    if (!accountName || typeof onConfirm !== 'function') return false;

    closeDialog();
    active = true;
    const token = ++dialogToken;
    const host = openDialog(`
      <h3>Erase All Content and Settings</h3>
      <p class="power-auth-copy">For your security, enter your account password before continuing.</p>
      <form id="erase-password-form" class="power-auth-form">
        <label class="power-auth-label" for="erase-password">Account password</label>
        <input id="erase-password" class="power-auth-input" type="password" autocomplete="current-password" required>
        <p id="erase-password-error" class="power-auth-error" role="alert"></p>
        <div class="power-auth-actions">
          <button type="button" class="pb power-auth-cancel" id="erase-cancel" style="background:#666">Cancel</button>
          <button type="submit" class="pb power-auth-primary" id="erase-continue">Continue</button>
        </div>
      </form>`);
    const passwordForm = host.querySelector('#erase-password-form');
    const passwordField = host.querySelector('#erase-password');
    const passwordError = host.querySelector('#erase-password-error');
    const passwordSubmit = host.querySelector('#erase-continue');
    host.querySelector('#erase-cancel').onclick = closeDialog;

    passwordForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy || token !== dialogToken) return;
      if (!passwordField.value) { passwordError.textContent = 'Enter your account password.'; passwordField.focus(); return; }
      busy = true;
      passwordField.disabled = true;
      passwordSubmit.disabled = true;
      passwordError.textContent = '';
      try {
        const valid = await verifyPassword(passwordField.value);
        if (token !== dialogToken || !active) return;
        if (!valid) {
          passwordError.textContent = 'The password is not correct. Try again.';
          passwordField.value = '';
          passwordField.disabled = false;
          passwordSubmit.disabled = false;
          busy = false;
          passwordField.focus();
          return;
        }
        busy = false;
        renderEraseNameStep(host, token, accountName, onConfirm);
      } catch (err) {
        if (token !== dialogToken || !active) return;
        passwordError.textContent = err?.message || 'Password verification is unavailable.';
        passwordField.disabled = false;
        passwordSubmit.disabled = false;
        busy = false;
        passwordField.focus();
      }
    });
    passwordField.focus();
    return true;
  }

  function renderEraseNameStep(host, token, accountName, onConfirm) {
    host.innerHTML = `<div class="dbx power-auth-box">
      <h3>Confirm your account name</h3>
      <p class="power-auth-copy">Type your account name exactly as shown to confirm the erase.</p>
      <form id="erase-name-form" class="power-auth-form">
        <label class="power-auth-label" for="erase-account-name">Account name</label>
        <input id="erase-account-name" class="power-auth-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" required>
        <p class="power-auth-expected">Account: <strong id="erase-account-expected"></strong></p>
        <p id="erase-name-error" class="power-auth-error" role="alert"></p>
        <div class="power-auth-actions">
          <button type="button" class="pb power-auth-cancel" id="erase-name-cancel" style="background:#666">Cancel</button>
          <button type="submit" class="pb power-auth-primary" id="erase-name-submit">Erase All Content</button>
        </div>
      </form>
    </div>`;
    const expected = host.querySelector('#erase-account-expected');
    const field = host.querySelector('#erase-account-name');
    const form = host.querySelector('#erase-name-form');
    const error = host.querySelector('#erase-name-error');
    const submit = host.querySelector('#erase-name-submit');
    expected.textContent = accountName;
    host.querySelector('#erase-name-cancel').onclick = closeDialog;
    field.focus();

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy || token !== dialogToken || !active) return;
      if (field.value.trim() !== accountName) {
        error.textContent = 'The account name does not match. Type it exactly as shown.';
        field.focus();
        field.select();
        return;
      }
      busy = true;
      submit.disabled = true;
      error.textContent = '';
      try {
        closeDialog();
        await onConfirm();
      } catch (err) {
        console.error('BlynsOS erase action failed.', err);
        busy = false;
        if (typeof config.onError === 'function') config.onError(err);
      }
    });
  }

  async function execute(action) {
    if (!['shutdown', 'restart'].includes(action) || active || busy) return false;
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

  // Escape closes the shared modal through this controller too, resetting its
  // internal state so the next Shutdown/Restart request is never left locked.
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active && !busy) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDialog();
    }
  }, true);

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

  window.BlynsOff = Object.freeze({ configure, request, requestErase, execute, cancel: closeDialog });
})();
