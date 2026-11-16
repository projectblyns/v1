/* Inbox — independent BlynsOS package entry point. */
(() => {
  'use strict';
  const scriptUrl = document.currentScript?.src;
  if (!scriptUrl) throw new Error('Inbox: package script URL is unavailable.');
  window.BlynsPackageRuntime.register({
    id: 'inbox', coreId: 'mail', name: 'Inbox',
    description: 'Mail inbox and saved drafts.', category: 'Productivity', version: '1.3.0',
    symbol: '✉', colors: '#c5d9fa,#8199c9', size: [720, 500],
    baseUrl: new URL('.', scriptUrl).href,
    template: 'index.html', styles: 'style.css', icon: '../../../Assets/Icons/inbox.png'
  });
})();
