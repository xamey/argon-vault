import crypto from "crypto";
import argon2 from "argon2";

const ARGON2_CONFIG = {
  type: argon2.argon2id,
  memoryCost: 256 * 1024,
  timeCost: 12,
  parallelism: 1,
  hashLength: 32,
  saltLength: 16,
};

const AES_CONFIG = {
  algorithm: "aes-256-gcm",
  ivLength: 12,
  authTagLength: 16,
};

export async function deriveKey(passphrase, salt) {
  return argon2.hash(passphrase, {
    ...ARGON2_CONFIG,
    salt: salt,
    raw: true,
  });
}

export function encryptValue(plaintext, key) {
  const iv = crypto.randomBytes(AES_CONFIG.ivLength);
  const cipher = crypto.createCipheriv(AES_CONFIG.algorithm, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    data: encrypted.toString("base64"),
  };
}

export async function decryptValue(encryptedData, key, iv, authTag) {
  const decipher = crypto.createDecipheriv(
    AES_CONFIG.algorithm,
    key,
    Buffer.from(iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function generateSalt() {
  return crypto.randomBytes(ARGON2_CONFIG.saltLength);
}
