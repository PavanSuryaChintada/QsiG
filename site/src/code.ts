// Real source files, bundled at build time. Snippets are cut from these, never retyped.
import keys from "./py/qsentry/protocol/keys.py?raw";
import teleport from "./py/qsentry/protocol/teleport.py?raw";
import verify from "./py/qsentry/protocol/verify.py?raw";
import intercept from "./py/qsentry/attacks/intercept.py?raw";
import chsh from "./py/qsentry/detect/chsh.py?raw";
import fingerprinting from "./py/qsentry/detect/fingerprinting.py?raw";
import engine from "./py/qsentry/detect/engine.py?raw";
import testChsh from "./py/tests/test_chsh.py?raw";
import testReproduce from "./py/tests/test_reproduce.py?raw";

const FILES: Record<string, string> = {
  "qsentry/protocol/keys.py": keys,
  "qsentry/protocol/teleport.py": teleport,
  "qsentry/protocol/verify.py": verify,
  "qsentry/attacks/intercept.py": intercept,
  "qsentry/detect/chsh.py": chsh,
  "qsentry/detect/fingerprinting.py": fingerprinting,
  "qsentry/detect/engine.py": engine,
  "tests/test_chsh.py": testChsh,
  "tests/test_reproduce.py": testReproduce,
};

/** Cut one top-level Python function out of a file, from its `def` to the next top-level statement. */
export function extract(file: string, fn: string): { code: string; line: number } {
  const lines = (FILES[file] ?? "").replace(/\r/g, "").split("\n");
  const start = lines.findIndex((l) => l.startsWith(`def ${fn}(`));
  if (start < 0) return { code: `# ${fn} not found in ${file}`, line: 0 };
  let end = start + 1;
  while (end < lines.length && !(/^\S/.test(lines[end]) && !/^\)/.test(lines[end]))) end++;
  while (end > start && lines[end - 1].trim() === "") end--;
  return { code: lines.slice(start, end).join("\n"), line: start + 1 };
}

export type Snippet = { id: string; title: string; file: string; fn: string; why: string };

export const SNIPPETS: Snippet[] = [
  { id: "keys", title: "Generate the key", file: "qsentry/protocol/keys.py", fn: "generate_key",
    why: "A seeded random choice of basis and eigenvalue for every position. The basis label stays attached, so every instrument can sort errors by basis." },
  { id: "teleport", title: "Teleport over the channel", file: "qsentry/protocol/teleport.py", fn: "teleport_circuit",
    why: "The full 3-qubit teleportation circuit. Noise and Eve are inserted only on q2, the travelling qubit, which is where they occur in reality." },
  { id: "intercept", title: "Eve: intercept and resend", file: "qsentry/attacks/intercept.py", fn: "apply_intercept",
    why: "Eve is a real mid-circuit measurement: rotate into her basis, measure, rotate back. Her fingerprint emerges from the physics, not from a formula." },
  { id: "verify", title: "Count errors per basis", file: "qsentry/protocol/verify.py", fn: "verify",
    why: "Returns s_by_basis, the vector [e_X, e_Y, e_Z], alongside the usual pooled rate. That vector is the core of the method." },
  { id: "chsh", title: "CHSH entanglement monitor", file: "qsentry/detect/chsh.py", fn: "chsh_rounds",
    why: "Estimates the four correlations and S ± σ from real measurement shots, and asserts the Tsirelson bound: exceeding 2√2 would be a bug." },
  { id: "attribute", title: "χ² attribution", file: "qsentry/detect/fingerprinting.py", fn: "attribute",
    why: "Ranks every cause by χ² against measured profiles. It returns INCONCLUSIVE when nothing fits or the top two aren't separated." },
  { id: "engine", title: "Verdict engine", file: "qsentry/detect/engine.py", fn: "detect",
    why: "Combines the instruments. Any of them can veto, and every verdict carries human-readable reasons." },
  { id: "test", title: "Release gate: Tsirelson", file: "tests/test_chsh.py", fn: "test_never_exceeds_tsirelson",
    why: "A test that fails the build if any condition ever reports S above the physical maximum." },
  { id: "repro", title: "Release gate: reproducible", file: "tests/test_reproduce.py", fn: "test_same_seed_identical",
    why: "Same seed, same result, bit for bit. That's why every number on this site can be checked." },
];

export const snippet = (id: string) => SNIPPETS.find((s) => s.id === id)!;
