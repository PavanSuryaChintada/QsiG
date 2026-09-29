# FRONTEND GUIDE — building the site

Concrete implementation. Read `docs/SITE_SPEC.md` for *what* to build, `docs/DESIGN.md` for the tokens, `docs/DATA_CONTRACT.md` for the JSON shapes. This file is *how*.

**Time budget: 90 minutes.** Build in the order below and stop where the clock runs out.

---

## 0 · Setup — 10 minutes

```bash
npm create vite@latest site -- --template react-ts
cd site
npm install
npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
npm install recharts katex react-katex
```

`src/styles/tokens.css` — paste the colour block from `docs/DESIGN.md` §3 verbatim. Do not retype the hex values.

```css
@tailwind base; @tailwind components; @tailwind utilities;

:root { /* tokens from DESIGN.md §3 */ }

* { border-radius: 0 !important; }        /* enforces the ban list */
body { background: var(--ground-000); color: var(--ink-100); }
.mono { font-family: "IBM Plex Mono", monospace; font-variant-numeric: tabular-nums; }
```

That `border-radius: 0 !important` line saves you from every rounded-corner violation for free.

**Fonts:** IBM Plex Sans, Plex Sans Condensed, Plex Mono from Google Fonts. One `<link>` in `index.html`.

---

## 1 · Data loading — 10 minutes

Everything is static JSON. No API, no state library.

```tsx
// src/lib/data.ts
export async function loadJSON<T>(name: string): Promise<T | null> {
  try {
    const r = await fetch(`/data/${name}.json`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

export function useData<T>(name: string) {
  const [data, setData] = useState<T | null>(null);
  const [state, setState] = useState<"loading"|"ready"|"missing">("loading");
  useEffect(() => {
    loadJSON<T>(name).then(d => {
      setData(d); setState(d ? "ready" : "missing");
    });
  }, [name]);
  return { data, state };
}
```

**A missing file renders "not yet generated".** Never a placeholder number. `SITE_SPEC.md` §1.

---

## 2 · `SeedBadge` — build this second, use it everywhere

```tsx
export function SeedBadge({ seed, generatedAt, n, fixture }: Props) {
  return (
    <div className="mono text-[10px] text-[var(--ink-300)] mt-2 flex gap-3">
      {fixture && <span className="text-[var(--v-warn)]">FIXTURE DATA</span>}
      <span>seed {seed}</span>
      {n && <span>n={n}</span>}
      <span>{new Date(generatedAt).toISOString().slice(0,16)}Z</span>
    </div>
  );
}
```

**Every figure gets one. No exceptions.** Build it before any chart so you cannot forget.

The `FIXTURE DATA` flag makes it impossible to accidentally present fake numbers, and impossible to forget to remove them.

---

## 3 · `CHSHGauge` — the signature component, 20 minutes

The most important visual in the project. Build it as an SVG, not a chart library.

```tsx
export function CHSHGauge({ S, sigma, secureMin = 2.40 }: Props) {
  const TSIRELSON = 2.8284271247461903;
  const MIN = 1.8, MAX = 2.9;
  const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;

  const secure = S - 2 * sigma > secureMin;
  const violates = S - 2 * sigma > 2.0;
  const colour = secure ? "var(--v-secure)"
               : violates ? "var(--v-warn)" : "var(--v-breach)";

  return (
    <div>
      <div className="relative h-12 bg-[var(--ground-200)]">
        {/* classical region, hatched */}
        <div className="absolute inset-y-0 left-0 opacity-30"
             style={{ width: `${pct(2.0)}%`,
                      backgroundImage:
                        "repeating-linear-gradient(45deg,transparent,transparent 3px,var(--ink-300) 3px,var(--ink-300) 4px)" }} />
        {/* the bar */}
        <div className="absolute inset-y-0 left-0"
             style={{ width: `${pct(S)}%`, background: colour,
                      transition: "width 200ms ease-out" }} />
        {/* Tsirelson — a hard ceiling, must read as a wall */}
        <div className="absolute inset-y-0 w-[2px] bg-[var(--ink-000)]"
             style={{ left: `${pct(TSIRELSON)}%` }} />
        {/* security threshold */}
        <div className="absolute inset-y-0 w-[1px] bg-[var(--ink-300)]"
             style={{ left: `${pct(secureMin)}%` }} />
      </div>

      <div className="flex justify-between mono text-[10px] text-[var(--ink-300)] mt-1">
        <span>2.0 classical</span>
        <span>{secureMin} secure</span>
        <span>2.828 Tsirelson</span>
      </div>

      <div className="mono text-2xl mt-3" style={{ color: colour }}>
        S = {S.toFixed(3)} ± {sigma.toFixed(3)}
        <span className="text-sm ml-3">
          {secure ? "SECURE" : violates ? "DEGRADED" : "COMPROMISED"}
        </span>
      </div>
    </div>
  );
}
```

**Three things that matter here.** Tsirelson must read as a wall, not a tick. Show `S ± σ` always, never a bare value. The verdict word sits beside the colour — never colour alone.

**The hatched region is the only exception to the gradient ban** — it is a hatch pattern, not a colour fade, and it marks the physically classical zone. Say so in a code comment so nobody "fixes" it.

---

## 4 · `BasisBars` — the differentiator visual, 15 minutes

```tsx
export function BasisBars({ eX, eY, eZ }: Props) {
  const MAX = 0.5;   // FIXED. Never autoscale. See below.
  const bars = [
    { label: "X", value: eX, colour: "var(--basis-x)" },
    { label: "Y", value: eY, colour: "var(--basis-y)" },
    { label: "Z", value: eZ, colour: "var(--basis-z)" },
  ];
  return (
    <div className="space-y-2">
      {bars.map(b => (
        <div key={b.label} className="flex items-center gap-3">
          <span className="mono text-sm w-4">{b.label}</span>
          <div className="flex-1 h-6 bg-[var(--ground-200)] relative">
            <div className="absolute inset-y-0 left-0"
                 style={{ width: `${(b.value / MAX) * 100}%`,
                          background: b.colour,
                          transition: "width 200ms ease-out" }} />
          </div>
          <span className="mono text-sm w-14 text-right">{b.value.toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
}
```

> **`MAX` is fixed at 0.5 and must never autoscale.**
>
> The entire demonstration is that under a Z-basis attack, two bars rise and one stays flat. If the axis rescales between frames the reader cannot see it, and the differentiator is invisible. This is the single most important line in the frontend.

---

## 5 · `ConfusionMatrix` — 15 minutes

Do **not** use a charting library. A styled HTML table is clearer and faster to build.

```tsx
export function ConfusionMatrix({ data }: Props) {
  const max = Math.max(...data.rows.flatMap(r => Object.values(r.counts)));
  return (
    <table className="mono text-[11px] border-collapse">
      <thead>
        <tr>
          <th className="text-left p-1 text-[var(--ink-300)]">true \ predicted</th>
          {data.labels.map(l => (
            <th key={l} className="p-1 text-[var(--ink-300)] font-normal
                                   [writing-mode:vertical-rl] rotate-180">{l}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map(row => (
          <tr key={row.true_label}>
            <td className="p-1 text-[var(--ink-100)] whitespace-nowrap">
              {row.true_label}
            </td>
            {data.labels.map(l => {
              const c = row.counts[l] ?? 0;
              const diag = l === row.true_label;
              return (
                <td key={l} className="p-1 text-center w-9"
                    style={{
                      background: c ? `rgba(239,234,224,${0.08 + 0.55*(c/max)})` : "transparent",
                      borderLeft: diag ? "2px solid var(--ink-000)" : undefined,
                      color: c > max*0.5 ? "var(--ground-000)" : "var(--ink-100)",
                    }}>
                  {c || ""}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Greyscale intensity, not a rainbow colourmap.** Rainbow maps imply ordering that isn't there and read as unserious.

**The INCONCLUSIVE column is always shown.** Never hidden to make the diagonal look cleaner.

---

## 6 · `SPRTTrace` — 10 minutes

Recharts `LineChart` with two `ReferenceLine` boundaries.

```tsx
<LineChart data={trace.llr.map((v,i) => ({ round: i, llr: v }))}>
  <XAxis dataKey="round" stroke="var(--ink-300)" tick={{fontSize:10}} />
  <YAxis stroke="var(--ink-300)" tick={{fontSize:10}} />
  <ReferenceLine y={upper} stroke="var(--ink-300)" strokeDasharray="3 3"
                 label={{ value:"attack", fontSize:10, fill:"var(--ink-300)" }} />
  <ReferenceLine y={lower} stroke="var(--ink-300)" strokeDasharray="3 3" />
  <ReferenceLine x={decidedAt} stroke="var(--v-breach)" />
  <Line dataKey="llr" stroke="var(--ink-000)" dot={false} isAnimationActive={false} />
</LineChart>
```

**`isAnimationActive={false}` on every chart in the project.** `DESIGN.md` §6 — data appears, it does not perform. Animation on load also makes screen recording for the video harder.

**Downsample `llr` to ≤500 points** before it reaches the chart. `DATA_CONTRACT.md` §4.

---

## 7 · Live console — 20 minutes, build the transition first

This is not live computation. It replays a recorded run.

```tsx
const [scenario, setScenario] = useState<"depolarising"|"intercept_z">("depolarising");
const [round, setRound] = useState(0);
const [playing, setPlaying] = useState(false);

useEffect(() => {
  if (!playing) return;
  const t = setInterval(() => setRound(r => Math.min(r + 1, MAX_ROUND)), 400);
  return () => clearInterval(t);
}, [playing]);
```

**Header badge, always visible:**

```tsx
<span className="mono text-[10px] text-[var(--v-warn)]">
  REPLAY OF RECORDED RUN · seed {seed}
</span>
```

**Never presented as live computation.** Labelled at all times.

**Build the scenario toggle before anything else on this page.** Switching depolarising → intercept_z must show, in one frame: three equal bars become two-high-one-flat, and the CHSH needle drops. That transition is the site's entire payload and it carries the 1:10 and 1:35 marks in the video.

Layout top to bottom: CHSH gauge → basis bars → posterior → SPRT trace. Controls in a right rail.

---

## 8 · Pages — priority order

| | Page | Minutes | Cut? |
|---|---|---|---|
| 1 | **Results** — every figure from JSON | 15 | never |
| 2 | **Live console** | 20 | never |
| 3 | **Home** — the argument | 10 | never |
| 4 | **Limits** — confusable pairs, assumptions | 10 | never |
| 5 | Method — how each instrument works | 15 | cut if needed |
| 6 | Reproduce — the commands | 5 | cut if needed |

**Limits is not cuttable.** It is the page that makes the rest believable — the same move as reporting a benchmark where you lose.

Routing: `react-router-dom`, or a simple `useState` tab switch. **Do not install a router if a tab switch will do** — you have 90 minutes.

---

## 9 · Deploy

```bash
npm run build
npx vercel --prod
```

**Deploy an empty page in the first 10 minutes.** Discovering a build failure at hour 7 is how projects die. Push after every page.

---

## 10 · Checklist before freeze

```
[ ] Every figure has a SeedBadge
[ ] No FIXTURE DATA banner anywhere
[ ] BasisBars axis is fixed at 0–0.5, verified by switching scenarios
[ ] CHSH gauge shows S ± sigma, Tsirelson reads as a wall
[ ] INCONCLUSIVE column present in the confusion matrix
[ ] known_confusions rendered on the Limits page
[ ] Posterior chart shows its prior
[ ] Every number traceable to results/ — grep the slides against the JSON
[ ] No gradients (except the documented CHSH hatch), no radius, no emoji
[ ] isAnimationActive={false} on every chart
[ ] Console labelled REPLAY OF RECORDED RUN
[ ] Deployed and loading on a phone as well as desktop
```

---

## 11 · If the site fights you

**Ship the matplotlib figures in a PDF and move on.**

The figures are the deliverable. The site is packaging. `WORKFLOW.md` cut order puts the site at position 8 of 10 for exactly this reason — losing it costs you polish, not the argument.
