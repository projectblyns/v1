# Cadangan storan gambar BlynsOS

## Reka bentuk yang disyorkan

Gunakan dua lapisan:

- `localStorage`: tetapan kecil sahaja — wallpaper dipilih, tema, bahasa, susunan Dock.
- `IndexedDB` (`blyns-vault`): fail imej sebenar sebagai `Blob`, bersama metadata.

Modul `Systems/file-vault.js` dalam pakej ini menyediakan fungsi `saveImage`, `listImages`, `getImage`, `deleteImage`, `createObjectURL`, `revokeObjectURL`, `requestPersistence` dan `estimate`.

## Kenapa bukan localStorage?

`localStorage` menyimpan teks dan mempunyai kuota kecil. Menukar gambar kepada Base64 menjadikan fail lebih besar dan membebankan operasi simpan/baca. IndexedDB boleh menyimpan Blob tanpa perlu encode ke Base64 dan sesuai untuk fail binari.

## Model data

Setiap rekod gambar menyimpan:

- ID unik
- Nama fail
- MIME type
- Saiz byte
- Tarikh dicipta dan tarikh fail asal
- Dimensi jika disediakan
- Folder maya, contohnya `Pictures`
- Blob imej sebenar

## Contoh penggunaan daripada app

```js
const file = fileInput.files[0];
const metadata = await window.BlynsFileVault.saveImage(file, {
  folder: 'Pictures'
});

const record = await window.BlynsFileVault.getImage(metadata.id);
const url = window.BlynsFileVault.createObjectURL(record);
imageElement.src = url;

// Apabila preview tidak digunakan lagi:
window.BlynsFileVault.revokeObjectURL(url);
```

## Had yang perlu difahami

- IndexedDB ialah storan browser pada peranti/profile itu, bukan cloud sync.
- Data boleh terpadam jika pengguna clear site data, profil browser rosak atau browser mengurus kuota.
- `requestPersistence()` meminta browser cuba melindungi storan daripada eviction; ia bukan jaminan backup.
- Tambah export/import backup sebelum menyimpan gambar penting.
- Dalam build ini File Vault sudah disediakan sebagai servis, tetapi integrasi penuh ke UI Files/Gallery dan migrasi automatik gambar lama belum dibuat. Jangan padam rekod gambar lama sehingga migrasi diuji.
