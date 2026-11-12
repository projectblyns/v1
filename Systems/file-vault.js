/* BlynsOS File Vault — IndexedDB-backed binary storage for user images. */
(() => {
  'use strict';
  const DB_NAME = 'blyns-vault';
  const DB_VERSION = 1;
  const STORE = 'images';
  const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
  let databasePromise;

  function openDatabase() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('This browser does not support IndexedDB.'));
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open image storage.'));
      request.onblocked = () => reject(new Error('Image storage upgrade is blocked by another BlynsOS tab.'));
    }).catch(error => { databasePromise = null; throw error; });
    return databasePromise;
  }

  function makeId() {
    return window.crypto?.randomUUID?.() || `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  async function requestPersistence() {
    try {
      if (navigator.storage?.persist) return await navigator.storage.persist();
    } catch (_) {}
    return false;
  }

  async function saveImage(file, extra = {}) {
    if (!(file instanceof Blob)) throw new TypeError('Choose an image file first.');
    if (!String(file.type || '').startsWith('image/')) throw new TypeError('Only image files can be saved here.');
    if (file.size > MAX_IMAGE_BYTES) throw new Error('Images must be 50 MB or smaller.');
    const db = await openDatabase();
    const record = {
      id: makeId(),
      name: String(extra.name || file.name || 'Image').slice(0, 180),
      type: file.type || 'application/octet-stream',
      size: file.size,
      createdAt: new Date().toISOString(),
      lastModified: Number(file.lastModified || Date.now()),
      width: Number(extra.width || 0),
      height: Number(extra.height || 0),
      folder: String(extra.folder || 'Pictures'),
      blob: file
    };
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).add(record);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Image could not be saved.'));
      tx.onabort = () => reject(tx.error || new Error('Image save was cancelled.'));
    });
    await requestPersistence();
    const { blob, ...metadata } = record;
    return metadata;
  }

  async function listImages(folder = null) {
    const db = await openDatabase();
    const records = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('Could not list images.'));
    });
    return records
      .filter(record => !folder || record.folder === folder)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map(({ blob, ...metadata }) => metadata);
  }

  async function getImage(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Could not read image.'));
    });
  }

  async function deleteImage(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('Could not delete image.'));
      tx.onabort = () => reject(tx.error || new Error('Image deletion was cancelled.'));
    });
  }

  function createObjectURL(record) {
    if (!record?.blob) throw new TypeError('An image record with a Blob is required.');
    return URL.createObjectURL(record.blob);
  }

  function revokeObjectURL(url) {
    if (typeof url === 'string' && url.startsWith('blob:')) URL.revokeObjectURL(url);
  }

  async function estimate() {
    try {
      if (navigator.storage?.estimate) return await navigator.storage.estimate();
    } catch (_) {}
    return null;
  }

  window.BlynsFileVault = Object.freeze({
    saveImage, listImages, getImage, deleteImage,
    createObjectURL, revokeObjectURL, requestPersistence, estimate
  });
})();
