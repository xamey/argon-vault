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

This creates `secrets.json` (encrypted data) and `secrets.js` (helper functions).

- **Decrypt / verify**

```bash
argon-vault decrypt --secrets secrets.json
```

Enter the same passphrase to see your decrypted secrets and confirm everything works.

## In your app

Import the generated helpers from `secrets.js` and call them with the passphrase to get plain-text values at runtime.
