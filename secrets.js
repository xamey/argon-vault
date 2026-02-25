import { deriveKeyBrowser, decryptValueBrowser } from 'argon-vault/crypto-browser';

const vaultSalt = Uint8Array.from(atob('TBN/aygdv5yEZzbWikmC6Q=='), c => c.charCodeAt(0));

export async function decryptA(passphrase) {
  const key = await deriveKeyBrowser(passphrase, vaultSalt);
  return decryptValueBrowser('Gw==', key, '4Zupkx5jQMLQF6nU', '3BipnaQG9AIK6pfjZHhLMw==');
}

export async function decryptC(passphrase) {
  const key = await deriveKeyBrowser(passphrase, vaultSalt);
  return decryptValueBrowser('rA==', key, 'HulOafn8bDO0VxVs', '8noJ0W4tCIV0y8gwdq/D4g==');
}
