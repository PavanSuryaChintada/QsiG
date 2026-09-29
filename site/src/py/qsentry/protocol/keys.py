"""
Key generation and records for QDS.
The basis label must survive into the key record — every instrument buckets errors by basis.
"""

import random
from dataclasses import dataclass, field
from typing import Dict, List

from ..config import BASES, KEY_LENGTH_L


@dataclass
class KeyElement:
    """A single key element with basis and eigenvalue."""
    basis: str
    eigenvalue: int


@dataclass
class KeyRecord:
    """Complete key record for a message bit."""
    message_bit: int
    key: List[KeyElement] = field(default_factory=list)
    
    def __post_init__(self):
        if len(self.key) != KEY_LENGTH_L:
            raise ValueError(f"Key length must be {KEY_LENGTH_L}")


def generate_key(message_bit: int, seed: int) -> KeyRecord:
    """
    Generate a random key of length KEY_LENGTH_L with seeded randomness.
    Each position draws a basis from X, Y, Z and an eigenvalue from +1, -1.
    
    Args:
        message_bit: The message bit (0 or 1)
        seed: Random seed for reproducibility
    
    Returns:
        KeyRecord with the generated key
    """
    rng = random.Random(seed)
    key = []
    
    for _ in range(KEY_LENGTH_L):
        basis = rng.choice(BASES)
        eigenvalue = rng.choice([+1, -1])
        key.append(KeyElement(basis=basis, eigenvalue=eigenvalue))
    
    return KeyRecord(message_bit=message_bit, key=key)


def count_by_basis(key: List[KeyElement]) -> Dict[str, int]:
    """
    Count key elements by basis.
    
    Args:
        key: List of key elements
    
    Returns:
        Dictionary mapping basis to count
    """
    counts = {basis: 0 for basis in BASES}
    for element in key:
        counts[element.basis] += 1
    return counts
