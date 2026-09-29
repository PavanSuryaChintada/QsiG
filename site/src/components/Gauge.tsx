import { C } from "../lib";

/** Semicircular CHSH gauge, 0..3, with classical (2), secure threshold and Tsirelson (2√2) marks. */
export function Gauge({ S, sigma, secureMin, tsirelson }: { S: number; sigma: number; secureMin: number; tsirelson: number }) {
  const R = 110, cx = 140, cy = 130, max = 3;
  const ang = (v: number) => Math.PI * (1 - Math.min(Math.max(v, 0), max) / max);
  const pt = (v: number, r = R) => [cx + r * Math.cos(ang(v)), cy - r * Math.sin(ang(v))];
  const arc = (a: number, b: number) => {
    const [x1, y1] = pt(a), [x2, y2] = pt(b);
    return `M${x1},${y1} A${R},${R} 0 0 1 ${x2},${y2}`;
  };
  const col = S > secureMin ? C.secure : S > 2 ? C.warn : C.breach;
  const deg = (Math.min(Math.max(S, 0), max) / max) * 180 - 90;
  const mark = (v: number, text: string, c: string) => {
    const [x1, y1] = pt(v, R - 14), [x2, y2] = pt(v, R + 8), [tx, ty] = pt(v, R + 22);
    return <g key={text}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="2" /><text x={tx} y={ty} fill={c} fontSize="11" textAnchor="middle">{text}</text></g>;
  };
  return (
    <svg viewBox="0 0 280 160" width="100%" style={{ maxWidth: 340 }}>
      <path d={arc(0, 2)} stroke={C.breach} strokeOpacity=".35" strokeWidth="14" fill="none" />
      <path d={arc(2, secureMin)} stroke={C.warn} strokeOpacity=".35" strokeWidth="14" fill="none" />
      <path d={arc(secureMin, max)} stroke={C.secure} strokeOpacity=".35" strokeWidth="14" fill="none" />
      {mark(2, "2", C.i2)}
      {mark(secureMin, String(secureMin), C.warn)}
      {mark(tsirelson, "2√2", C.i0)}
      <g style={{ transform: `rotate(${deg}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: "transform .9s cubic-bezier(.2,.8,.2,1)" }}>
        <line x1={cx} y1={cy} x2={cx} y2={cy - R + 8} stroke={col} strokeWidth="4" />
      </g>
      <circle cx={cx} cy={cy} r="7" fill={col} />
      <text x={cx} y={cy + 26} textAnchor="middle" fill={C.i0} fontSize="16" fontFamily="IBM Plex Mono">S = {S.toFixed(3)} ± {sigma.toFixed(3)}</text>
    </svg>
  );
}
