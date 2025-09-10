// Use Web Crypto API and simpler approach for better compatibility

/**
 * Convert ArrayBuffer to base64 string
 */
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Convert base64 string to ArrayBuffer
 */
const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Generate ECDH keypair for key exchange
 * @returns {Object} {privateKey, publicKey} - both as base64 strings
 */
export const generateKeyPair = async () => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );
  
  // Export keys in PKCS#8 format for private key and SPKI for public key
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  
  return {
    privateKey: arrayBufferToBase64(privateKey),
    publicKey: arrayBufferToBase64(publicKey)
  };
};

/**
 * Generate shared secret from private key and peer's public key
 * @param {string} privateKey - base64 encoded private key in PKCS#8 format
 * @param {string} peerPublicKey - base64 encoded peer's public key in SPKI format
 * @returns {ArrayBuffer} shared secret
 */
export const getSharedSecret = async (privateKey, peerPublicKey) => {
  // Import private key (PKCS#8 format)
  const privateKeyBuffer = base64ToArrayBuffer(privateKey);
  const importedPrivateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    false,
    ['deriveKey', 'deriveBits']
  );
  
  // Import public key (SPKI format)
  const publicKeyBuffer = base64ToArrayBuffer(peerPublicKey);
  const importedPublicKey = await crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    false,
    []
  );
  
  // Derive shared secret
  return await crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: importedPublicKey
    },
    importedPrivateKey,
    256 // 256 bits for AES-256
  );
};

/**
 * Encrypt message using AES-256-GCM
 * @param {string} message - plaintext message
 * @param {ArrayBuffer} sharedSecret - shared secret from ECDH
 * @returns {Object} {ciphertext, nonce} - both base64 encoded
 */
export const encryptMessage = async (message, sharedSecret) => {
  // Generate random nonce
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  
  // Import shared secret as AES key
  const key = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  
  // Encrypt the message
  const messageBytes = new TextEncoder().encode(message);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce
    },
    key,
    messageBytes
  );
  
  return {
    ciphertext: arrayBufferToBase64(encrypted),
    nonce: arrayBufferToBase64(nonce)
  };
};

/**
 * Decrypt message using AES-256-GCM
 * @param {string} ciphertext - base64 encoded ciphertext
 * @param {string} nonce - base64 encoded nonce
 * @param {ArrayBuffer} sharedSecret - shared secret from ECDH
 * @returns {string} decrypted plaintext message
 */
export const decryptMessage = async (ciphertext, nonce, sharedSecret) => {
  try {
    const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
    const nonceBuffer = base64ToArrayBuffer(nonce);
    
    // Import shared secret as AES key
    const key = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Decrypt the message
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonceBuffer
      },
      key,
      ciphertextBuffer
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Decryption failed]';
  }
};

/**
 * Generate a random room code
 * @returns {string} 6-character room code
 */
export const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate invite link for a room
 * @param {string} roomCode - room code
 * @param {string} roomName - room name
 * @returns {string} shareable invite link
 */
export const generateInviteLink = (roomCode, roomName) => {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    code: roomCode,
    name: encodeURIComponent(roomName)
  });
  return `${baseUrl}/join?${params.toString()}`;
};

/**
 * Parse invite link to extract room info
 * @param {string} url - invite link URL
 * @returns {Object|null} {code, name} or null if invalid
 */
export const parseInviteLink = (url) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.pathname !== '/join') return null;
    
    const code = urlObj.searchParams.get('code');
    const name = urlObj.searchParams.get('name');
    
    if (!code) return null;
    
    return {
      code,
      name: name ? decodeURIComponent(name) : null
    };
  } catch (error) {
    return null;
  }
};