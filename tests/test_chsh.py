"""
Gate 2: noiseless Bell pairs reach Tsirelson; S never exceeds it beyond sampling noise.
"""

from qsig.config import SEED, TSIRELSON
from qsig.detect.chsh import chsh_rounds

CONDITIONS = [("honest", 0.0), ("depolarising", 0.15), ("phase_damping", 0.3),
              ("intercept_Z", 1.0), ("intercept_random", 1.0)]


def test_bell_state_reaches_tsirelson():
    r = chsh_rounds(8000, seed=SEED)
    print(f"\n  noiseless  S = {r.S:.3f} +/- {r.sigma:.3f}   Tsirelson = {TSIRELSON:.3f}")
    assert abs(r.S - TSIRELSON) < 3 * r.sigma, f"S={r.S:.3f} ± {r.sigma:.3f}"
    assert r.secure and r.violates


def test_never_exceeds_tsirelson():
    print()
    for c in CONDITIONS:
        S = []
        for s in range(5):
            r = chsh_rounds(2000, c, seed=SEED + s)
            S.append(r.S)
            assert r.S <= TSIRELSON + 4 * r.sigma, f"{c}: S={r.S:.3f}"
        print(f"  {c[0] + '@' + str(c[1]):<22} max S over 5 seeds = {max(S):.3f}   (limit {TSIRELSON:.3f})")


def test_full_intercept_breaks_entanglement():
    r = chsh_rounds(2000, ("intercept_Z", 1.0), seed=SEED)
    print(f"\n  intercept_Z@1.0  S = {r.S:.3f} +/- {r.sigma:.3f}   secure = {r.secure}")
    assert not r.secure
