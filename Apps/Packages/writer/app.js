/* Writer — independent BlynsOS package entry point. */
(() => {
  'use strict';
  const scriptUrl = document.currentScript?.src;
  if (!scriptUrl) throw new Error('Writer: package script URL is unavailable.');
  window.BlynsPackageRuntime.register({
    id: 'writer', coreId: 'textedit', name: 'Writer',
    description: 'A clean document editor.', category: 'Productivity', version: '1.3.0',
    symbol: '▤', colors: '#d6e7f6,#8eabc8', size: [720, 500],
    baseUrl: new URL('.', scriptUrl).href,
    template: 'index.html', styles: 'style.css', icon: '../../../Assets/Icons/writer.png'
  });
})();
