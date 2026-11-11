# BlynsOS 1.0 — Stabilized

BlynsOS 1.0 Stabilized menggabungkan pengalaman desktop dan aplikasi daripada Major Update 2.0 dengan Setup Assistant v1 yang dibina semula. Pakej ini telah dipecahkan kepada empat struktur utama supaya mudah diselenggara dan dikembangkan.

## Cara menjalankan

**Windows**

1. Ekstrak ZIP ke satu folder, contohnya `BlynsOS_1.0_Stabilized`.
2. Buka folder tersebut di File Explorer.
3. Klik ruang alamat folder, taip `cmd`, kemudian tekan Enter.
4. Jalankan:

   ```bat
   py -m http.server 8000
   ```

   Jika arahan `py` tidak tersedia, gunakan `python -m http.server 8000`.
5. Buka `http://localhost:8000` dalam Chrome, Edge atau Opera versi terkini.

Fail `index.html` akan membawa anda ke `Core/Index.html`. Jalankan melalui `localhost` atau HTTPS kerana Web Crypto digunakan untuk hash kata laluan.

## Struktur folder

```text
BlynsOS_1.0_Stabilized/
├── index.html                 # Pintu masuk projek
├── Core/
│   ├── Index.html             # Semua skrin: boot, setup, lockscreen, desktop
│   ├── core.css               # Reka bentuk dan animasi sistem
│   └── core.js                # Enjin desktop, windows, dock dan aplikasi sistem
├── Systems/
│   ├── storage.js             # Lapisan storan setempat
│   ├── security.js            # Hash dan pengesahan kata laluan PBKDF2-SHA-256
│   ├── registry.js            # Laluan ikon dan carian wallpaper
│   ├── wallpapers.js          # Katalog wallpaper
│   └── packages.js            # Registry pakej aplikasi
├── Apps/
│   ├── focus-timer.js         # Contoh aplikasi tambahan yang boleh dipasang
│   └── app-template.js        # Templat untuk aplikasi baharu
├── Assets/
│   ├── Icons/                 # Ikon aplikasi PNG
│   ├── Wallpapers/            # Wallpaper sistem dan Store
│   └── Brand/                 # Aset identiti jenama (ruang untuk aset tambahan)
└── Docs/
    ├── APP_DEVELOPMENT.md     # Cara menambah aplikasi ke Store
    └── SECURITY.md            # Nota keselamatan dan batasan
```

## Apa yang termasuk

- Boot screen dengan logo B dan loading bar selama kira-kira 3 saat.
- Setup Assistant 10 peringkat: salam, region/bahasa, nama akaun, kata laluan, pengesahan, tema, wallpaper, accent, avatar dan persediaan akhir.
- Lockscreen dengan jam, tarikh dan pengesahan kata laluan.
- Desktop Major Update 2.0: menu bar, Dock, App Library, Spotlight, Control Center, Stage Manager, windows, Files, Settings dan aplikasi terbina dalam.
- Blyns Store dengan tab Apps dan Wallpapers. Pemasangan direkodkan dalam profil browser.
- PNG icon registry. Setiap aplikasi akan mencari `Assets/Icons/<app-id>.png`, dengan ikon umum sebagai fallback.
- Wallpaper setempat yang boleh digunakan pada desktop dan lockscreen.

## Menukar ikon aplikasi kepada PNG

1. Sediakan ikon PNG berbentuk segi empat sama, disyorkan 256×256 atau 512×512.
2. Namakan fail menggunakan ID aplikasi, contohnya `finder.png`, `settings.png` atau `focus-timer.png`.
3. Letakkan fail tersebut di `Assets/Icons/`.
4. Muat semula BlynsOS. Kod ikon membaca PNG secara automatik.

Jika mahu ikon khas untuk aplikasi pakej, tetapkan `icon: '../Assets/Icons/nama-app.png'` dalam manifest.

## Menambah aplikasi baharu

Baca `Docs/APP_DEVELOPMENT.md`. Ringkasnya, salin `Apps/app-template.js`, tukar ID dan maklumat manifest, bina UI dalam fungsi `render(container, context)`, kemudian tambah satu tag `<script>` ke `Core/Index.html` sebelum `core.js`. Aplikasi baharu akan muncul dalam Blyns Store dan boleh dipasang ke Dock/App Library.

## Menambah wallpaper baharu

1. Letakkan fail JPG, PNG atau WebP dalam `Assets/Wallpapers/`.
2. Buka `Systems/wallpapers.js`.
3. Tambah satu objek dengan `id`, `name`, `description`, `src`, `preview` dan `category`.
4. Pastikan laluan imej bermula dengan `../Assets/Wallpapers/`.
5. Muat semula BlynsOS. Wallpaper itu akan muncul dalam Setup, Appearance dan Blyns Store.

## Data pengguna

Akaun, hash kata laluan, aplikasi terpasang, wallpaper terpasang, fail, nota dan pilihan Appearance disimpan dalam storan browser pada profil browser semasa. Gunakan **Blyns Settings → Erase All Content** untuk memadam data BlynsOS dan memulakan Setup semula.

BlynsOS ialah persekitaran desktop berasaskan browser. Ia tidak menggantikan sistem operasi sebenar dan tidak mengawal perkakasan komputer.
