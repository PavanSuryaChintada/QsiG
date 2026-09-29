# STATISTICS — the decision layer

Every detection decision in this framework is a classical statistical test with a stated null hypothesis, a test statistic and a significance level. **No AI, no ML** — the PS excludes them, and these methods are older, stronger and provably optimal for what they do.

χ² dates to 1900. SPRT to 1945. CUSUM to 1954. Each is optimal for its problem in a way no classifier can claim.

---

## 1. χ² attribution — `detect/fingerprint.py`

**Null hypothesis:** the observed basis-error vector was produced by hypothesis `h`.

```
χ²_h  =  Σ_{b ∈ {X,Y,Z}}  (ê_b − e_b^h)² / σ_b²          df = 2
```

Weight each term by the per-basis sample count `n_b` — the counts are unequal because key positions split unevenly across bases.

```python
@dataclass
class Attribution:
    verdict: str          # best hypothesis, or "INCONCLUSIVE"
    chi2: float
    p_value: float
    runner_up: str
    runner_p: float
    separation: float     # how distinguishable the top two are
    all_scores: list      # every hypothesis, ranked
```

**Rules**
- Always return the runner-up. A bare verdict is a guess; a verdict with its nearest competitor is a statistical statement.
- Return `INCONCLUSIVE` when the top two are not separated at `sig_level`. **This is a feature, not a failure.**
- Include `"honest"` as a hypothesis so a clean channel attributes correctly.
- Never estimate a rate from fewer than 30 samples in a basis without flagging it.

### Multiple-hypothesis correction

Testing nine hypotheses at once inflates the family-wise false-positive rate. Apply **Benjamini–Hochberg** to control the false discovery rate.

Small detail. Signals real statistical training, and a reviewer who knows the field will look for it.

---

## 2. Bayesian posterior — `detect/bayes.py`

χ² gives a one-shot verdict. A **running posterior** gives calibrated belief that updates every round.

```
P(h | data)  ∝  P(data | h) · P(h)
```

```python
class PosteriorTracker:
    def __init__(self, hypotheses, priors=None): ...
    def update(self, round_result) -> dict[str, float]:
        """Returns the normalised posterior over hypotheses."""
```

**Priors:** start with `P(honest) = 0.9` and spread the rest uniformly across attacks. **State the prior explicitly in the output** — a Bayesian result without its prior is not interpretable, and a reviewer will ask.

**Why it beats a one-shot test:** you get `P(intercept-Z) = 0.94` rather than "reject at p<0.001", and the number is directly meaningful to an operator. It also makes a live bar chart that updates round by round, which is the best single element on the console.

**Trap:** use log-space accumulation. Multiplying hundreds of small likelihoods underflows to zero in float64.

---

## 3. SPRT — `detect/sprt.py`

Fixed-sample testing collects `N` rounds, then decides. **Wald's Sequential Probability Ratio Test** decides as soon as the evidence suffices — and is provably optimal in expected sample size for a binary test.

```
Λ_n  =  Σ_{i=1..n}  log [ P(x_i | H₁) / P(x_i | H₀) ]

Λ_n ≥ log((1−β)/α)   →  ATTACK,  stop
Λ_n ≤ log(β/(1−α))   →  CLEAN,   stop
otherwise             →  continue
```

With `α = β = 0.01`, a strong intercept-resend should trigger in **tens of rounds** where a fixed-sample test needs hundreds.

```python
class SPRT:
    def __init__(self, p0, p1, alpha=0.01, beta=0.01):
        self.upper = math.log((1 - beta) / alpha)
        self.lower = math.log(beta / (1 - alpha))
        self.llr, self.n, self.trace = 0.0, 0, []

    def update(self, mismatch: bool) -> str:
        """Returns 'attack' | 'clean' | 'continue'."""
```

**Traps**
- `p0` is the **measured** baseline error, not an assumed one. Take it from channel characterisation.
- Clamp `p0`, `p1` to `[1e-6, 1−1e-6]` or the log-likelihood diverges.
- Cap the round count. An SPRT that never crosses must terminate and report `INCONCLUSIVE`, not loop.
- **Record the full LLR trace.** The console plots it, and a trace crossing at round 38 is a demo beat.
- SPRT assumes i.i.d. observations. Rounds here are independent by construction — **say so explicitly** rather than leaving it assumed.

**Deliverable: average rounds-to-decision versus attack strength**, plotted against the fixed-sample requirement. Figure F6.

---

## 4. CUSUM change-point detection — `detect/cusum.py`

SPRT says *"under attack now."* CUSUM says *"it began at round 412."*

That is forensics — you can point at when the attacker joined the channel.

```
S_n  =  max(0,  S_{n−1} + (x_n − k))

S_n > h   →  change detected
change point  =  argmin over the last interval where S returned to 0
```

- `k` = reference value, typically midway between the in-control and out-of-control means
- `h` = decision interval, set from the desired average run length under no change

**Why it matters:** an operator does not just want "you are compromised." They want "you were compromised starting Tuesday at 14:20, so everything signed after that is suspect." That is an incident-response answer, not a detector output.

**Trap:** CUSUM is sensitive to the assumed in-control mean. Take it from channel characterisation, and re-characterise if the baseline legitimately drifts.

---

## 5. Threshold derivation — `detect/thresholds.py`

Every QDS implementation hardcodes `s_a = 0.15`. **We derive it.**

```
1.  Characterise the channel on known states with no attack
        →  baseline mean μ, standard deviation σ

2.  Derive the authentication threshold for target false-rejection rate α
        s_a  =  μ  +  z_{1−α} · σ / √L

3.  Set the verification threshold with a transferability gap
        s_v  =  s_a + Δ,   Δ chosen so P_forge ≤ target

4.  Assert s_a < s_v, else raise — no gap means no transferability

5.  Validate both on HELD-OUT runs
```

**Step 5 is the release gate.** A threshold that hits its target on the data used to derive it proves nothing.

Deliverable: ROC over a threshold sweep with the derived operating point marked. Figure F4.

**The line:** *"Every implementation hardcodes the acceptance threshold. We derive it from the measured channel and show the security bound that follows."*

---

## 6. Finite-key bounds — `analysis/bounds.py`

Asymptotic security proofs assume infinite key length. Real systems have finite `L`, and serious QDS papers use concentration inequalities. Almost no hackathon submission will.

**Hoeffding** — bounds the deviation of an observed rate from its true value:

```
P( |ê − e| ≥ t )  ≤  2 exp( −2 n t² )
```

**Chernoff** — tighter for small probabilities, which is the regime that matters for forgery bounds.

Use these to state the security claim honestly:

> *"With L = 256 and the measured channel, the forgery probability is below 10⁻⁶ with confidence 1 − 10⁻⁹, by Hoeffding."*

That is a defensible sentence. *"Forgery probability is 10⁻⁶"* without a confidence statement is not.

---

## 7. Helstrom bound — `analysis/helstrom.py` *(stretch)*

The **theoretically optimal** probability of distinguishing two quantum states:

```
P_success  =  ½ ( 1 + ½ ‖ p₀ρ₀ − p₁ρ₁ ‖₁ )
```

This is the hard ceiling **any** detector can reach. No method beats it — it is physics.

**Why it is worth the effort:** plot your detector's ROC against the Helstrom limit. If you sit close to it, you are demonstrating **near-optimality**, not merely "it works." That is a qualitatively stronger claim than any accuracy number.

**Cut first if time is short.** High value, real cost.

---

## 8. Timing side-channel — `detect/timing.py`

**Kolmogorov–Smirnov** two-sample test of the observed latency distribution against the characterised baseline.

Non-parametric, no distributional assumption, and completely independent of the quantum measurements. Two orthogonal detectors agreeing is far stronger evidence than one.

---

## 9. What to report, and what never to report

| Always report | Never report |
|---|---|
| Test statistic and p-value | A verdict with no statistic |
| Runner-up hypothesis | A single confident answer with no alternative |
| Sample size per basis | A rate without its `n` |
| Prior, for any Bayesian output | A posterior with an unstated prior |
| Confidence interval on every rate | A point estimate alone |
| `INCONCLUSIVE` when it applies | A forced decision |
| The seed | An unreproducible number |

**The last row is the one that matters most.** A judge who can reproduce one number will trust the rest.
