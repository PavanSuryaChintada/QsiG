import { Bar, BarChart, Cell, ErrorBar, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { C, Data, label } from "../lib";

export function ChshChart({ data }: { data: Data }) {
  const rows = Object.entries<any>(data.chsh).map(([k, c]) => ({ key: k, name: label(k), S: c.S, sigma: c.sigma }));
  const col = (S: number) => (S > data.chsh_secure_min ? C.secure : S > 2 ? C.warn : C.breach);
  const n = (Object.values(data.chsh)[0] as any).n_rounds;
  return (
    <div className="panel">
      <ResponsiveContainer width="100%" height={rows.length * 26 + 50}>
        <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 40, top: 20 }}>
          <XAxis type="number" domain={[0, 3]} stroke={C.g4} ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3]} />
          <YAxis type="category" dataKey="name" width={230} stroke={C.g4} tick={{ fontSize: 12 }} interval={0} />
          <Tooltip cursor={{ fill: C.g2 }} contentStyle={{ background: C.g1, border: `1px solid ${C.g3}` }}
            formatter={(v: number, _n, p: any) => `${v.toFixed(3)} ± ${p.payload.sigma.toFixed(3)}`} />
          <Bar dataKey="S" name="CHSH S">
            {rows.map((r) => <Cell key={r.key} fill={col(r.S)} />)}
            <ErrorBar dataKey="sigma" direction="x" stroke={C.i1} width={4} />
          </Bar>
          <ReferenceLine x={2} stroke={C.i2} strokeDasharray="3 3" label={{ value: "2 classical", position: "top", fill: C.i2, fontSize: 11 }} />
          <ReferenceLine x={data.chsh_secure_min} stroke={C.warn} strokeDasharray="5 3" label={{ value: `${data.chsh_secure_min}`, position: "top", fill: C.warn, fontSize: 11 }} />
          <ReferenceLine x={data.tsirelson} stroke={C.i0} label={{ value: "2√2", position: "top", fill: C.i0, fontSize: 11 }} />
        </BarChart>
      </ResponsiveContainer>
      <div className="muted" style={{ fontSize: 13 }}>{n} Bell-test rounds per condition, S ± σ. Green = secure, amber = partial entanglement, red = none.</div>
    </div>
  );
}
