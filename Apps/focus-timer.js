/* Example optional app package. Copy this file to create another Store app. */
window.BlynsPackages.registerApp({
  id: 'focus-timer',
  name: 'Focus Timer',
  description: 'A simple focus and break timer.',
  category: 'Productivity',
  version: '1.0.0',
  symbol: '◷',
  icon: '../Assets/Icons/focus-timer.png',
  colors: '#8bb8ee,#3b5eaa',
  size: [420, 360],
  render(container, context) {
    container.innerHTML = `
      <div class="focus-app">
        <div class="focus-app-badge">FOCUS SESSION</div>
        <div class="focus-time" id="focus-time">25:00</div>
        <div class="focus-track"><i id="focus-progress"></i></div>
        <div class="focus-actions">
          <button id="focus-start" class="focus-primary">Start</button>
          <button id="focus-reset">Reset</button>
        </div>
        <p class="focus-caption" id="focus-caption">Take one task at a time.</p>
      </div>`;
    const time = container.querySelector('#focus-time');
    const progress = container.querySelector('#focus-progress');
    const start = container.querySelector('#focus-start');
    const reset = container.querySelector('#focus-reset');
    const caption = container.querySelector('#focus-caption');
    const duration = 25 * 60;
    let remaining = duration, timer = null;
    const draw = () => {
      const m = Math.floor(remaining / 60), s = remaining % 60;
      time.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      progress.style.width = `${(1 - remaining / duration) * 100}%`;
    };
    const stop = () => { if (timer) clearInterval(timer); timer = null; start.textContent = 'Start'; };
    start.addEventListener('click', () => {
      if (timer) { stop(); caption.textContent = 'Session paused.'; return; }
      if (remaining <= 0) remaining = duration;
      start.textContent = 'Pause'; caption.textContent = 'Stay focused. You are doing well.';
      timer = setInterval(() => {
        remaining = Math.max(0, remaining - 1); draw();
        if (remaining === 0) { stop(); caption.textContent = 'Session complete. Take a short break.'; context.toast?.('Focus session complete'); }
      }, 1000);
    });
    reset.addEventListener('click', () => { stop(); remaining = duration; caption.textContent = 'Take one task at a time.'; draw(); });
    draw();
    context.onClose?.(stop);
  }
});
