# SUBMISSION — delivery table, slide content, video script, Q&A

Everything for the SIH idea submission.

---

## PART 1 · Delivery Table (Expected Deliverables)

Paste into the submission. Maps to the organisation's stated deliverables: **Prototype, Code, Documentation.**

| # | Deliverable | Contents | Evidence of completion |
|---|---|---|---|
| **D1** | Mathematical model | Teleportation-based QDS formalism: Bell-state distribution, Pauli-eigenstate keys, correction operators, verification rule. Forgery bound `P_forge ≤ exp(−L·D(s_v‖s_a))`. Robustness and transferability conditions. | Written specification with derivations |
| **D2** | Protocol simulator | Qiskit implementation of key distribution over Bell pairs, teleportation with Pauli correction, signing, independent verification by two parties. Configurable key length. | Honest signature accepted 100% on a noiseless channel across 500 seeded runs |
| **D3** | Channel models | Depolarising, phase damping, amplitude damping, bit flip, phase flip — parameterised. Baseline characterisation routine. | Measured error profiles match analytic predictions within CI |
| **D4** | **CHSH entanglement monitor** | Interleaved Bell-inequality test rounds, `S ± σ` estimation, Tsirelson-bound assertion, security threshold derivation. | S ≈ 2.828 on a noiseless channel; measurable degradation under every channel attack |
| **D5** | **Pauli-basis fingerprinting** | Basis-resolved error estimation `[e_X, e_Y, e_Z]`; empirically-measured reference profiles with provenance; χ² attribution returning verdict, p-value and runner-up. | **Confusion matrix across all conditions, including an explicit INCONCLUSIVE band** |
| **D6** | Quantum process tomography | Pauli Transfer Matrix reconstruction; fidelity, unitarity and non-unitality metrics for coherent-vs-incoherent discrimination. | PTM heatmaps, honest vs attacked, with confidence regions |
| **D7** | Attack suite | Intercept-resend in X/Y/Z and random basis; blind and partial-knowledge forgery; impersonation; replay; collective entangling attack. All strength-parameterised. | Per-attack sensitivity curves; detection crossover strength reported |
| **D8** | **Quantum red-teaming** | Grover forgery search against our own scheme; Quantum Amplitude Estimation of forgery probability at `O(1/ε)` versus Monte Carlo `O(1/ε²)`. | Measured attack cost; QAE-vs-Monte-Carlo comparison table |
| **D9** | Statistical decision layer | χ² attribution with Benjamini–Hochberg correction; Bayesian posterior tracking; Wald SPRT; CUSUM change-point detection; derived thresholds; Hoeffding and Chernoff finite-key bounds. | Rounds-to-decision curves; ROC with derived operating point; validated on held-out runs |
| **D10** | Independent detection axes | Decoy-state consistency checking; timing side-channel analysis by Kolmogorov–Smirnov test. | Catches selective attacks that the primary instruments miss |
| **D11** | Replay and freshness | Nonce binding, key-position consumption register, timestamp window. Classical by design and stated as such. | Replayed signature rejected 100% — deterministic, not statistical |
| **D12** | Security analysis | Forgery, repudiation and transferability bounds with assumptions stated explicitly. Numerical validation against simulation. Helstrom optimality comparison. | Written analysis with citations and validating figures |
| **D13** | Performance evaluation | Qubits and classical bits per signature, verification time, detection latency, scaling with key length. Honest comparison against RSA-2048 and ECDSA-P256. | Benchmark tables and plots |
| **D14** | **Prototype and results site** | Interactive console with live CHSH gauge, basis error bars, posterior tracking, SPRT trace, attack injection. Published methodology and results pages. | Deployed site; attack injected and identified on screen |
| **D15** | Code and reproducibility | Documented repository, seeded runs, configuration files. | `python -m experiments.run_all --seed 20260101` regenerates every figure and table |

---

## PART 2 · Six-slide content

Official SIH idea-submission format.

### Slide 1 — Title

```
Problem Statement ID     26141
Title                    Quantum-Inspired Cyber Threat Detection
                         for Digital Signature Security
Theme                    Blockchain & Cybersecurity
Category                 Software
Organisation             Egreen Quanta LLP
Team ID                  <edit>
Team Name                Qtron
```

**Strapline:**
> A live diagnostic instrument for quantum signature channels — not a threshold check.

---

### Slide 2 — Idea

**Tagline (top, centred):**
> A verifier sees a 9% mismatch rate. Is that a degraded fibre, or an attacker? Every existing framework compares 9 to a hardcoded 15 and moves on.

**Three columns:**

**01 · THE PROBLEM**
- Quantum computers break RSA and ECC. QDS replaces mathematical hardness with physical law.
- Verification counts mismatches. Noiseless gives 0%, garbage gives 50%.
- Real channels give 9% — and 9% has two opposite explanations.

**02 · WHERE EVERY SUBMISSION STOPS**
- Pool all errors into one number, compare against a hardcoded threshold.
- That threshold is asserted, never derived. Nobody can say where 0.15 came from.
- The pooled number cannot separate a degraded fibre from an eavesdropper.

**03 · WHAT WE BUILD**
- Six independent instruments on one channel, not one threshold.
- Attribution: *which* attack, with a p-value and a runner-up hypothesis.
- We attack ourselves with Grover to measure the real quantum forgery cost.

**Footer line (mono, centred):**
> Everyone counts how many errors there are. We work out what caused them.

---

### Slide 3 — Technical approach

**Tagline:**
> Six instruments. Each answers a different question. Together they cover what any single one misses.

**Left — the instruments:**

| | Instrument | Question it answers |
|---|---|---|
| **I1** | CHSH entanglement monitor | Is anyone in the channel at all? *(physical theorem)* |
| **I2** | Pauli-basis fingerprinting | Which cause produced these errors? |
| **I3** | Process tomography | Is the disturbance coherent or random? |
| **I4** | Statistical decision layer | How confident, and since when? |
| **I5** | Grover / QAE red-teaming | What does a quantum attack actually cost? |
| **I6** | Decoy states + timing | Independent confirmation |

**Centre — the mechanism** (the teaching moment):

```
Eve measures in Z:
    Z-eigenstates survive untouched     →  e_Z = 0.00
    X-eigenstates collapse at random    →  e_X = 0.50
    Y-eigenstates collapse at random    →  e_Y = 0.50
                              fingerprint [0.50, 0.50, 0.00]

Depolarising noise chooses no basis     →  [e, e, e]

Add the three together and both become "9%".
```

**Right — technology stack:**

| Layer | |
|---|---|
| Quantum | Qiskit 1.2 · Aer · qiskit-experiments |
| Algorithms | Bell states · teleportation · CHSH · process tomography · **Grover** · **QAE** |
| Statistics | scipy · statsmodels — χ² · Bayesian · SPRT · CUSUM · Hoeffding |
| Backend | Python 3.11 · FastAPI · Pydantic |
| Frontend | Vite · React · TypeScript · Tailwind · Recharts · KaTeX |
| Reproducibility | seeded runs · `run_all` regenerates every figure |
| **Not used** | **No AI, no ML — the PS excludes them, and χ² and SPRT are provably optimal here** |

---

### Slide 4 — Feasibility and viability

**Tagline:**
> Fully simulated, no hardware, no dataset required. Every limitation stated rather than hidden.

**Left — feasible today:**

| | |
|---|---|
| **No hardware needed** | Everything runs in Qiskit Aer. Circuits are hardware-ready if a QPU becomes available. |
| **No dataset needed** | Dataset is Public/Open; we generate every input by seeded simulation. |
| **Established methods** | CHSH 1969 · χ² 1900 · SPRT 1945 · CUSUM 1954 · Grover 1996. Nothing invented. |
| **Fully reproducible** | One command regenerates every figure. Seeds published. |

**Right — limitations, stated:**

| | |
|---|---|
| **1 · Confusable pairs** | Phase damping and weak Z-intercept share the shape `[e,e,0]`; blind forgery and severe depolarising are both isotropic near 0.5. Separated by magnitude, not shape. Both appear in the confusion matrix and the framework returns INCONCLUSIVE rather than guessing. |
| **2 · Simulation, not hardware** | Aer, not a QPU. Circuits are hardware-ready; results are simulated and labelled as such on every page. |
| **3 · Grover extrapolated** | The forgery oracle is built for a small instance; scaling is extrapolated analytically. Stated wherever the number appears. |
| **4 · Attack model bounded** | We detect the implemented suite at the measured sensitivities. Attacks outside it are by definition untested. |
| **5 · Finite-key effects** | Per-basis sample counts are limited at L=256. Reported with confidence intervals, bounded by Hoeffding. |

---

### Slide 5 — Impact and benefits

**Tagline:**
> Detection that names the cause turns an alarm into an incident response.

**Who it serves:**

**01 · Quantum network operators** — Live entanglement monitoring. Not "the error rate rose" but "intercept-resend, Z basis, began at round 412."

**02 · Security researchers** — An open, reproducible testbed for QDS threat models. Every figure regenerates from one command.

**03 · Standards and policy** — Thresholds derived from measured channels rather than asserted, with the security bound that follows. Input to QDS deployment guidance.

**Benefits:**

- **Operational** — attribution plus change-point turns detection into forensics. You can say what was compromised and from when.
- **Scientific** — quantum red-teaming measures adversary cost rather than assuming it.
- **Economic** — no hardware, no dataset, no licence. Runs on a laptop.
- **National** — India is investing in quantum communication. Independent verification tooling is infrastructure, not an experiment.

---

### Slide 6 — Research and references

**Four groups:**

**QDS PROTOCOLS**
- Gottesman & Chuang — Quantum Digital Signatures, 2001 · `arxiv.org/abs/quant-ph/0105032`
- Dunjko, Wallden & Andersson — Quantum digital signatures without quantum memory, PRL 112, 2014
- Amiri & Andersson — Unconditionally secure quantum signatures, Entropy 17, 2015

**ENTANGLEMENT AND CHANNEL CHARACTERISATION**
- Clauser, Horne, Shimony & Holt — Proposed experiment to test local hidden-variable theories, PRL 23, 1969
- Tsirelson — Quantum generalizations of Bell's inequality, Lett. Math. Phys. 4, 1980
- Chow et al. — Randomized benchmarking and process tomography, PRL 102, 2009

**STATISTICAL DECISION THEORY**
- Wald — Sequential Tests of Statistical Hypotheses, Ann. Math. Stat. 16, 1945
- Page — Continuous inspection schemes, Biometrika 41, 1954
- Hoeffding — Probability inequalities for sums of bounded random variables, JASA 58, 1963
- Helstrom — Quantum Detection and Estimation Theory, 1976

**QUANTUM ALGORITHMS AND TOOLING**
- Grover — A fast quantum mechanical algorithm for database search, STOC 1996
- Brassard, Høyer, Mosca & Tapp — Quantum amplitude amplification and estimation, 2002
- Qiskit · Qiskit Aer · qiskit-experiments — IBM Quantum

---

## PART 3 · Video voice-over script — 2:25

Plain delivery, no music under the speech. Time markers are cues for the visual.

---

**[0:00–0:18] — problem**

> Quantum computers will break the digital signatures protecting almost everything online. The replacement is a quantum digital signature — security from physics rather than from hard maths.
>
> But there's a problem nobody has solved.

**[0:18–0:42] — the gap**

> When a signature is verified, the verifier counts how many measurements disagree. Zero percent is perfect. Fifty percent is garbage.
>
> Real channels give you something like nine percent.
>
> And nine percent has two completely opposite explanations. Either the fibre is degraded — which is innocent — or someone is intercepting your messages.

**[0:42–0:58] — what everyone does**

> Every existing framework handles this by picking a cutoff in advance, usually fifteen percent, and comparing.
>
> Nine is under fifteen, so accept. That's the entire decision. Nobody asks why it was nine.

**[0:58–1:28] — our idea**

> Here's what everyone misses. That one measurement is really three, in three different bases — X, Y and Z. Everyone adds the three together into a single number.
>
> We keep them separate.
>
> A noisy channel damages all three equally, because noise doesn't choose. An eavesdropper has to pick a basis to listen in. Whatever she picks gets destroyed. Whatever she skips comes through perfectly clean.
>
> That uneven pattern is a fingerprint — and adding the three numbers together erases it.

**[1:28–1:50] — the physical proof**

> We also monitor entanglement directly, using the CHSH inequality. There is a hard physical ceiling at two point eight two eight. An eavesdropper cannot extract information without pushing that number down. That isn't a heuristic — it's a theorem. No attack can avoid it.

**[1:50–2:10] — red-teaming**

> And we attack our own system with quantum algorithms. Grover's search hunts for forgeries against our own scheme, and amplitude estimation bounds the forgery probability quadratically faster than Monte Carlo.
>
> Every other approach uses quantum to defend. We use it to attack ourselves, and show the signature still holds.

**[2:10–2:25] — close**

> So instead of "nine percent, accept", the output is: intercept-resend attack, Z basis, detected at round thirty-eight, confidence ninety-nine point nine percent — and here is exactly what we cannot separate.
>
> Everyone counts how many errors there are. We work out what caused them.

---

**Delivery notes**

- **2:25 spoken.** Leave the last 5 seconds silent on the close frame.
- Slow down at 0:58–1:28. That's the core idea and it is the only part the viewer must follow.
- Show the three bars at 1:10. Two rise, one stays flat. **Let the visual land before speaking over it.**
- Show the CHSH needle falling at 1:35.
- Do not read the slides. The voice-over carries the argument; the visuals carry the evidence.

---

## PART 4 · Questions you will be asked

**"Isn't this just anomaly detection?"**
> No. Anomaly detection says something is unusual. We identify which of nine specific physical causes produced the observation, with a p-value and a runner-up hypothesis. And there is no learned model anywhere — it's a χ² test against profiles measured under controlled conditions.

**"Where is the machine learning?"**
> There isn't any, deliberately — the problem statement excludes it. Every decision is a classical hypothesis test. χ² dates to 1900, the sequential probability ratio test to 1945. Both are provably optimal for the problems they solve, which is more than any classifier could claim here.

**"What if the attacker measures in a random basis to hide?"**
> Then the fingerprint fails — it looks isotropic, exactly like noise. **CHSH still catches it**, because entanglement degrades regardless of which basis she chose. That case is precisely why we built six independent instruments rather than one clever detector.

**"Why not just lower the threshold?"**
> Because that trades false rejections for security and nobody quantifies the trade. We derive the threshold from the measured channel for a target false-rejection rate, and show the forgery bound that follows. A lower threshold rejects legitimate signatures over a noisy fibre.

**"Is this real quantum hardware?"**
> Simulation, in Qiskit Aer, labelled as such on every results page. The protocol circuits are hardware-ready; the detection layer is classical post-processing and runs on any measurement record, real or simulated.

**"How do I know your reference profiles are right?"**
> They're measured, not asserted. Every profile is 200 seeded runs under controlled conditions with mean, standard deviation and provenance recorded. Run `experiments/run_all.py --seed 20260101` and you get the same numbers.

**"What can't it detect?"**
> Phase damping and weak Z-basis interception share a shape and separate only by magnitude. Blind forgery and severe depolarising are both isotropic near 0.5. Both pairs are in the confusion matrix, and the framework returns INCONCLUSIVE rather than guessing. Attacks outside the implemented suite are by definition untested.

**"Is QDS better than RSA?"**
> Not by efficiency — it needs quantum infrastructure and far more communication. The trade is information-theoretic security against Shor's algorithm instead of computational hardness. Our comparison table states that plainly.

**"Grover on how many qubits?"**
> Sixteen on the simulator. The oracle is built for a small instance and the scaling is extrapolated analytically — we say so wherever the number appears. The point is measuring adversary cost rather than assuming it.

---

## PART 5 · Three rules

**Lead with the question, not the protocol.** Every other submission opens with Bell states and teleportation. Open with *"is that noise or an attacker?"*

**Volunteer the confusion matrix's weak cells.** Two pairs the method cannot separate at low strength. Saying it first turns a limitation into evidence you understand your own system.

**Never show a number you have not measured.** Every figure carries its seed. A judge who reproduces one number will trust the rest; a judge who catches one fabricated number discards everything.

---

## The one line

> **Everyone counts how many errors there are. We work out what caused them.**
