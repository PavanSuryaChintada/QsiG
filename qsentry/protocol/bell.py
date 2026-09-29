"""
Bell pair preparation for teleportation-based QDS.
"""

from qiskit import QuantumCircuit


def bell_pair() -> QuantumCircuit:
    """
    Create a Bell pair |Φ⁺⟩ = (|00⟩ + |11⟩)/√2.
    
    Returns:
        QuantumCircuit with 2 qubits (no measurement)
    """
    qc = QuantumCircuit(2)
    qc.h(0)
    qc.cx(0, 1)
    return qc
