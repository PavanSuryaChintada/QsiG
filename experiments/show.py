"""
Print the results of the last run_all as terminal tables.

    python -m experiments.show

Reads results/*.json only. Every number printed comes from the recorded run;
nothing here computes or asserts a result.
"""

import json
import sys
from pathlib import Path

RESULTS = Path(__file__).resolve().parent.parent / "results"


def load(name):
    return json.loads((RESULTS / name).read_text(encoding="utf-8"))


def rule(title):
    print()
    print(title)
    print("-" * len(title))


def show_manifest():
    m = load("run_manifest.json")
    rule("Run")
    print(f"seed {m['seed']}   qiskit {m['qiskit']}   aer {m['qiskit_aer']}   python {m['python']}")
    print(f"git {m['git_sha'][:12]}   {m['timestamp']}   {m['runtime_s']} s   sha256 {m['results_sha256'][:12]}")


def show_chsh():
    c = load("chsh.json")
    rule("I1  CHSH  (S <= 2.828 Tsirelson, S > 2 = entanglement)")
    print(f"{'condition':<24}{'S':>8}{'±σ':>8}{'rounds':>8}   {'violates':<9}{'secure':<7}")
    for key, r in c.items():
        print(f"{key:<24}{r['S']:>8.3f}{r['sigma']:>8.3f}{r['n_rounds']:>8}   "
              f"{'yes' if r['violates'] else 'no':<9}{'yes' if r['secure'] else 'NO':<7}")


def show_attribution():
    a = load("attribution_accuracy.json")
    rule(f"I2  Fingerprint attribution  (held-out, {a['n_runs_per_condition']} runs/condition, seed {a['seed']})")
    print(f"{'true cause':<20}{'accuracy':>10}{'inconclusive':>14}")
    for cls in a["classes"]:
        print(f"{cls:<20}{a['accuracy'][cls]:>10.1%}{a['inconclusive_rate'][cls]:>14.1%}")

    cols = a["columns"]
    short = [c[:6] for c in cols]
    rule("Confusion matrix  (rows = true, columns = attributed)")
    print(f"{'':<18}" + "".join(f"{s:>7}" for s in short))
    for cls in a["classes"]:
        row = a["matrix"][cls]
        print(f"{cls:<18}" + "".join(f"{row[c] or '.':>7}" for c in cols))


def show_verdicts():
    v = load("verdicts.json")
    rule("Example verdicts")
    for key, r in v.items():
        print(f"{key:<24}{r['decision']:<8} cause: {r['cause']}")
        for reason in r["reasons"]:
            print(f"{'':<26}{reason}")


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    show_manifest()
    show_chsh()
    show_attribution()
    show_verdicts()
    print()


if __name__ == "__main__":
    main()
