/**
 * Browser-safe crypto: same KDF and cipher as src/crypto.js so existing
 * secrets.json payloads decrypt. Uses argon2-browser + Web Crypto (AES-GCM).
 *
 * Argon2id: memory 256*1024 KiB, time 12, parallelism 1, hash 32 bytes.
 * AES-256-GCM: 12-byte IV, 16-byte auth tag (ciphertext + tag).
 */

const ARGON2_CONFIG = {
  time: 12,
  mem: 256 * 1024,
  hashLen: 32,
  parallelism: 1,
};

const AES_GCM_TAG_LENGTH_BITS = 128;

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Derive a 32-byte key from passphrase and salt (Argon2id, same params as Node).
 * @param {string} passphrase
 * @param {Uint8Array} salt - 16 bytes (e.g. from atob(secret.salt))
 * @returns {Promise<Uint8Array>} 32-byte key
 */
export async function deriveKeyBrowser(passphrase, salt) {
  const mod = await import("argon2-browser");
  const argon2 = mod.default ?? mod;
  const result = await argon2.hash({
    pass: passphrase,
    salt: salt,
    time: ARGON2_CONFIG.time,
    mem: ARGON2_CONFIG.mem,
    hashLen: ARGON2_CONFIG.hashLen,
    parallelism: ARGON2_CONFIG.parallelism,
    type: argon2.ArgonType.Argon2id,
  });
  return result.hash;
}

/**
 * Decrypt one secret value (AES-256-GCM, same IV + tag handling as Node).
 * @param {string} encryptedDataBase64 - ciphertext only (no tag)
 * @param {Uint8Array} key - 32-byte key from deriveKeyBrowser
 * @param {string} ivBase64 - 12-byte IV, base64
 * @param {string} authTagBase64 - 16-byte auth tag, base64
 * @returns {Promise<string>} UTF-8 plaintext
 */
export async function decryptValueBrowser(
  encryptedDataBase64,
  key,
  ivBase64,
  authTagBase64
) {
  const iv = base64ToUint8Array(ivBase64);
  const ciphertext = base64ToUint8Array(encryptedDataBase64);
  const tag = base64ToUint8Array(authTagBase64);
  const ciphertextWithTag = new Uint8Array(ciphertext.length + tag.length);
  ciphertextWithTag.set(ciphertext);
  ciphertextWithTag.set(tag, ciphertext.length);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: AES_GCM_TAG_LENGTH_BITS,
    },
    cryptoKey,
    ciphertextWithTag
  );

  return new TextDecoder("utf-8").decode(decrypted);
}
