import { useState } from "react";
import { Data, label, name } from "../lib";
import { BasisBars } from "./BasisBars";
import { Gauge } from "./Gauge";

export function LiveDemo({ data }: { data: Data }) {
  const keys = Object.keys(data.verdicts);
  const [key, setKey] = useState(keys[0]);
  const v = data.verdicts[key];
  const ch = v.instruments.chsh, fp = v.instruments.fingerprint;
  return (
    <div>
      <div className="tabs">
        {keys.map((k) => <button key={k} className={`btn ${k === key ? "on" : ""}`} onClick={() => setKey(k)}>{label(k)}</button>)}
      </div>
      <div className="grid3">
        <div className="panel">
          <div className="label">Verdict</div>
          <span className={`verdict ${v.decision}`}>{v.decision}</span>
          <div style={{ marginTop: 14 }}>
            <div className="muted" style={{ fontSize: 13 }}>Attributed cause</div>
            <div style={{ fontSize: 18 }}>{fp.verdict === "INCONCLUSIVE" ? "Inconclusive" : name(fp.verdict)}</div>
            <div className="muted mono" style={{ fontSize: 12, marginTop: 4 }}>
              best {fp.best} (p={fp.best_p.toFixed(3)}) · runner-up {fp.runner_up}{fp.runner_up_p != null ? ` (p=${fp.runner_up_p.toFixed(3)})` : ""}
            </div>
          </div>
          <ul style={{ paddingLeft: 18, marginTop: 14, color: "var(--i1)", fontSize: 13 }}>
            {v.reasons.map((r: string) => <li key={r}>{r}</li>)}
          </ul>
        </div>
        <div className="panel">
          <div className="label">I1 · CHSH entanglement monitor</div>
          <Gauge S={ch.S} sigma={ch.sigma} secureMin={data.chsh_secure_min} tsirelson={data.tsirelson} />
          <div className="muted" style={{ fontSize: 13 }}>Red: no entanglement (S ≤ 2). Amber: partial. Green: intact. Nobody can eavesdrop without pulling the needle down.</div>
        </div>
        <div className="panel">
          <div className="label">I2 · Error rate per basis (session)</div>
          <BasisBars e={fp.e} height={150} />
          <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>Noise: bars roughly level. Single-basis attack: one bar at zero.</div>
        </div>
      </div>
    </div>
  );
}
