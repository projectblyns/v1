/* World Clock — independent BlynsOS package entry point. */
(() => {
  'use strict';
  const scriptUrl = document.currentScript?.src;
  if (!scriptUrl) throw new Error('World Clock: package script URL is unavailable.');
  window.BlynsPackageRuntime.register({
    id: 'world-clock', coreId: 'clock', name: 'World Clock',
    description: 'Time across selected cities.', category: 'Utilities', version: '1.3.0',
    symbol: '◷', colors: '#b9d2ee,#728cb6', size: [560, 420],
    baseUrl: new URL('.', scriptUrl).href,
    template: 'index.html', styles: 'style.css', icon: '../../../Assets/Icons/world-clock.png'
  });
})();
