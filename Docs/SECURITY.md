# Keselamatan dan batasan BlynsOS 1.0 Stabilized

## Kata laluan

BlynsOS tidak lagi menyimpan kata laluan sebagai teks biasa. `Systems/security.js` menggunakan Web Crypto PBKDF2 dengan SHA-256, salt rawak 16 bait dan 310,000 iterasi. Nilai yang disimpan dalam localStorage ialah rekod hash, salt dan parameter derivasi. Semasa log masuk, kata laluan yang dimasukkan dibandingkan melalui derivasi semula.

Untuk menghasilkan hash dengan betul, buka BlynsOS melalui `http://localhost` atau HTTPS. Browser moden biasanya menyekat sebahagian API kriptografi pada origin tidak selamat seperti laman HTTP biasa.

## Had keselamatan

- BlynsOS ialah aplikasi browser, bukan sistem operasi yang mempunyai akaun OS sebenar.
- Data disimpan dalam profil browser setempat. Seseorang yang mempunyai akses ke profil browser atau DevTools mungkin boleh memeriksa atau mengubah data aplikasi.
- PBKDF2 melindungi kata laluan daripada disimpan sebagai teks biasa, tetapi tidak menjadikan keseluruhan persekitaran setara dengan pengesahan OS atau pangkalan data pelayan.
- Aplikasi tambahan berjalan dalam origin dan halaman yang sama. Pasang hanya kod aplikasi yang anda tulis atau percayai.
- App Store dalam pakej ini ialah katalog pakej setempat. Aplikasi dan wallpaper yang disenaraikan dibekalkan bersama projek ZIP; pemasangan menyimpan status pemasangan dalam browser. Ia bukan servis backend atau marketplace internet.
- Navigator tertakluk kepada dasar keselamatan laman web yang dibuka. Sesetengah laman tidak membenarkan paparan dalam iframe.

## Cadangan

Jangan gunakan kata laluan sebenar yang digunakan untuk akaun penting. Simpan salinan sandaran fail projek dan eksport data sendiri sebelum memadam storan browser.
