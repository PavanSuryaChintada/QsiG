# BUILD SPEC — QSIG

File-by-file contract. Read `CLAUDE.md`, `docs/PHYSICS.md`, `docs/STATISTICS.md`, `docs/ATTACKS.md` first.

---

## Layout

```
qsig/
├── config.py                  seeds, defaults, thresholds — single source
├── protocol/
│   ├── states.py              the six Pauli eigenstates, prepare + measure
│   ├── bell.py                Bell pair preparation
│   ├── teleport.py            teleportation circuit + Pauli correction
│   ├── keys.py                key generation and records
│   ├── sign.py
│   └── verify.py              per-basis mismatch counting
├── channels/
│   └── noise.py               depolarising, phase/amplitude damping, flips
├── attacks/
│   ├── intercept.py  forgery.py  impersonation.py  replay.py
│   ├── collective.py          optional
│   ├── grover.py  qae.py      quantum red-teaming
├── detect/
│   ├── chsh.py                I1  — build early
│   ├── fingerprint.py         I2  — the differentiator
│   ├── profiles.py            empirical reference builder
│   ├── tomography.py          I3
│   ├── bayes.py  sprt.py  cusum.py  thresholds.py    I4
│   ├── decoy.py  timing.py    I6
│   └── engine.py              orchestrates all instruments -> one verdict
├── analysis/
│   ├── bounds.py              KL, Hoeffding, Chernoff
│   ├── helstrom.py            stretch
│   └── performance.py         cost tables, RSA/ECDSA comparison
└── experiments/
    ├── exp1_confusion.py      F1 — THE HEADLINE
    ├── exp2_chsh.py           F2
    ├── exp3_profiles.py       F3
    ├── exp4_roc.py            F4
    ├── exp5_bounds.py         F5
    ├── exp6_sprt.py           F6
    ├── exp7_bayes.py          F7
    ├── exp8_tomography.py     F8
    ├── exp9_sensitivity.py    F9
    ├── exp10_performance.py   F10
    └── run_all.py             regenerates every figure + site JSON
```

---

## 1 · `config.py`

```python
SEED           = 20260101
KEY_LENGTH_L   = 256
N_RUNS_DEFAULT = 200
BASES          = ("X", "Y", "Z")

ALPHA          = 0.01      # SPRT false positive
BETA           = 0.01      # SPRT false negative
TARGET_FRR     = 0.01      # false rejection target for threshold derivation
SIG_LEVEL      = 0.05      # chi2 attribution significance

CHSH_TEST_FRACTION = 0.10  # fraction of rounds used for CHSH
CHSH_SECURE_MIN    = 2.40  # below this -> entanglement compromised
TSIRELSON          = 2.8284271247461903

DECOY_FRACTION = 0.15
MAX_QUBITS_GROVER = 16
```

Single source. Every module imports it. **Every experiment records its seed in its output JSON.**

---

## 2 · `protocol/states.py`

```python
PAULI_EIGENSTATES = {
    ("Z", +1): "|0>",  ("Z", -1): "|1>",
    ("X", +1): "|+>",  ("X", -1): "|->",
    ("Y", +1): "|+i>", ("Y", -1): "|-i>",
}

def prepare(qc, q, basis, eigenvalue): ...
def measure_in_basis(qc, q, c, basis): ...
```

Measurement rotations: **Z** → nothing · **X** → `H` · **Y** → `Sdg` then `H`.

**The basis label must survive into the key record.** Every instrument buckets errors by basis. Store only the state vector and the differentiator is gone.

---

## 3 · `protocol/teleport.py`

```python
def teleport_circuit(basis, eigenvalue, noise_model=None) -> QuantumCircuit
```

**Traps**
- **Simulate the full circuit.** Do not hand the recipient the state directly. The circuit is where noise enters and where it enters determines the fingerprint. **This is the most important implementation decision in the project.**
- Apply noise to the **travelling qubit** (`q2` leg), not uniformly across the circuit.
- Qiskit 1.x: use `qc.if_test` for conditional corrections, or defer measurement and apply Pauli corrections classically. **Deferred measurement is simpler and equivalent here** — use it if `if_test` gives trouble.

---

## 4 · `protocol/verify.py`

```python
@dataclass
class VerifyResult:
    s_pooled: float
    s_by_basis: dict[str, float]    # {"X":.., "Y":.., "Z":..}   <- THE VECTOR
    n_by_basis: dict[str, int]
    mismatch_positions: list[int]
    accepted: bool
```

**`s_by_basis` and `n_by_basis` are why this project is different. Return them from the very first version**, before any detector exists.

**Trap:** `L=256` across three bases gives ~85 samples per basis. Enough for χ², but the variance is real. Always return `n_by_basis` so tests can weight correctly, and flag any basis with fewer than 30 samples.

---

## 5 · `detect/chsh.py` — build this second

```python
def chsh_rounds(n_rounds, noise_model=None, attack=None, seed=SEED) -> CHSHResult:
    """
    Settings for |Phi+>:
      Alice: a = Z,          a' = X
      Bob:   b = (Z+X)/rt2,  b' = (Z-X)/rt2
    Returns S, sigma, violates, secure.
    """
```

**Traps**
- **Assert `S <= TSIRELSON + tol`.** Exceeding Tsirelson's bound is always a bug in the correlation estimator, never a discovery.
- Report `S ± σ`. `2.45 ± 0.20` is a different statement from `2.45 ± 0.02`.
- CHSH round positions come from a **seeded RNG Eve cannot predict.** If they were regular, a smart attacker would skip them.
- The security threshold is not 2.0. Between 2.0 and 2.828 lies partial entanglement — a partial attack. Derive `CHSH_SECURE_MIN` from your target false-alarm rate, the same way `s_a` is derived.

---

## 6 · `detect/profiles.py` — before any attribution

```python
def build_reference_profiles(conditions, n_runs=200, seed=SEED) -> dict:
    """
    conditions: [("depolarising", 0.05), ("depolarising", 0.10),
                 ("intercept_z", 0.3), ("intercept_z", 1.0), ...]
    Writes results/reference_profiles.json with full provenance:
    seed, n_runs, key length, timestamp, git sha.
    """
```

**Never hardcode analytic values.** `PHYSICS.md` §3.3.

Build at **several strengths per condition.** Attribution must hold across the range, not only at full strength.

---

## 7 · `detect/engine.py` — the orchestrator

```python
@dataclass
class Verdict:
    decision: str              # ACCEPT | REJECT | INCONCLUSIVE
    cause: str                 # attributed hypothesis
    confidence: float          # Bayesian posterior
    instruments: dict          # per-instrument findings
    detected_at_round: int | None
    change_point: int | None   # CUSUM
    reasons: list[str]
```

**Rules**
- **Any instrument may veto.** CHSH below threshold rejects regardless of what the fingerprint says — it is a physical bound, and it is the only thing that catches random-basis interception.
- Every instrument's finding appears in `instruments`, including ones that found nothing. Silence is evidence too.
- A verdict with no `reasons` is a bug.
- When instruments disagree, report the disagreement. Do not silently pick a winner.

---

## 8 · `experiments/exp1_confusion.py` — build first among experiments

```python
"""
For each true condition (channels x strengths, attacks x strengths):
    run n_runs, attribute each, tally predicted vs true
Emit:
    results/confusion_matrix.csv
    results/fig1_confusion.png
    results/attribution_accuracy.json
"""
```

**This figure is the submission.** Include the `INCONCLUSIVE` column explicitly — a matrix with an honest inconclusive band beats one forced to always decide.

---

## 9 · `experiments/run_all.py`

Runs every experiment, regenerates every figure, and writes **`site/public/data/*.json`** for the frontend.

```
results/
├── fig1..fig10.png
├── confusion_matrix.csv
├── reference_profiles.json
├── attribution_accuracy.json
├── performance_table.csv
└── run_manifest.json     seed, versions, timestamp, git sha, runtime
```

**`run_manifest.json` is what makes the work reproducible.** Without it, no number on the site is verifiable.

---

## 10 · Tests — six gates

```python
# test_protocol.py
def test_honest_accepted_noiseless():
    """500 seeded runs, noiseless -> 100% acceptance, s == 0."""

# test_chsh.py
def test_bell_state_reaches_tsirelson():
    """Noiseless -> S ~= 2.828 within tolerance."""
def test_never_exceeds_tsirelson():
    """Across all conditions, S <= 2.8284 + tol. ALWAYS."""

# test_fingerprint.py
def test_intercept_not_confused_with_depolarising():
    """Strength >= 0.3: Z-intercept never attributed depolarising, and vice versa."""

# test_thresholds.py
def test_derived_threshold_hits_target_frr():
    """On HELD-OUT runs, not the derivation set."""

# test_replay.py
def test_replayed_signature_always_rejected():
    """100%. Deterministic."""

# test_reproduce.py
def test_run_all_is_deterministic():
    """Same seed twice -> identical results hashes."""
```

---

## 11 · Build order — with cut points

```
1.  protocol/                          ← nothing works without this
2.  detect/chsh.py                     ← I1, ~2h, strongest single claim
3.  channels/noise.py
4.  detect/fingerprint.py + profiles.py ← I2, the differentiator
5.  attacks/ intercept x3, blind forgery, replay
6.  experiments/exp1_confusion.py      ← THE HEADLINE FIGURE
--- steps 1-6 are a complete, differentiated submission ---
7.  detect/bayes.py sprt.py cusum.py
8.  detect/thresholds.py
9.  detect/engine.py
10. site/                              ← publishes results
11. detect/decoy.py timing.py
12. detect/tomography.py               ← I3
13. attacks/grover.py qae.py           ← I5
14. analysis/ bounds, performance
CUT 15. helstrom.py, collective.py, QuTiP channels, hardware run
```

**Stop anywhere after step 6 and you still have a complete story.**

---

## 12 · Failure protocol

| If | Then |
|---|---|
| qiskit-aer install fails | **Fix first.** Python 3.11, not 3.12 — aer wheels lag. |
| `if_test` misbehaves | Deferred measurement + classical Pauli correction. Equivalent. |
| Simulation slow at L=256 | Drop to L=128 and say so. Physics unchanged; bound tightens more slowly. |
| CHSH exceeds 2.828 | **Bug in the correlation estimator, every time.** Check sign conventions on the rotated bases. |
| Attribution accuracy poor | Check noise is applied to the travelling qubit, not globally. **Most likely cause by far.** |
| Per-basis samples too small | Raise L, or bias key generation toward a uniform basis split. State which. |
| SPRT never terminates | Cap rounds, return INCONCLUSIVE. Check `p0 != p1`. |
| Grover oracle too complex | Restrict to a small instance and extrapolate scaling analytically. **Say that you did.** |
| Site won't build | Ship static matplotlib figures. **The figures are the deliverable; the site is packaging.** |
