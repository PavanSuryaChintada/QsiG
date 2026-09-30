# DATA CONTRACT — Python → site

**Define these shapes before either side is built.** The simulation and the frontend are built in parallel; without a fixed contract they diverge and you discover it with no time left.

All files land in `site/public/data/`, written by `experiments/run_all.py`.

---

## Conventions

- All floats are plain JSON numbers, not strings
- All timestamps are UTC ISO-8601
- **Every file carries `seed` and `generated_at`** — the site renders them as a badge
- A missing file means the page shows *"not yet generated"* — **never a placeholder number**

---

## 0 · `manifest.json` — written first, read by every page

```json
{
  "seed": 20260101,
  "generated_at": "2026-09-29T14:22:11Z",
  "git_sha": "a4f2c9e",
  "runtime_s": 412.7,
  "versions": {
    "python": "3.11.9",
    "qiskit": "1.2.4",
    "qiskit_aer": "0.15.1",
    "numpy": "2.1.3"
  },
  "config": {
    "key_length_L": 256,
    "n_runs": 200,
    "chsh_test_fraction": 0.10,
    "chsh_secure_min": 2.40,
    "sig_level": 0.05
  },
  "figures_generated": ["f1", "f2", "f3", "f4", "f5", "f6", "f7"],
  "gates_passed": ["test_protocol", "test_chsh", "test_fingerprint",
                   "test_thresholds", "test_replay", "test_reproduce"]
}
```

**`gates_passed` renders on the site.** A figure whose gate is red should not be published.

---

## 1 · `chsh.json`

```json
{
  "seed": 20260101,
  "generated_at": "2026-09-29T14:22:11Z",
  "tsirelson": 2.8284271247461903,
  "secure_min": 2.40,
  "classical_max": 2.0,
  "conditions": [
    {
      "label": "noiseless",
      "kind": "baseline",
      "strength": 0.0,
      "S": 2.8241,
      "sigma": 0.0183,
      "n_rounds": 2000,
      "violates_classical": true,
      "secure": true
    },
    {
      "label": "intercept_z",
      "kind": "attack",
      "strength": 1.0,
      "S": 2.0142,
      "sigma": 0.0201,
      "violates_classical": false,
      "secure": false
    },
    {
      "label": "depolarising",
      "kind": "channel",
      "strength": 0.10,
      "S": 2.5431,
      "sigma": 0.0195,
      "violates_classical": true,
      "secure": true
    }
  ]
}
```

**Assert `S <= tsirelson + 0.01` on write.** A value above Tsirelson's bound is a bug in the correlation estimator, every time. Fail the run rather than publishing it.

---

## 2 · `profiles.json` — reference fingerprints

```json
{
  "seed": 20260101,
  "n_runs_per_condition": 200,
  "conditions": [
    {
      "label": "depolarising",
      "kind": "channel",
      "strength": 0.10,
      "mean": {"X": 0.0503, "Y": 0.0497, "Z": 0.0511},
      "std":  {"X": 0.0231, "Y": 0.0228, "Z": 0.0235},
      "n_samples": {"X": 85, "Y": 86, "Z": 85}
    },
    {
      "label": "intercept_z",
      "kind": "attack",
      "strength": 1.0,
      "mean": {"X": 0.4987, "Y": 0.5012, "Z": 0.0000},
      "std":  {"X": 0.0541, "Y": 0.0533, "Z": 0.0000},
      "n_samples": {"X": 85, "Y": 86, "Z": 85}
    }
  ]
}
```

**`n_samples` is required.** The site displays it, and a rate quoted without its sample size is not a result.

---

## 3 · `confusion.json` — the headline

```json
{
  "seed": 20260101,
  "n_runs_per_cell": 200,
  "sig_level": 0.05,
  "labels": ["honest", "depolarising", "phase_damping", "amplitude_damping",
             "intercept_z", "intercept_x", "intercept_y", "intercept_random",
             "blind_forgery", "INCONCLUSIVE"],
  "rows": [
    {
      "true_label": "intercept_z",
      "strength": 1.0,
      "counts": {"intercept_z": 194, "phase_damping": 2, "INCONCLUSIVE": 4},
      "accuracy": 0.97
    },
    {
      "true_label": "phase_damping",
      "strength": 0.30,
      "counts": {"phase_damping": 141, "intercept_z": 31, "INCONCLUSIVE": 28},
      "accuracy": 0.705
    }
  ],
  "overall_accuracy": 0.882,
  "known_confusions": [
    {
      "pair": ["phase_damping", "intercept_z"],
      "reason": "Both produce shape [e, e, 0]; separated by magnitude, not shape",
      "separable_above_strength": 0.45
    },
    {
      "pair": ["blind_forgery", "depolarising"],
      "reason": "Both isotropic near 0.5",
      "separable_above_strength": null
    }
  ]
}
```

**`known_confusions` is not optional.** It renders on the Limits page and on slide 4. A confusion matrix without it looks like an oversight; with it, it looks like rigour.

**`INCONCLUSIVE` is a label like any other.** Never drop it to make the diagonal look cleaner.

---

## 4 · `sprt_traces.json`

```json
{
  "seed": 20260101,
  "alpha": 0.01,
  "beta": 0.01,
  "upper_bound": 4.5951,
  "lower_bound": -4.5951,
  "traces": [
    {
      "label": "intercept_z",
      "strength": 1.0,
      "llr": [0.0, 1.21, 2.44, 3.67],
      "decision": "attack",
      "decided_at_round": 38,
      "fixed_sample_equivalent": 1000
    },
    {
      "label": "honest",
      "strength": 0.0,
      "llr": [0.0, -0.11, -0.23],
      "decision": "clean",
      "decided_at_round": 112,
      "fixed_sample_equivalent": 1000
    }
  ],
  "rounds_to_decision": [
    {"label": "intercept_z", "strength": 0.2, "mean_rounds": 284, "std": 61},
    {"label": "intercept_z", "strength": 1.0, "mean_rounds": 38,  "std": 9}
  ]
}
```

`llr` arrays can be long — **downsample to ≤ 500 points before writing.** The chart cannot render more and the browser will not thank you.

---

## 5 · `posterior.json`

```json
{
  "seed": 20260101,
  "prior": {"honest": 0.90, "depolarising": 0.04, "intercept_z": 0.02,
            "intercept_x": 0.02, "blind_forgery": 0.02},
  "scenario": "intercept_z_strength_1.0",
  "evolution": [
    {"round": 0,  "posterior": {"honest": 0.90, "intercept_z": 0.02}},
    {"round": 50, "posterior": {"honest": 0.02, "intercept_z": 0.94}}
  ],
  "final": {"honest": 0.001, "intercept_z": 0.982, "phase_damping": 0.017}
}
```

**`prior` is mandatory.** A posterior without its prior is not interpretable, and the site renders it beneath the chart.

---

## 6 · `roc.json`

```json
{
  "seed": 20260101,
  "characterised_channel": {"mu": 0.0503, "sigma": 0.0231, "n_runs": 200},
  "derived": {
    "s_a": 0.0912,
    "s_v": 0.1534,
    "target_frr": 0.01,
    "achieved_frr_heldout": 0.0113,
    "target_forge": 1e-6
  },
  "sweep": [
    {"threshold": 0.05, "tpr": 0.998, "fpr": 0.412},
    {"threshold": 0.09, "tpr": 0.971, "fpr": 0.012}
  ],
  "auc": 0.983
}
```

**`achieved_frr_heldout` is the number that matters.** A threshold hitting its target on the data used to derive it proves nothing.

---

## 7 · `bounds.json`

```json
{
  "seed": 20260101,
  "s_a": 0.0912,
  "s_v": 0.1534,
  "kl_divergence": 0.0341,
  "curve": [
    {"L": 64,  "analytic_bound": 0.1121, "simulated": 0.0987, "n_trials": 5000},
    {"L": 256, "analytic_bound": 0.00016, "simulated": 0.0002, "n_trials": 5000}
  ],
  "hoeffding_confidence": 1e-9,
  "statement": "With L=256 on the measured channel, forgery probability is below 1.6e-4 with confidence 1-1e-9 (Hoeffding)."
}
```

`statement` is rendered verbatim on the site. **Generate it from the numbers — never hand-write it**, or it will drift when the numbers change.

---

## 8 · `sensitivity.json`

```json
{
  "seed": 20260101,
  "attacks": [
    {
      "label": "intercept_z",
      "sweep": [
        {"strength": 0.1, "chsh_detect": 0.31, "fingerprint_detect": 0.28,
         "sprt_detect": 0.44, "any_detect": 0.58},
        {"strength": 1.0, "chsh_detect": 1.00, "fingerprint_detect": 0.99,
         "sprt_detect": 1.00, "any_detect": 1.00}
      ],
      "detection_90pct_strength": 0.34
    }
  ]
}
```

**`detection_90pct_strength` is the honest limit** — the attack strength below which you stop catching it. Report it per attack. `null` means never reached.

---

## 9 · `performance.json`

```json
{
  "seed": 20260101,
  "qsig": {
    "qubits_per_signature": 512,
    "classical_bits_per_signature": 1024,
    "verification_time_ms": 41.2,
    "key_length_L": 256
  },
  "classical_comparison": [
    {"scheme": "RSA-2048",  "sign_ms": 1.4, "verify_ms": 0.04, "bytes": 256},
    {"scheme": "ECDSA-P256","sign_ms": 0.1, "verify_ms": 0.3,  "bytes": 64}
  ],
  "honest_note": "QDS requires quantum infrastructure and far more communication than ECDSA. The trade is information-theoretic security against Shor's algorithm, not efficiency."
}
```

**`honest_note` renders on the page.** A submission implying QDS is cheaper than ECDSA loses credibility instantly.

---

## 10 · Writing the files

```python
# experiments/run_all.py
def write(name: str, payload: dict):
    payload = {"seed": SEED,
               "generated_at": datetime.now(timezone.utc).isoformat(),
               **payload}
    Path(f"site/public/data/{name}.json").write_text(json.dumps(payload, indent=2))
```

Every write stamps seed and timestamp. **No exceptions** — the site renders them as a badge and a figure without one does not get published.

---

## 11 · Fixtures for parallel work

Ship `site/public/data/*.json` with **realistic fake values matching every shape above** in the first 45 minutes.

The frontend builds against them immediately. `run_all.py` overwrites them with real data later.

**Mark fixture files with `"fixture": true`** and have the site render a visible `FIXTURE DATA` banner. It must be impossible to accidentally present fake numbers — and impossible to forget to remove them.
