# BlynsOS 1.2 — Major Update

Release package based on the existing BlynsOS 1.1 Indexed structure. Existing browser-profile data is retained; do not use **Erase All Content** during an ordinary upgrade.

## Installation

1. Back up the current repository.
2. Copy the contents of this ZIP into the repository root, preserving folder names and capitalisation.
3. Keep any personal assets that are not supplied in this package.
4. Commit and push the changes to GitHub Pages.
5. Hard-refresh the deployed page with `Ctrl + Shift + R`.

## Main changes in 1.2

- Uploaded wallpapers are stored in IndexedDB and restored after refresh.
- Appearance lists built-in and installed wallpapers; **Get More** opens the Store catalogue.
- App and wallpaper installation requires the account password.
- The desktop grid appears only while dragging desktop items.
- Launchpad replaces the App Library label and only lists installed apps.
- Stage Manager is limited to five windows; overflow windows are minimized, with no scroll rail.
- Settings includes a profile card in its sidebar.
- The lock screen uses separate glass clock/calendar surfaces, a minimal password field and a rounded clock with smaller AM/PM.
- Avatar and profile shapes are fixed to a true circle.
- Dock glass, scrollbars, sliders and progress bars have been refined.
- New password hashes use PBKDF2-SHA-256 with 600,000 iterations. Existing stored hashes remain verifiable.
- Optional package apps now compare manifest versions and can be updated after password confirmation; Focus Timer is updated to v1.2.0.

## App architecture note

`Apps/Packages/` contains independently installable, manifest-versioned app modules, including Focus Timer v1.2.0. Apps in this folder can be updated as their manifest version advances. Most legacy built-in applications still share private Core helpers and remain registered in `Core/core.js` for compatibility; they have not all been migrated into individual folders or gained separate per-app customization in this release. Independent editing/updating is currently available for modular packages. `Apps/BuiltIn/README.md` describes the staged extraction path.

## Main entry points

- `index.html` — repository-root redirect.
- `Core/Index.html` — boot, lock screen and desktop shell.
- `Core/core.js` / `Core/core.css` — window manager and desktop UI.
- `Setup/` — first-run Setup Assistant.
- `Systems/` — storage, security, wallpaper catalogue, package manager and IndexedDB File Vault.
- `Apps/Packages/` — installable app modules.
- `Assets/` — icons and wallpaper assets.

**Version:** BlynsOS 1.2 Major Update · 15 November 2026.
