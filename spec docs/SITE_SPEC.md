# SITE SPEC — the results site

A static frontend publishing the framework's methodology and measured results. Reads JSON produced by `experiments/run_all.py`. **No backend required.**

---

## 1. The rule that governs everything here

> **Every number on this site comes from a real Qiskit run, or it does not go on the site.**

No placeholder values, no illustrative figures, no "representative" numbers. Each page carries the seed and run timestamp that produced it.

A judge who reproduces one number will trust the rest. A judge who catches one fabricated number will discard everything.

---

## 2. Stack

```
Vite · React 18 · TypeScript · Tailwind
Recharts        charts
KaTeX           equations
Static JSON from results/ — no API, no server
Deploy: Vercel or GitHub Pages
```

---

## 3. Structure

```
site/
├── public/data/            ← written by experiments/run_all.py
│   ├── manifest.json       seed, versions, timestamp, git sha
│   ├── confusion.json
│   ├── chsh.json
│   ├── profiles.json
│   ├── sprt_traces.json
│   ├── roc.json
│   ├── bounds.json
│   ├── sensitivity.json
│   └── performance.json
└── src/
    ├── pages/
    │   ├── Home.tsx            the argument
    │   ├── Live.tsx            simulated live console
    │   ├── Method.tsx          how each instrument works
    │   ├── Results.tsx         every figure
    │   ├── Limits.tsx          what it cannot do
    │   └── Reproduce.tsx       run it yourself
    └── components/
        ├── CHSHGauge.tsx  BasisBars.tsx  ConfusionMatrix.tsx
        ├── PosteriorBars.tsx  SPRTTrace.tsx  PTMHeatmap.tsx
        └── SeedBadge.tsx       appears on EVERY figure
```

---

## 4. Page 1 — Home

The argument, in the order a reader needs it.

**Hero**
> **A verifier sees a 9% mismatch rate. Is that a degraded fibre, or an attacker?**
> Everyone compares 9 to a hardcoded 15 and moves on. We answer the question.

**The gap** — three short blocks: what QDS is, what everyone builds, why a pooled error rate cannot distinguish noise from attack.

**The six instruments** — one line each, linking to Method.

**The headline result** — the confusion matrix, live from JSON, with its seed badge.

**The honest line**, prominent, not buried:
> Two condition pairs we cannot separate at low strength. Both are in the matrix. The framework returns INCONCLUSIVE rather than guessing.

---

## 5. Page 2 — Live console

A replay of a recorded run, stepping through rounds. **Labelled `REPLAY OF RECORDED RUN` at all times** — never presented as live computation.

```
┌──────────────────────────────────────────────────────┐
│  CHSH          S = 2.81 / 2.828        ✓ SECURE      │
│  ████████████████████░░                               │
├──────────────────────────────────────────────────────┤
│  BASIS ERRORS    X 0.08   Y 0.08   Z 0.08            │
│  ████            ████     ████     ████               │
├──────────────────────────────────────────────────────┤
│  POSTERIOR                                            │
│  honest        ████████████████████  0.94             │
│  intercept-Z   █                     0.03             │
├──────────────────────────────────────────────────────┤
│  SPRT   ─────────────╱          round 38              │
│  CUSUM  change point: round 412                       │
├──────────────────────────────────────────────────────┤
│  DECOY  signal 0.08 / decoy 0.08   ✓                  │
│  TIMING μ 2.1ms  σ 0.3ms  KS p=0.71 ✓                 │
└──────────────────────────────────────────────────────┘
```

**Controls:** inject attack (dropdown), strength slider, play/pause/step, reset.

**The beat that matters:** switch from depolarising to Z-intercept. All three basis bars were equal; now two spike and **one stays flat.** The CHSH needle drops. The posterior flips.

Build this transition first — it is the site's entire payload.

---

## 6. Page 3 — Method

One section per instrument. Each follows the same shape:

1. **The question it answers** — plain English, one sentence
2. **The physics or statistics** — with the equation in KaTeX
3. **A worked example** — real numbers from a real run
4. **What it cannot do** — every instrument gets this subsection

The worked example for fingerprinting is the strongest teaching moment in the project:

> Eve measures in Z. A Z-eigenstate survives her measurement untouched, so `e_Z = 0`. An X-eigenstate collapses to `|0⟩` or `|1⟩` at random, so Bob measuring in X is right half the time: `e_X = 0.5`. Same for Y. Fingerprint `[0.5, 0.5, 0.0]`.
> Depolarising noise doesn't choose a basis, so it gives `[e, e, e]`.
> **Add the three together and both become "9%".**

---

## 7. Page 4 — Results

Every figure, each with its seed badge, sample size, and a download link to the underlying JSON.

| Figure | |
|---|---|
| F1 | Confusion matrix — attribution accuracy |
| F2 | CHSH under each attack, Tsirelson bound marked |
| F3 | Basis-resolved error bars per condition |
| F4 | ROC with the derived threshold marked |
| F5 | Forgery probability vs key length, analytic bound overlaid |
| F6 | SPRT rounds-to-decision vs attack strength |
| F7 | Posterior evolution over rounds |
| F8 | PTM heatmap — honest vs attacked |
| F9 | Detection sensitivity vs attack strength |
| F10 | Performance vs RSA-2048 / ECDSA-P256 |

**F10 must be honest.** QDS needs quantum infrastructure and far more communication than ECDSA. The trade is information-theoretic security against Shor, not efficiency. **A submission pretending QDS is cheaper loses credibility instantly.**

---

## 8. Page 5 — Limits

A full page. Not a footnote.

**What we cannot separate**

| Pair | Why | Separated by |
|---|---|---|
| Phase damping vs weak Z-intercept | Both `[e, e, 0]` | Magnitude |
| Blind forgery vs severe depolarising | Both isotropic near 0.5 | Magnitude and context |
| Bit flip vs X-intercept | Both leave X clean | Magnitude |

**Where detection drops below 90%** — per attack, with the measured crossover strength.

**Assumptions the security claim rests on** — trusted measurement devices, authenticated classical channel, the implemented attack model. Attacks outside the suite are by definition untested.

**Simulation, not hardware.** The protocol circuits are hardware-ready; these results are from Aer.

> **A page listing what a system cannot do is the strongest page on the site.** Every other submission will claim it works. This one shows where it stops.

---

## 9. Page 6 — Reproduce

```bash
git clone <repo> && cd qsentry
pip install -r requirements.txt
python -m experiments.run_all --seed 20260101
```

Show the expected `run_manifest.json`. Invite the reader to diff their output against the published JSON.

---

## 10. Design

Inherits `docs/DESIGN.md` entirely. The rules that matter most here:

- **No gradients, no glassmorphism, no purple, no glow, no radius above 2px, no emoji**
- **All numerals monospace**, tabular
- **Colour carries verdict only** — secure green, compromised red, inconclusive amber. Chrome is greyscale.
- **Every figure carries a seed badge.** Non-negotiable.
- Charts: no 3D, no animation on load, no decorative gridlines

---

## 11. Build order

```
1. Data contract — define the JSON shapes and ship fixtures matching them
2. Results page — figures render from JSON
3. Home — the argument
4. Live console — build the depolarising→intercept transition FIRST
5. Method
6. Limits
7. Reproduce
```

**Step 1 first.** Define the JSON shapes before either side is built, or the Python and the React diverge and you find out at integration.

---

## 12. Failure protocol

| If | Then |
|---|---|
| Site won't build in time | **Ship the matplotlib figures in a PDF.** The figures are the deliverable; the site is packaging. |
| A JSON file is missing | Page shows "not yet generated" — **never a placeholder number** |
| Recharts struggles with the confusion matrix | Render it as a styled HTML table. Clearer anyway. |
| Live console too complex | Static screenshots of the two states, side by side, annotated. Loses motion, keeps the argument. |
