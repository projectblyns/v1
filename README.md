# BlynsOS 1.3 — App Package Update

BlynsOS is a browser-based desktop workspace. Version 1.3 builds on v1.2.1 with a more reliable startup sequence, a repaired first-run setup flow, a cleaner lock screen and a new per-app package structure.

## Start

Jalankan melalui local web server atau deploy sebagai static site (contohnya GitHub Pages). Elakkan `file://` kerana pelayar boleh menyekat `fetch` dan storan tertentu. The project uses browser storage; user profiles and saved files remain in the browser used to run BlynsOS.

## v1.3 changes

- Boot progress resets to 0 and completes over the full 3 seconds on every power-on, restart and shutdown-to-start cycle.
- Setup Hello screen now renders on entry. The language-selection step has been removed, leaving a 9-step setup flow. The account-preparation screen advances automatically.
- Lock screen shows the calendar/date above the time, uses a smaller clock and password field, removes glass frames and removes the “Unlock BlynsOS” caption.
- 12-hour lock-screen time no longer displays AM/PM. The desktop menu-bar clock retains its selected time format.
- Navigator, Daybook, Jotter, Tasks, Soundwave, World Clock, Calculator, Writer and Inbox now have their own `manifest.json`, `index.html`, `style.css` and `app.js` package folders.
- Chatline and Atlas are reserved as future packages and are not loaded by default in this release.
- App packages receive a shared API for local storage, desktop file listing/saving, network fetch and downloading binary files into BlynsOS Downloads/Desktop storage.

## Architecture

- `Core/` owns boot, setup handoff, lock screen, desktop, windows and system UI.
- `Systems/` owns storage, security, wallpaper registry, file vault and package manager.
- `Apps/Packages/<app-id>/` owns each packaged app's manifest, HTML fragment, scoped CSS and JS entry point.
- `Docs/APP_DEVELOPMENT.md` is the v1.3 developer contract and lists the package APIs.

The nine selected built-in app packages currently use a compatibility adapter to preserve their existing renderers while the package boundary is established. Standalone third-party packages can register without a Core window ID and supply their own `mount(container, context)` renderer. Chatline and Atlas remain future, unloaded scaffolds.

**Version:** BlynsOS 1.3 · 16 November 2026.
