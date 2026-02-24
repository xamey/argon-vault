import fs from "fs";
import path from "path";
import readline from "readline";
import { deriveKey, decryptValue } from "../crypto.js";

// Use readline only to read, and let the terminal handle echoing once
const rl = readline.createInterface({
  input: process.stdin,
  output: undefined,
});

function question(query) {
  return new Promise((resolve) => {
    process.stdout.write(query);
    rl.once("line", (answer) => {
      resolve(answer);
    });
  });
}

export async function decrypt(options) {
  const secretsPath = path.resolve(options.secrets);

  if (!fs.existsSync(secretsPath)) {
    console.error(`Error: ${secretsPath} not found`);
    process.exit(1);
  }

  let secretsData;
  try {
    secretsData = JSON.parse(fs.readFileSync(secretsPath, "utf8"));
  } catch (err) {
    console.error("Error: Invalid JSON file");
    process.exit(1);
  }

  if (!secretsData.secrets || Object.keys(secretsData.secrets).length === 0) {
    console.log("No secrets found in file");
    return;
  }

  const passphrase = await question("Enter passphrase: ");
  if (!passphrase) {
    console.error("Error: Passphrase cannot be empty");
    process.exit(1);
  }

  console.log("\nDecrypted secrets:\n");

  for (const [key, secret] of Object.entries(secretsData.secrets)) {
    try {
      const salt = Buffer.from(secret.salt, "base64");
      const keyBuffer = await deriveKey(passphrase, salt);
      const decrypted = await decryptValue(
        secret.data,
        keyBuffer,
        secret.iv,
        secret.authTag,
      );
      console.log(`${key}: ${decrypted}`);
    } catch (err) {
      console.error(`${key}: DECRYPTION_FAILED (wrong passphrase?)`);
    }
  }

  rl.close();
}
