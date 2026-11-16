/* Daybook — independent BlynsOS package entry point. */
(() => {
  'use strict';
  const scriptUrl = document.currentScript?.src;
  if (!scriptUrl) throw new Error('Daybook: package script URL is unavailable.');
  window.BlynsPackageRuntime.register({
    id: 'daybook', coreId: 'calendar', name: 'Daybook',
    description: 'Calendar and day planning.', category: 'Productivity', version: '1.3.0',
    symbol: '▦', colors: '#c7e8ff,#7b9bd0', size: [720, 500],
    baseUrl: new URL('.', scriptUrl).href,
    template: 'index.html', styles: 'style.css', icon: '../../../Assets/Icons/daybook.png'
  });
})();
