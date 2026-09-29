import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { C, Data, kind, kindColor, label } from "../lib";

/**
 * Drag the acceptance threshold and watch the dilemma. Bars are the mean pooled
 * mismatch of each measured condition; "best possible" is searched over the data.
 */
export function ThresholdExplorer({ data }: { data: Data }) {
  const rows = useMemo(
    () => Object.entries<any>(data.profiles)
      .map(([k, p]) => ({ key: k, name: label(k), s: p.s_pooled_mean, cls: p.condition }))
      .sort((a, b) => a.s - b.s),
    [data]
  );
  const legit = rows.filter((r) => kind(r.cls) !== "attack");
  const attacks = rows.filter((r) => kind(r.cls) === "attack");
  const score = (t: number) => {
    const rej = legit.filter((r) => r.s >= t).length, acc = attacks.filter((r) => r.s < t).length;
    return { rej, acc, total: rej + acc };
  };
  // Best threshold: try a cut just above every measured value.
  const best = useMemo(() => {
    let b = { t: 0, ...score(0) };
    for (const r of rows) {
      const t = r.s + 1e-6, sc = score(t);
      if (sc.total < b.total) b = { t, ...sc };
    }
    return b;
  }, [rows]);

  const [th, setTh] = useState(0.15);
  const cur = score(th);
  const presets: [string, number][] = [["0.05 strict", 0.05], ["0.10", 0.1], ["0.15 common default", 0.15], ["0.30 lenient", 0.3]];

  return (
    <div className="panel">
      <div className="thgrid">
        <div>
          <div className="label">Acceptance threshold on the pooled mismatch rate</div>
          <input type="range" min={0} max={0.55} step={0.001} value={th} onChange={(e) => setTh(Number(e.target.value))} style={{ width: "100%", accentColor: C.i0 }} />
          <div className="mono" style={{ fontSize: 24 }}>threshold = {th.toFixed(3)}</div>
          <div className="tabs" style={{ marginTop: 10, marginBottom: 0 }}>
            {presets.map(([t, v]) => <button key={t} className={`btn ${Math.abs(th - v) < 1e-9 ? "on" : ""}`} style={{ padding: "5px 10px", fontSize: 13 }} onClick={() => setTh(v)}>{t}</button>)}
            <button className="btn primary" style={{ padding: "5px 10px", fontSize: 13 }} onClick={() => setTh(best.t)}>best possible →</button>
          </div>
        </div>
        <div className="thcount">
          <div className={cur.rej ? "bad" : "good"}><b>{cur.rej}<small>/{legit.length}</small></b><span>honest or noisy links <u>wrongly rejected</u></span></div>
          <div className={cur.acc ? "bad" : "good"}><b>{cur.acc}<small>/{attacks.length}</small></b><span>attacks <u>wrongly accepted</u></span></div>
        </div>
      </div>

      <div className="thverdict">
        Even the <b>best possible threshold</b> ({best.t.toFixed(3)}) still gets <b>{best.total}</b> condition{best.total === 1 ? "" : "s"} wrong
        ({best.rej} noisy link{best.rej === 1 ? "" : "s"} rejected, {best.acc} attack{best.acc === 1 ? "" : "s"} accepted). These are averages; single signatures scatter around them, so in practice the overlap is wider.
      </div>

      <ResponsiveContainer width="100%" height={rows.length * 24 + 40}>
        <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 30 }}>
          <XAxis type="number" domain={[0, 0.55]} stroke={C.g4} tickFormatter={(v) => v.toFixed(2)} />
          <YAxis type="category" dataKey="name" width={230} stroke={C.g4} tick={{ fontSize: 12 }} interval={0} />
          <Tooltip cursor={{ fill: C.g2 }} contentStyle={{ background: C.g1, border: `1px solid ${C.g4}` }}
            labelStyle={{ color: C.i0 }} itemStyle={{ color: C.i1 }} formatter={(v: number) => v.toFixed(4)} />
          <Bar dataKey="s" name="mean pooled mismatch" isAnimationActive={false}>
            {rows.map((r) => <Cell key={r.key} fill={kindColor(r.cls)} fillOpacity={r.s < th ? 1 : 0.3} />)}
          </Bar>
          <ReferenceLine x={th} stroke={C.i0} strokeWidth={2} label={{ value: "threshold", fill: C.i0, position: "top", fontSize: 12 }} />
        </BarChart>
      </ResponsiveContainer>
      <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
        Mean pooled mismatch per condition, {data.manifest.n_profile_runs} seeded runs each. Solid = accepted at this threshold, faded = rejected.
        <span style={{ color: C.secure }}> ■ honest</span><span style={{ color: C.Z }}> ■ noise</span><span style={{ color: C.breach }}> ■ attack</span>
      </div>
    </div>
  );
}
