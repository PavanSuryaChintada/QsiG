"""
Gate 6: same seed -> identical results.
"""

from qsentry.config import SEED
from qsentry.detect.chsh import chsh_rounds
from qsentry.protocol.run import run_protocol


def test_same_seed_identical():
    for c in [("honest", 0.0), ("depolarising", 0.1), ("intercept_random", 0.5)]:
        a = run_protocol(seed=SEED, condition=c)
        b = run_protocol(seed=SEED, condition=c)
        assert a == b
        assert chsh_rounds(500, c, seed=SEED) == chsh_rounds(500, c, seed=SEED)
