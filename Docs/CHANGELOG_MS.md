# BlynsOS 1.3 — Kemas Kini Aplikasi

Tarikh keluaran: 16 November 2026

- Progress bar boot direset ke 0% dan mengambil masa penuh 3 saat pada setiap power-on, restart dan hidup semula selepas shutdown.
- Baiki setup Hello supaya dipaparkan sebaik setup bermula. Pemilihan bahasa dibuang; setup kini mempunyai 9 langkah. Skrin penyediaan akaun bergerak secara automatik tanpa butang Continue.
- Lockscreen menyusun tarikh/kalendar di atas jam. Jam dan input kata laluan dikecilkan, glass frame dibuang dan teks “Unlock BlynsOS” dibuang.
- Dalam format 12 jam, lockscreen tidak memaparkan AM/PM; jam desktop masih mengekalkan format pilihan.
- Sembilan aplikasi dipisahkan ke folder pakej dengan manifest, HTML, CSS dan JS: Navigator, Daybook, Jotter, Tasks, Soundwave, World Clock, Calculator, Writer dan Inbox.
- Chatline dan Atlas disediakan sebagai rangka pakej masa hadapan tetapi belum dimuatkan.
- API pakej menyediakan local storage, akses Desktop/Documents/Downloads serta muat turun fail binari ke IndexedDB.
- Untuk kestabilan, renderer UI sembilan aplikasi masih dipanggil melalui adapter Core buat sementara; fail pakej kini menjadi sempadan HTML/CSS/JS rasmi dan boleh diganti satu demi satu dengan `mount(container, context)` tanpa menulis semula window manager.
- Pakej pembangun luar boleh didaftarkan sebagai aplikasi bebas tanpa `coreId`; Store hanya memaparkan pakej yang didaftarkan dalam katalog.

# BlynsOS 1.2 — Kemas Kini Utama

**Tarikh:** 15 November 2026

## Perubahan dan pembaikan

- Memperbaiki bug wallpaper yang dimuat naik secara manual supaya imej disimpan dalam IndexedDB dan dipulihkan selepas refresh.
- Grid desktop disembunyikan secara lalai dan hanya dipaparkan ketika ikon/fail sedang diseret.
- Appearance hanya memaparkan wallpaper terbina dalam dan wallpaper yang sudah dipasang; wallpaper lain boleh dicapai melalui **Get More**.
- Pemasangan aplikasi dan wallpaper memerlukan pengesahan kata laluan akaun.
- App Library dinamakan semula kepada Launchpad dan hanya memaparkan aplikasi yang dipasang.
- Pakej aplikasi modular menyemak versi manifest dan menawarkan **Update** dengan pengesahan kata laluan; kemas kini pakej memuat semula aset berversi untuk mengelakkan cache lama.
- Protokol hash kata laluan baharu menggunakan PBKDF2-SHA-256 dengan 600,000 iterasi; hash lama masih disokong.
- Menambah kad profil pengguna pada sidebar Settings.
- Stage Manager memaparkan maksimum lima tetingkap; tetingkap lebihan diminimumkan dan tiada scrollbar/expand button.
- Memperkemas animasi, kaca Dock, glass surfaces, scrollbar, slider dan progress bar.
- Reka bentuk lock screen dikemas kini: jam rounded/glass, AM/PM lebih kecil, kalendar glass dan tiada label Workspace.
- Membuang bingkai glass daripada kawasan kata laluan lock screen.
- Memperbaiki avatar supaya kekal bulat walaupun ruang flex berubah.

## Nota seni bina aplikasi

Aplikasi tambahan yang menggunakan `Apps/Packages/` boleh dipasang secara berasingan. Kebanyakan aplikasi terbina dalam masih berada di `Core/core.js` kerana ia berkongsi fungsi window manager, Files dan storan. Pemindahan menyeluruh ke modul `Apps/BuiltIn/` perlu dibuat secara berperingkat dan bukan sebahagian daripada migrasi kompatibiliti v1.2 ini.
