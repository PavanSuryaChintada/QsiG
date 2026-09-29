"""
Run the full QDS protocol: key generation, teleportation, verification.

Every key position goes through the full teleportation circuit. Positions that share
(state, measurement basis, Eve basis) share a circuit, so a whole signature is one
batched Aer call with memory=True: each shot is one real, seeded measurement.
"""

import random
from collections import defaultdict
from functools import lru_cache
from typing import Tuple

from qiskit_aer import AerSimulator

from ..attacks.intercept import intercept_plan
from ..channels.noise import channel_error
from ..config import BASES, KEY_LENGTH_L, SEED
from .keys import generate_key
from .sign import Signature, sign
from .teleport import apply_pauli_correction, teleport_circuit
from .verify import VerifyResult, verify

Condition = Tuple[str, float]
HONEST: Condition = ("honest", 0.0)

_SIM = AerSimulator(max_parallel_threads=1)  # 6x faster than threaded for tiny circuits


@lru_cache(maxsize=None)
def _circuit(prep_basis, prep_eig, meas_basis, eve_basis, channel, strength):
    return teleport_circuit(prep_basis, prep_eig, meas_basis, channel_error(channel, strength), eve_basis)


def run_protocol(
    message_bit: int = 0,
    seed: int = SEED,
    condition: Condition = HONEST,
    s_a: float = 0.15,
    s_v: float = 0.25,
) -> VerifyResult:
    """
    condition: ("honest", 0), a channel from channels.noise (e.g. ("depolarising", 0.1)),
               an intercept attack (e.g. ("intercept_Z", 1.0)), or ("blind_forgery", f)
               where f is the fraction of positions the forger has to guess.
    """
    name, strength = condition
    rng = random.Random(seed * 7919 + 1)

    key = generate_key(message_bit, seed)
    signature = sign(key)

    # Blind forgery: the forger declares (basis, eigenvalue) with no key knowledge.
    declared = signature
    if name == "blind_forgery":
        bases, eigs = list(signature.bases), list(signature.eigenvalues)
        for i in range(KEY_LENGTH_L):
            if rng.random() < strength:
                bases[i] = rng.choice(BASES)
                eigs[i] = rng.choice((+1, -1))
        declared = Signature(message_bit=message_bit, bases=bases, eigenvalues=eigs)

    eve = intercept_plan(name, strength, KEY_LENGTH_L, rng)

    # Group positions by circuit; the recipient measures in the declared basis.
    groups = defaultdict(list)
    for i, el in enumerate(key.key):
        groups[(el.basis, el.eigenvalue, declared.bases[i], eve[i])].append(i)

    keys = list(groups)
    circuits = [_circuit(*k, name, strength) for k in keys]
    shots = max(len(v) for v in groups.values())
    result = _SIM.run(circuits, shots=shots, memory=True, seed_simulator=seed).result()

    received = [0] * KEY_LENGTH_L
    for ci, k in enumerate(keys):
        memory = result.get_memory(ci)
        for pos, bits in zip(groups[k], memory):
            b = bits[::-1]  # clbit 0 first
            received[pos] = apply_pauli_correction(int(b[2]), int(b[0]), int(b[1]), k[2])

    return verify(declared, received, s_a, s_v)
