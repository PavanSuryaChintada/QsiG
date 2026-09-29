# WORKFLOW — the 8-hour build

**Assumption flagged:** written for **3 people over 8 hours**. Solo, cut to the T1 column only and skip the site. Tell me your real numbers and I will rework it.

Roles: **A** protocol + physics · **B** detection + experiments · **C** site + submission

---

## What 8 hours actually buys

| Ship today | Documented, not built |
|---|---|
| Protocol simulator | Process tomography (I3) |
| **CHSH monitor (I1)** | **Grover / QAE red-teaming (I5)** |
| **Basis fingerprinting (I2)** | Decoy states + timing (I6) |
| Channels + attack suite | Helstrom bound |
| **Confusion matrix — the headline figure** | Collective entangling attack |
| SPRT + Bayesian posterior | QuTiP channel realism |
| Results site | Hardware validation run |
| 6 slides + 2:25 video | |

**This is not a compromise.** The delivery table in `SUBMISSION.md` describes the full framework — that is the proposal. Today you build enough to prove every claim in it with measured numbers.

> **The one thing that cannot slip: every number on the slides must come from a real run.** That is what separates you from forty teams describing a protocol they didn't simulate.

---

## Hour by hour

### H0 – H0:45 · Setup and the first proof

**All:** clone, `pip install -r requirements.txt`, run `docs/RUNBOOK.md` §1–3 checkpoints.

**A:** `protocol/states.py` + `bell.py` — prepare and measure all six Pauli eigenstates.

**B:** `config.py`, results directory, figure helper with the seed badge baked in.

**C:** Vite scaffold, Tailwind, `docs/DESIGN.md` tokens in `tokens.css`, deploy an empty page to Vercel.

> **Gate: `pytest tests/test_states.py` green. Empty site live.**

---

### H0:45 – H2 · Protocol working

**A:** `teleport.py` — full circuit, Pauli correction, noise applied to the **travelling qubit**. Then `keys.py`, `sign.py`, `verify.py`.

**`verify.py` returns `s_by_basis` and `n_by_basis` from the first version.** Not later. Everything downstream consumes them.

**B:** `channels/noise.py` — depolarising, phase damping, amplitude damping.

**C:** `docs/DATA_CONTRACT.md` fixtures → Results page renders from fake JSON of the right shape.

> **Gate: honest signature accepted 100% on a noiseless channel, 500 seeded runs. `test_protocol.py` green.**

---

### H2 – H3 · CHSH — the strongest two hours in the build

**A:** `detect/chsh.py`. Interleaved test rounds, optimal settings, `S ± σ`, Tsirelson assertion.

**B:** `attacks/intercept.py` — intercept-resend in X, Y, Z and random basis, strength-parameterised.

**C:** `CHSHGauge.tsx` — needle, Tsirelson line at 2.828, threshold at 2.40.

> **Gate: noiseless → S ≈ 2.828. Under Z-intercept → S drops measurably. `test_chsh.py` green.**

**If you are behind, this is still a submission.** A working protocol plus a live CHSH gauge that falls under attack is a complete, differentiated story on its own.

---

### H3 – H4:30 · The differentiator

**A:** `attacks/forgery.py` (blind + partial), `attacks/replay.py` + `detect/freshness.py`. Replay is deterministic — cheap gate, green immediately.

**B:** `detect/profiles.py` — build reference profiles empirically. **200 runs per condition, several strengths each.** Then `detect/fingerprint.py` — χ² attribution with runner-up and INCONCLUSIVE.

**C:** `BasisBars.tsx` with the **axis fixed at 0–0.5**. If it autoscales, the reader cannot see two rise and one stay flat — which is the whole demonstration.

> **Gate: `test_fingerprint.py` green — Z-intercept never attributed as depolarising at strength ≥ 0.3.**

---

### H4:30 – H5:15 · The headline figure

**B:** `experiments/exp1_confusion.py`. Every condition × every strength, attributed, tallied. **Include the INCONCLUSIVE column.**

**A:** `detect/sprt.py` + `detect/bayes.py`. Both are small; SPRT is ~40 lines.

**C:** `ConfusionMatrix.tsx` — greyscale intensity, not a rainbow colourmap.

> **Gate: F1 exists as a PNG and as JSON. This figure is the submission.**

---

### H5:15 – H6:15 · Site and remaining figures

**B:** `experiments/run_all.py` — regenerates every figure and writes `site/public/data/*.json` with `run_manifest.json`.

**A:** `detect/thresholds.py` — derive `s_a` from the characterised channel, validate on held-out runs. `analysis/bounds.py` for the forgery bound.

**C:** Results page from real JSON. Home page. **The live console's depolarising → intercept transition — build that before anything else on the console.**

> **Gate: site deployed, every figure rendering from real data, every figure carrying its seed badge.**

---

### H6:15 – H7:15 · Submission

**C:** Six slides from `SUBMISSION.md` Part 2, with **real numbers pasted from `results/`.**

**A + B:** Record the 2:25 video. Script is in Part 3. Screen-record the console transition for the 1:10 and 1:35 beats.

**All:** Limits page. The confusable-pairs table goes on slide 4 and the site.

---

### H7:15 – H8 · Freeze

- **No new features.** Bugs only.
- Run all six gates. Any red gate → fix or cut the claim it supports.
- `grep -ri "TODO\|FIXME\|placeholder\|lorem" .`
- Confirm no number on a slide is missing from `results/`
- Design pass — no gradients, no radius above 2px, every figure has a seed badge
- Re-record the video if any number changed

---

## Cut order

Behind schedule? Cut from the bottom.

```
KEEP  1. protocol/                            ← never cut
      2. CHSH monitor
      3. channels + fingerprint
      4. attack suite (intercept x3, blind forgery, replay)
      5. confusion matrix F1
      6. slides + video                       ← the actual submission
      7. SPRT + Bayesian
      8. results site
      9. threshold derivation
CUT  10. everything else — documented, not built
```

**Items 1–6 are a complete submission.** Item 8 is packaging; if the site fights you, put the matplotlib figures in a PDF and move on. **The figures are the deliverable.**

---

## The three failure modes that actually happen

**1 · Environment.** qiskit-aer on Python 3.12 will try to build from source and eat an hour. Run `RUNBOOK.md` §1 first. Non-negotiable.

**2 · Noise in the wrong place.** If attribution accuracy comes out poor, it is almost always because noise was applied globally instead of to the travelling qubit. Check that before touching the statistics.

**3 · Numbers on slides that aren't in `results/`.** Under time pressure someone types a plausible figure into a slide. **That is the one thing that can end the submission.** The H7:15 check exists for this.

---

## Parallel-work contract

**`docs/DATA_CONTRACT.md` is defined before any site code.** C builds against fixtures matching those shapes; B swaps real data underneath. Without it, Python and React diverge and you find out at H6 with no time left.

---

## Demo transition to rehearse

One beat, and it is the whole argument:

```
depolarising         X ████  Y ████  Z ████     CHSH 2.79  ✓
                     → attribution: channel noise, p=0.55

  [ switch to intercept-Z ]

intercept-resend Z   X ████████  Y ████████  Z ░░░░      CHSH 2.31  ✗
                     → attribution: intercept-resend, Z basis, p<0.001
```

**Two bars up, one flat, needle falls.** Rehearse it until it is automatic — it carries the 1:10 and 1:35 marks in the video.
