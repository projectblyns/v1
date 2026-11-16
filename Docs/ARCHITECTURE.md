# Seni bina BlynsOS v1.3

## Core

`Core/Index.html` ialah entry page dan menyimpan markup skrin kuasa, boot, setup, lockscreen, desktop serta overlay sistem. `Core/core.js` mengurus urutan skrin, sesi, tingkap, Dock, menu bar dan interaksi desktop. `Core/core.css` mengandungi gaya sistem. Tujuh aplikasi yang kekal dalam Core ialah Settings, Files, Gallery, Store, Console, Assistant dan Image Viewer.

## Systems

- `storage.js`: baca/tulis data browser melalui lapisan storan.
- `security.js`: derivasi dan pengesahan kata laluan.
- `registry.js`: laluan ikon dan carian wallpaper.
- `wallpapers.js`: senarai pakej wallpaper.
- `file-vault.js`: IndexedDB untuk imej dan fail binari.
- `packages.js`: katalog, pemasangan, pemulihan, versi dan kemas kini aplikasi pakej.

## Apps

Setiap aplikasi pakej mempunyai folder sendiri di `Apps/Packages/<id>/` dengan `manifest.json`, `index.html`, `style.css` dan `app.js`. Sembilan aplikasi pilihan v1.3 menggunakan adapter ke renderer lama buat sementara supaya fungsi sedia ada kekal. Pakej pihak ketiga boleh menjadi aplikasi bebas dengan `BlynsPackageRuntime.register()` dan fungsi `mount(container, context)` tanpa memerlukan ID Core.

`Apps/Packages/Future/` menyimpan rangka Chatline dan Atlas; kedua-duanya belum didaftarkan atau dipaparkan dalam v1.3. Store hanya boleh memasang pakej yang turut disenaraikan dalam katalog `Systems/packages.js`.

## App context

Pakej menerima API untuk storan, file vault, desktop (`Desktop`, `Documents`, `Downloads`), fetch dan muat turun binari. Permintaan rangkaian masih tertakluk kepada CORS dan sekatan pelayar. Senarai kebenaran dalam manifest menerangkan capaian yang dimaksudkan; ia bukan sandbox keselamatan.

## Assets

`Assets/Icons` mengandungi PNG untuk aplikasi dan `Assets/Wallpapers` mengandungi imej latar sistem serta wallpaper.
