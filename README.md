# argon-vault

**argon-vault** is a tiny CLI to encrypt key/value secrets with a passphrase and store them in `secrets.json` and `secrets.js`.

## Install

```bash
npm install -g argon-vault
```

or

```bash
bun install -g argon-vault
```

## Basic usage

- **Encrypt secrets**

```bash
argon-vault
```

Follow the prompts to enter:

- your passphrase
- as many `KEY=VALUE` secrets as you want

This creates `secrets.json` (encrypted data) and `secrets.js` (browser-safe decryption helpers).

- **Decrypt / verify**

```bash
argon-vault decrypt --secrets secrets.json
```

Enter the same passphrase to see your decrypted secrets and confirm everything works.

## In your app

The generated `secrets.js` is **browser-safe** (Argon2 via `argon2-browser`, AES-GCM via Web Crypto). Import it in your Vite/React (or any frontend) app and call the helpers with the passphrase at runtime:

```js
import { decryptA } from "./secrets.js";
const value = await decryptA(passphrase);
```

Your app must depend on this package and have `argon2-browser` available (it’s a dependency of argon-vault). The subpath `argon-vault/crypto-browser` exports `deriveKeyBrowser` and `decryptValueBrowser` if you need to decrypt a raw payload (e.g. from a fetched `secrets.json`) yourself.

**Crypto:** Argon2id (memory 256×1024 KiB, time 12, parallelism 1, hash 32 bytes) and AES-256-GCM (12-byte IV, 16-byte auth tag), compatible with existing `secrets.json` payloads.
