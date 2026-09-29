// Copies the Python sources shown as code snippets into src/py/, so the site builds
// on its own (e.g. on Vercel with root directory = site). Run automatically before dev/build.
// If the repo root isn't available, the committed copies in src/py/ are used as-is.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(site, "..");
const FILES = [
  "qsentry/protocol/keys.py",
  "qsentry/protocol/teleport.py",
  "qsentry/protocol/verify.py",
  "qsentry/attacks/intercept.py",
  "qsentry/detect/chsh.py",
  "qsentry/detect/fingerprinting.py",
  "qsentry/detect/engine.py",
  "tests/test_chsh.py",
  "tests/test_reproduce.py",
];

let copied = 0;
for (const f of FILES) {
  const from = join(repo, f), to = join(site, "src/py", f);
  if (!existsSync(from)) continue;
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  copied++;
}
console.log(copied ? `sync-code: copied ${copied} source files into src/py` : "sync-code: repo sources not found, using committed src/py copies");
