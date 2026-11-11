/* BlynsOS Security — PBKDF2-SHA-256 password hashing via Web Crypto. */
(() => {
  'use strict';
  const ITERATIONS = 310000;
  const encoder = new TextEncoder();
  const toBase64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const fromBase64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  const cryptoAvailable = () => !!(window.crypto && window.crypto.subtle && window.crypto.getRandomValues);
  async function derive(password, salt, iterations) {
    if (!cryptoAvailable()) throw new Error('Secure password storage requires HTTPS or localhost and Web Crypto support.');
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    return crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
  }
  async function hashPassword(password) {
    if (typeof password !== 'string' || password.length < 8) throw new Error('Password must contain at least 8 characters.');
    if (!cryptoAvailable()) throw new Error('Open BlynsOS through localhost or HTTPS to create a secure password.');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const bits = await derive(password, salt, ITERATIONS);
    return JSON.stringify({ version: 1, algorithm: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: toBase64(salt), digest: toBase64(bits) });
  }
  async function verifyPassword(password, stored) {
    if (!stored || typeof password !== 'string' || !cryptoAvailable()) return false;
    try {
      const record = typeof stored === 'string' ? JSON.parse(stored) : stored;
      if (record.algorithm !== 'PBKDF2-SHA256' || !record.salt || !record.digest) return false;
      const bits = await derive(password, fromBase64(record.salt), Math.max(100000, Math.min(1000000, Number(record.iterations) || ITERATIONS)));
      const actual = new Uint8Array(bits), expected = fromBase64(record.digest);
      if (actual.length !== expected.length) return false;
      let diff = 0;
      for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
      return diff === 0;
    } catch (error) { return false; }
  }
  window.BlynsSecurity = Object.freeze({ hashPassword, verifyPassword, isAvailable: cryptoAvailable });
})();
