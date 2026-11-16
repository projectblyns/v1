/* Atlas package scaffold. Not loaded or registered in BlynsOS v1.3. */
(() => {
  'use strict';
  const scriptUrl = document.currentScript?.src;
  if (!scriptUrl) throw new Error('Atlas: package script URL is unavailable.');
  window.BlynsPackageRuntime.register({
    id: 'atlas', name: 'Atlas', category: 'Travel', version: '0.1.0',
    symbol: '⌖', size: [680, 500],
    baseUrl: new URL('.', scriptUrl).href,
    template: 'index.html', styles: 'style.css',
    icon: '../../../../Assets/Icons/atlas.png',
    mount(container, context) {
      container.innerHTML = '<div class="future-package-card"><h2>Atlas</h2><p>This package is reserved for a future BlynsOS release.</p></div>';
    }
  });
})();
