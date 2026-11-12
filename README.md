# BlynsOS 1.1 — Minor Update / Indexed Structure

This is an **upgrade package** based on the files supplied for BlynsOS 1.0. It is not a clean-room rewrite.

## Installation

1. Back up the current GitHub repository before replacing anything.
2. Copy the contents of this ZIP into the repository root, keeping the folder names and capitalisation exactly as shown.
3. Keep your existing `Assets/Wallpapers/` images, logo images, favicon files, and any other assets that are not included in this upgrade package.
4. Commit and push the changes to GitHub.
5. Open the GitHub Pages URL and hard-refresh with `Ctrl + Shift + R`.

Existing account and preference data are stored by the browser in `localStorage`; uploading this package does not intentionally clear that data. Do not use **Erase All Content** during an upgrade.

## Important scope note

This minor update separates Boot, Shutdown/Restart, Setup, shared systems, user-image storage, and the new optional app-package pathway. It also includes one real installable example app (`Focus Timer`). The older built-in applications are still registered inside the legacy Core runtime in this build. They have **not** all been extracted into independent modules yet; moving all of them in one minor release would risk breaking their shared dependencies. `Apps/BuiltIn/README.md` documents the next safe extraction stage.

## Main entry points

- `index.html` — small repository-root redirect to `Core/Index.html`.
- `Core/Index.html` — main shell, lock screen and desktop host.
- `Core/boot.js` — startup visual/timing controller.
- `Core/off.js` — password-confirmed shutdown/restart controller.
- `Setup/Index.html` — standalone Setup Assistant page.
- `Setup/setup.js` and `Setup/setup.css` — first-run setup module and skin.
- `Systems/` — storage, security, wallpaper, asset registry, package loader and IndexedDB image vault.
- `Apps/Packages/` — separately loaded optional app packages.
- `Assets/Icons/` — PNG app icons.
- `Docs/` — indexing and extension guides.

## Version

BlynsOS 1.1 — Minor Update, 12 November 2026.
