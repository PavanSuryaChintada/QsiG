"""
Teleportation circuit for QDS.
CRITICAL: Noise and attacks act on the travelling qubit (q2 leg), not globally.
"""

from typing import Optional

from qiskit import QuantumCircuit
from qiskit_aer.noise import QuantumError

from ..attacks.intercept import apply_intercept
from .states import measure_in_basis, prepare


def teleport_circuit(
    prep_basis: str,
    prep_eigenvalue: int,
    meas_basis: str,
    error: Optional[QuantumError] = None,
    eve_basis: Optional[str] = None,
) -> QuantumCircuit:
    """
    q0: state to teleport   q1: Alice's Bell half   q2: travelling qubit
    c0, c1: Bell measurement (b0, b1)   c2: recipient's measurement   c3: Eve

    Deferred measurement: the Pauli correction Z^b0 X^b1 is applied classically
    by apply_pauli_correction.
    """
    qc = QuantumCircuit(3, 4)
    prepare(qc, 0, prep_basis, prep_eigenvalue)
    qc.h(1)
    qc.cx(1, 2)

    # The travelling leg: channel noise, then Eve if present
    if error is not None:
        qc.append(error.to_instruction(), [2])
    if eve_basis is not None:
        apply_intercept(qc, 2, 3, eve_basis)

    qc.cx(0, 1)
    qc.h(0)
    qc.measure(0, 0)
    qc.measure(1, 1)
    measure_in_basis(qc, 2, 2, meas_basis)
    return qc


def apply_pauli_correction(measured_bit: int, b0: int, b1: int, basis: str) -> int:
    """
    Correction Z^b0 X^b1, pushed through the measurement:
      X flips Z- and Y-basis outcomes, commutes with X
      Z flips X- and Y-basis outcomes, commutes with Z
    """
    flip = (b1 and basis in ("Z", "Y")) ^ (b0 and basis in ("X", "Y"))
    return measured_bit ^ int(flip)
