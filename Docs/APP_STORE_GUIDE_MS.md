# Panduan menambah aplikasi ke Blyns Store

Contoh kerja dalam build ini ialah `Apps/Packages/focus-timer/`.

## A. Struktur folder aplikasi

Bina folder baharu, contohnya:

```text
Apps/
└── Packages/
    └── my-app/
        ├── manifest.json
        ├── app.js
        └── style.css
Assets/
└── Icons/
    └── my-app.png
```

Gunakan ID huruf kecil, nombor, `-` atau `_`. Contoh: `my-app`. Jangan guna ruang atau tukar ID selepas aplikasi diterbitkan kerana status pemasangan disimpan menggunakan ID itu.

## B. Isi manifest

`manifest.json` ialah sumber metadata dan laluan sebenar yang dibaca oleh package loader. Path `entry`, `styles` dan `icon` dikira relatif kepada fail manifest itu sendiri.

Contoh `Apps/Packages/my-app/manifest.json`:

```json
{
  "id": "my-app",
  "name": "My App",
  "description": "A short description.",
  "category": "Productivity",
  "version": "1.0.0",
  "entry": "app.js",
  "styles": "style.css",
  "icon": "../../../Assets/Icons/my-app.png",
  "permissions": []
}
```

## C. Daftarkan dalam katalog Store

Buka `Systems/packages.js`. Tambah satu objek kepada array `catalogue`:

```js
{
  id: 'my-app',
  name: 'My App',
  description: 'A short description.',
  category: 'Productivity',
  version: '1.0.0',
  symbol: '✦',
  colors: '#b8d5ff,#5f83ca',
  size: [520, 420],
  manifest: '../Apps/Packages/my-app/manifest.json'
}
```

`manifest` dikira dari `Core/Index.html`. Path `entry`, `styles` dan `icon` dalam manifest pula dikira dari folder aplikasi tersebut.

## D. Daftar fungsi render dalam app.js

Aplikasi memanggil `window.BlynsPackages.registerApp()`:

```js
window.BlynsPackages.registerApp({
  id: 'my-app',
  name: 'My App',
  version: '1.0.0',
  symbol: '✦',
  size: [520, 420],
  render(container, context) {
    container.innerHTML = '<section class="my-app"><h2>Hello</h2></section>';
    // context.toast('Optional status message');
    // context.storage.getText('my-app:key', '');
    // context.onClose(() => cleanupTimersOrEvents());
  }
});
```

`container` ialah kawasan kandungan app di dalam window BlynsOS. Jangan bina title bar atau window sendiri. Core menyediakan window, title bar, butang tutup/minimize/fullscreen dan skin utama.

Gunakan class CSS khusus seperti `.my-app`. Jangan ubah style global `body`, `.win`, `#desk` atau `#dock`. Jika app membuat timer atau listener, daftarkan cleanup melalui `context.onClose(() => ...)`.

## E. Cara pengguna memasang

1. Buka Blyns Store.
2. Tekan `Get` pada aplikasi.
3. Package loader mencari laluan `manifest.json` daripada katalog Store.
4. Loader membaca manifest, mengesahkan ID dan menyelesaikan path `entry`, `styles` serta `icon`.
5. `style.css` dan `app.js` dimuatkan daripada fail statik GitHub Pages.
6. App mendaftarkan `render()` ke BlynsOS Core.
7. Core menyimpan ID pemasangan dan menyegarkan Dock/App Library.
8. Apabila halaman dibuka semula, package loader membaca ID yang sudah dipasang dan memuatkan semula skrip pakej tersebut.

**Nota teknikal penting:** Pada GitHub Pages, browser tidak boleh menulis fail terus ke repository atau menyalin kod aplikasi ke folder `Apps/` milik pelawat. Jadi “install” di sini bermaksud browser memuatkan modul yang telah diterbitkan oleh pembangun dan menyimpan status pemasangan secara setempat. Kod app kekal di repository; pengguna tidak perlu mengedit fail untuk memasangnya.

## F. Uji aplikasi sebelum diterbitkan

- Pastikan semua path betul dan huruf besar/kecil sepadan.
- Semak `app.js` dengan `node --check app.js`.
- Uji `Get`, `Open`, refresh, tutup, minimize, restore dan tema cerah/gelap.
- Uji aplikasi yang sedang berjalan ditutup dengan butang Dock.
- Semak bahawa timer/event dibersihkan apabila window ditutup.
- Jangan masukkan aplikasi pihak ketiga yang tidak dipercayai: package JavaScript berjalan pada origin BlynsOS dan belum disandbox dalam iframe.

## G. Nyahpasang

API `window.BlynsPackages.uninstall('my-app')` disediakan untuk app yang berdaftar dalam katalog. UI nyahpasang pengguna boleh ditambah kemudian di App Library atau Settings.

## H. Kemas kini versi

Naikkan medan `version` dalam katalog dan manifest, kemas kini fail `app.js`/`style.css`, kemudian terbitkan perubahan ke GitHub. Untuk build statik, pengguna perlu refresh halaman agar browser memuat turun versi fail yang terkini. Sistem auto-update dengan checksum/rollback belum dibina dalam release ini.
