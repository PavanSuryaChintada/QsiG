import { Data, kind, label } from "../lib";
import { BasisBars } from "./BasisBars";

/** Measured mean fingerprint of every condition at its strongest strength. */
export function FingerprintGallery({ data }: { data: Data }) {
  const strongest: Record<string, [string, any]> = {};
  for (const [k, p] of Object.entries<any>(data.profiles)) {
    const cur = strongest[p.condition];
    if (!cur || p.strength > cur[1].strength) strongest[p.condition] = [k, p];
  }
  const groups = [
    { title: "Honest and noise: errors spread across bases", items: Object.values(strongest).filter(([, p]) => kind(p.condition) !== "attack") },
    { title: "Attacks: errors have a shape", items: Object.values(strongest).filter(([, p]) => kind(p.condition) === "attack") },
  ];
  return (
    <div>
      {groups.map((g) => (
        <div key={g.title} style={{ marginBottom: 18 }}>
          <div className="label">{g.title}</div>
          <div className="grid4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {g.items.map(([k, p]) => (
              <div key={k} className="panel" style={{ padding: 14 }}>
                <div style={{ fontSize: 14, marginBottom: 8, minHeight: 42 }}>{label(k)}</div>
                <BasisBars e={p.mean} height={80} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="muted" style={{ fontSize: 13 }}>Mean per-basis error rate from {data.manifest.n_profile_runs} seeded runs per condition. These are the reference profiles the χ² test compares against.</div>
    </div>
  );
}
