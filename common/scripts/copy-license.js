#!/usr/bin/env node

import fs from "fs";
import path from "path";
import url from "url";

/**
 * copy-license.js
 *
 * Copies LICENSE from the monorepo root into the current package folder.
 * Intended for use as a prepublishOnly hook in package.json */
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// repo root = two levels up from common/scripts
const repoRoot = path.resolve(__dirname, "../../");
const licenseSrc = path.join(repoRoot, "LICENSE");

// current package (script is executed with cwd=package folder by npm/pnpm)
const pkgDir = process.cwd();
const licenseDest = path.join(pkgDir, "LICENSE");

if (!fs.existsSync(licenseSrc)) {
  console.error(`[copy-license] LICENSE not found at ${licenseSrc}`);
  process.exit(1);
}

fs.copyFileSync(licenseSrc, licenseDest);
console.log(`[copy-license] LICENSE copied into ${pkgDir}`);