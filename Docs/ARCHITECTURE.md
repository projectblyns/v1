# Seni bina BlynsOS

## Core

`Core/Index.html` ialah entry page aplikasi dan menyimpan markup skrin Boot, Setup, Lockscreen, Desktop dan overlay sistem. `Core/core.js` mengawal urutan skrin, pengurusan sesi, tingkap, Dock, menu bar dan interaksi sistem. `Core/core.css` mengandungi reka bentuk visual.

## Systems

- `storage.js`: baca/tulis data browser melalui satu lapisan yang konsisten.
- `security.js`: derivasi kata laluan PBKDF2-SHA-256.
- `registry.js`: standard laluan ikon dan carian wallpaper.
- `wallpapers.js`: senarai pakej wallpaper.
- `packages.js`: registry aplikasi pilihan dan metadata Store.

## Apps

Setiap aplikasi pilihan didaftarkan sebagai manifest melalui `BlynsPackages.registerApp`. Store membaca manifest dan memberikan kawalan Get/Install. Aplikasi sistem teras kekal di dalam enjin Core.

## Assets

`Assets/Icons` mengandungi PNG yang digunakan oleh Dock, App Library, Files, Store dan desktop shortcut. `Assets/Wallpapers` mengandungi imej latar sistem dan wallpaper yang boleh dipasang.
