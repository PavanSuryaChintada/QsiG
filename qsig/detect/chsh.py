"""
CHSH entanglement monitor (I1).

Bell pair |Phi+> on (q0 Alice, q1 travelling). Noise and Eve act on q1.
Measurement directions in the XZ plane (angle t means cos(t) Z + sin(t) X):
  Alice: a = 0 (Z),     a' = pi/2 (X)
  Bob:   b = pi/4,      b' = 3pi/4
For |Phi+>, E(ta, tb) = cos(ta - tb), so noiseless
  S = E(a,b) - E(a,b') + E(a',b) + E(a',b') = 2*sqrt(2).
"""

import math
import random
from collections import defaultdict
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Dict, Tuple

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

from ..attacks.intercept import apply_intercept, intercept_plan
from ..channels.noise import channel_error
from ..config import CHSH_SECURE_MIN, SEED, TSIRELSON

SETTINGS = {"ab": (0.0, math.pi / 4), "ab'": (0.0, 3 * math.pi / 4),
            "a'b": (math.pi / 2, math.pi / 4), "a'b'": (math.pi / 2, 3 * math.pi / 4)}
SIGNS = {"ab": 1, "ab'": -1, "a'b": 1, "a'b'": 1}

_SIM = AerSimulator(max_parallel_threads=1)  # 6x faster than threaded for tiny circuits


@dataclass
class CHSHResult:
    S: float
    sigma: float
    violates: bool   # S - 2 sigma > 2
    secure: bool     # S > CHSH_SECURE_MIN
    n_rounds: int
    E: Dict[str, float] = field(default_factory=dict)


@lru_cache(maxsize=None)
def _circuit(setting, eve_basis, channel, strength):
    ta, tb = SETTINGS[setting]
    qc = QuantumCircuit(2, 3)
    qc.h(0)
    qc.cx(0, 1)
    err = channel_error(channel, strength)
    if err is not None:
        qc.append(err.to_instruction(), [1])
    if eve_basis is not None:
        apply_intercept(qc, 1, 2, eve_basis)
    qc.ry(-ta, 0)
    qc.ry(-tb, 1)
    qc.measure(0, 0)
    qc.measure(1, 1)
    return qc


def chsh_rounds(n_rounds: int, condition: Tuple[str, float] = ("honest", 0.0), seed: int = SEED) -> CHSHResult:
    name, strength = condition
    rng = random.Random(seed * 104729 + 3)
    settings = [rng.choice(list(SETTINGS)) for _ in range(n_rounds)]
    eve = intercept_plan(name, strength, n_rounds, rng)

    groups = defaultdict(int)
    for s, e in zip(settings, eve):
        groups[(s, e)] += 1
    keys = list(groups)
    circuits = [_circuit(s, e, name, strength) for s, e in keys]
    result = _SIM.run(circuits, shots=max(groups.values()), memory=True, seed_simulator=seed).result()

    same, total = defaultdict(int), defaultdict(int)
    for ci, (s, e) in enumerate(keys):
        for bits in result.get_memory(ci)[:groups[(s, e)]]:
            b = bits[::-1]
            same[s] += b[0] == b[1]
            total[s] += 1

    E, var = {}, 0.0
    for s in SETTINGS:
        n = total[s]
        E[s] = (2 * same[s] - n) / n if n else 0.0
        var += (1 - E[s] ** 2) / n if n else 1.0
    S = abs(sum(SIGNS[s] * E[s] for s in SETTINGS))
    sigma = math.sqrt(var)

    # Tsirelson: a finite-sample estimate may overshoot by noise, never by more than ~4 sigma.
    assert S <= TSIRELSON + 4 * sigma + 1e-9, f"S={S:.3f} exceeds Tsirelson bound — estimator bug"

    return CHSHResult(S=S, sigma=sigma, violates=S - 2 * sigma > 2.0,
                      secure=S > CHSH_SECURE_MIN, n_rounds=n_rounds, E=E)
