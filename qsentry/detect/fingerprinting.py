"""
Pauli-basis fingerprinting (I2).
Per-basis error vector [e_X, e_Y, e_Z], attributed by chi-squared against
empirically measured reference profiles (never hardcoded).
"""

from dataclasses import dataclass
from typing import Dict, List, Optional

from scipy.stats import chi2

from ..config import BASES, SESSION_SIGNATURES, SIG_LEVEL

# Two hypotheses are "separated" if their chi2 differs by more than this (95%, 1 dof).
SEPARATION = chi2.ppf(1 - SIG_LEVEL, 1)


@dataclass
class Attribution:
    verdict: str                 # attributed class, or "INCONCLUSIVE"
    best: str
    best_p: float
    runner_up: Optional[str]
    runner_up_p: Optional[float]
    chi2_by_class: Dict[str, float]


def aggregate(results) -> tuple:
    """Pool per-basis mismatches over a session of VerifyResults -> (e, n)."""
    n = {b: sum(r.n_by_basis[b] for r in results) for b in BASES}
    e = {b: sum(r.s_by_basis[b] * r.n_by_basis[b] for r in results) / max(n[b], 1) for b in BASES}
    return e, n


def chi2_stat(e: Dict[str, float], n: Dict[str, int], profile: Dict, k: int = SESSION_SIGNATURES) -> float:
    """
    profile["std"] is the per-signature spread; a k-signature session has std/sqrt(k).
    The profile mean itself carries std/sqrt(n_runs) uncertainty. Plus a 1/n resolution floor.
    """
    total = 0.0
    for b in BASES:
        nb = max(n.get(b, 0), 1)
        sd = profile["std"][b]
        var = sd ** 2 / k + sd ** 2 / profile["n_runs"] + 1.0 / nb ** 2
        total += (e.get(b, 0.0) - profile["mean"][b]) ** 2 / var
    return total


def attribute(e: Dict[str, float], n: Dict[str, int], profiles: Dict[str, Dict], k: int = SESSION_SIGNATURES) -> Attribution:
    """profiles: label -> {"condition": class, "mean": {..}, "std": {..}}"""
    best_by_class: Dict[str, float] = {}
    for p in profiles.values():
        c = chi2_stat(e, n, p, k)
        cls = p["condition"]
        best_by_class[cls] = min(c, best_by_class.get(cls, float("inf")))

    ranked: List = sorted(best_by_class.items(), key=lambda kv: kv[1])
    best, best_c = ranked[0]
    runner, runner_c = ranked[1] if len(ranked) > 1 else (None, None)
    best_p = float(chi2.sf(best_c, len(BASES)))
    runner_p = float(chi2.sf(runner_c, len(BASES))) if runner else None

    if best_p < SIG_LEVEL or (runner and runner_c - best_c < SEPARATION):
        verdict = "INCONCLUSIVE"
    else:
        verdict = best
    return Attribution(verdict, best, best_p, runner, runner_p, dict(ranked))
