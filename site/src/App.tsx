import { ReactNode, useEffect, useState } from "react";
import { C, Data, useData, useReveal } from "./lib";
import { Architecture } from "./components/Architecture";
import { BasisBars } from "./components/BasisBars";
import { ChshChart } from "./components/ChshChart";
import { Confusion } from "./components/Confusion";
import { FingerprintGallery } from "./components/FingerprintGallery";
import { LiveDemo } from "./components/LiveDemo";
import { GuidedTour } from "./components/GuidedTour";
import { ThresholdExplorer } from "./components/ThresholdExplorer";
import { PsApproach } from "./components/PsApproach";
import { UnderTheHood } from "./components/UnderTheHood";

const NAV = [
  ["ps", "Problem & approach"], ["problem", "The dilemma"], ["existing", "Comparison"], ["how", "Step by step"],
  ["idea", "Key idea"], ["arch", "Architecture"], ["code", "Code"], ["demo", "Live results"], ["limits", "Limits"], ["stack", "Tech stack"],
];

type Variant = "plain" | "band" | "center" | "split" | "accent" | "light";

function Section({ id, n, title, sub, children, v = "plain", acc = "var(--brand)", light = false }: { id: string; n: string; title: string; sub?: ReactNode; children: ReactNode; v?: Variant; acc?: string; light?: boolean }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section id={id} ref={ref} className={`reveal v-${v} ${light ? "light" : ""}`} style={{ ["--acc" as any]: acc }}>
      <div className="shead">
        <div className="ghost" aria-hidden>{n.slice(0, 2)}</div>
        <div className="step">{n}</div>
        <h2>{title}</h2>
        {sub && <p className="sub" style={{ marginBottom: 0 }}>{sub}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Nav() {
  const [on, setOn] = useState("");
  useEffect(() => {
    const f = () => {
      let cur = "";
      for (const [id] of NAV) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < 140) cur = id; }
      setOn(cur);
    };
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <nav className="top"><div>
      <b>QSIG</b>
      {NAV.map(([id, t]) => <a key={id} href={`#${id}`} className={on === id ? "on" : ""}>{t}</a>)}
    </div></nav>
  );
}

function HeroVisual() {
  return (
    <svg viewBox="0 0 420 300" width="100%" role="img" aria-label="Same error rate, two opposite causes">
      <rect x="130" y="10" width="160" height="70" fill={C.g2} stroke={C.i0} />
      <text x="210" y="42" textAnchor="middle" fill={C.i0} fontSize="30" fontFamily="IBM Plex Mono">9%</text>
      <text x="210" y="66" textAnchor="middle" fill={C.i2} fontSize="12">mismatch rate</text>
      <path d="M170,80 L90,160" stroke={C.g4} strokeWidth="2" className="flowline" />
      <path d="M250,80 L330,160" stroke={C.g4} strokeWidth="2" className="flowline" />
      <text x="210" y="140" textAnchor="middle" fill={C.i0} fontSize="40" className="pulse">?</text>
      <rect x="10" y="160" width="170" height="120" fill={C.g1} stroke={C.Z} />
      <text x="95" y="188" textAnchor="middle" fill={C.i0} fontSize="15" fontWeight="600">Noisy fibre</text>
      <text x="95" y="210" textAnchor="middle" fill={C.i1} fontSize="12">harmless</text>
      <text x="95" y="250" textAnchor="middle" fill={C.Z} fontSize="12">→ keep the link</text>
      <rect x="240" y="160" width="170" height="120" fill={C.g1} stroke={C.breach} />
      <text x="325" y="188" textAnchor="middle" fill={C.i0} fontSize="15" fontWeight="600">Eavesdropper</text>
      <text x="325" y="210" textAnchor="middle" fill={C.i1} fontSize="12">hostile</text>
      <text x="325" y="250" textAnchor="middle" fill="var(--bad)" fontSize="12">→ abort, raise alarm</text>
    </svg>
  );
}

function Compare() {
  const them = ["Errors", "One pooled number", "Compare to 0.15", "Accept / reject"];
  const us = ["Errors, per basis", "Vector [e_X, e_Y, e_Z]", "CHSH Bell test", "χ² vs measured profiles", "Verdict + cause + runner-up"];
  const Lane = ({ items, cls }: any) => (
    <div className={`flow ${cls}`}>
      {items.map((t: string, i: number) => (
        <div key={t} style={{ display: "contents" }}>
          <div className={`box ${i === items.length - 1 ? "end" : ""}`}>{t}</div>
          {i < items.length - 1 && <div className="arrow">→</div>}
        </div>
      ))}
    </div>
  );
  return (
    <>
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="label">Typical QDS implementation</div>
        <Lane items={them} cls="them" />
        <div className="label" style={{ marginTop: 20, color: "var(--i0)" }}>QSIG</div>
        <Lane items={us} cls="us" />
      </div>
      <ThreeWay />
    </>
  );
}

// y = yes, n = no, p = partial, - = not applicable
const CMP: [string, [string, string], [string, string], [string, string]][] = [
  ["Survives a large quantum computer", ["n", "No: Shor's algorithm breaks RSA and ECDSA"], ["y", "Yes, under stated assumptions"], ["y", "Yes, under stated assumptions"]],
  ["Detects tampering on the channel", ["-", "No quantum channel"], ["p", "Only if errors exceed a fixed threshold"], ["y", "CHSH Bell test and per-basis fingerprint"]],
  ["Tells noise from an attack", ["-", "—"], ["n", "One pooled number"], ["y", "Basis structure plus CHSH"]],
  ["Names the likely cause", ["-", "—"], ["n", "Not attempted"], ["y", "χ² ranking with runner-up and p-value"]],
  ["Proves entanglement is intact", ["-", "—"], ["n", "Assumed"], ["y", "Measured: S ± σ every session"]],
  ["Catches an attacker hiding in noise", ["-", "—"], ["n", "Invisible under the threshold"], ["y", "CHSH drops even when the fingerprint looks like noise"]],
  ["Says when it is unsure", ["n", "Binary valid / invalid"], ["n", "Always decides"], ["y", "INCONCLUSIVE, and blind spots published"]],
  ["Every number reproducible", ["-", "Standardised"], ["p", "Figures, often unseeded"], ["y", "One seed, one command, results hash"]],
  ["Mature and deployed at scale", ["y", "Yes, everywhere today"], ["n", "Research stage"], ["n", "Research prototype, simulated"]],
];

function ThreeWay() {
  const icon: Record<string, string> = { y: "✓", n: "✗", p: "◐", "-": "–" };
  const cell = ([k, t]: [string, string], us = false) => <td className={`${k === "-" ? "muted" : k} ${us ? "us" : ""}`}><span className="i">{icon[k]}</span>{t}</td>;
  return (
    <div className="panel scroll">
      <table className="cmp" style={{ minWidth: 820 }}>
        <thead><tr>
          <th style={{ width: "22%" }}>Capability</th>
          <th>Classical signatures<div className="muted" style={{ fontSize: 12 }}>RSA · ECDSA</div></th>
          <th>Typical QDS implementation<div className="muted" style={{ fontSize: 12 }}>threshold check</div></th>
          <th className="us" style={{ color: "var(--i0)" }}>QSIG<div style={{ fontSize: 12, color: "var(--ok)" }}>live channel instrument</div></th>
        </tr></thead>
        <tbody>{CMP.map(([q, a, b, c]) => <tr key={q}><td>{q}</td>{cell(a)}{cell(b)}{cell(c, true)}</tr>)}</tbody>
      </table>
      <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>✓ yes · ◐ partly · ✗ no · – not applicable. We include the row where classical signatures win, too.</div>
    </div>
  );
}

function Glance({ data }: { data: Data }) {
  const acc = data.confusion.accuracy;
  const attackKeys = Object.keys(data.chsh).filter((k) => k.startsWith("intercept") && k.endsWith("@1.0"));
  const caught = attackKeys.filter((k) => !data.chsh[k].secure).length;
  const vals = Object.values<number>(acc);
  const strong = vals.filter((a) => a >= 0.9).length;
  return (
    <div className="kpis">
      <div><b>{data.chsh["honest@0.0"].S.toFixed(2)}</b><span>CHSH S on a clean channel (max 2√2 ≈ 2.83)</span></div>
      <div><b>{caught}/{attackKeys.length}</b><span>full-strength intercept attacks flagged by CHSH</span></div>
      <div><b>{strong}/{vals.length}</b><span>conditions attributed correctly ≥ 90% on held-out sessions</span></div>
      <div><b>{(acc.honest * 100).toFixed(0)}%</b><span>honest sessions attributed as honest</span></div>
    </div>
  );
}

function TwoInstruments({ data }: { data: Data }) {
  const pair = [["depolarising@0.15", "Depolarising noise · p=0.15"], ["intercept_random@1.0", "Eve · random-basis intercept"]];
  return (
    <div className="grid2">
      {pair.map(([k, t]) => {
        const p = data.profiles[k], ch = data.chsh[k];
        const col = ch.S > data.chsh_secure_min ? C.secure : ch.S > 2 ? C.warn : C.breach;
        return (
          <div key={k} className="panel">
            <h3>{t}</h3>
            <div className="label" style={{ marginTop: 10 }}>Fingerprint: both roughly level</div>
            <BasisBars e={p.mean} height={90} />
            <div className="label" style={{ marginTop: 16 }}>CHSH: clearly different</div>
            <div className="mono" style={{ fontSize: 26, color: col }}>S = {ch.S.toFixed(3)} ± {ch.sigma.toFixed(3)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const { data, error } = useData();
  const m = data?.manifest;
  return (
    <>
      <Nav />
      <main>
        <div className="hero">
          <div>
            <div className="label">SIH 2026 · PS 26141 · Quantum digital signature security</div>
            <h1>A verifier sees a 9% mismatch rate. Is that a noisy fibre, or an attacker?</h1>
            <p className="lede">QSIG is a live diagnostic instrument for quantum digital signature channels. It proves the entanglement is intact, identifies what degraded the channel, and says openly when it can't tell.</p>
            {data && (
              <div className="stats">
                <div><b>{Object.keys(data.chsh).length}</b><span>channel conditions</span></div>
                <div><b>{m.seed}</b><span>one seed</span></div>
                <div><b>2</b><span>independent instruments</span></div>
                <div><b>0</b><span>machine learning</span></div>
              </div>
            )}
            <div className="ctas">
              <a className="btn primary lg" href="#how">Take the step-by-step tour →</a>
              <a className="btn lg" href="#demo">See live results</a>
            </div>
            {error && <p className="err" style={{ marginTop: 20 }}>{error}</p>}
          </div>
          <HeroVisual />
        </div>
        {data && <Glance data={data} />}

        <Section id="ps" n="01 · PROBLEM STATEMENT & OUR APPROACH" v="plain" light acc="var(--brand)" title="What the problem asks, why every approach fails, and what we do"
          sub="Start here. Everything later on this page builds on these three ideas.">
          <PsApproach />
        </Section>

        <Section id="problem" n="02 · THE DILEMMA" v="center" acc="var(--breach)" title="One threshold can't tell noise from an attacker"
          sub="A QDS verifier counts disagreements and compares the rate to a threshold. Drag the threshold below. Every bar is a measured condition. Wherever you put the line, you either reject honest-but-noisy links or let partial attacks through.">
          {data && <ThresholdExplorer data={data} />}
        </Section>

        <Section id="existing" n="03 · COMPARISON" v="plain" light acc="#9A760C" title="Classical signatures vs typical QDS vs QSIG"
          sub="Typical QDS implementations are correct and complete, and they answer only one question: is the error rate too high? Here is how the three approaches compare.">
          <Compare />
        </Section>

        <Section id="how" n="04 · STEP BY STEP" v="band" acc="var(--bz)" title="How QSIG works, one step at a time"
          sub="Click Next to follow a signature from Alice to the verdict. Switch the scenario at any step: clean channel, noisy fibre, or an eavesdropper. Every chart in the tour is a measured result.">
          <div id="tour">{data && <GuidedTour data={data} />}</div>
        </Section>

        <Section id="idea" n="05 · THE KEY IDEA" v="plain" light acc="var(--by)" title="Noise is even. Attacks have a shape."
          sub={<>If Eve measures in the Z basis, Z-basis states pass through untouched and X and Y states are scrambled. The fingerprint becomes <span className="mono">[½, ½, 0]</span>. Noise hits every basis alike. Pooled into one number these can look identical; as three numbers they are obvious.</>}>
          {data && <FingerprintGallery data={data} />}
          <h3 style={{ marginTop: 30 }}>Why two instruments: the attack built to hide</h3>
          <p className="sub">An eavesdropper who picks a random basis each time leaves a level, noise-like fingerprint. But measuring still destroys entanglement, and CHSH catches it.</p>
          {data && <TwoInstruments data={data} />}
        </Section>

        <Section id="arch" n="06 · ARCHITECTURE" v="center" acc="var(--brand)" title="System architecture"
          sub="Protocol → instruments → verdict, plus the pipeline that produces every number on this page.">
          <Architecture />
        </Section>

        <Section id="code" n="07 · UNDER THE HOOD" v="plain" light acc="var(--brand)" title="The actual code behind each step"
          sub="These snippets are cut from the real Python source when the site is built, so what you see is what ran. Pick a step on the left.">
          <UnderTheHood />
        </Section>

        <Section id="demo" n="08 · LIVE RESULTS" v="band" acc="var(--secure)" title="Pick a channel condition"
          sub={m ? `Real seeded Qiskit runs (seed ${m.seed}${m.quick ? ", QUICK mode" : ""}). Choose a scenario and watch the gauge and the fingerprint.` : ""}>
          {data && <LiveDemo data={data} />}
          <h3 style={{ marginTop: 40 }}>CHSH under every condition</h3>
          <p className="sub">Every attack pulls S down. Blind forgery doesn't touch the channel, so CHSH stays high there and the fingerprint catches it instead.</p>
          {data && <ChshChart data={data} />}
          <h3 style={{ marginTop: 40 }}>Attribution accuracy on held-out sessions</h3>
          <p className="sub">{data && `Each row: ${data.confusion.n_runs_per_condition} sessions per strength, ${data.confusion.signatures_per_session} signatures each, on seeds never used to build the profiles. Green = correct cause, amber = inconclusive, red = wrong cause.`}</p>
          {data && <Confusion data={data} />}
        </Section>

        <Section id="limits" n="09 · WHAT IT CANNOT DO" v="split" light acc="var(--warn)" title="Blind spots, stated openly"
          sub="A method that names its blind spots is easier to trust than one that always decides.">
          <div className="panel scroll">
            <table>
              <thead><tr><th>Confusable pair</th><th>Why</th><th>Separated by</th></tr></thead>
              <tbody>
                <tr><td>Phase damping vs weak Z-intercept</td><td>Both give [e, e, 0]</td><td>Magnitude: an intercept saturates at 0.5</td></tr>
                <tr><td>Bit flip vs X-intercept</td><td>Both leave X clean</td><td>Magnitude, and CHSH at high strength</td></tr>
                <tr><td>Blind forgery vs severe depolarising</td><td>Both level near 0.5</td><td>CHSH: forgery leaves entanglement intact</td></tr>
                <tr><td>Random-basis intercept vs depolarising</td><td>Both level</td><td>CHSH: a second, independent instrument</td></tr>
              </tbody>
            </table>
          </div>
          <p className="sub" style={{ marginTop: 16 }}>Security holds under stated assumptions: trusted measurement devices, an authenticated classical channel, and the attack suite implemented here. It detects the attacks we implemented, at the sensitivities we measured. We don't claim it detects every possible attack.</p>
        </Section>

        <Section id="stack" n="10 · TECH STACK" v="center" acc="var(--bz)" title="Built from standard, open tools">
          <div className="grid4">
            {[
              ["Quantum simulation", ["Qiskit 1.2", "Qiskit Aer 0.15"], "Full teleportation circuits, mid-circuit measurement for Eve, Kraus noise channels"],
              ["Statistics", ["NumPy", "SciPy"], "χ² attribution, CHSH uncertainty. No machine learning."],
              ["Verification", ["pytest", "Matplotlib"], "Release gates: honest acceptance, Tsirelson bound, attribution, reproducibility"],
              ["Presentation", ["React + TypeScript", "Vite · Recharts"], "Static site, no backend. Reads the JSON the experiments wrote."],
            ].map(([t, items, d]) => (
              <div key={t as string} className="panel">
                <div className="label">{t}</div>
                {(items as string[]).map((i) => <div key={i} style={{ fontSize: 16 }}>{i}<span className="tag">used</span></div>)}
                <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{d}</p>
              </div>
            ))}
          </div>
          <div className="panel" style={{ marginTop: 14 }}>
            <div className="label">Reproduce every number</div>
            <code>pip install -r requirements.txt</code> → <code>python -m experiments.run_all</code> → <code>pytest</code>
          </div>
        </Section>

        <div className="ctaband">
          <p className="q">Everyone checks whether the error rate is too high. We run a live instrument on the channel. It proves the entanglement is intact, identifies what degraded it, and says when it can't tell.</p>
          <div className="ctas">
            <a className="btn primary lg" href="#how">Replay the tour</a>
            <a className="btn lg" href="#demo">Explore the results</a>
            <a className="btn lg" href="#stack">Reproduce it yourself</a>
          </div>
        </div>

        {m && (
          <footer>
            Provenance: seed {m.seed} · key length {m.key_length} · {m.n_profile_runs} profile runs per condition · qiskit {m.qiskit} · qiskit-aer {m.qiskit_aer} · python {m.python} · git {m.git_sha?.slice(0, 8) ?? "n/a"} · results sha256 {m.results_sha256.slice(0, 16)} · runtime {m.runtime_s}s
          </footer>
        )}
      </main>
    </>
  );
}
