# Built-in app extraction plan

The pre-existing built-in apps still share private helpers and state inside `Core/core.js` (for example the window registry, file model, menu helpers and common app renderers). This folder is reserved for their staged extraction.

## Safe migration order

1. Extract apps with no shared state first (for example a small clock or calculator utility).
2. Give each extracted app a folder under `Apps/BuiltIn/<app-id>/` with `manifest.json`, `app.js` and optional `style.css`.
3. Use the same package contract demonstrated by `Apps/Packages/focus-timer/`.
4. Keep window chrome, title bar, resize/minimize controls and common theme tokens owned by BlynsOS Core.
5. Move data-heavy apps such as Files, Gallery, Notes and Calendar only after their data model has a stable public API.
6. Remove the old inline renderer only after the extracted version passes open/close, restore, local-data and theme tests.

Do not duplicate an app ID in both the old inline Core registry and the new package registry. The package loader intentionally rejects or ignores duplicate runtime IDs.

## Skin contract

An app package renders only into its provided content container. It should use a unique root class (for example `.focus-package`) and avoid changing `body`, `#desk`, `.win`, or the shared title bar. The Core window wrapper continues to provide the BlynsOS chrome and interaction model.

**Current state:** Focus Timer is the first independently loaded package. Other legacy built-ins are retained in Core for compatibility and should be extracted incrementally in a later maintenance pass.
