/* BlynsOS v1.3 package runtime. Each app owns its HTML, CSS and JS folder. */
(() => {
  'use strict';
  const loadedStyles = new Map();
  const safeText = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  function sameOriginUrl(value, baseUrl) {
    const url = new URL(value, baseUrl);
    if (!/^https?:$/.test(url.protocol) || url.origin !== window.location.origin) {
      throw new Error('BlynsOS app assets must be served from the same origin.');
    }
    return url.href;
  }

  function loadStyle(url) {
    if (!url) return Promise.resolve();
    if (loadedStyles.has(url)) return loadedStyles.get(url);
    const task = new Promise((resolve, reject) => {
      const existing = [...document.querySelectorAll('link[rel="stylesheet"]')]
        .find(link => link.href === url);
      if (existing) { resolve(); return; }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.dataset.blynsAppPackageStyle = 'true';
      link.onload = () => resolve();
      link.onerror = () => { link.remove(); reject(new Error('App stylesheet could not be loaded.')); };
      document.head.appendChild(link);
    });
    loadedStyles.set(url, task);
    task.catch(() => loadedStyles.delete(url));
    return task;
  }

  function register(definition) {
    if (!definition || !/^[a-z0-9][a-z0-9_-]{1,39}$/.test(definition.id || '') ||
        (definition.coreId && !/^[a-z0-9][a-z0-9_-]{1,39}$/.test(definition.coreId)) ||
        !definition.baseUrl || !definition.template || !definition.styles) {
      throw new TypeError('A BlynsOS package needs an id, baseUrl, template and styles. coreId is optional for standalone apps.');
    }

    const templateUrl = sameOriginUrl(definition.template, definition.baseUrl);
    const styleUrl = sameOriginUrl(definition.styles, definition.baseUrl);
    const iconUrl = definition.icon ? sameOriginUrl(definition.icon, definition.baseUrl) : '';

    const appPackage = {
      id: definition.id,
      coreId: definition.coreId || null,
      name: definition.name || definition.id,
      description: definition.description || '',
      category: definition.category || 'Apps',
      version: definition.version || '1.0.0',
      symbol: definition.symbol || '◈',
      colors: definition.colors || '#7897c9,#3c5b91',
      size: Array.isArray(definition.size) ? definition.size : [620, 440],
      icon: iconUrl,
      mount: typeof definition.mount === 'function' ? definition.mount : null,
      templateUrl,
      styleUrl,
      render(container, context = {}) {
        let active = true;
        const shell = document.createElement('section');
        shell.className = `blyns-app-package blyns-pkg-${definition.id}`;
        shell.setAttribute('aria-label', `${safeText(definition.name || definition.id)} application`);
        shell.innerHTML = '<div class="blyns-package-loading" role="status">Loading app…</div>';
        container.replaceChildren(shell);
        context.onClose?.(() => { active = false; });

        Promise.all([
          loadStyle(styleUrl),
          fetch(templateUrl, { cache: 'no-cache' }).then(response => {
            if (!response.ok) throw new Error(`App template could not be loaded (${response.status}).`);
            return response.text();
          })
        ]).then(([, html]) => {
          if (!active || !container.isConnected) return;
          shell.innerHTML = html;
          const mount = shell.querySelector('[data-blyns-mount]');
          if (!mount) throw new Error('App HTML must contain an element with data-blyns-mount.');
          if (typeof context.legacyRender === 'function') {
            context.legacyRender(mount);
            return;
          }
          if (typeof appPackage.mount === 'function') {
            appPackage.mount(mount, context);
            return;
          }
          mount.innerHTML = '<p class="blyns-package-error">This app package has no mount function.</p>';
        }).catch(error => {
          if (!active || !container.isConnected) return;
          shell.innerHTML = `<div class="blyns-package-error"><b>App could not open</b><p>${safeText(error.message || error)}</p></div>`;
          console.error('BlynsOS app package failed:', definition.id, error);
        });
      }
    };

    if (!window.BlynsPackages?.registerApp) {
      throw new Error('BlynsOS package manager must load before app modules.');
    }
    window.BlynsPackages.registerApp(appPackage);
    return appPackage;
  }

  window.BlynsPackageRuntime = Object.freeze({ register });
})();
