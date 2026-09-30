"""
F1 — attribution confusion matrix. THE HEADLINE.
Each trial is one session of SESSION_SIGNATURES signatures, attributed as a whole.

Profiles are built on one seed range; the confusion runs use a disjoint, held-out
seed range, so accuracy is never measured on the data that built the profiles.
"""

from collections import Counter
from typing import Dict, List, Tuple

from qsig.config import SESSION_SIGNATURES
from qsig.detect.fingerprinting import aggregate, attribute
from qsig.protocol.run import run_protocol

HELD_OUT_OFFSET = 1_000_000


def run_confusion(conditions: List[Tuple[str, float]], profiles: Dict, n_runs: int, seed: int) -> Dict:
    classes = sorted({c for c, _ in conditions}, key=[c for c, _ in conditions].index)
    matrix = {c: Counter() for c in classes}
    for name, strength in conditions:
        for i in range(n_runs):
            base = seed + HELD_OUT_OFFSET + i * SESSION_SIGNATURES
            session = [run_protocol(seed=base + j, condition=(name, strength)) for j in range(SESSION_SIGNATURES)]
            e, n = aggregate(session)
            matrix[name][attribute(e, n, profiles).verdict] += 1

    columns = classes + ["INCONCLUSIVE"]
    rows = {c: {col: matrix[c][col] for col in columns} for c in classes}
    totals = {c: sum(rows[c].values()) for c in classes}
    return {
        "classes": classes,
        "columns": columns,
        "matrix": rows,
        "accuracy": {c: rows[c][c] / totals[c] for c in classes},
        "inconclusive_rate": {c: rows[c]["INCONCLUSIVE"] / totals[c] for c in classes},
        "n_runs_per_condition": n_runs,
        "signatures_per_session": SESSION_SIGNATURES,
        "seed": seed + HELD_OUT_OFFSET,
    }
