# ATTACKS — the suite and quantum red-teaming

Every attack takes a **strength parameter in [0,1]** so detection sensitivity can be swept. That sweep is Figure F9.

---

## 1. Channel attacks — `attacks/intercept.py`

### 1.1 Intercept-resend, per basis

Eve measures each travelling qubit in a fixed basis and resends what she found.

```python
def intercept_resend(circuit, basis: str, strength: float, rng):
    """
    strength = fraction of qubits Eve touches.
    strength=1.0 -> every qubit; 0.3 -> a random 30%.
    """
```

**Expected fingerprints** — these emerge from the physics, and your empirical profiles should reproduce them:

| Eve's basis | e_X | e_Y | e_Z |
|---|---|---|---|
| **Z** | 0.50 | 0.50 | **0.00** |
| **X** | **0.00** | 0.50 | 0.50 |
| **Y** | 0.50 | **0.00** | 0.50 |
| Random | 0.33 | 0.33 | 0.33 |

At partial strength `f`, rates scale as `f × 0.5` in the disturbed bases.

**The random-basis case is important.** It is Eve's best attempt to hide — an isotropic profile that mimics depolarising noise. **CHSH still catches it**, because entanglement degrades regardless of which basis she chose. That is the argument for having two independent instruments.

### 1.2 Collective entangling attack — `attacks/collective.py`

Eve entangles an ancilla with each travelling qubit and defers measurement until after basis reconciliation.

More powerful than intercept-resend and it leaves a subtler signature. **Optional — cut first.** But if built, it is the attack that shows tomography earning its place: it degrades unitarity in a way the three-number fingerprint barely registers.

---

## 2. Signature attacks — `attacks/forgery.py`

### 2.1 Blind forgery

The forger declares a signature with no key knowledge. Guesses disagree about half the time regardless of basis.

Fingerprint: **`[0.5, 0.5, 0.5]`** — isotropic, near-maximal.

**Honest note:** this is shape-identical to severe depolarising. Separation is by magnitude and context — depolarising that severe is a broken link, not a subtle attack. Say so rather than pretending the fingerprint is perfect.

### 2.2 Partial-knowledge forgery

The forger knows a fraction `f` of key positions.

```
mismatch rate  ≈  (1 − f) × 0.5
```

Sweep `f` from 0 to 1. Where detection fails is where your security margin runs out — and **that crossover point is the most honest number in the whole project.** Plot it.

### 2.3 Impersonation — `attacks/impersonation.py`

Bob attempts to produce a signature Charlie accepts. This directly tests **transferability**, which is the property that makes a signature a signature rather than a shared secret.

Bob has his own copy of the key states, so he has genuine partial knowledge. **The `s_a < s_v` gap is what stops him.** Verify it does, across key lengths.

---

## 3. Replay — `attacks/replay.py` and `detect/freshness.py`

**Purely classical, and say so.** Not every part of a quantum protocol needs to be quantum, and claiming otherwise is exactly the overclaim that gets caught.

```
- Nonce bound into the signed message
- Key-position consumption register — each element used once
- Timestamp window
```

Detection is **deterministic, 100%**, not statistical. A reused key position is a fact.

Cheap to build, gates green immediately, and it covers an objective the PS names explicitly.

---

## 4. Quantum red-teaming — `attacks/grover.py`, `attacks/qae.py`

**This is the upgrade nobody else will have.** Everyone uses quantum defensively. **We attack our own system with quantum algorithms and prove it holds.**

### 4.1 Grover forgery search

Grover's algorithm finds a marked item in an unstructured space in `O(√N)` instead of `O(N)` — a quadratic speedup.

Point it at your own scheme: **how fast can a quantum adversary find a forgery that passes verification?**

```python
def grover_forgery_search(key_length, oracle_threshold, n_qubits):
    """
    Oracle marks signature candidates that would pass verification.
    Returns: iterations to find one, success probability, effective search cost.
    """
```

**Why it is convincing:** you are not assuming the attack cost. You are **measuring** it with the best known quantum algorithm for the job.

**Traps**
- Grover needs a reversible oracle. Building one for the full verification predicate is real work — **restrict to a small `n_qubits` instance and extrapolate the scaling analytically.** State that you did.
- Optimal iterations are `⌊π/4 · √(N/M)⌋`. Overshooting *reduces* success probability — this is the classic implementation error.
- Keep it to ≤ 16 qubits on a simulator. Above that Aer gets slow and the point is already made.

### 4.2 Quantum Amplitude Estimation

Estimating a forgery probability by Monte Carlo needs `O(1/ε²)` samples. **QAE needs `O(1/ε)`** — quadratically fewer.

For a bound like `10⁻⁶`, that is the difference between feasible and not.

```python
def qae_forgery_probability(circuit, epsilon=1e-3):
    """Returns estimate, confidence interval, and oracle calls used."""
```

Use Qiskit's Iterative QAE — lower circuit depth than canonical QAE and far more practical on a simulator.

**Deliverable:** a table comparing Monte Carlo samples against QAE oracle calls for the same target precision. One table, and it demonstrates a real quantum advantage in a place where the advantage is genuine.

### 4.3 The framing

> *"Every other submission uses quantum to defend. We use quantum to attack our own system — Grover to search for forgeries, amplitude estimation to bound the probability — and show the scheme still holds."*

That is a fundamentally more mature security posture than a defensive-only design, and it uses two algorithms any judge in this domain will recognise immediately.

---

## 5. Attack matrix — what detects what

Build this table from measured results and put it in the deck. Empty cells are as informative as full ones.

| Attack | CHSH | Fingerprint | Tomography | SPRT | Decoy | Timing |
|---|---|---|---|---|---|---|
| Intercept-resend Z/X/Y | ✓✓ | **✓✓** | ✓ | ✓✓ | ✓ | ✓ |
| Intercept random basis | **✓✓** | ✗ | ✓ | ✓ | ✓ | ✓ |
| Collective entangling | ✓✓ | ✓ | **✓✓** | ✓ | ✓ | — |
| Blind forgery | — | ✓✓ | — | ✓✓ | — | — |
| Partial-knowledge forgery | — | ✓ | — | ✓ | — | — |
| Impersonation | — | ✓ | — | ✓ | — | — |
| Replay | — | — | — | — | — | **✓✓** deterministic |
| Selective (signal-only) | ✓ | ✓ | ✓ | ✓ | **✓✓** | ✓ |

**Read the second row.** Random-basis interception defeats the fingerprint — it looks isotropic, exactly like noise. CHSH catches it anyway, because entanglement degrades regardless of basis choice.

**That row is the single best argument for the multi-instrument design**, and it is why one clever detector is not enough. Lead with it when someone asks why you built six instruments instead of one.

---

## 6. Sensitivity sweeps

For each attack, sweep strength from 0 to 1 and record:

- Detection rate per instrument
- Rounds to decision (SPRT)
- Attribution accuracy
- CHSH value
- Where detection drops below 90%

**That last number is the honest limit of the system.** Report it per attack. A submission that states where it stops working is more credible than one claiming it never does.
