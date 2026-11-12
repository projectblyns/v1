# Panduan proses indeks BlynsOS 1.1

## 1. Tujuan indeks

Indeks bermaksud menyusun fail mengikut tugas supaya perubahan pada satu sistem tidak memerlukan kod sistem lain disalin atau diubah.

- `Core/` mengawal shell, keadaan desktop, lock screen, window manager dan panggilan antara modul.
- `Core/boot.js` mengurus animasi dan tempoh startup sahaja.
- `Core/off.js` mengurus permintaan shutdown/restart, pengesahan kata laluan dan peralihan skrin.
- `Setup/` menyimpan Setup Assistant secara berasingan.
- `Systems/` menyimpan servis bersama yang boleh digunakan oleh Core atau app.
- `Apps/` menyimpan aplikasi; aplikasi tambahan dimuatkan sebagai pakej berasingan.
- `Assets/` menyimpan ikon dan wallpaper.
- `Docs/` menyimpan panduan dan nota versi.

## 2. Laluan boot yang dicadangkan

`index.html` → `Core/Index.html` → `Core/core.js` → panggil `Core/boot.js` → selepas 3 saat:

- akaun sudah wujud: pergi ke `lock`;
- akaun belum wujud: panggil `Setup/setup.js`.

`Core/core.js` tidak perlu menyalin animasi boot ke dalam dirinya. Ia hanya meminta Boot controller menjalankan animasi dan menerima callback apabila selesai.

## 3. Laluan shutdown/restart

Dari desktop atau lock screen, tekan `0`:

1. `Core/off.js` meminta kata laluan akaun.
2. Kata laluan disahkan menggunakan `Systems/security.js`.
3. Paparan meminta pengesahan kedua.
4. Selepas pengguna sahkan, overlay fade menjadi hitam selama 2 saat.
5. Shutdown pergi ke skrin off; restart memanggil semula Boot controller.

Pada skrin off, `0` memulakan boot. Kotak kata laluan mengabaikan listener kuasa supaya angka `0` boleh ditaip ke dalam kata laluan.

## 4. Cara mengemas kini fail

1. Buat salinan projek sebelum mengubah fail.
2. Kenal pasti folder pemilik fungsi.
3. Pastikan path menggunakan huruf besar/kecil yang betul (GitHub Pages sensitif huruf besar/kecil).
4. Ubah hanya modul pemilik fungsi itu.
5. Semak JavaScript dengan `node --check`.
6. Uji dari root dan GitHub Pages, termasuk refresh.
7. Jangan padam localStorage atau IndexedDB semasa kemas kini biasa.

## 5. Keadaan semasa yang perlu diketahui

Setup, Boot, Shutdown/Restart dan storan Blob imej sudah dipisahkan. Laluan pemasangan app pihak pertama juga disediakan dengan satu contoh Focus Timer. Namun semua app warisan belum diekstrak: sebahagiannya masih berkongsi helper di `Core/core.js`. Pindahkan satu app pada satu masa, bermula dengan app yang tidak bergantung pada fail atau state sistem.
