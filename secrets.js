import { deriveKeyBrowser, decryptValueBrowser } from 'argon-vault/crypto-browser';

export async function deriveKey(passphrase) {
  const vaultSalt = Uint8Array.from(atob("n09gEeG/mewUevnWdkXqFg=="), (c) =>
    c.charCodeAt(0),
  );
  const key = await deriveKeyBrowser(passphrase, vaultSalt);
  try {
    await decrypt_sentinel(key);
  } catch (e) {
    throw new Error("Invalid passphrase");
  }
  return key;
}

export async function decryptC(key) {
  return decryptValueBrowser('gQ==', key, 'nnkgnZ/Rhinh7gHK', 'iAKNKHc+fw/iQCqwx4qVmA==');
}

export async function decrypt_sentinel(key) {
  return decryptValueBrowser('Ss8=', key, 'vtFxZCm7d+o4o9gU', 'rY4AanrhS2Ls8WX7b2+HYA==');
}
