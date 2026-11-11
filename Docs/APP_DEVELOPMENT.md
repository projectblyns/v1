# Panduan membina aplikasi BlynsOS

## Prinsip asas

Setiap aplikasi ialah satu fail JavaScript di dalam `Apps/`. Aplikasi mendaftarkan manifest menggunakan `window.BlynsPackages.registerApp(...)`. BlynsOS akan memaparkan manifest itu dalam Blyns Store. Pengguna menekan **Get** untuk memasang; selepas dipasang aplikasi muncul di App Library dan boleh diletakkan di Dock melalui Settings.

## Langkah menambah aplikasi

1. Salin `Apps/app-template.js` dan namakan fail baharu, contohnya `Apps/notes-plus.js`.
2. Tukar `id` kepada ID unik huruf kecil, nombor, `-` atau `_`.
3. Ubah `name`, `description`, `category`, `version`, `icon`, `colors` dan `size`.
4. Bina paparan dalam fungsi `render(container, context)`.
5. Tambah ikon PNG di `Assets/Icons/<id>.png`.
6. Buka `Core/Index.html`. Cari bahagian skrip aplikasi dan tambah:

   ```html
   <script src="../Apps/notes-plus.js"></script>
   ```

   Letakkan tag itu selepas `packages.js` dan sebelum `core.js`.
7. Simpan semua fail, muat semula BlynsOS, buka Blyns Store dan tekan **Get**.

## Manifest aplikasi

```js
window.BlynsPackages.registerApp({
  id: 'notes-plus',
  name: 'Notes Plus',
  description: 'A compact note-taking app.',
  category: 'Productivity',
  version: '1.0.0',
  symbol: '✎',
  icon: '../Assets/Icons/notes-plus.png',
  colors: '#88aee8,#405f9f',
  size: [520, 420],
  render(container, context) {
    container.innerHTML = '<div class="main"><h2>Notes Plus</h2><textarea style="width:100%;height:240px"></textarea></div>';
    // context.toast('Saved');
  }
});
```

`context` menyediakan:

- `context.toast(message)` — paparkan notifikasi.
- `context.storage.get(key, fallback)` dan `context.storage.set(key, value)` — simpan data JSON setempat.
- `context.openApp(id, args)` — buka aplikasi BlynsOS lain.
- `context.onClose(callback)` — daftar pembersihan apabila tetingkap ditutup.

Jangan gunakan ID yang sama dengan aplikasi teras. Jangan meletakkan kod daripada sumber yang tidak dipercayai ke dalam aplikasi.

## Ikon PNG

Nama fail lalai ialah `Assets/Icons/<id>.png`. Gunakan PNG 512×512 dengan ruang tepi mencukupi. Jika perlu lokasi khas, tetapkan `icon` pada manifest.

## Wallpaper

Wallpaper bukan aplikasi. Tambah fail imej ke `Assets/Wallpapers/`, kemudian tambah manifest dalam `Systems/wallpapers.js`. Contoh:

```js
{
  id: 'blue-evening',
  name: 'Blue Evening',
  description: 'A calm blue evening sky.',
  src: '../Assets/Wallpapers/blue-evening.jpg',
  preview: '../Assets/Wallpapers/blue-evening.jpg',
  category: 'Abstract'
}
```
