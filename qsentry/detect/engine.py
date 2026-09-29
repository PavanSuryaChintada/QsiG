"""
Detection engine: combines CHSH (I1) and fingerprint (I2) into one verdict.
Any instrument may veto. Disagreement is reported, not hidden.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional

from ..config import SEED, SESSION_SIGNATURES
from ..protocol.run import run_protocol
from .chsh import chsh_rounds
from .fingerprinting import aggregate, attribute

CHSH_ROUNDS = 1000  # CHSH test rounds accumulated over a session


@dataclass
class Verdict:
    decision: str                # ACCEPT | REJECT | INCONCLUSIVE
    cause: str                   # attributed hypothesis
    instruments: Dict
    reasons: List[str] = field(default_factory=list)
    detected_at_round: Optional[int] = None
    change_point: Optional[int] = None


def detect(condition, profiles: Dict, seed: int = SEED, n_chsh: int = CHSH_ROUNDS) -> Verdict:
    session = [run_protocol(seed=seed + j, condition=condition) for j in range(SESSION_SIGNATURES)]
    sig = session[0]  # the signature being verified; the session feeds the fingerprint
    ch = chsh_rounds(n_chsh, condition, seed=seed)
    e, n = aggregate(session)
    fp = attribute(e, n, profiles)

    instruments = {
        "signature": {"s_pooled": sig.s_pooled, "accepted": sig.accepted},
        "chsh": {"S": ch.S, "sigma": ch.sigma, "secure": ch.secure, "violates": ch.violates},
        "fingerprint": {"e": e, "n": n, "verdict": fp.verdict,
                        "best": fp.best, "best_p": fp.best_p,
                        "runner_up": fp.runner_up, "runner_up_p": fp.runner_up_p},
    }
    reasons = [
        f"Signature mismatch s = {sig.s_pooled:.3f} ({'below' if sig.accepted else 'at or above'} s_a)",
        f"CHSH S = {ch.S:.3f} ± {ch.sigma:.3f} ({'entanglement intact' if ch.secure else 'entanglement degraded'})",
        f"Fingerprint: best {fp.best} (p={fp.best_p:.3f}), runner-up {fp.runner_up}"
        + (f" (p={fp.runner_up_p:.3f})" if fp.runner_up_p is not None else ""),
    ]

    if not ch.secure or not sig.accepted:
        decision = "REJECT"
    elif fp.verdict.startswith(("intercept", "blind_forgery")):
        decision = "REJECT"
        reasons.append("Fingerprint attributes an attack although s and CHSH pass — instruments disagree")
    elif fp.verdict == "INCONCLUSIVE":
        decision = "INCONCLUSIVE"
    else:
        decision = "ACCEPT"
    return Verdict(decision=decision, cause=fp.verdict, instruments=instruments, reasons=reasons)
