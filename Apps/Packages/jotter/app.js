/* Jotter — independent BlynsOS package entry point. */
(() => {
  'use strict';
  const scriptUrl = document.currentScript?.src;
  if (!scriptUrl) throw new Error('Jotter: package script URL is unavailable.');
  window.BlynsPackageRuntime.register({
    id: 'jotter', coreId: 'notes', name: 'Jotter',
    description: 'Local notes and quick writing.', category: 'Productivity', version: '1.3.0',
    symbol: '✎', colors: '#ffe59c,#e6b95e', size: [720, 500],
    baseUrl: new URL('.', scriptUrl).href,
    template: 'index.html', styles: 'style.css', icon: '../../../Assets/Icons/jotter.png'
  });
})();
