"""
Reference profiles for channel attribution — measured, never asserted.
"""

import statistics
from typing import Dict, List, Tuple

from ..config import BASES, KEY_LENGTH_L, SEED
from ..protocol.run import run_protocol


def build_reference_profiles(conditions: List[Tuple[str, float]], n_runs: int = 200, seed: int = SEED) -> Dict:
    """For each (condition, strength): run n_runs, store per-basis mean and std."""
    profiles = {}
    for name, strength in conditions:
        runs = [run_protocol(seed=seed + i, condition=(name, strength)) for i in range(n_runs)]
        profiles[f"{name}@{strength}"] = {
            "condition": name,
            "strength": strength,
            "n_runs": n_runs,
            "seed": seed,
            "key_length": KEY_LENGTH_L,
            "mean": {b: statistics.fmean(r.s_by_basis[b] for r in runs) for b in BASES},
            "std": {b: statistics.pstdev(r.s_by_basis[b] for r in runs) for b in BASES},
            "s_pooled_mean": statistics.fmean(r.s_pooled for r in runs),
            "accept_rate": sum(r.accepted for r in runs) / n_runs,
        }
    return profiles
