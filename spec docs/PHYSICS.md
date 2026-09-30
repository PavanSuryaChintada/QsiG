# PHYSICS — protocol, instruments, and the model

Read after `CLAUDE.md`, before any protocol code.

---

## 1. The protocol — teleportation-based QDS

Three parties. **Alice** signs. **Bob** and **Charlie** verify independently.

The property that makes a signature a signature is **transferability**: Bob must not be able to forge something Charlie accepts.

### 1.1 Key generation

For each of `L` positions and each message bit `m ∈ {0,1}`, Alice draws a random Pauli eigenstate:

```
k[m][i] ∈ { |0⟩, |1⟩, |+⟩, |−⟩, |+i⟩, |−i⟩ }        i = 1..L
```

Six states, two per basis:

| Basis | Eigenvalue +1 | Eigenvalue −1 | Measured by |
|---|---|---|---|
| **Z** | `\|0⟩` | `\|1⟩` | nothing (computational) |
| **X** | `\|+⟩` | `\|−⟩` | `H` |
| **Y** | `\|+i⟩` | `\|−i⟩` | `S†` then `H` |

**Store the basis label in the key record, not just the state.** Every instrument downstream buckets errors by basis. Lose the label and the entire differentiator disappears.

### 1.2 Distribution by teleportation

For each key element, Alice and the recipient share a Bell pair `|Φ⁺⟩ = (|00⟩ + |11⟩)/√2`.

```
q0   the state to teleport
q1   Alice's half of the Bell pair
q2   recipient's half

1.  prepare |ψ⟩ on q0
2.  Bell pair on (q1, q2):  H on q1, CNOT q1→q2
3.  CNOT q0→q1, H on q0
4.  measure q0, q1  →  two classical bits (b0, b1)
5.  recipient applies:  00 → I   01 → X   10 → Z   11 → ZX
```

**Simulate the full circuit.** Do not shortcut by handing the recipient the state directly. The circuit is where channel noise enters, and where noise enters determines the fingerprint. This is the single most important implementation decision in the project.

Noise is applied to the **travelling qubit** — the `q2` leg during distribution — not uniformly across the circuit.

### 1.3 Signing and verification

Alice publishes the classical descriptions `(basis[i], eigenvalue[i])`.

Bob measures each held qubit in the declared basis and counts disagreements:

```
s  =  disagreements / L

s < s_a   →  accept                     (authentication threshold)
s < s_v   →  accept as transferable     (verification threshold)
s ≥ s_v   →  reject
```

**`s_a < s_v` is required.** The gap is what prevents Bob forging to Charlie. A scheme with `s_a = s_v` has no transferability and is not a signature scheme.

### 1.4 Security bound

```
P_forge  ≤  exp( −L · D(s_v ‖ s_a) )
```

where `D(p‖q) = p·ln(p/q) + (1−p)·ln((1−p)/(1−q))` is the binary KL divergence.

**Validate this numerically against simulation.** Do not present it as an assertion. Figure F5.

---

## 2. Instrument I1 — CHSH entanglement monitor

**The strongest claim in the project, and roughly two hours of work because the Bell pairs already exist.**

### 2.1 What it is

The CHSH value `S` measures how strongly correlated two entangled particles are.

```
S = | E(a,b) − E(a,b′) + E(a′,b) + E(a′,b′) |
```

where `E(x,y)` is the correlation between measurement settings `x` and `y`.

| S | Meaning |
|---|---|
| **≤ 2.000** | Classical physics explains it. **No entanglement.** |
| **2.828** (2√2) | Tsirelson's bound. Maximal quantum entanglement. |
| **> 2.828** | **Impossible. This is a bug.** Assert it. |

### 2.2 Why it matters

**An eavesdropper cannot extract information without degrading entanglement.** That is a theorem, not a heuristic. There is no attack that leaves `S = 2.828` while learning anything about the state.

So a falling `S` is *physical evidence* of interception — independent of any threshold, any model, and any assumption about the eavesdropper's strategy.

### 2.3 Implementation

Optimal measurement settings for `|Φ⁺⟩`:

```
Alice:  a = Z,           a′ = X
Bob:    b = (Z+X)/√2,    b′ = (Z−X)/√2
```

Interleave **CHSH test rounds** randomly among the signature rounds — roughly 10% of rounds, positions chosen by a seeded RNG that Eve cannot predict.

```python
def chsh_value(counts_per_setting) -> CHSHResult:
    """
    Returns:
      S          : float
      sigma      : float    statistical uncertainty from finite rounds
      violates   : bool     S - 2*sigma > 2.0
      secure     : bool     S > security threshold (default 2.4)
    """
```

**Traps**
- Report `S ± σ`. With a few hundred rounds the uncertainty is real, and `S = 2.45 ± 0.20` is a different statement from `S = 2.45 ± 0.02`.
- The security threshold is not 2.0. Between 2.0 and 2.828 there is partial entanglement — a partial attack. Set the threshold from the false-alarm rate you want, the same way `s_a` is derived.
- **Assert `S ≤ 2.828 + tolerance`.** A run exceeding Tsirelson's bound is a bug in your correlation estimator, every time.

### 2.4 The demo value

A live gauge, needle falling in real time as an attack is injected. It is the clearest visual in the project and it rests on a physical law.

---

## 3. Instrument I2 — Pauli-basis fingerprinting

### 3.1 The idea

Standard practice pools all mismatches into one scalar `s`. That throws away the information identifying the cause.

**Estimate the error rate separately per basis:**

```
e_X = mismatches among X-basis positions / count of X positions
e_Y = ...
e_Z = ...
```

### 3.2 Why structure exists — the worked example

Eve measures every travelling qubit in the **Z basis** and resends what she found.

- State is a **Z eigenstate**: Eve's measurement leaves it unchanged. Bob measures in Z, gets the right answer. **`e_Z = 0`**
- State is an **X eigenstate**: Eve's Z-measurement collapses it to `|0⟩` or `|1⟩` at random. Bob measures in X and gets each outcome with probability ½. **`e_X = 0.5`**
- Same for Y. **`e_Y = 0.5`**

Fingerprint: **`[0.5, 0.5, 0.0]`**

Depolarising noise is isotropic by construction: **`[e, e, e]`**

**A pooled scalar cannot separate these. The vector can.**

### 3.3 Reference profiles — measured, never asserted

```python
def build_reference_profiles(conditions, n_runs=200, seed=SEED) -> dict:
    """
    For each (condition, strength):
        run the protocol n_runs times
        record [e_X, e_Y, e_Z] per run
        store mean, std, n, and provenance
    Write results/reference_profiles.json
    """
```

Build profiles at **several strengths per condition**, not one. An intercept-resend at strength 0.3 differs in magnitude from one at 1.0, and attribution must hold across the range.

Two reasons this beats hardcoding: it captures your implementation's real behaviour including finite-size effects, and every number traces to a measurement you can show.

### 3.4 Attribution by χ²

```
χ²_h = Σ_{b ∈ {X,Y,Z}}  (ê_b − e_b^h)² / σ_b²          2 degrees of freedom
```

Return the best hypothesis, its p-value, **the runner-up and its p-value**, and `INCONCLUSIVE` when the top two are not separated at the chosen significance.

Include `"honest"` among the hypotheses so a clean channel attributes correctly rather than being forced into an attack class.

### 3.5 What it cannot separate — state this openly

| Confusable pair | Why | Separated by |
|---|---|---|
| Phase damping vs weak Z-intercept | Both give `[e, e, 0]` | Magnitude — intercept saturates at 0.5, damping does not |
| Blind forgery vs severe depolarising | Both isotropic near 0.5 | Magnitude, and depolarising that severe is a broken link |
| Bit flip vs X-intercept | Both leave X clean | Magnitude |

**Put this table in the deck.** Volunteering blind spots is what makes the rest believable.

---

## 4. Instrument I3 — Process tomography

Fingerprinting gives three numbers. Tomography gives the **entire channel**.

### 4.1 The Pauli Transfer Matrix

A 4×4 real matrix describing exactly what the channel does to any input state. From it:

| Quantity | Meaning | Diagnostic value |
|---|---|---|
| **Fidelity** | How faithfully states survive | Overall health |
| **Unitarity** | Coherent vs incoherent | **Attacks are often coherent; noise is not** |
| **Non-unitality** | Energy flowing in or out | Passive noise is usually unital; an active adversary need not be |
| **Eigenvalue spectrum** | Full structural fingerprint | Attribution at maximum resolution |

**Unitarity is the discriminator worth highlighting.** A depolarising channel has low unitarity — it is random. A coherent attack that rotates states has high unitarity even at the same fidelity. Two channels with identical error rates, distinguishable by unitarity alone.

### 4.2 Implementation

`qiskit-experiments` `ProcessTomography` on the distribution channel. Expensive — run it periodically, not every round.

**Trap:** tomography needs many shots to converge. Report the confidence region, and do not present a PTM from 100 shots as if it were exact.

---

## 5. Instrument I6 — independent detection axes

Two channels that are physically independent of the quantum measurements. **Two orthogonal detectors agreeing is far stronger evidence than one detector shouting.**

### 5.1 Decoy states

Interleave decoy rounds — different intensity or known states — chosen by a seeded RNG. Eve cannot distinguish decoys from signal, so she attacks both equally.

```
e_signal ≈ e_decoy      consistent, no selective attack
e_signal ≫ e_decoy      Eve is targeting signal rounds
```

Cheap to build, physically principled, borrowed from established QKD practice.

### 5.2 Timing side-channel

Intercept-resend requires measuring and re-preparing. **That takes time.**

Monitor the round-trip latency distribution. An attacker in the loop adds detectable jitter. Kolmogorov–Smirnov test against the baseline distribution.

**This is not a quantum measurement at all** — which is the point. An attacker who defeats the quantum detector still has to defeat the speed of light.

---

## 6. Channel models — `qsig/channels/`

| Channel | Action | Structural signature |
|---|---|---|
| **Depolarising** | `ρ → (1−p)ρ + p·I/2` | Isotropic |
| **Phase damping** | Destroys off-diagonal coherence | Z clean; X and Y degrade together |
| **Amplitude damping** | `\|1⟩ → \|0⟩` with probability γ | Asymmetric, biased toward `\|0⟩` |
| **Bit flip** | X with probability p | Z affected; X clean |
| **Phase flip** | Z with probability p | X and Y affected; Z clean |

Qiskit Aer `NoiseModel` with Kraus operators. Optional: QuTiP Lindblad dynamics for physically-derived rather than hand-set parameters — **cut first if time is short.**

---

## 7. Figures

| # | Figure | Why |
|---|---|---|
| **F1** | **Confusion matrix — attribution accuracy** | **The headline. Build first.** |
| **F2** | **CHSH under each attack, with Tsirelson bound** | The physical proof |
| F3 | Basis-resolved error bars per condition | Shows the mechanism at a glance |
| F4 | ROC over threshold sweep, derived point marked | Justifies the threshold |
| F5 | Forgery probability vs key length, bound overlaid | Validates the security proof |
| F6 | SPRT rounds-to-decision vs attack strength | The speed claim |
| F7 | Bayesian posterior evolving over rounds | Live confidence |
| F8 | PTM heatmap: honest vs attacked | Tomography payoff |
| F9 | Detection sensitivity vs attack strength, per attack | Where the method breaks down |
| F10 | Performance comparison vs RSA-2048 / ECDSA-P256 | Honest positioning |

**F1 and F2 carry the submission.** Everything else supports them.
