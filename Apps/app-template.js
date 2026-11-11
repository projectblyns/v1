/*
  BLYNSOS APP TEMPLATE
  1. Copy this file into Apps/ and give it a unique name, for example: my-notes.js
  2. Change id, name, description, category, version, icon, colors and size.
  3. Build the interface inside render(container, context).
  4. Add a matching PNG at ../Assets/Icons/<id>.png.
  5. Add a script tag for your new file in Core/Index.html, above Core/core.js.
*/
window.BlynsPackages.registerApp({
  id: 'my-app',
  name: 'My App',
  description: 'Describe what the app does.',
  category: 'Utilities',
  version: '1.0.0',
  symbol: '✦',
  icon: '../Assets/Icons/my-app.png',
  colors: '#87a8dc,#536c9a',
  size: [520, 420],
  render(container, context) {
    container.innerHTML = `
      <div class="main">
        <h2>My App</h2>
        <p>Your application content goes here.</p>
        <button id="my-app-action">Try it</button>
      </div>`;
    container.querySelector('#my-app-action').addEventListener('click', () => {
      context.toast?.('My App is ready.');
    });
  }
});
