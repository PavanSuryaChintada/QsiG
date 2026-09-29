import { C } from "../lib";

const FAILS = [
  {
    who: "Classical signatures",
    eg: "RSA · ECDSA",
    why: "Their security rests on maths that is hard today: factoring and discrete logarithms. Shor's algorithm solves both on a large quantum computer.",
    so: "Anything signed today can be forged tomorrow.",
  },
  {
    who: "QDS with a fixed threshold",
    eg: "what most submissions build",
    why: "They pool every error into one number and compare it with a hardcoded value like 0.15. Nobody can say where 0.15 came from.",
    so: "A noisy fibre and an eavesdropper look identical, so one gets rejected or the other gets through.",
  },
  {
    who: "AI / ML anomaly detection",
    eg: "classifiers, clustering",
    why: "The problem statement excludes it. There is also no labelled dataset of quantum attacks to train on, and a classifier gives no physical guarantee.",
    so: "It can't prove anything about an eavesdropper.",
  },
];

const OURS = [
  { n: "1", t: "Measure", d: "A CHSH Bell test proves the entanglement is intact. Nobody can eavesdrop without lowering it.", c: C.secure },
  { n: "2", t: "Attribute", d: "Errors split by basis X · Y · Z. A χ² test against measured profiles names the cause.", c: C.X },
  { n: "3", t: "Decide", d: "ACCEPT, REJECT or INCONCLUSIVE, with reasons, the runner-up cause and p-values.", c: "var(--brand)" },
];

export function PsApproach() {
  return (
    <div>
      {/* A · the problem statement */}
      <div className="psdoc">
        <div className="psid"><span>PS</span><b>26141</b></div>
        <div className="psbody">
          <div className="label">Smart India Hackathon 2026 · Problem statement</div>
          <h3 style={{ fontSize: 24 }}>Quantum-Inspired Cyber Threat Detection for Digital Signature Security</h3>
          <div className="psmeta">
            <div><span>Organisation</span>Egreen Quanta LLP</div>
            <div><span>Theme</span>Blockchain &amp; Cybersecurity</div>
            <div><span>Category</span>Software</div>
            <div><span>Deliverables</span>Prototype · Code · Documentation</div>
          </div>
          <div className="psplain">
            <div className="label" style={{ color: "var(--i0)" }}>In plain words</div>
            Digital signatures prove who sent a message. Quantum computers will break the ones we use today. Quantum digital signatures replace hard maths with physical law. <b>The open question is how to tell, on a real noisy channel, whether a signature is under attack.</b> No AI or ML allowed.
          </div>
        </div>
      </div>

      {/* B · why every approach fails */}
      <h3 className="bighead">Why every existing approach falls short</h3>
      <div className="fails">
        {FAILS.map((f) => (
          <div key={f.who} className="fail">
            <div className="x">✗</div>
            <h3>{f.who}</h3>
            <div className="muted mono" style={{ fontSize: 12, marginBottom: 10 }}>{f.eg}</div>
            <p className="dim">{f.why}</p>
            <p className="so">{f.so}</p>
          </div>
        ))}
      </div>
      <p className="miss">What they all miss: <b>the number of errors doesn't tell you what caused them.</b></p>

      {/* C · our approach */}
      <h3 className="bighead">Our approach: a measuring instrument, not a threshold</h3>
      <div className="ours3">
        {OURS.map((o, i) => (
          <div key={o.n} className="o">
            <div className="num" style={{ color: o.c, borderColor: o.c }}>{o.n}</div>
            <h3 style={{ fontSize: 22 }}>{o.t}</h3>
            <p className="dim">{o.d}</p>
            {i < OURS.length - 1 && <div className="conn" />}
          </div>
        ))}
      </div>
      <p className="tagline">Everyone counts <i>how many</i> errors there are. We work out <i>what caused them</i>.</p>
    </div>
  );
}
