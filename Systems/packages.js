/* BlynsOS package registries — optional app modules and wallpaper packs. */
(() => {
  'use strict';
  window.BLYNS_APP_PACKAGES = window.BLYNS_APP_PACKAGES || [];
  window.BLYNS_APP_CATALOG = [
    { id: 'pages', name: 'Documents', description: 'A calm space for writing and editing documents.', category: 'Productivity', version: '1.0.0' },
    { id: 'keynote', name: 'Slides', description: 'Create and arrange simple presentations.', category: 'Productivity', version: '1.0.0' },
    { id: 'freeform', name: 'Canvas', description: 'A flexible board for notes and ideas.', category: 'Creativity', version: '1.0.0' },
    { id: 'weatherplus', name: 'Forecast Plus', description: 'A compact weather dashboard.', category: 'Lifestyle', version: '1.0.0' }
  ];
  window.BlynsPackages = Object.freeze({
    apps: window.BLYNS_APP_PACKAGES,
    wallpapers: window.BLYNS_WALLPAPERS || [],
    registerApp(manifest) {
      if (!manifest || !/^[a-z0-9][a-z0-9_-]{1,39}$/.test(manifest.id || '') || typeof manifest.render !== 'function') {
        throw new TypeError('An app package needs a valid id and a render(container, context) function.');
      }
      if (this.apps.some(app => app.id === manifest.id)) throw new Error('Duplicate BlynsOS app id: ' + manifest.id);
      this.apps.push(manifest);
      return manifest;
    }
  });
})();
