# RUNBOOK — setup and verification

**Run every checkpoint.** Each takes seconds and catches a class of failure that costs an hour if found later. In an 8-hour build, one environment failure is 12% of your time.

---

## 1 · Python version — do this first

```bash
python --version        # must be 3.11.x
```

**✗ If 3.12:** `qiskit-aer==0.15.1` has no wheel for 3.12 on several platforms and will attempt a source build. That is 30–60 minutes and often fails. Install 3.11:

```bash
# macOS
brew install python@3.11 && python3.11 -m venv .venv

# Ubuntu
sudo apt install python3.11 python3.11-venv && python3.11 -m venv .venv

# conda
conda create -n qsentry python=3.11 -y && conda activate qsentry
```

---

## 2 · Install

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

**✓ Checkpoint — run this now, not later:**

```bash
python -c "
import qiskit, qiskit_aer, numpy, scipy, statsmodels, pandas, matplotlib
from qiskit_aer import AerSimulator
print('qiskit', qiskit.__version__)
print('aer   ', qiskit_aer.__version__)
print('ok')
"
```

**✗ If `qiskit_aer` fails:** nothing in this project works. Do not proceed to anything else.

```bash
pip install qiskit-aer --no-cache-dir --force-reinstall
# still failing → conda install -c conda-forge qiskit-aer
```

**✓ Lock it immediately:**
```bash
pip freeze > requirements.lock
git add requirements.lock && git commit -m "lock deps"
```

Version drift between `qiskit` and `qiskit-aer` is the most likely thing to eat your build.

---

## 3 · Quantum smoke test — 2 minutes, catches everything

```bash
python -c "
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

qc = QuantumCircuit(2, 2)
qc.h(0); qc.cx(0, 1); qc.measure([0,1], [0,1])
sim = AerSimulator()
counts = sim.run(transpile(qc, sim), shots=4096, seed_simulator=42).result().get_counts()
print(counts)
p00 = counts.get('00',0)/4096
p11 = counts.get('11',0)/4096
assert p00 + p11 > 0.98, 'Bell state is broken'
print('bell ok:', round(p00,3), round(p11,3))
"
```

**✓ Expect:** roughly 50/50 between `00` and `11`, almost nothing in `01` or `10`.

**✗ If you see `01` or `10` in quantity:** the Bell pair is wrong, and **everything downstream is meaningless** — CHSH, fingerprinting, all of it. Fix before writing another line.

---

## 4 · CHSH sanity — the most important checkpoint

```bash
python -c "
from qsentry.detect.chsh import chsh_rounds
r = chsh_rounds(n_rounds=4000, seed=42)
print(f'S = {r.S:.4f} +/- {r.sigma:.4f}')
assert r.S <= 2.8285, f'S={r.S} EXCEEDS TSIRELSON — estimator bug'
assert r.S > 2.7,     f'S={r.S} too low for a noiseless channel'
print('chsh ok')
"
```

**✓ Expect:** `S ≈ 2.82 ± 0.02` on a noiseless channel.

**✗ If `S > 2.8285`:** an estimator bug, every time. The usual cause is a sign convention error in the rotated measurement bases. **This is never a discovery.**

**✗ If `S ≈ 2.0`:** your measurement settings are wrong. Check the rotation angles in `PHYSICS.md` §2.3.

**✗ If `S ≈ 0`:** correlations are being computed with the wrong pairing. Check which qubit belongs to which party.

---

## 5 · The noise-placement check — catches the top failure mode

```bash
python -c "
from qsentry.protocol.verify import run_protocol
from qsentry.attacks.intercept import intercept_resend

r = run_protocol(attack=intercept_resend(basis='Z', strength=1.0), seed=42)
e = r.s_by_basis
print(e)
assert e['Z'] < 0.05, f\"e_Z={e['Z']} should be ~0 under Z-intercept\"
assert e['X'] > 0.40, f\"e_X={e['X']} should be ~0.5 under Z-intercept\"
print('fingerprint ok')
"
```

**✓ Expect:** roughly `{X: 0.50, Y: 0.50, Z: 0.00}`.

**✗ If all three are similar:** noise is being applied globally instead of to the travelling qubit. **This is the single most common failure in this build** and it silently destroys attribution accuracy. Fix in `teleport.py` before touching any statistics.

---

## 6 · Site

```bash
cd site && npm install && npm run dev
```

**✗ If `npm install` hangs:**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --prefer-offline --no-audit --no-fund
# still hanging → npm config set registry https://registry.npmmirror.com
# still hanging → npm i -g pnpm && pnpm install
```

**Try it on a second machine in parallel.** If it installs there, the problem is the environment and you verify from that machine instead of debugging.

**✓ Deploy an empty page in the first 10 minutes.** Discovering a build failure at hour 7 is how projects die.

---

## 7 · Release gates

```bash
pytest -v
```

Six gates from `CLAUDE.md` §6. **Any red gate means cutting the claim it supports**, not shipping anyway.

---

## 8 · Before freeze

```
[ ] pytest all green
[ ] python -m experiments.run_all --seed 20260101 completes
[ ] results/run_manifest.json exists with the seed recorded
[ ] Every number on the slides appears in results/ — grep and verify
[ ] No FIXTURE DATA banner on the deployed site
[ ] Video re-recorded if any number changed
[ ] grep -ri "TODO\|FIXME\|placeholder\|lorem" .
```

**The fourth line is the one that matters.** Under time pressure, someone types a plausible number into a slide. That is the one thing that can end the submission.

---

## 9 · Failures ranked by likelihood

| Rank | Failure | Fix |
|---|---|---|
| 1 | Python 3.12 → aer source build | §1. **Check before anything else.** |
| 2 | **Noise applied globally, not to the travelling qubit** | §5. Silently ruins attribution. |
| 3 | CHSH exceeds Tsirelson | Sign convention in the rotated bases |
| 4 | `npm install` hangs | §6 escalation, second machine in parallel |
| 5 | Simulation too slow at L=256 | Drop to L=128 and say so. Physics unchanged. |
| 6 | Per-basis samples under 30 | Raise L, or bias key generation to a uniform basis split |
| 7 | SPRT never terminates | Cap rounds → INCONCLUSIVE. Check `p0 != p1`. |

**Ranks 1 and 2 account for most lost hours in a build like this.** Both are checked in under five minutes.
