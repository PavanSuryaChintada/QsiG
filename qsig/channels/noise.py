"""
Channel noise models for QDS.
All noise is applied to the travelling qubit only: each model is a single-qubit
QuantumError that the circuit builders append directly onto that qubit.
"""

from typing import Optional

from qiskit_aer.noise import (
    QuantumError,
    amplitude_damping_error,
    depolarizing_error,
    pauli_error,
    phase_damping_error,
)

CHANNELS = ("depolarising", "phase_damping", "amplitude_damping", "bit_flip", "phase_flip")


def channel_error(name: str, strength: float) -> Optional[QuantumError]:
    """
    depolarising       rho -> (1-p) rho + p I/2
    phase_damping      destroys off-diagonal coherence
    amplitude_damping  |1> -> |0> with probability gamma
    bit_flip           X with probability p
    phase_flip         Z with probability p
    Returns None for anything that is not a channel (honest, attacks).
    """
    if name not in CHANNELS or strength <= 0:
        return None
    if name == "depolarising":
        return depolarizing_error(strength, 1)
    if name == "phase_damping":
        return phase_damping_error(strength)
    if name == "amplitude_damping":
        return amplitude_damping_error(strength)
    if name == "bit_flip":
        return pauli_error([("X", strength), ("I", 1 - strength)])
    return pauli_error([("Z", strength), ("I", 1 - strength)])
