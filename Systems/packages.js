/* BlynsOS App Package Manager — manifest-driven catalogue and installer. */
(() => {
  'use strict';

  const STORAGE_KEY = 'mac_installed_272';
  const VERSION_KEY = 'blyns_package_versions';
  const loadedScripts = new Map();
  const loadedStyles = new Set();
  const pendingInstalls = new Map();

  // Only published package manifests are listed here. App code and styling
  // live in their own folders under Apps/Packages/.
  const catalogue = [
    {
      id: 'focus-timer',
      name: 'Focus Timer',
      description: 'A quiet focus timer with start, pause and reset controls.',
      category: 'Productivity',
      version: '1.2.0',
      symbol: '◷',
      colors: '#b8d5ff,#5f83ca',
      size: [480, 430],
      manifest: '../Apps/Packages/focus-timer/manifest.json'
    }
  ];

  window.BLYNS_APP_CATALOG = catalogue;
  window.BLYNS_APP_PACKAGES = window.BLYNS_APP_PACKAGES || [];

  function readInstalled() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }

  function readVersions() {
    try {
      const value = JSON.parse(localStorage.getItem(VERSION_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }

  function writeVersions(value) {
    try { localStorage.setItem(VERSION_KEY, JSON.stringify(value)); } catch (_) {}
  }

  function compareVersions(left, right) {
    const a = String(left || '0').split(/[.+-]/).slice(0, 3).map(part => Number.parseInt(part, 10) || 0);
    const b = String(right || '0').split(/[.+-]/).slice(0, 3).map(part => Number.parseInt(part, 10) || 0);
    for (let i = 0; i < 3; i++) {
      if ((a[i] || 0) > (b[i] || 0)) return 1;
      if ((a[i] || 0) < (b[i] || 0)) return -1;
    }
    return 0;
  }

  function isSafeRelativePath(value) {
    return typeof value === 'string' && value.trim() !== '' &&
      !/^(?:javascript:|data:|https?:|\/\/)/i.test(value.trim());
  }

  async function readManifest(item) {
    if (!item || !isSafeRelativePath(item.manifest)) {
      throw new Error('This Store entry has no valid manifest path.');
    }
    const manifestUrl = new URL(item.manifest, document.baseURI);
    const response = await fetch(manifestUrl.href, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Manifest could not be loaded (${response.status}).`);
    const manifest = await response.json();
    if (!manifest || manifest.id !== item.id) {
      throw new Error('The package manifest ID does not match the Store catalogue.');
    }
    if (!isSafeRelativePath(manifest.entry)) {
      throw new Error('The package manifest has no valid entry script.');
    }
    if (manifest.styles && !isSafeRelativePath(manifest.styles)) {
      throw new Error('The package manifest has an invalid stylesheet path.');
    }
    if (manifest.icon && !isSafeRelativePath(manifest.icon)) {
      throw new Error('The package manifest has an invalid icon path.');
    }
    const version = String(manifest.version || item.version || '1.0.0');
    const versioned = value => {
      if (!value) return '';
      const url = new URL(value, manifestUrl);
      url.searchParams.set('blyns_version', version);
      return url.href;
    };
    return {
      ...item,
      ...manifest,
      entry: versioned(manifest.entry),
      styles: versioned(manifest.styles),
      icon: manifest.icon ? new URL(manifest.icon, manifestUrl).href : ''
    };
  }

  function addStyles(url) {
    if (!url || loadedStyles.has(url)) return Promise.resolve();
    const existing = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .find(link => link.href === url || link.getAttribute('href') === url);
    if (existing) {
      loadedStyles.add(url);
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.dataset.blynsPackageStyle = 'true';
      link.onload = () => { loadedStyles.add(url); resolve(); };
      link.onerror = () => {
        link.remove();
        reject(new Error('Could not load app styles: ' + url));
      };
      document.head.appendChild(link);
    });
  }

  function loadScript(item) {
    if (loadedScripts.has(item.id)) return loadedScripts.get(item.id);
    const promise = new Promise((resolve, reject) => {
      if (!item.entry) { reject(new Error('This app has no published entry script.')); return; }
      const script = document.createElement('script');
      script.src = item.entry;
      script.async = true;
      script.dataset.blynsPackage = item.id;
      script.onload = () => resolve(true);
      script.onerror = () => {
        loadedScripts.delete(item.id);
        script.remove();
        reject(new Error('Could not load app package: ' + item.name));
      };
      document.head.appendChild(script);
    });
    loadedScripts.set(item.id, promise);
    return promise;
  }

  function registerApp(manifest) {
    if (!manifest || !/^[a-z0-9][a-z0-9_-]{1,39}$/.test(manifest.id || '') ||
        typeof manifest.render !== 'function') {
      throw new TypeError('App package requires a valid id and render(container, context).');
    }
    const previous = window.BLYNS_APP_PACKAGES.find(item => item.id === manifest.id);
    if (previous) Object.assign(previous, manifest);
    else window.BLYNS_APP_PACKAGES.push(manifest);
    if (window.BlynsCore && typeof window.BlynsCore.registerPackage === 'function') {
      window.BlynsCore.registerPackage(previous || manifest);
    }
    return previous || manifest;
  }

  async function install(id, options = {}) {
    if (pendingInstalls.has(id)) return pendingInstalls.get(id);
    const item = catalogue.find(entry => entry.id === id);
    if (!item) throw new Error('App is not listed in the Blyns Store catalogue.');

    const task = (async () => {
      const manifest = await readManifest(item);
      await addStyles(manifest.styles);
      await loadScript(manifest);

      const registered = window.BLYNS_APP_PACKAGES.find(pkg => pkg.id === id);
      if (!registered) {
        loadedScripts.delete(id);
        throw new Error('The app script loaded but did not register its package.');
      }
      // Manifest owns package metadata and asset URLs; app.js owns render().
      Object.assign(registered, {
        name: manifest.name || registered.name,
        description: manifest.description || registered.description || '',
        category: manifest.category || registered.category || 'Apps',
        version: manifest.version || registered.version || '1.0.0',
        icon: manifest.icon || registered.icon || ''
      });
      window.BlynsCore.registerPackage(registered);
      if (!window.BlynsCore || typeof window.BlynsCore.installPackage !== 'function') {
        throw new Error('BlynsOS Core is not ready. Reload and try again.');
      }
      window.BlynsCore.installPackage(id);
      if (!options.restore) {
        const ids = readInstalled();
        if (!ids.includes(id)) {
          ids.push(id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        }
      }
      const versions = readVersions();
      versions[id] = String(manifest.version || item.version || '1.0.0');
      writeVersions(versions);
      try {
        const pending = JSON.parse(localStorage.getItem('blyns_pending_package_update') || 'null');
        if (pending?.id === id && pending.version === versions[id]) {
          localStorage.removeItem('blyns_pending_package_update');
          window.dispatchEvent(new CustomEvent('blyns:package-updated', { detail: { id, name: manifest.name || item.name, version: versions[id] } }));
        }
      } catch (_) {}
      return true;
    })();

    pendingInstalls.set(id, task);
    try { return await task; }
    finally { pendingInstalls.delete(id); }
  }

  async function checkUpdates() {
    const installedIds = readInstalled();
    const versions = readVersions();
    const updates = [];
    for (const id of installedIds) {
      const item = catalogue.find(entry => entry.id === id);
      if (!item) continue;
      try {
        const manifest = await readManifest(item);
        const installedVersion = String(versions[id] || '0.0.0');
        const availableVersion = String(manifest.version || item.version || '1.0.0');
        if (compareVersions(availableVersion, installedVersion) > 0) {
          updates.push({ id, name: manifest.name || item.name, installedVersion, availableVersion });
        }
      } catch (error) {
        console.warn('BlynsOS could not check package update:', id, error);
      }
    }
    return updates;
  }

  async function update(id) {
    if (!readInstalled().includes(id)) throw new Error('Install this app before updating it.');
    const updates = await checkUpdates();
    const updateInfo = updates.find(entry => entry.id === id);
    if (!updateInfo) return false;
    try {
      localStorage.setItem('blyns_pending_package_update', JSON.stringify({ id, version: updateInfo.availableVersion, requestedAt: new Date().toISOString() }));
    } catch (_) {}
    // A reload gives the app module a clean registry and loads the new versioned script URL.
    window.location.reload();
    return true;
  }

  function uninstall(id) {
    const item = catalogue.find(entry => entry.id === id);
    if (!item) return false;
    const result = window.BlynsCore?.uninstallPackage?.(id) || false;
    const ids = readInstalled().filter(value => value !== id);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch (_) {}
    return result;
  }

  window.BlynsPackages = Object.freeze({
    apps: window.BLYNS_APP_PACKAGES,
    wallpapers: window.BLYNS_WALLPAPERS || [],
    catalogue,
    registerApp,
    install,
    update,
    checkUpdates,
    uninstall,
    getInstalled: readInstalled,
    getInstalledVersions: readVersions
  });

  // Deferred scripts run before DOMContentLoaded, so Core is ready by restoration.
  document.addEventListener('DOMContentLoaded', async () => {
    const installed = readInstalled();
    for (const id of installed) {
      if (!catalogue.some(item => item.id === id)) continue;
      try { await install(id, { restore: true }); }
      catch (error) { console.warn('BlynsOS could not restore package:', id, error); }
    }
  }, { once: true });
})();
