/* Calculator — independent BlynsOS package entry point. */
(() => {
  'use strict';
  const scriptUrl = document.currentScript?.src;
  if (!scriptUrl) throw new Error('Calculator: package script URL is unavailable.');
  window.BlynsPackageRuntime.register({
    id: 'calculator', coreId: 'calc', name: 'Calculator',
    description: 'Everyday calculations.', category: 'Utilities', version: '1.3.0',
    symbol: '＋', colors: '#e2e2e8,#aaaeb9', size: [420, 520],
    baseUrl: new URL('.', scriptUrl).href,
    template: 'index.html', styles: 'style.css', icon: '../../../Assets/Icons/calc.png'
  });
})();
