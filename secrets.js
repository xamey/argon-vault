import { deriveKeyBrowser, decryptValueBrowser } from 'argon-vault/crypto-browser';

export async function decryptA(passphrase) {
  const salt = Uint8Array.from(atob('TrkQD0dx35PgzrpOcHWohQ=='), c => c.charCodeAt(0));
  const key = await deriveKeyBrowser(passphrase, salt);
  return decryptValueBrowser('FQ==', key, 'Iy+si3MVRMHfctfA', 'fr5S3oeLRAG/fG5bU0SnSA==');
}
