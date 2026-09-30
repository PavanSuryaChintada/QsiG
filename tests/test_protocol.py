"""
Gate 1: honest signature accepted 100% on a noiseless channel, 500 seeded runs, all three bases.
"""

from qsentry.config import SEED
from qsentry.protocol.run import run_protocol


def test_honest_accepted_noiseless():
    accepted = 0
    for i in range(500):
        r = run_protocol(seed=SEED + i)
        assert r.accepted, f"run {i} rejected"
        assert r.s_pooled == 0.0, f"run {i}: s_pooled={r.s_pooled}"
        assert all(r.n_by_basis[b] > 0 for b in "XYZ")
        accepted += r.accepted
    print(f"\n  honest, noiseless: {accepted}/500 accepted, mismatch s = 0.000 in every run")


def test_z_intercept_fingerprint_shape():
    """Z-intercept leaves Z clean and disturbs X and Y — emerges from the circuit."""
    r = run_protocol(seed=SEED, condition=("intercept_Z", 1.0))
    s = r.s_by_basis
    print(f"\n  intercept_Z@1.0  mismatch X = {s['X']:.3f}  Y = {s['Y']:.3f}  Z = {s['Z']:.3f}")
    assert s["Z"] == 0.0
    assert s["X"] > 0.3 and s["Y"] > 0.3
