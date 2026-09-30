"""
Signing protocol for QDS.
Alice publishes the classical descriptions (basis[i], eigenvalue[i]).
"""

from dataclasses import dataclass
from typing import List, Tuple

from .keys import KeyRecord, KeyElement


@dataclass
class Signature:
    """A signature consists of the classical descriptions of the key."""
    message_bit: int
    bases: List[str]
    eigenvalues: List[int]
    
    def __post_init__(self):
        if len(self.bases) != len(self.eigenvalues):
            raise ValueError("bases and eigenvalues must have same length")


def sign(key_record: KeyRecord) -> Signature:
    """
    Create a signature from a key record.
    
    Alice publishes the classical descriptions (basis[i], eigenvalue[i]).
    
    Args:
        key_record: The key record for a message bit
    
    Returns:
        Signature with bases and eigenvalues
    """
    bases = [element.basis for element in key_record.key]
    eigenvalues = [element.eigenvalue for element in key_record.key]
    
    return Signature(
        message_bit=key_record.message_bit,
        bases=bases,
        eigenvalues=eigenvalues
    )
