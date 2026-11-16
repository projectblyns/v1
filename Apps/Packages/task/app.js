/* Tasks — independent BlynsOS package entry point. */
(() => {
  'use strict';
  const scriptUrl = document.currentScript?.src;
  if (!scriptUrl) throw new Error('Tasks: package script URL is unavailable.');
  window.BlynsPackageRuntime.register({
    id: 'task', coreId: 'reminders', name: 'Tasks',
    description: 'Personal task and reminder list.', category: 'Productivity', version: '1.3.0',
    symbol: '✓', colors: '#b8e5d4,#67b99a', size: [650, 480],
    baseUrl: new URL('.', scriptUrl).href,
    template: 'index.html', styles: 'style.css', icon: '../../../Assets/Icons/tasks.png'
  });
})();
