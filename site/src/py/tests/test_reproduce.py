"""
Gate 6: same seed -> identical results.
"""

from qsig.config import SEED
from qsig.detect.chsh import chsh_rounds
from qsig.protocol.run import run_protocol


def test_same_seed_identical():
    print()
    for c in [("honest", 0.0), ("depolarising", 0.1), ("intercept_random", 0.5)]:
        a = run_protocol(seed=SEED, condition=c)
        b = run_protocol(seed=SEED, condition=c)
        assert a == b
        x = chsh_rounds(500, c, seed=SEED)
        y = chsh_rounds(500, c, seed=SEED)
        assert x == y
        print(f"  {c[0] + '@' + str(c[1]):<22} run A: s = {a.s_pooled:.4f}  S = {x.S:.4f}   "
              f"run B: s = {b.s_pooled:.4f}  S = {y.S:.4f}   identical")
