# Built-in app migration notes

BlynsOS v1.3 keeps seven system apps in Core: Settings, Files, Gallery, Store, Console, Assistant and Image Viewer.

Nine selected built-in apps now have independent package folders under `Apps/Packages/`, with `manifest.json`, `index.html`, `style.css` and `app.js`. Their current UI renderers remain behind a compatibility adapter in `Core/core.js` so existing functions are not lost during this first migration.

For future app redesigns, replace the compatibility renderer with a package-owned `mount(container, context)` function. New third-party apps may omit `coreId` and register as standalone packages. See `Docs/APP_DEVELOPMENT.md` for the required contract and available APIs.
