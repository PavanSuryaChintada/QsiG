"""
Intercept-resend attacks on the travelling qubit.

Eve measures the travelling qubit in her basis and resends the collapsed state.
Simulated as a real mid-circuit measurement (rotate, measure, rotate back), so the
fingerprint emerges from the circuit rather than being asserted.
"""

import random
from typing import List, Optional

from qiskit import QuantumCircuit

INTERCEPT_ATTACKS = ("intercept_X", "intercept_Y", "intercept_Z", "intercept_random")


def apply_intercept(qc: QuantumCircuit, q: int, c: int, eve_basis: str) -> None:
    """Eve measures qubit q in eve_basis (outcome into clbit c) and resends."""
    if eve_basis == "X":
        qc.h(q)
        qc.measure(q, c)
        qc.h(q)
    elif eve_basis == "Y":
        qc.sdg(q)
        qc.h(q)
        qc.measure(q, c)
        qc.h(q)
        qc.s(q)
    else:
        qc.measure(q, c)


def intercept_plan(attack: str, strength: float, n: int, rng: random.Random) -> List[Optional[str]]:
    """
    Eve's basis per position (None = untouched).
    strength = fraction of qubits Eve touches, chosen by a seeded RNG.
    """
    if attack not in INTERCEPT_ATTACKS:
        return [None] * n
    plan: List[Optional[str]] = []
    for _ in range(n):
        if rng.random() >= strength:
            plan.append(None)
        elif attack == "intercept_random":
            plan.append(rng.choice(("X", "Y", "Z")))
        else:
            plan.append(attack[-1])
    return plan
