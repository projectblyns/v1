/* Example independently installable BlynsOS application package. */
(() => {
  'use strict';
  window.BlynsPackages.registerApp({
    id: 'focus-timer',
    name: 'Focus Timer',
    description: 'A quiet focus timer with start, pause and reset controls.',
    category: 'Productivity',
    version: '1.1.0',
    symbol: '◷',
    colors: '#b8d5ff,#5f83ca',
    size: [480, 430],
    render(container, context) {
      let duration = 25 * 60;
      let remaining = duration;
      let interval = null;
      let running = false;
      const safe = value => String(value).padStart(2, '0');
      const format = value => `${safe(Math.floor(value / 60))}:${safe(value % 60)}`;

      container.innerHTML = `
        <section class="focus-package">
          <div class="focus-package-mark">BLYNS · FOCUS</div>
          <h2>Make room for focus.</h2>
          <p class="focus-package-subtitle">One task. One quiet session.</p>
          <div class="focus-package-ring"><span id="focus-time">25:00</span></div>
          <div class="focus-package-controls">
            <button type="button" id="focus-start" class="primary">Start</button>
            <button type="button" id="focus-reset">Reset</button>
          </div>
          <div class="focus-package-presets">
            <button type="button" data-minutes="15">15 min</button>
            <button type="button" data-minutes="25" class="selected">25 min</button>
            <button type="button" data-minutes="45">45 min</button>
          </div>
          <p class="focus-package-status" id="focus-status" aria-live="polite">Ready when you are.</p>
        </section>`;

      const time = container.querySelector('#focus-time');
      const start = container.querySelector('#focus-start');
      const reset = container.querySelector('#focus-reset');
      const status = container.querySelector('#focus-status');
      const presets = [...container.querySelectorAll('[data-minutes]')];

      function paint() { time.textContent = format(remaining); }
      function stop() {
        if (interval) window.clearInterval(interval);
        interval = null;
        running = false;
        start.textContent = 'Resume';
      }
      function tick() {
        remaining = Math.max(0, remaining - 1);
        paint();
        if (remaining === 0) {
          stop();
          start.disabled = true;
          status.textContent = 'Session complete. Take a short break.';
          context.toast('Focus session complete.');
        }
      }
      start.addEventListener('click', () => {
        if (running) {
          stop();
          status.textContent = 'Paused.';
          return;
        }
        if (remaining <= 0) return;
        running = true;
        start.textContent = 'Pause';
        status.textContent = 'You are in a focus session.';
        interval = window.setInterval(tick, 1000);
      });
      reset.addEventListener('click', () => {
        stop(); remaining = duration; start.disabled = false;
        start.textContent = 'Start'; status.textContent = 'Ready when you are.'; paint();
      });
      presets.forEach(button => button.addEventListener('click', () => {
        stop();
        duration = Number(button.dataset.minutes) * 60;
        remaining = duration;
        start.disabled = false;start.textContent = 'Start';
        status.textContent = 'Ready when you are.';
        presets.forEach(item => item.classList.toggle('selected', item === button));
        paint();
      }));
      context.onClose(() => stop());
      paint();
    }
  });
})();
