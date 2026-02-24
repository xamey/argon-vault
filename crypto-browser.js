/**
 * Re-export browser crypto for bundlers that resolve subpaths as literal files.
 * The canonical implementation is in src/crypto-browser.js (see package.json exports).
 */
export {
  deriveKeyBrowser,
  decryptValueBrowser,
} from './src/crypto-browser.js';
