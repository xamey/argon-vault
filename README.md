# _argon-vault – Secret Encryption CLI Tool_

_argon-vault is a Node.js CLI tool for encrypting key/value secrets using Argon2id and AES-256-GCM, and generating both an encrypted JSON bundle and a JavaScript decryption module for use in your applications._

## _Features_

- **\*Interactive secret encryption**: Securely enter a passphrase and multiple key/value pairs.\*
- **\*Strong key derivation**: Uses Argon2id with high memory and time parameters.\*
- **\*Authenticated encryption**: Encrypts values with AES-256-GCM (per-secret IV and auth tag).\*
- **\*Bundled output**:\*
  - `secrets.json` _– encrypted secrets and metadata._
  - `secrets.js` _– JS helpers for decrypting each secret in your app._
- **\*Decrypt/verify mode**: Decrypt and verify stored secrets to confirm correctness.\*

## _Installation_

```bash
# Assuming you have Node.js and npm/bun installed
npm install -g argon-vault
# or
bun install -g argon-vault
```

_(If you’re working from source, clone this repo and install dependencies, then use_ `npm link` _or_ `bun link` _to expose the_ `argon-vault` _CLI globally.)_

## _Usage_

### _1. Encrypt secrets (default mode)_

_Run the CLI to interactively enter your passphrase and secrets:_

```bash
argon-vault encrypt
```

_You will be prompted to:_

1. **\*Enter a passphrase** (hidden/secure input).\*
2. **\*Enter multiple key/value pairs** (argon-vault loops so you can add as many as you like).\*

_On success, argon-vault generates:_

- `secrets.json` _– encrypted blobs and metadata._
- `secrets.js` _– decryption helpers._

### _2. Decrypt and verify secrets_

_Use decrypt mode to verify that your secrets were correctly encrypted:_

```bash
argon-vault decrypt --secrets secrets.json
```

_You will be prompted for your passphrase. argon-vault will:_

- _Derive the key with Argon2id._
- _Attempt to decrypt each stored secret._
- _Print decrypted key/value pairs on success._
- _Show an error if the passphrase is incorrect._

### _3. Help_

```bash
argon-vault --help
```

_Displays available commands, options, and usage examples._

## _Output Files_

### `secrets.json`

_Structured encrypted secrets bundle:_

```json
{
  "version": 1,
  "secrets": {
    "API_KEY": {
      "salt": "base64...",
      "iv": "base64...",
      "authTag": "base64...",
      "data": "base64..."
    }
  }
}
```

- **\*version**: Schema version (for future upgrades).\*
- **\*secrets**: Map of secret names to their encrypted payloads and parameters.\*

### `secrets.js`

_Generated JavaScript decryption helpers:_

```js
const CRYPTO_CONFIG = { time: 12, mem: 262144, hashLen: 32, parallelism: 1 };

export async function decryptAPI_KEY(passphrase) {
  // argon2 derive key + aes-256-gcm decrypt
}

export async function decryptDB_PASSWORD(passphrase) {
  // argon2 derive key + aes-256-gcm decrypt
}
```

- _One function per secret key (_`decrypt<KEY>`_)._
- _Each function:_
  - _Accepts a_ `passphrase` _string._
  - _Uses the same Argon2id + AES-256-GCM settings as the CLI._
  - _Returns the decrypted value (or throws on error)._

## _Cryptography Details_

### _Key Derivation – Argon2id_

- **\*Type**: Argon2id\*
- **\*Memory**: 256 MB (262,144 KB)\*
- **\*Time**: 12 iterations\*
- **\*Parallelism**: 1\*
- **\*Hash length**: 32 bytes\*

_Each secret uses its **own random salt** (16 bytes), ensuring unique keys even with the same passphrase._

### _Encryption – AES-256-GCM_

- **\*Algorithm**: AES-256-GCM\*
- **\*IV**: 12 bytes random per secret\*
- **\*Salt**: 16 bytes random per secret\*
- **\*Auth tag**: Stored alongside the ciphertext and IV\*

_These parameters are encoded as Base64 in_ `secrets.json`_._

## _Example Project Structure_

```text
my-secrets/
├── secrets.json    # Encrypted data
└── secrets.js      # Decryption functions
```

_You can import the functions from_ `secrets.js` _in your frontend or backend code and pass in the user’s passphrase to decrypt values at runtime._

## _Dependencies_

_argon-vault relies on:_

- `argon2` _– Node.js bindings for Argon2id key derivation._
- `commander` _– CLI framework for command parsing and help output._
- `readline` _– For interactive prompts (passphrase and key/value input)._

## _Security Notes_

- _Use a **strong, unique passphrase** and avoid reusing passphrases from other systems._
- _Treat_ `secrets.json` _and_ `secrets.js` _as sensitive artifacts; they contain encrypted data but still need protection._
- _Never commit real production passphrases to source control._
- _When you enter a passphrase during_ `argon-vault encrypt`_, argon-vault prints an **estimated brute-force cost** (based on passphrase length/character set and an offline attacker with ~50k Argon2id guesses per second) **before you confirm it**. This is only a rough heuristic—always prefer long, random passphrases._
