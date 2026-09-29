"""
Gate 2: noiseless Bell pairs reach Tsirelson; S never exceeds it beyond sampling noise.
"""

from qsentry.config import SEED, TSIRELSON
from qsentry.detect.chsh import chsh_rounds

CONDITIONS = [("honest", 0.0), ("depolarising", 0.15), ("phase_damping", 0.3),
              ("intercept_Z", 1.0), ("intercept_random", 1.0)]


def test_bell_state_reaches_tsirelson():
    r = chsh_rounds(8000, seed=SEED)
    assert abs(r.S - TSIRELSON) < 3 * r.sigma, f"S={r.S:.3f} ± {r.sigma:.3f}"
    assert r.secure and r.violates


def test_never_exceeds_tsirelson():
    for c in CONDITIONS:
        for s in range(5):
            r = chsh_rounds(2000, c, seed=SEED + s)
            assert r.S <= TSIRELSON + 4 * r.sigma, f"{c}: S={r.S:.3f}"


def test_full_intercept_breaks_entanglement():
    r = chsh_rounds(2000, ("intercept_Z", 1.0), seed=SEED)
    assert not r.secure
