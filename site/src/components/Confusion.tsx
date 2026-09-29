import { Data, name } from "../lib";

export function Confusion({ data }: { data: Data }) {
  const c = data.confusion;
  return (
    <div className="panel scroll">
      <table style={{ fontSize: 12, minWidth: 900 }}>
        <thead>
          <tr>
            <th>true ↓ · attributed →</th>
            {c.columns.map((x: string) => <th key={x} style={{ textAlign: "center", writingMode: "vertical-rl", transform: "rotate(180deg)", height: 150 }}>{name(x)}</th>)}
            <th style={{ textAlign: "center" }}>accuracy</th>
          </tr>
        </thead>
        <tbody>
          {c.classes.map((r: string) => {
            const tot = Object.values<number>(c.matrix[r]).reduce((a, b) => a + b, 0);
            return (
              <tr key={r}>
                <td style={{ background: "var(--g1)", color: "var(--i1)", whiteSpace: "nowrap" }}>{name(r)}</td>
                {c.columns.map((col: string) => {
                  const f = c.matrix[r][col] / tot;
                  const rgb = col === r ? "62,124,90" : col === "INCONCLUSIVE" ? "154,118,12" : "180,45,26";
                  return <td key={col} className="mono" style={{ textAlign: "center", background: f ? `rgba(${rgb},${0.2 + f * 0.8})` : undefined }}>{f ? f.toFixed(2) : "·"}</td>;
                })}
                <td className="mono" style={{ textAlign: "center" }}>{(c.accuracy[r] * 100).toFixed(0)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
