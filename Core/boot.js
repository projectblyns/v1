/* BlynsOS Boot controller — visual lifecycle only; Core supplies the next screen. */
(() => {
  'use strict';
  let timer = 0;
  const BOOT_DURATION = 3000;

  function run(options = {}) {
    clearTimeout(timer);
    const boot = document.getElementById('boot');
    if (!boot) throw new Error('Boot screen element #boot is missing.');

    if (typeof options.prepare === 'function') options.prepare();
    boot.classList.remove('go');
    void boot.offsetWidth;
    boot.classList.add('go');
    if (typeof options.reveal === 'function') options.reveal();

    timer = window.setTimeout(() => {
      if (typeof options.complete === 'function') options.complete();
    }, BOOT_DURATION);
  }

  window.BlynsBoot = Object.freeze({ run, duration: BOOT_DURATION });
})();
