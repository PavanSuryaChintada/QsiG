"""
Regenerate every number and figure from one seed.

    python -m experiments.run_all          (full)
    python -m experiments.run_all --quick  (fewer runs, for smoke tests)

Writes results/*.json, results/fig*.png, and site/public/data/site_data.json (what the site shows).
View the site:  cd site && npm install && npm run dev
"""

import hashlib
import json
import platform
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import qiskit
import qiskit_aer

from qsig.config import CHSH_SECURE_MIN, KEY_LENGTH_L, SEED, TSIRELSON
from qsig.detect.chsh import chsh_rounds
from qsig.detect.engine import detect
from qsig.detect.profiles import build_reference_profiles

from .exp1_confusion import run_confusion

RESULTS = Path("results")

# phase_flip is omitted as a separate class: on Pauli-eigenstate inputs it is the same
# channel as phase_damping (both [e, e, 0]), so no fingerprint can separate them.

CONDITIONS = [
    ("honest", 0.0),
    ("depolarising", 0.05), ("depolarising", 0.15),
    ("phase_damping", 0.1), ("phase_damping", 0.3),
    ("amplitude_damping", 0.1), ("amplitude_damping", 0.3),
    ("bit_flip", 0.05), ("bit_flip", 0.15),
    ("intercept_Z", 0.3), ("intercept_Z", 1.0),
    ("intercept_X", 0.3), ("intercept_X", 1.0),
    ("intercept_Y", 0.3), ("intercept_Y", 1.0),
    ("intercept_random", 0.3), ("intercept_random", 1.0),
    ("blind_forgery", 1.0),
]
DEMO = [("honest", 0.0), ("depolarising", 0.15), ("phase_damping", 0.3),
        ("intercept_Z", 1.0), ("intercept_random", 1.0), ("blind_forgery", 1.0)]


def git_sha():
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
    except Exception:
        return None


def fig_confusion(conf, path):
    cls, cols = conf["classes"], conf["columns"]
    data = [[conf["matrix"][r][c] / max(sum(conf["matrix"][r].values()), 1) for c in cols] for r in cls]
    fig, ax = plt.subplots(figsize=(11, 8))
    ax.imshow(data, cmap="Greys", vmin=0, vmax=1)
    ax.set_xticks(range(len(cols)), cols, rotation=60, ha="right")
    ax.set_yticks(range(len(cls)), cls)
    for i, row in enumerate(data):
        for j, v in enumerate(row):
            if v > 0:
                ax.text(j, i, f"{v:.2f}", ha="center", va="center", color="white" if v > 0.5 else "black", fontsize=8)
    ax.set_xlabel("attributed")
    ax.set_ylabel("true condition")
    ax.set_title(f"F1  Attribution on held-out runs (n={conf['n_runs_per_condition']} per strength, seed {conf['seed']})")
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)


def fig_chsh(chsh, path):
    labels = list(chsh)
    fig, ax = plt.subplots(figsize=(11, 5))
    ax.bar(range(len(labels)), [chsh[l]["S"] for l in labels], yerr=[chsh[l]["sigma"] for l in labels],
           color=["#3E7C5A" if chsh[l]["secure"] else "#B42D1A" for l in labels])
    ax.axhline(TSIRELSON, color="black", ls="--", lw=1, label="Tsirelson 2√2")
    ax.axhline(2.0, color="grey", ls=":", lw=1, label="classical limit 2")
    ax.axhline(CHSH_SECURE_MIN, color="#9A760C", ls="-.", lw=1, label=f"secure threshold {CHSH_SECURE_MIN}")
    ax.set_xticks(range(len(labels)), labels, rotation=60, ha="right")
    ax.set_ylabel("CHSH S")
    ax.legend()
    ax.set_title("F2  CHSH value under each condition")
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)


def main(quick: bool = False, seed: int = SEED):
    t0 = time.time()
    RESULTS.mkdir(exist_ok=True)
    n_profile, n_test, n_chsh = (20, 5, 400) if quick else (100, 25, 2000)

    print(f"[1/4] reference profiles  ({len(CONDITIONS)} conditions x {n_profile} runs, seed {seed})")
    profiles = build_reference_profiles(CONDITIONS, n_runs=n_profile, seed=seed)

    print(f"[2/4] confusion matrix    (held-out, {n_test} runs per condition)")
    conf = run_confusion(CONDITIONS, profiles, n_runs=n_test, seed=seed)

    print(f"[3/4] CHSH                ({n_chsh} rounds per condition)")
    chsh = {}
    for c in CONDITIONS:
        r = chsh_rounds(n_chsh, c, seed=seed)
        chsh[f"{c[0]}@{c[1]}"] = {"condition": c[0], "strength": c[1], "S": r.S, "sigma": r.sigma,
                                  "secure": r.secure, "violates": r.violates, "E": r.E, "n_rounds": n_chsh}

    print("[4/4] example verdicts")
    verdicts = {}
    for c in DEMO:
        v = detect(c, profiles, seed=seed + 2_000_000)
        verdicts[f"{c[0]}@{c[1]}"] = {"decision": v.decision, "cause": v.cause,
                                      "instruments": v.instruments, "reasons": v.reasons}

    manifest = {
        "seed": seed, "quick": quick, "key_length": KEY_LENGTH_L,
        "n_profile_runs": n_profile, "n_confusion_runs": n_test, "n_chsh_rounds": n_chsh,
        "python": platform.python_version(), "qiskit": qiskit.__version__, "qiskit_aer": qiskit_aer.__version__,
        "git_sha": git_sha(), "timestamp": datetime.now(timezone.utc).isoformat(),
        "runtime_s": round(time.time() - t0, 1),
    }
    # Hash of results only (manifest excluded: timestamps differ run to run)
    payload = {"profiles": profiles, "confusion": conf, "chsh": chsh, "verdicts": verdicts}
    manifest["results_sha256"] = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

    for name, obj in [("reference_profiles", profiles), ("attribution_accuracy", conf),
                      ("chsh", chsh), ("verdicts", verdicts), ("run_manifest", manifest)]:
        (RESULTS / f"{name}.json").write_text(json.dumps(obj, indent=2))
    (RESULTS / "site_data.json").write_text(json.dumps({**payload, "manifest": manifest,
                                                        "tsirelson": TSIRELSON, "chsh_secure_min": CHSH_SECURE_MIN}, indent=2))
    site_data = Path("site/public/data")
    site_data.mkdir(parents=True, exist_ok=True)
    (site_data / "site_data.json").write_text((RESULTS / "site_data.json").read_text())
    fig_confusion(conf, RESULTS / "fig1_confusion.png")
    fig_chsh(chsh, RESULTS / "fig2_chsh.png")

    print(f"done in {manifest['runtime_s']} s  results sha256 {manifest['results_sha256'][:12]}")
    return manifest


if __name__ == "__main__":
    main(quick="--quick" in sys.argv)
