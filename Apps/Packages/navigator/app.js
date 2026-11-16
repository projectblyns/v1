/* Navigator — independent BlynsOS package entry point. */
(() => {
  'use strict';
  const scriptUrl = document.currentScript?.src;
  if (!scriptUrl) throw new Error('Navigator: package script URL is unavailable.');
  window.BlynsPackageRuntime.register({
    id: 'navigator', coreId: 'safari', name: 'Navigator',
    description: 'A tabbed browser workspace.', category: 'Productivity', version: '1.3.0',
    symbol: '▣', colors: '#d8e8ff,#7ca5e7', size: [860, 600],
    baseUrl: new URL('.', scriptUrl).href,
    template: 'index.html', styles: 'style.css', icon: '../../../Assets/Icons/navigator.png'
  });
})();
