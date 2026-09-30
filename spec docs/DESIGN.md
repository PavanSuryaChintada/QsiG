# DESIGN — QSIG

Visual and interaction spec for the results site and any console. Tokens are locked.

---

## 1. Direction

**Reference world:** laboratory instrumentation. An oscilloscope, a spectrum analyser, a physics rig at 2am. Dense, precise, read by someone who must not misread a value.

**The one decision everything follows from:**

> **Colour carries verdict and nothing else.**

Secure is green, compromised is red, inconclusive is amber. Every other element — panels, rules, labels, type, chrome — is greyscale on a cool dark ground.

**Signature element:** the **CHSH gauge**. A needle against a scale with Tsirelson's bound marked at 2.828 and the security threshold at 2.40. It is the only analogue element in an otherwise digital interface, and it is what makes the site feel like an instrument rather than a dashboard.

---

## 2. Banned

- **Gradients.** No `linear-gradient`, no `radial-gradient`, no `bg-gradient-to-*`
- Glassmorphism, `backdrop-filter`, frosted panels
- Purple, violet, indigo, magenta
- Glow, coloured `box-shadow`
- `border-radius` above `2px`
- Emoji
- Drop shadows for elevation — use a hairline rule
- Animated backgrounds, particles, mesh
- 3D charts, decorative gridlines, chart animation on load
- shadcn defaults, Material, Bootstrap
- Pill badges
- **Any figure without a seed badge**

---

## 3. Colour

```css
:root {
  /* Ground — cool instrument slate, lifted off pure black so
     verdict colours do not crush at the low end */
  --ground-000: #0D1315;   /* page */
  --ground-100: #141E22;   /* panel */
  --ground-200: #1B282D;   /* raised */
  --ground-300: #25363D;   /* hairline rules */
  --ground-400: #345059;   /* disabled */

  /* Ink — warm bone on cool ground */
  --ink-000:    #EFEAE0;
  --ink-100:    #C6C0B5;
  --ink-200:    #96918A;
  --ink-300:    #66635D;

  /* VERDICT — the only chromatic vocabulary */
  --v-secure:   #3E7C5A;   /* entanglement intact, signature accepted */
  --v-warn:     #9A760C;   /* partial / inconclusive */
  --v-breach:   #B42D1A;   /* compromised, rejected */

  /* Instrument accents — data series only, never chrome */
  --basis-x:    #C9A227;
  --basis-y:    #C2731F;
  --basis-z:    #4F7D8C;

  --bound:      #EFEAE0;   /* Tsirelson line, analytic overlays */
}
```

**Three basis colours exist only for the X/Y/Z series.** They are the one place a non-verdict colour is allowed, because distinguishing the three series *is* the information.

---

## 4. Type

```css
--font-display: "IBM Plex Sans Condensed", sans-serif;   /* 600 */
--font-body:    "IBM Plex Sans", sans-serif;
--font-data:    "IBM Plex Mono", monospace;
```

| Role | Face | Size |
|---|---|---|
| Section eyebrow | Condensed 600 uppercase | 11px / `0.12em` |
| Page title | Condensed 600 | 28px |
| Panel title | Condensed 600 | 15px |
| Body | Plex Sans 400 | 14px / 1.55 |
| **All numerals** | **Plex Mono 500** | tabular, always |
| **S values, p-values, error rates** | **Plex Mono 500** | never proportional |
| Seed badge | Plex Mono 400 | 10px, `--ink-300` |
| Equations | KaTeX | 15px |

**Every number is monospace and tabular.** Values update constantly; proportional digits jitter and become unreadable.

Scale: `10 · 11 · 12 · 13 · 14 · 15 · 18 · 22 · 28 · 36`. Nothing else.

---

## 5. Components

### CHSH gauge — the signature

```
  CHSH ENTANGLEMENT MONITOR

  2.0                2.40            2.828
   │──────────────────│───────────────│
   │         ████████████████▲        │
   └──────────────────┴───────────────┘
   classical        secure      Tsirelson

   S = 2.81 ± 0.04          ✓ SECURE
```

- Needle in the verdict colour for the current state
- **Tsirelson's bound is a hard white line labelled 2.828.** It must be visibly a ceiling.
- The classical region below 2.0 is hatched, not filled
- `S ± σ` always shown — never a bare value
- Transition on state change: 200ms, opacity and position only

### Basis error bars

Three bars, `--basis-x` / `--basis-y` / `--basis-z`, always in that order, always same scale.

**The whole point is shape, so the scale must never auto-fit.** Fix the axis at 0–0.5. If bars rescale between frames, the reader cannot see that two rose and one stayed flat — which is the entire demonstration.

### Posterior bars

Horizontal, sorted descending, percentage in mono at the right. The leading hypothesis takes the verdict colour; the rest stay `--ink-200`.

**The prior is displayed beneath the chart.** A posterior without its prior is not interpretable.

### SPRT trace

Line chart of log-likelihood ratio versus round. Two horizontal boundary lines in `--ink-300`. The crossing point is marked with a `--ink-000` dot and the round number in mono.

### Confusion matrix

Grid. Cell intensity by count, greyscale — **not a rainbow colourmap.** Diagonal cells get a `--ink-000` left border.

**The INCONCLUSIVE column is always shown**, never hidden to make the matrix look cleaner.

### Seed badge

```
seed 20260101 · n=200 · 2026-09-29 14:22 UTC
```

Bottom-right of **every** figure, `--ink-300`, 10px mono. Non-negotiable.

---

## 6. Motion

Almost none. This is an instrument.

- Transitions: 150ms ease-out, opacity and position only. Never scale, never transform.
- Gauge needle: 200ms
- Live console stepping: one update per 400ms, pausable
- **No chart animation on load.** Data appears, it does not perform.
- `prefers-reduced-motion`: everything instant

**Banned:** load sequences, scroll reveals, hover lift, parallax, count-up numerals, skeleton shimmer.

---

## 7. Copy

| Write | Not |
|---|---|
| S = 2.34 — below 2.40, entanglement compromised | ⚠️ ALERT! |
| Intercept-resend, Z basis, p < 0.001 | Threat detected |
| Cannot separate from phase damping at this strength | Unknown |
| INCONCLUSIVE — top two hypotheses not separated | No result |
| Detected at round 38 | Fast detection! |
| Simulation, Qiskit Aer, seed 20260101 | Real-world tested |

**Never state a verdict without its statistic.** Never write a confidence without its prior. Never say "detected" without saying by which instrument.

Never write: leverage, seamless, powerful, cutting-edge, revolutionary, harness, unlock, empower.

---

## 8. Quantum in the interface

- CHSH, tomography, Grover and QAE appear as **named instruments with their measured values**, never as marketing
- **No "powered by quantum" anywhere.** The physics is the content, not a badge.
- Grover results state the qubit count and that scaling was extrapolated from a small instance
- Simulation is labelled as simulation on every results page

---

## 9. Quality floor

- Responsive to 1024px — desktop-first is correct for an instrument
- Visible keyboard focus: 2px `--ink-000` outline, 2px offset. Never `outline: none`.
- Contrast: `--ink-100` on `--ground-100` ≥ 7:1
- **Verdict never encoded by colour alone** — always paired with the word and the value
- **Every figure carries a seed badge**
- No layout shift when values update — reserve the space
