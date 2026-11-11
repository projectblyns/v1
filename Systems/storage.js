/* BlynsOS Storage Layer — namespaced local storage with safe JSON handling. */
(() => {
  'use strict';
  const prefix = 'blyns_';
  const storage = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (error) {
        console.warn('BlynsOS storage read failed:', key, error);
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn('BlynsOS storage write failed:', key, error);
        return false;
      }
    },
    getText(key, fallback = '') {
      try { return localStorage.getItem(key) ?? fallback; }
      catch (error) { return fallback; }
    },
    setText(key, value) {
      try { localStorage.setItem(key, String(value)); return true; }
      catch (error) { return false; }
    },
    remove(key) { try { localStorage.removeItem(key); return true; } catch (error) { return false; } },
    clearBlyns() {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (/^mac(_|os_)/i.test(key) || key.startsWith(prefix) || key.startsWith('navigator_'))) keys.push(key);
        }
        keys.forEach(key => localStorage.removeItem(key));
        return true;
      } catch (error) { console.warn('BlynsOS storage reset failed.', error); return false; }
    }
  };
  window.BlynsStorage = Object.freeze(storage);
})();
