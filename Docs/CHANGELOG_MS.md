# BlynsOS 1.1 — Minor Update

**Tarikh pakej:** 12 November 2026

## Perubahan dalam build ini

- Boot visual dipindahkan ke `Core/boot.js` dan Core hanya memanggil controller tersebut.
- Shutdown/restart dipindahkan ke `Core/off.js`.
- Shutdown/restart dari desktop atau lock screen memerlukan kata laluan diikuti pengesahan kedua.
- Peralihan shutdown/restart menggunakan fade sehingga 2 saat (kecuali Reduce Motion diaktifkan).
- Setup Assistant dipindahkan ke folder `Setup/` dan boleh dibuka melalui `Setup/Index.html` secara berasingan.
- Jam menyokong format 12 jam dan 24 jam di Blyns Settings → General.
- Dock mempunyai tingkah laku toggle: buka aplikasi, klik lagi untuk tutup; aplikasi minimized akan dipulihkan.
- Window minimized disembunyikan selepas animasi ke Dock selesai supaya tidak kelihatan mengintai di desktop.
- Control Center, Spotlight dan paparan detail Settings menggunakan transisi fade/transform yang lebih lembut.
- Store menggunakan katalog pakej dan memuatkan JavaScript/CSS aplikasi apabila pengguna memilih Get.
- `Focus Timer` disediakan sebagai contoh aplikasi sebenar yang boleh dipasang dan dipulihkan selepas refresh.
- `Systems/file-vault.js` menambah asas IndexedDB untuk simpan Blob gambar dan metadata.
- Label versi dipaparkan sebagai BlynsOS 1.1; label versi lama dan hint tambahan dibuang daripada antara muka.
- Hint visual dikekalkan hanya pada skrin kuasa: `0` untuk power on.

## Belum selesai / sengaja ditangguhkan

- Semua aplikasi warisan belum dipindahkan keluar daripada `Core/core.js`. Hanya laluan pakej optional dan Focus Timer dipisahkan dalam update ini. Apps lama berkongsi helper dan state dalaman; pemindahan perlu dibuat satu per satu supaya data dan tingkah laku tidak rosak.
- File Vault sudah tersedia sebagai servis IndexedDB, tetapi UI import/preview penuh ke Files dan Gallery serta migrasi gambar dari model lama belum dibuat.
- Auto-update, checksum tandatangan pakej dan sandbox aplikasi pihak ketiga belum disediakan.
