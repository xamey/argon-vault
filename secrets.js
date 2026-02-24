import argon2 from 'argon2';
import crypto from 'crypto';

export async function decryptA(passphrase) {
  const salt = Uint8Array.from(atob('4mrhLs35zi2sy9xntvGYCA=='), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob('o4GiRscxlf8ZmaOf'), c => c.charCodeAt(0));
  const authTag = Uint8Array.from(atob('P2iUdYHnzNrWsJx5HORo7Q=='), c => c.charCodeAt(0));
  const data = Uint8Array.from(atob('BQ=='), c => c.charCodeAt(0));

  const key = await argon2.hash(passphrase, {
    type: argon2.argon2id,
    salt: salt,
    memoryCost: 256 * 1024,
    timeCost: 12,
    parallelism: 1,
    hashLength: 32,
    raw: true,
  });

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(data),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
