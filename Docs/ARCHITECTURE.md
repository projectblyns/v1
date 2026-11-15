# Seni bina BlynsOS

## Core

`Core/Index.html` ialah entry page aplikasi dan menyimpan markup skrin Boot, Setup, Lockscreen, Desktop dan overlay sistem. `Core/core.js` mengawal urutan skrin, pengurusan sesi, tingkap, Dock, menu bar dan interaksi sistem. `Core/core.css` mengandungi reka bentuk visual.

## Systems

- `storage.js`: baca/tulis data browser melalui satu lapisan yang konsisten.
- `security.js`: derivasi kata laluan PBKDF2-SHA-256.
- `registry.js`: standard laluan ikon dan carian wallpaper.
- `wallpapers.js`: senarai pakej wallpaper.
- `packages.js`: katalog aplikasi pilihan, pemasangan, semakan versi manifest dan kemas kini pakej berasingan.

## Apps

Aplikasi pilihan didaftarkan sebagai pakej manifest melalui `BlynsPackages.registerApp`. Store membaca manifest, memasang pakej, menyemak versi dan menawarkan Update apabila versi baharu tersedia. Pakej pilihan dimuatkan daripada folder sendiri. Aplikasi sistem teras masih kekal di dalam enjin Core dalam binaan kompatibiliti v1.2.

## Assets

`Assets/Icons` mengandungi PNG yang digunakan oleh Dock, Launchpad, Files, Store dan desktop shortcut. `Assets/Wallpapers` mengandungi imej latar sistem dan wallpaper yang boleh dipasang.
