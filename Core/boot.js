/* BlynsOS Boot controller — every start gets a fresh, complete 3-second progress run. */
(() => {
  'use strict';
  let timer = 0;
  let runToken = 0;
  const BOOT_DURATION = 3000;

  function run(options = {}) {
    clearTimeout(timer);
    const token = ++runToken;
    const boot = document.getElementById('boot');
    if (!boot) throw new Error('Boot screen element #boot is missing.');

    if (typeof options.prepare === 'function') options.prepare();

    const progress = boot.querySelector('#bar i');
    boot.classList.remove('go');
    if (progress) {
      // Disable the transition while resetting so a repeated boot never starts at 100%.
      progress.style.setProperty('transition', 'none', 'important');
      progress.style.setProperty('width', '0%', 'important');
      void progress.offsetWidth;
    }
    void boot.offsetWidth;

    const begin = () => {
      if (token !== runToken) return;
      if (progress) {
        progress.style.setProperty('transition', `width ${BOOT_DURATION}ms linear`, 'important');
        void progress.offsetWidth;
        progress.style.setProperty('width', '100%', 'important');
      }
      boot.classList.add('go');
      if (typeof options.reveal === 'function') options.reveal();
      timer = window.setTimeout(() => {
        if (token === runToken && typeof options.complete === 'function') options.complete();
      }, BOOT_DURATION);
    };

    // Two animation frames guarantee the zero-width state is painted before .go returns.
    window.requestAnimationFrame(() => window.requestAnimationFrame(begin));
  }

  window.BlynsBoot = Object.freeze({ run, duration: BOOT_DURATION });
})();
