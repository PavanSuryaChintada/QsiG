"""
Pauli eigenstates for QDS.
The basis label must survive into the key record — every instrument buckets errors by basis.
"""

from qiskit import QuantumCircuit
from typing import Literal

Basis = Literal["X", "Y", "Z"]

PAULI_EIGENSTATES = {
    ("Z", +1): "|0>",
    ("Z", -1): "|1>",
    ("X", +1): "|+>",
    ("X", -1): "|->",
    ("Y", +1): "|+i>",
    ("Y", -1): "|-i>",
}


def prepare(qc: QuantumCircuit, q: int, basis: Basis, eigenvalue: int) -> None:
    """
    Prepare a Pauli eigenstate on qubit q.
    
    Args:
        qc: Quantum circuit
        q: Qubit index
        basis: Measurement basis ("X", "Y", or "Z")
        eigenvalue: +1 or -1
    """
    # Flip first, then rotate: X,H gives |->; X,H,S gives |-i>.
    if basis not in ("X", "Y", "Z"):
        raise ValueError(f"Invalid basis: {basis}")
    if eigenvalue == -1:
        qc.x(q)
    if basis == "X":
        qc.h(q)
    elif basis == "Y":
        qc.h(q)
        qc.s(q)


def measure_in_basis(qc: QuantumCircuit, q: int, c: int, basis: Basis) -> None:
    """
    Measure qubit q in the specified basis, storing result in classical bit c.
    
    Measurement rotations:
    - Z: nothing (computational basis)
    - X: H before measurement (|+⟩→|0⟩, |-⟩→|1⟩)
    - Y: Sdg then H before measurement
    
    Args:
        qc: Quantum circuit
        q: Qubit index
        c: Classical bit index
        basis: Measurement basis ("X", "Y", or "Z")
    """
    if basis == "Z":
        qc.measure(q, c)
    elif basis == "X":
        qc.h(q)
        qc.measure(q, c)
    elif basis == "Y":
        qc.sdg(q)
        qc.h(q)
        qc.measure(q, c)
    else:
        raise ValueError(f"Invalid basis: {basis}")
