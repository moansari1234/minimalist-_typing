export const generateSalt = (): string => {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
};

const hexToArrayBuffer = (hex: string): ArrayBuffer => {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
};

const arrayBufferToHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const deriveKeyFromPasskey = async (passkey: string, saltHex: string): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passkey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: hexToArrayBuffer(saltHex),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const generateDEK = async (): Promise<CryptoKey> => {
  return window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const encryptDEK = async (dek: CryptoKey, kek: CryptoKey): Promise<{ encrypted: string, iv: string }> => {
  const exportedDek = await window.crypto.subtle.exportKey('raw', dek);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    kek,
    exportedDek
  );

  return {
    encrypted: arrayBufferToHex(encrypted),
    iv: arrayBufferToHex(iv)
  };
};

export const decryptDEK = async (encryptedHex: string, ivHex: string, kek: CryptoKey): Promise<CryptoKey> => {
  const encrypted = hexToArrayBuffer(encryptedHex);
  const iv = hexToArrayBuffer(ivHex);

  const decryptedDek = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    kek,
    encrypted
  );

  return window.crypto.subtle.importKey(
    'raw',
    decryptedDek,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const encryptPayload = async (payload: any, dek: CryptoKey): Promise<{ encrypted: string, iv: string }> => {
  const enc = new TextEncoder();
  const data = enc.encode(JSON.stringify(payload));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    dek,
    data
  );

  return {
    encrypted: arrayBufferToHex(encrypted),
    iv: arrayBufferToHex(iv)
  };
};

export const decryptPayload = async (encryptedHex: string, ivHex: string, dek: CryptoKey): Promise<any> => {
  const encrypted = hexToArrayBuffer(encryptedHex);
  const iv = hexToArrayBuffer(ivHex);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    dek,
    encrypted
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted));
};
