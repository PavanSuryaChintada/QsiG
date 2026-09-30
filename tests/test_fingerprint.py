"""
Gate 3: at strength >= 0.3, Z-intercept is never attributed as depolarising, and vice versa.
Profiles and test sessions use disjoint seeds.
"""

from qsentry.config import SEED, SESSION_SIGNATURES
from qsentry.detect.fingerprinting import aggregate, attribute
from qsentry.detect.profiles import build_reference_profiles
from qsentry.protocol.run import run_protocol

CONDITIONS = [("honest", 0.0), ("depolarising", 0.05), ("depolarising", 0.15),
              ("intercept_Z", 0.3), ("intercept_Z", 1.0)]


def test_intercept_not_confused_with_depolarising():
    profiles = build_reference_profiles(CONDITIONS, n_runs=40, seed=SEED)
    print()
    for true, other, strengths in [("intercept_Z", "depolarising", (0.3, 1.0)),
                                   ("depolarising", "intercept_Z", (0.05, 0.15))]:
        for s in strengths:
            for t in range(5):
                base = SEED + 500_000 + t * SESSION_SIGNATURES
                e, n = aggregate([run_protocol(seed=base + j, condition=(true, s)) for j in range(SESSION_SIGNATURES)])
                v = attribute(e, n, profiles).verdict
                print(f"  {true + '@' + str(s):<20} session {t}   e(X,Y,Z) = "
                      f"{e['X']:.3f} {e['Y']:.3f} {e['Z']:.3f}   -> {v}")
                assert v != other, f"{true}@{s} attributed as {other}"
