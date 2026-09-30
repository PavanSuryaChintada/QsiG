# QSIG

**A live diagnostic instrument for quantum digital signature channels.**

SIH 2026 · PS 26141 · Quantum-Inspired Cyber Threat Detection for Digital Signature Security
Egreen Quanta LLP · Theme: Blockchain & Cybersecurity

*(Name is a placeholder — rename with find-replace.)*

---

## The problem

Quantum computers break RSA and ECC. Quantum Digital Signatures replace mathematical hardness with physical law.

Verification counts mismatches. Noiseless gives 0%. Garbage gives 50%.

**Real channels give you 9%.**

> **And 9% has two opposite explanations: a degraded fibre, or an eavesdropper.**

## What everyone builds

Pool every error into one number. Compare against a hardcoded threshold, usually 0.15.

```
9% < 15%  →  accept
```

Nobody asks *why* it was 9%. Nobody can say where 0.15 came from.

## What we build

Six independent instruments on one channel.

| | Instrument | Question it answers |
|---|---|---|
| **I1** | CHSH entanglement monitor | Is anyone in the channel at all? *(a theorem, not a heuristic)* |
| **I2** | Pauli-basis fingerprinting | Which cause produced these errors? |
| **I3** | Process tomography | Coherent tampering, or random noise? |
| **I4** | Statistical decision layer | How confident, and since when? |
| **I5** | Grover / QAE red-teaming | What does a quantum attack actually cost? |
| **I6** | Decoy states + timing | Independent confirmation |

## The mechanism, in one block

```
Eve measures in Z:
    Z-eigenstates survive untouched     →  e_Z = 0.00
    X-eigenstates collapse at random    →  e_X = 0.50
    Y-eigenstates collapse at random    →  e_Y = 0.50
                              fingerprint [0.50, 0.50, 0.00]

Depolarising noise chooses no basis     →  [e, e, e]

Add the three together and both become "9%".
```

## The output

**Everyone else:** `error rate 9% — below threshold — accept`

**Us:**
```
VERDICT     REJECT
Cause       intercept-resend, Z basis
Confidence  0.999
CHSH        S = 2.34 ± 0.04   (below 2.40 — entanglement compromised)
Detected    round 38
Began       round 412 (CUSUM change point)
```

---

## Honest positioning

**No AI, no ML.** The PS excludes them. Every decision is a classical hypothesis test — χ² (1900), SPRT (1945), CUSUM (1954). Each provably optimal for its problem.

**Every number is measured, not asserted.** Reference profiles come from 200 seeded runs with recorded provenance. `python -m experiments.run_all --seed 20260101` regenerates every figure.

**Stated limits.** Phase damping and weak Z-intercept share the shape `[e,e,0]`. Blind forgery and severe depolarising are both isotropic near 0.5. Both pairs appear in the confusion matrix and the framework returns `INCONCLUSIVE` rather than guessing.

**Simulation, not hardware.** Qiskit Aer, labelled as such on every results page. Circuits are hardware-ready.

**Grover extrapolated.** The forgery oracle is built for a small instance; scaling is extrapolated analytically, and we say so wherever the number appears.

---

## Why six instruments and not one

Random-basis interception **defeats the fingerprint** — it looks isotropic, exactly like noise.

**CHSH catches it anyway**, because entanglement degrades regardless of which basis Eve chose.

That single row of the attack matrix is the argument for the whole design.

---

## Stack

**Quantum** Qiskit 1.2.4 · qiskit-aer 0.15.1 · qiskit-experiments
**Algorithms** Bell states · teleportation · CHSH · process tomography · Grover · QAE
**Statistics** numpy · scipy · statsmodels — χ² · Bayesian · SPRT · CUSUM · Hoeffding · KS
**Site** Vite · React 18 · TypeScript · Tailwind · Recharts · KaTeX
**Not used** sklearn, torch, or any learned model — by requirement and by design

---

## Repository

```
CLAUDE.md               build rules — read first
docs/PHYSICS.md         protocol, CHSH, tomography, fingerprint — read second
docs/STATISTICS.md      the decision layer in full
docs/ATTACKS.md         attack suite + quantum red-teaming
docs/BUILD_SPEC.md      file-by-file contract
docs/SITE_SPEC.md       the results website
docs/DESIGN.md          design system
docs/SUBMISSION.md      delivery table, 6 slides, video script, Q&A

qsig/protocol/       Bell, teleport, keys, sign, verify
qsig/channels/       noise models
qsig/attacks/        intercept, forgery, impersonation, replay, Grover, QAE
qsig/detect/         chsh, fingerprint, tomography, bayes, sprt, cusum, engine
qsig/analysis/       bounds, Helstrom, performance
qsig/experiments/    reproducible runs producing every figure
site/                   results frontend
```

---

## Running it

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

pytest                                          # six release gates
python -m experiments.run_all --seed 20260101   # regenerates every figure

cd site && npm install && npm run dev
```

**Python 3.11, not 3.12** — qiskit-aer wheels lag.

Every figure lands in `results/` with a `run_manifest.json` recording seed, versions, timestamp and git sha.

---

## The one line

> **Everyone counts how many errors there are. We work out what caused them.**
