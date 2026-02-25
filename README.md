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

The generated `secrets.js` is **browser-safe** (Argon2 via `argon2-browser`, AES-GCM via Web Crypto). Import it in your Vite/React (or any frontend) app and:

```js
import { deriveKey, decryptA } from "./secrets.js";

// 1) Derive + validate key from passphrase.
//    This will throw "Invalid passphrase" if the passphrase is wrong.
const key = await deriveKey(passphrase);

// 2) Use the derived key to decrypt individual secrets.
const value = await decryptA(key);
```

Your app must depend on this package and have `argon2-browser` available (it’s a dependency of argon-vault). The subpath `argon-vault/crypto-browser` exports `deriveKeyBrowser` and `decryptValueBrowser` if you need to decrypt a raw payload (e.g. from a fetched `secrets.json`) yourself. This package uses argon2-browser’s bundled build so **Vite works without any Wasm plugins**.

### Passphrase verification and sentinel secret

When you run `argon-vault` to create or update your vault, it automatically adds a hidden `_sentinel` secret whose only purpose is to verify passphrases. The generated `deriveKey(passphrase)` in `secrets.js`:

- derives the key with Argon2id using the vault salt, then
- tries to decrypt the `_sentinel` secret with that key
- throws `Error("Invalid passphrase")` if decryption fails (wrong passphrase or corrupted data)

You can rely on `deriveKey` throwing to decide whether a user‑provided passphrase is correct, and then reuse the returned key for all other decrypt functions.

**Crypto:** Argon2id (memory 256×1024 KiB, time 12, parallelism 1, hash 32 bytes) and AES-256-GCM (12-byte IV, 16-byte auth tag), compatible with existing `secrets.json` payloads.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
