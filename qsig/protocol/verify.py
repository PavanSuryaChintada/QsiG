"""
Verification protocol for QDS.
CRITICAL: s_by_basis and n_by_basis must be returned from the very first version.
These are why this project is different — every instrument downstream consumes them.
"""

from dataclasses import dataclass
from typing import Dict, List

from ..config import BASES, KEY_LENGTH_L
from .sign import Signature


@dataclass
class VerifyResult:
    """Result of signature verification."""
    s_pooled: float  # Overall mismatch rate
    s_by_basis: Dict[str, float]  # Per-basis mismatch rates {"X":.., "Y":.., "Z":..}
    n_by_basis: Dict[str, int]  # Per-basis sample counts
    mismatch_positions: List[int]  # Positions where mismatch occurred
    accepted: bool  # Whether signature was accepted


def verify(
    signature: Signature,
    received_bits: List[int],
    s_a: float,
    s_v: float
) -> VerifyResult:
    """
    Verify a signature against received bits.
    
    Bob measures each held qubit in the declared basis and counts disagreements.
    
    Args:
        signature: The signature to verify
        received_bits: List of received bits (length L)
        s_a: Authentication threshold
        s_v: Verification threshold (s_a < s_v required for transferability)
    
    Returns:
        VerifyResult with per-basis statistics and acceptance decision
    """
    if len(received_bits) != KEY_LENGTH_L:
        raise ValueError(f"received_bits must have length {KEY_LENGTH_L}")
    
    # Count mismatches per basis
    mismatches_by_basis = {basis: 0 for basis in BASES}
    counts_by_basis = {basis: 0 for basis in BASES}
    mismatch_positions = []
    
    for i, (basis, eigenvalue, received) in enumerate(zip(
        signature.bases, signature.eigenvalues, received_bits
    )):
        counts_by_basis[basis] += 1
        
        # Expected bit depends on basis and eigenvalue
        # Z basis: +1 -> |0⟩ -> 0, -1 -> |1⟩ -> 1
        # X basis: +1 -> |+⟩ -> H -> |0⟩ -> 0, -1 -> |-⟩ -> H -> |1⟩ -> 1
        # Y basis: +1 -> |+i⟩ -> Sdg H -> |0⟩ -> 0, -1 -> |-i⟩ -> Sdg H -> |1⟩ -> 1
        expected = 0 if eigenvalue == +1 else 1
        
        if received != expected:
            mismatches_by_basis[basis] += 1
            mismatch_positions.append(i)
    
    # Calculate per-basis error rates
    s_by_basis = {}
    for basis in BASES:
        n = counts_by_basis[basis]
        if n > 0:
            s_by_basis[basis] = mismatches_by_basis[basis] / n
        else:
            s_by_basis[basis] = 0.0
    
    # Calculate pooled error rate
    total_mismatches = sum(mismatches_by_basis.values())
    s_pooled = total_mismatches / KEY_LENGTH_L
    
    # Acceptance decision
    accepted = s_pooled < s_a
    
    return VerifyResult(
        s_pooled=s_pooled,
        s_by_basis=s_by_basis,
        n_by_basis=counts_by_basis,
        mismatch_positions=mismatch_positions,
        accepted=accepted
    )
