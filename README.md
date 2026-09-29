# QSENTRY — Quantum Digital Signature Channel Diagnostics

**SIH 2026 · PS 26141 · Quantum-Inspired Cyber Threat Detection for Digital Signature Security**

A live diagnostic instrument for teleportation-based Quantum Digital Signature (QDS) channels. It doesn't stop at asking whether the error rate is too high. It proves the entanglement is intact, identifies what degraded the channel, and says INCONCLUSIVE when it can't tell.

No AI or machine learning: every decision is a statistical hypothesis test or a physical measurement.

## What it does

| Instrument | What it measures |
|---|---|
| **I1 · CHSH monitor** | Bell-inequality value S ± σ on the same channel. An eavesdropper cannot learn anything without lowering S. |
| **I2 · Pauli-basis fingerprint** | Error rate per basis `[e_X, e_Y, e_Z]`, attributed by χ² against reference profiles *measured* by simulation, with the runner-up and p-values. |
| **Detection engine** | Combines both. Any instrument may veto; every verdict carries reasons. |

Noise and attacks act only on the travelling qubit of a full 3-qubit teleportation circuit (Qiskit Aer). Eve is a real mid-circuit measurement.

**Not built yet (roadmap):** process tomography, SPRT/CUSUM, Grover/QAE red-teaming, decoy states, timing side-channel, replay register.

## Quick start

```bash
# Python 3.11 (not 3.12: qiskit-aer wheels lag)
pip install -r requirements.txt

python -m experiments.run_all          # every number and figure, ~6-11 min
python -m experiments.run_all --quick  # smoke run, ~1 min (don't publish these)
pytest                                 # release-gate tests
```

`run_all` writes `results/*.json`, `results/fig1_confusion.png`, `results/fig2_chsh.png`, a `run_manifest.json` (seed, versions, git SHA, results hash) and `site/public/data/site_data.json`.

## Results site

```bash
cd site
npm install
npm run dev      # local
npm run build    # static build in site/dist
```

The site is static React + TypeScript (Vite, Recharts). It reads only `site_data.json`; no number is typed by hand. Code snippets on the site are copied from the real Python sources at build time (`site/scripts/sync-code.mjs`).

**Deploy on Vercel:** import the repo, set **Root Directory = `site`**, framework **Vite**. The build settings are in `site/vercel.json`.

## Layout

```
qsentry/
  config.py            seeds, thresholds — single source
  protocol/            keys, states, teleport, sign, verify, run
  channels/noise.py    depolarising, phase/amplitude damping, bit/phase flip
  attacks/intercept.py intercept-resend (X, Y, Z, random basis)
  detect/              chsh, fingerprinting, profiles, engine
experiments/           exp1_confusion, run_all
tests/                 protocol, chsh, fingerprint, reproduce
results/               generated outputs
site/                  results site
spec docs/, deliverables/   specifications and submission material
```

## Tests

| Test | Checks |
|---|---|
| `test_protocol.py` | Honest signature accepted 100% on a noiseless channel, 500 seeded runs, all three bases |
| `test_chsh.py` | Noiseless S reaches 2√2; S never exceeds Tsirelson's bound; full intercept breaks entanglement |
| `test_fingerprint.py` | Z-intercept never attributed as depolarising (strength ≥ 0.3), and vice versa |
| `test_reproduce.py` | Same seed → identical results |

## Stated limits

- Simulation only; not yet validated on quantum hardware.
- Some causes share a fingerprint shape (phase damping vs weak Z-intercept, bit flip vs X-intercept); these return INCONCLUSIVE or are separated by magnitude and CHSH.
- Attribution uses sessions of 10 signatures; a single 256-position signature has too few samples per basis.
- The CHSH secure threshold (2.40) is a configured value, not yet derived from a target false-alarm rate.
- Security holds under stated assumptions: trusted measurement devices, an authenticated classical channel, and the attack suite implemented here.

Seed: `20260101`.
