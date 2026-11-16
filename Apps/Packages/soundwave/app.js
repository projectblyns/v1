/* Soundwave — independent BlynsOS package entry point. */
(() => {
  'use strict';
  const scriptUrl = document.currentScript?.src;
  if (!scriptUrl) throw new Error('Soundwave: package script URL is unavailable.');
  window.BlynsPackageRuntime.register({
    id: 'soundwave', coreId: 'music', name: 'Soundwave',
    description: 'Music and audio workspace.', category: 'Media', version: '1.3.0',
    symbol: '♫', colors: '#f3c7ed,#b17dbb', size: [650, 460],
    baseUrl: new URL('.', scriptUrl).href,
    template: 'index.html', styles: 'style.css', icon: '../../../Assets/Icons/soundwave.png'
  });
})();
