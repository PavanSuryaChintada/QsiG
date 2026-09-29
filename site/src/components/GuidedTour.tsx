import { useEffect, useState } from "react";
import { C, Data, label, name } from "../lib";
import { BasisBars } from "./BasisBars";
import { Gauge } from "./Gauge";
import { CodeBlock } from "./CodeBlock";
import { snippet } from "../code";

const SCENARIOS = [
  ["honest@0.0", "Clean channel"],
  ["depolarising@0.15", "Noisy fibre"],
  ["intercept_Z@1.0", "Eve · Z-basis"],
  ["intercept_random@1.0", "Eve · random basis"],
] as const;

/* ---------- step visuals ---------- */

function KeyVisual() {
  // Illustration of a key: deterministic pattern, not a result.
  const states = [["|0⟩", "Z"], ["|1⟩", "Z"], ["|+⟩", "X"], ["|−⟩", "X"], ["|+i⟩", "Y"], ["|−i⟩", "Y"]];
  let s = 7;
  const cells = Array.from({ length: 48 }, () => ((s = (s * 1103515245 + 12345) % 2147483648), states[s % 6]));
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 4 }}>
        {cells.map(([st, b], i) => (
          <div key={i} className="mono" style={{ background: C.g2, borderBottom: `3px solid ${C[b as "X"]}`, textAlign: "center", fontSize: 12, padding: "6px 0", animation: `fadein .4s ${i * 0.02}s both` }}>{st}</div>
        ))}
      </div>
      <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        Illustration: the first 48 of 256 positions. Underline = basis <span style={{ color: C.X }}>X</span> · <span style={{ color: C.Y }}>Y</span> · <span style={{ color: C.Z }}>Z</span>. The basis label is stored with every position.
      </div>
    </div>
  );
}

function CircuitVisual({ attack }: { attack: string }) {
  const wire = (y: number, t: string) => <g><text x="8" y={y + 4} fill={C.i1} fontSize="13">{t}</text><line x1="60" y1={y} x2="700" y2={y} stroke={C.g4} /></g>;
  const gate = (x: number, y: number, t: string, c = C.i0) => <g><rect x={x - 16} y={y - 14} width="32" height="28" fill={C.g2} stroke={c} /><text x={x} y={y + 5} textAnchor="middle" fill={c} fontSize="13">{t}</text></g>;
  const cx = (x: number, y1: number, y2: number) => <g><line x1={x} y1={y1} x2={x} y2={y2} stroke={C.i0} /><circle cx={x} cy={y1} r="5" fill={C.i0} /><circle cx={x} cy={y2} r="11" fill="none" stroke={C.i0} /><line x1={x - 11} y1={y2} x2={x + 11} y2={y2} stroke={C.i0} /><line x1={x} y1={y2 - 11} x2={x} y2={y2 + 11} stroke={C.i0} /></g>;
  const meas = (x: number, y: number) => <g><rect x={x - 16} y={y - 14} width="32" height="28" fill={C.g2} stroke={C.i1} /><path d={`M${x - 10},${y + 6} A10,10 0 0 1 ${x + 10},${y + 6}`} fill="none" stroke={C.i1} /><line x1={x} y1={y + 6} x2={x + 8} y2={y - 8} stroke={C.i1} /></g>;
  const eve = attack.startsWith("intercept"), noise = !eve && attack !== "honest";
  return (
    <svg viewBox="0 0 720 230" width="100%">
      {wire(50, "q0 |ψ⟩")}{wire(115, "q1 Alice")}{wire(180, "q2 → Bob")}
      {gate(100, 50, "ψ", C.X)}
      {gate(160, 115, "H")}{cx(220, 115, 180)}
      <rect x="270" y="160" width="130" height="40" fill={C.g1} stroke={eve ? C.breach : noise ? C.Z : C.g4} strokeDasharray="4 3" className={eve || noise ? "pulse" : ""} />
      <text x="335" y="185" textAnchor="middle" fill={eve ? "var(--bad)" : noise ? C.Z : C.i3} fontSize="12">{eve ? "Eve measures + resends" : noise ? "channel noise" : "clean channel"}</text>
      {cx(450, 50, 115)}{gate(510, 50, "H")}
      {meas(570, 50)}{meas(570, 115)}
      <path d="M570,64 L570,150 L630,150 L630,166" stroke={C.i2} strokeDasharray="3 3" fill="none" />
      <text x="585" y="143" fill={C.i2} fontSize="11">b₀ b₁ → Pauli correction</text>
      {meas(660, 180)}
      <text x="660" y="215" textAnchor="middle" fill={C.i2} fontSize="11">declared basis</text>
    </svg>
  );
}

function ChannelVisual({ attack }: { attack: string }) {
  const eve = attack.startsWith("intercept"), noise = !eve && attack !== "honest";
  const path = noise ? "M90,90 Q130,60 170,90 T250,90 T330,90 T410,90 T490,90 T570,90" : "M90,90 L570,90";
  return (
    <svg viewBox="0 0 660 190" width="100%">
      <rect x="10" y="60" width="80" height="60" fill={C.g2} stroke={C.g4} /><text x="50" y="95" textAnchor="middle" fill={C.i0} fontSize="14">Alice</text>
      <rect x="570" y="60" width="80" height="60" fill={C.g2} stroke={C.g4} /><text x="610" y="95" textAnchor="middle" fill={C.i0} fontSize="14">Bob</text>
      <path d={path} fill="none" stroke={noise ? C.Z : C.g4} strokeWidth="2" className="flowline" />
      {eve && <g><line x1="330" y1="90" x2="330" y2="140" stroke={C.breach} strokeDasharray="3 3" /><rect x="275" y="140" width="110" height="36" fill={C.g2} stroke={C.breach} /><text x="330" y="163" textAnchor="middle" fill="var(--bad)" fontSize="13">Eve {attack.includes("random") ? "· random" : "· Z basis"}</text></g>}
      {[0, 0.6, 1.2].map((d) => (
        <circle key={`${attack}${d}`} r="7" fill={C.i0}>
          <animateMotion dur="2.4s" begin={`${d}s`} repeatCount="indefinite" path={path} />
          {eve && <animate attributeName="fill" values={`${C.i0};${C.i0};${C.breach};${C.breach}`} keyTimes="0;0.5;0.52;1" dur="2.4s" begin={`${d}s`} repeatCount="indefinite" />}
        </circle>
      ))}
      <text x="330" y="40" textAnchor="middle" fill={C.i2} fontSize="12">{eve ? "each qubit is measured and re-sent: its state collapses" : noise ? "depolarising noise p = 0.15 randomises some qubits" : "nothing touches the qubits"}</text>
    </svg>
  );
}

function closestProfile(data: Data, cls: string, e: Record<string, number>) {
  let best: any = null, bd = Infinity;
  for (const p of Object.values<any>(data.profiles)) {
    if (p.condition !== cls) continue;
    const d = ["X", "Y", "Z"].reduce((a, b) => a + (p.mean[b] - e[b]) ** 2, 0);
    if (d < bd) (bd = d), (best = p);
  }
  return best;
}

/* ---------- the tour ---------- */

export function GuidedTour({ data }: { data: Data }) {
  const [i, setI] = useState(0);
  const [sc, setSc] = useState<string>(SCENARIOS[2][0]);
  const v = data.verdicts[sc];
  const fp = v.instruments.fingerprint, ch = v.instruments.chsh;
  const attack = sc.split("@")[0];
  const bestP = closestProfile(data, fp.best, fp.e);
  const runP = fp.runner_up ? closestProfile(data, fp.runner_up, fp.e) : null;
  const m = data.manifest;

  const steps = [
    { t: "Alice creates a quantum key", d: "For each of 256 positions Alice picks one of six quantum states, two per basis. Publishing the list of states later is the signature.",
      ours: "We store the basis of every position. Every instrument later sorts errors by basis.", viz: <KeyVisual /> },
    { t: "The key is teleported", d: "Each state is teleported over an entangled Bell pair. Alice's measurement results are sent as two classical bits and Bob applies a correction.",
      ours: "We simulate the full 3-qubit Qiskit circuit, not a shortcut. The dashed box on Bob's wire is where reality intervenes.", viz: <CircuitVisual attack={attack} /> },
    { t: "The qubit crosses the channel", d: "The travelling qubit is exposed. It may meet fibre noise, or an eavesdropper who measures it and sends it on.",
      ours: "Noise and Eve act only on the travelling qubit, exactly as in a real link. Eve is a real mid-circuit measurement, not a formula.", viz: <ChannelVisual attack={attack} /> },
    { t: "Bob counts errors, per basis", d: "Bob measures each qubit in the basis Alice published and counts disagreements.",
      ours: "Everyone else adds these into one number. We keep three, and the shape of those three bars is the evidence.",
      viz: <div><div className="label">Measured error rate per basis · {label(sc)} · 10-signature session</div><BasisBars e={fp.e} height={170} /></div> },
    { t: "Instrument 1: is the entanglement intact?", d: "A CHSH Bell test runs on the same channel. S above 2 is only possible with real entanglement. An eavesdropper cannot learn anything without lowering S.",
      ours: "This is a physical law, not a threshold we picked. It catches even the random-basis attacker, whose fingerprint looks like noise.",
      viz: <div style={{ display: "flex", justifyContent: "center" }}><Gauge S={ch.S} sigma={ch.sigma} secureMin={data.chsh_secure_min} tsirelson={data.tsirelson} /></div> },
    { t: "Instrument 2: what caused the errors?", d: "The measured bars are compared with reference profiles, each one measured by simulating that cause. A χ² test ranks the candidates.",
      ours: "Reference profiles are measured, never hardcoded. We report the runner-up too, and say INCONCLUSIVE when the two are too close.",
      viz: (
        <div className="grid3" style={{ gap: 10 }}>
          <div><div className="label">Observed</div><BasisBars e={fp.e} height={120} /></div>
          <div><div className="label" style={{ color: "var(--ok)" }}>Best: {name(fp.best)} · p={fp.best_p.toFixed(3)}</div>{bestP && <BasisBars e={bestP.mean} height={120} />}</div>
          <div><div className="label">Runner-up: {fp.runner_up ? name(fp.runner_up) : "—"}{fp.runner_up_p != null ? ` · p=${fp.runner_up_p.toFixed(3)}` : ""}</div>{runP && <BasisBars e={runP.mean} height={120} />}</div>
        </div>
      ) },
    { t: "The verdict, with reasons", d: "The engine combines the instruments. Any one of them can veto. Every verdict carries its reasons.",
      ours: "Three outcomes, not two: ACCEPT, REJECT, or INCONCLUSIVE. An honest 'we can't tell' beats a confident guess.",
      viz: (
        <div>
          <span className={`verdict ${v.decision}`} style={{ fontSize: 30 }}>{v.decision}</span>
          <span style={{ marginLeft: 14, fontSize: 18 }}>cause: {fp.verdict === "INCONCLUSIVE" ? "inconclusive" : name(fp.verdict)}</span>
          <ul style={{ marginTop: 16, paddingLeft: 18, color: "var(--i1)" }}>{v.reasons.map((r: string) => <li key={r}>{r}</li>)}</ul>
        </div>
      ) },
    { t: "Anyone can reproduce it", d: "Every number on this page came from one seeded run. Run one command and you get identical numbers, with an identical hash.",
      ours: "No number on this site was typed by hand. Release-gate tests guard the physics, including the Tsirelson bound.",
      viz: (
        <div className="mono" style={{ background: C.g2, padding: 16, fontSize: 14, lineHeight: 1.9 }}>
          <div style={{ color: C.i2 }}>$ python -m experiments.run_all</div>
          <div>seed {m.seed} · {Object.keys(data.chsh).length} conditions · {m.n_profile_runs} runs each</div>
          <div>qiskit {m.qiskit} · qiskit-aer {m.qiskit_aer}</div>
          <div style={{ color: "var(--ok)" }}>results sha256 {m.results_sha256.slice(0, 24)}…</div>
        </div>
      ) },
  ];
  const CODE = ["keys", "teleport", "intercept", "verify", "chsh", "attribute", "engine", "repro"];
  const [showCode, setShowCode] = useState(false);
  useEffect(() => setShowCode(false), [i]);
  const s = steps[i];
  const last = steps.length - 1;

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const el = document.getElementById("tour");
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.6 || r.bottom < 100) return;
      if (e.key === "ArrowRight") setI((x) => Math.min(x + 1, last));
      if (e.key === "ArrowLeft") setI((x) => Math.max(x - 1, 0));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [last]);

  return (
    <div className="panel" style={{ padding: 0 }}>
      <div style={{ display: "flex", gap: 4, padding: "14px 20px 0" }}>
        {steps.map((st, j) => (
          <button key={j} onClick={() => setI(j)} title={st.t} aria-label={`Step ${j + 1}: ${st.t}`}
            style={{ flex: 1, height: 6, border: "none", cursor: "pointer", background: j <= i ? C.i0 : C.g3, transition: "background .3s" }} />
        ))}
      </div>
      <div style={{ padding: "14px 20px 0", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <span className="muted" style={{ fontSize: 13, marginRight: 6 }}>Scenario:</span>
        {SCENARIOS.map(([k, t]) => <button key={k} className={`btn ${sc === k ? "on" : ""}`} style={{ padding: "5px 10px", fontSize: 13 }} onClick={() => setSc(k)}>{t}</button>)}
      </div>
      <div className="tourbody" key={i}>
        <div>
          <div className="mono muted" style={{ fontSize: 13 }}>STEP {i + 1} OF {steps.length}</div>
          <h3 style={{ fontSize: 26, margin: "6px 0 12px" }}>{s.t}</h3>
          <p className="dim" style={{ fontSize: 16 }}>{s.d}</p>
          <div className="ours" style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.g3}`, color: "var(--ok)" }}>
            <div className="label" style={{ color: "var(--ok)", marginBottom: 4 }}>What we do differently</div>{s.ours}
          </div>
          <button className="btn codebtn" onClick={() => setShowCode(!showCode)}>{showCode ? "Hide the code" : "</> Show the real code for this step"}</button>
        </div>
        <div className="tourviz">{s.viz}</div>
      </div>
      {showCode && <div style={{ padding: "0 20px 18px", animation: "fadein .35s ease both" }}><CodeBlock s={snippet(CODE[i])} maxHeight={340} /></div>}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px 20px", gap: 10 }}>
        <button className="btn" disabled={i === 0} style={{ opacity: i === 0 ? 0.4 : 1 }} onClick={() => setI(i - 1)}>← Back</button>
        <span className="muted" style={{ fontSize: 12, alignSelf: "center" }}>use ← → keys</span>
        <button className="btn primary" onClick={() => setI(i === last ? 0 : i + 1)}>{i === last ? "↺ Start again" : "Next →"}</button>
      </div>
    </div>
  );
}
