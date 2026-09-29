import { C } from "../lib";

/** Three bars e_X, e_Y, e_Z. Scale fixed at 0..0.6 so fingerprints are comparable. */
export function BasisBars({ e, height = 110, max = 0.6 }: { e: Record<string, number>; height?: number; max?: number }) {
  return (
    <div>
      <div className="bars" style={{ height }}>
        {(["X", "Y", "Z"] as const).map((b) => (
          <div key={b}>
            <small>{e[b].toFixed(3)}</small>
            <i style={{ height: `${Math.max((e[b] / max) * 100, 0.8)}%`, background: C[b] }} />
          </div>
        ))}
      </div>
      <div className="blabels"><span>X</span><span>Y</span><span>Z</span></div>
    </div>
  );
}
