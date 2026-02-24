import readline from "readline";
import fs from "fs";
import path from "path";
import { generateSalt, deriveKey, encryptValue } from "../crypto.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function estimateBruteforce(passphrase) {
  const length = passphrase.length;
  if (!length) return null;

  let charsetSize = 0;
  if (/[a-z]/.test(passphrase)) charsetSize += 26;
  if (/[A-Z]/.test(passphrase)) charsetSize += 26;
  if (/[0-9]/.test(passphrase)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(passphrase)) charsetSize += 32; // rough symbol set size

  if (!charsetSize) return null;

  const log10Keyspace = length * Math.log10(charsetSize);
  const entropyBits = log10Keyspace * 3.321928094887362; // log2(10)

  // Very rough offline attacker assumption for Argon2id with current params
  const guessesPerSecond = 50000;
  const log10GuessesPerSecond = Math.log10(guessesPerSecond);
  const log10Seconds = log10Keyspace - log10GuessesPerSecond;

  const secondsPerYear = 365.25 * 24 * 60 * 60;
  const log10SecondsPerYear = Math.log10(secondsPerYear);
  const log10Years = log10Seconds - log10SecondsPerYear;

  let timeCategory;
  if (log10Seconds < 0) {
    timeCategory = "under a second (extremely weak)";
  } else if (log10Seconds < 2) {
    timeCategory = "seconds (very weak)";
  } else if (log10Seconds < 4) {
    timeCategory = "minutes to hours (weak)";
  } else if (log10Seconds < 6) {
    timeCategory = "days to weeks (moderate)";
  } else if (log10Seconds < 8) {
    timeCategory = "years to millennia (strong)";
  } else {
    timeCategory = "far beyond practical limits (very strong)";
  }

  return { entropyBits, timeCategory, log10Seconds, log10Years };
}

function humanizeDuration(log10Seconds, log10Years) {
  if (log10Seconds < 0) {
    return "< 1 second";
  }

  // Up to ~100 seconds → express in seconds
  if (log10Seconds < 2) {
    const seconds = Math.round(10 ** log10Seconds);
    return `about ${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  const log10Minutes = log10Seconds - Math.log10(60);
  const log10Hours = log10Seconds - Math.log10(60 * 60);
  const log10Days = log10Seconds - Math.log10(24 * 60 * 60);

  // Up to a few hours → express in minutes
  if (log10Seconds < 4) {
    const minutes = Math.round(10 ** log10Minutes);
    return `about ${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  // Up to a few days → express in hours
  if (log10Seconds < 5.5) {
    const hours = Math.round(10 ** log10Hours);
    return `about ${hours} hour${hours === 1 ? "" : "s"}`;
  }

  // Up to a few years → express in days
  if (log10Seconds < 8) {
    const days = Math.round(10 ** log10Days);
    return `about ${days} day${days === 1 ? "" : "s"}`;
  }

  // Very long durations → use years in broad terms
  if (log10Years < 3) {
    const years = Math.round(10 ** log10Years);
    return `about ${years} year${years === 1 ? "" : "s"}`;
  }
  if (log10Years < 6) {
    const thousands = Math.round(10 ** (log10Years - 3));
    return `about ${thousands} thousand years`;
  }
  if (log10Years < 9) {
    const millions = Math.round(10 ** (log10Years - 6));
    return `about ${millions} million years`;
  }

  const billions = Math.round(10 ** (log10Years - 9));
  return `about ${billions} billion years`;
}

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function questionSecret(query) {
  // For now, reuse the main readline interface without masking
  return question(query);
}

export async function encrypt() {
  console.log("argon-vault Secret Encryption Tool\n");

  const passphrase = await questionSecret("Enter passphrase: ");
  if (!passphrase) {
    console.error("Error: Passphrase cannot be empty");
    process.exit(1);
  }

  const estimate = estimateBruteforce(passphrase);
  if (estimate) {
    const humanDuration = humanizeDuration(
      estimate.log10Seconds,
      estimate.log10Years,
    );

    console.log(
      `\nPassphrase strength: ~${estimate.entropyBits.toFixed(
        1,
      )} bits; estimated brute-force cost (offline, ~50k Argon2id guesses/sec): ${humanDuration} (${estimate.timeCategory}).`,
    );
  } else {
    console.log(
      "\nPassphrase strength could not be estimated. Use a long, random passphrase.",
    );
  }

  const confirmPassphrase = await questionSecret(
    "\nConfirm passphrase (re-enter to proceed): ",
  );
  if (passphrase !== confirmPassphrase) {
    console.error("Error: Passphrases do not match");
    process.exit(1);
  }

  console.log(
    "\nEnter key/value pairs (press Enter twice on key to finish):\n",
  );

  const secrets = {};

  while (true) {
    const key = await question("Key: ");
    if (key === "") {
      break;
    }

    if (secrets[key]) {
      console.log("Error: Key already exists");
      continue;
    }

    const value = await question("Value: ");
    if (!value) {
      console.log("Error: Value cannot be empty");
      continue;
    }

    const salt = generateSalt();
    const keyBuffer = await deriveKey(passphrase, salt);
    const encrypted = encryptValue(value, keyBuffer);

    secrets[key] = {
      salt: salt.toString("base64"),
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      data: encrypted.data,
    };

    console.log(`Added: ${key}\n`);
  }

  rl.close();

  if (Object.keys(secrets).length === 0) {
    console.log("No secrets entered. Exiting.");
    process.exit(0);
  }

  const output = {
    version: 1,
    secrets: secrets,
  };

  const outputPath = path.join(process.cwd(), "secrets.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(
    `\nEncrypted ${Object.keys(secrets).length} secret(s) to ${outputPath}`,
  );

  generateDecryptionModule(secrets);
}

function generateDecryptionModule(secrets) {
  const functions = Object.keys(secrets)
    .map((key) => {
      const secret = secrets[key];
      const funcName = `decrypt${key.charAt(0).toUpperCase() + key.slice(1).replace(/[^a-zA-Z0-9]/g, "_")}`;
      return `export async function ${funcName}(passphrase) {
  const salt = Uint8Array.from(atob('${secret.salt}'), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob('${secret.iv}'), c => c.charCodeAt(0));
  const authTag = Uint8Array.from(atob('${secret.authTag}'), c => c.charCodeAt(0));
  const data = Uint8Array.from(atob('${secret.data}'), c => c.charCodeAt(0));

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
}`;
    })
    .join("\n\n");

  const jsContent = `import argon2 from 'argon2';
import crypto from 'crypto';

${functions}
`;

  const outputPath = path.join(process.cwd(), "secrets.js");
  fs.writeFileSync(outputPath, jsContent);

  console.log(`Generated decryption module: ${outputPath}`);
}
