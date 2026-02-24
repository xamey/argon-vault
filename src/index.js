#!/usr/bin/env node

import { Command } from "commander";
import { encrypt } from "./commands/encrypt.js";
import { decrypt } from "./commands/decrypt.js";

const program = new Command();

program
  .name("argon-vault")
  .description("argon-vault: Secret Encryption CLI Tool")
  .version("1.0.0")
  .option("--decrypt", "Decrypt secrets from secrets.json")
  .option("-s, --secrets <path>", "Path to secrets.json", "secrets.json")
  .option("--encrypt", "Interactively encrypt key/value pairs");

program.parse();

const opts = program.opts();

if (opts.decrypt) {
  decrypt({ secrets: opts.secrets });
} else if (
  opts.encrypt ||
  (!opts.decrypt && !opts.encrypt && program.args.length === 0)
) {
  encrypt();
}
