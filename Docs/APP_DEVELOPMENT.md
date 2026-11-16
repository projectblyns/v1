# BlynsOS v1.3 — App package standard

## App placement

### Remain in Core
- Blyns Settings (`settings`)
- Files (`finder`)
- Gallery (`photos`)
- Blyns Store (`store`)
- Console (`terminal`)
- Blyns Assistant (`siri`)
- Image Viewer (`preview`)

### Independent app packages

| Package ID | Core window ID | App |
|---|---|---|
| `navigator` | `safari` | Navigator |
| `daybook` | `calendar` | Daybook |
| `jotter` | `notes` | Jotter |
| `task` | `reminders` | Tasks |
| `soundwave` | `music` | Soundwave |
| `world-clock` | `clock` | World Clock |
| `calculator` | `calc` | Calculator |
| `writer` | `textedit` | Writer |
| `inbox` | `mail` | Inbox |

Chatline and Atlas have reserved package folders under `Apps/Packages/Future/`. They are not loaded in v1.3 and are intentionally hidden from the Dock and Launchpad until a later release. Their future package IDs will be `chatline` and `atlas`; they will be standalone apps, not replacements for Core window IDs.

## Required package folder

Each app must live in its own folder under `Apps/Packages/<package-id>/` and contain:

```text
<package-id>/
├── manifest.json
├── index.html
├── style.css
└── app.js
```

- `manifest.json` declares identity, version, paths, icon, size and intended permissions. `coreId` is optional.
- `index.html` is an HTML fragment, not a full HTML document. It must contain an element with `data-blyns-mount`.
- `style.css` must scope every selector under `.blyns-pkg-<package-id>`; do not style `body`, `#desk`, `.win`, or Core window chrome.
- `app.js` registers the package through `BlynsPackageRuntime.register(...)`. Keep its descriptor in sync with `manifest.json`.

The Core window frame, title bar, minimize, close, resize, Dock and Stage Manager remain owned by Core. The nine selected built-in apps currently use a compatibility adapter so their existing renderers remain functional while the new folder boundary is established. A standalone third-party app can supply its own `mount(container, context)` function and does not need a matching Core app.

## Registration from app.js

A package script runs before `Core/core.js` and uses its own script URL as the package base. For an independent third-party app, omit `coreId` and provide `mount`:

```js
const scriptUrl = document.currentScript.src;
window.BlynsPackageRuntime.register({
  id: 'my-app',
  name: 'My App',
  description: 'What the app does.',
  category: 'Productivity',
  version: '1.0.0',
  symbol: '✦',
  colors: '#87a8dc,#536c9a',
  size: [620, 440],
  baseUrl: new URL('.', scriptUrl).href,
  template: 'index.html',
  styles: 'style.css',
  icon: '../../../Assets/Icons/my-app.png',
  mount(container, context) {
    container.innerHTML = '<h2>My App</h2>';
    // Use context.storage, context.desktop, context.fetch, context.toast, etc.
  }
});
```

For a built-in app being moved gradually out of Core, `coreId: 'existing-core-window-id'` may be provided. BlynsOS will keep its existing Core renderer as a compatibility bridge until the package implements its own `mount` and the mapping is removed. The package `id` and optional `coreId` must use lowercase letters, digits, hyphens or underscores. Package IDs must be unique and should not reuse Core system IDs.

The manifest uses the same package ID and paths, for example:

```json
{
  "id": "my-app",
  "name": "My App",
  "version": "1.0.0",
  "entry": "app.js",
  "template": "index.html",
  "styles": "style.css",
  "icon": "../../../Assets/Icons/my-app.png",
  "permissions": ["storage:local", "desktop:read", "desktop:write", "network:fetch"],
  "compatibility": "BlynsOS 1.3+"
}
```

To publish an app for Store installation, its manifest path must also be added to the `catalogue` in `Systems/packages.js`. A folder by itself is not automatically installable.

## App context API

When Core mounts a package, its `context` provides:

- `context.toast(message)` — show a BlynsOS notification.
- `context.openApp(id, argument)` — open another installed app.
- `context.storage.get(key, fallback)`, `set(key, value)`, `getText`, `setText`, `remove` — browser-local storage through `BlynsStorage`.
- `context.files` — IndexedDB file-vault methods, including `saveFile`, `listFiles`, `getFile`, `deleteFile`, and image methods.
- `context.desktop.list(folder)` — read `Desktop`, `Documents` or `Downloads` entries.
- `context.desktop.save(file, {folder})` — add a text/metadata file to those folders. Use a record such as `{n: 'notes.txt', t: 'txt', c: 'Text'}`.
- `context.desktop.download(url, filename, {folder})` — fetch a same-origin or CORS-permitted resource and save its binary data in IndexedDB, with a visible file entry in the selected folder.
- `context.desktop.read(file)` — read a desktop text entry or retrieve a stored binary Blob.
- `context.desktop.remove(index, {folder})` — remove a desktop entry and its stored binary data.
- `context.fetch(url, options)` and `context.download(url, filename, options)` — standard fetch / desktop download helpers.
- `context.onClose(callback)` — register cleanup for timers, audio and event listeners when the window closes.

Network requests still obey browser CORS and website restrictions. Package scripts execute as same-origin code; the permission list in the manifest documents intended access and is not a sandbox. Only install packages from developers you trust.

## Release notes

- Every boot, restart and power-on resets the progress bar to 0 and runs the full 3-second animation.
- Setup opens directly on the animated Hello page; the language-choice step has been removed. Setup now has 9 steps, and the account-preparation screen has no Continue button.
- Lock screen order is date/calendar first and time second. The lock-screen time omits AM/PM in 12-hour mode; the desktop menu-bar clock keeps the selected format.
- The lock-screen clock, profile area and password field no longer use glass frames. Clock and password field are smaller.
- Removed the visible “Unlock BlynsOS” text.
- Chatline and Atlas are reserved for a later installable-package update.
