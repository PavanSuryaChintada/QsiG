import { C } from "../lib";

const Box = ({ x, y, w = 200, h = 80, title, lines, stroke = C.g4, fill = C.g2, dashed = false }: any) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeDasharray={dashed ? "4 3" : undefined} />
    <text x={x + 12} y={y + 24} fill={C.i0} fontSize="14" fontWeight="600">{title}</text>
    {lines.map((l: string, i: number) => <text key={i} x={x + 12} y={y + 44 + i * 17} fill={C.i1} fontSize="12">{l}</text>)}
  </g>
);
const Arrow = ({ d }: { d: string }) => <path d={d} fill="none" stroke={C.i2} strokeWidth="1.5" markerEnd="url(#ar)" className="flowline" />;
const BLUE = "#4A7FC1";
const Lane = ({ y, text, c = C.i2 }: any) => <g><rect x="10" y={y - 11} width="4" height="14" fill={c} /><text x="22" y={y} fill={c} fontSize="11" letterSpacing="1.5" fontWeight="600">{text}</text></g>;

export function Architecture() {
  return (
    <div className="panel scroll">
      <svg viewBox="0 0 1100 500" width="100%" style={{ minWidth: 780 }} role="img" aria-label="QSIG system architecture">
        <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill={C.i2} /></marker></defs>

        <Lane y={22} c={BLUE} text="1 · PROTOCOL — QISKIT CIRCUITS (qsig/protocol, channels, attacks)" />
        <Box x={10} y={35} w={180} stroke={BLUE} title="Alice · keys" lines={["6 Pauli eigenstates", "basis label kept"]} />
        <Box x={230} y={35} w={200} stroke={BLUE} title="Teleportation" lines={["Bell pair |Φ⁺⟩", "full 3-qubit circuit"]} />
        <Box x={470} y={35} w={210} title="Travelling qubit" lines={["noise channel (Kraus)", "Eve: mid-circuit measure"]} stroke={C.breach} dashed />
        <Box x={720} y={35} w={170} stroke={BLUE} title="Bob · verify" lines={["measure in declared", "basis + Pauli correction"]} />
        <Box x={930} y={35} w={160} stroke={BLUE} title="Mismatch vector" lines={["e_X · e_Y · e_Z", "+ counts per basis"]} />
        <Arrow d="M190,75 L228,75" /><Arrow d="M430,75 L468,75" /><Arrow d="M680,75 L718,75" /><Arrow d="M890,75 L928,75" />

        <Lane y={175} c={C.secure} text="2 · INSTRUMENTS — STATISTICS, NO MACHINE LEARNING (qsig/detect)" />
        <Box x={230} y={190} w={260} h={96} title="I1 · CHSH monitor" lines={["Bell test on the same channel", "S ± σ  vs  2 and 2√2", "veto if entanglement degraded"]} stroke={C.secure} fill={C.g1} />
        <Box x={540} y={190} w={260} h={96} title="I2 · Basis fingerprint" lines={["χ² vs measured profiles", "best + runner-up + p-values", "INCONCLUSIVE if not separated"]} stroke={C.secure} fill={C.g1} />
        <Box x={850} y={190} w={240} h={96} title="Detection engine" lines={["any instrument may veto", "ACCEPT / REJECT /", "INCONCLUSIVE + reasons"]} stroke={C.i0} fill={C.g1} />
        <Arrow d="M1010,115 L1010,150 L670,150 L670,188" />
        <Arrow d="M575,115 L575,140 L360,140 L360,188" />
        <Arrow d="M490,238 L538,238" /><Arrow d="M800,238 L848,238" />
        <text x="10" y="212" fill={C.i1} fontSize="12">Roadmap (not built yet):</text>
        {["I3 process tomography", "I4 SPRT · CUSUM", "I5 Grover red-team", "I6 decoy · timing"].map((t, i) => <text key={t} x="10" y={232 + i * 17} fill={C.i3} fontSize="12">{t}</text>)}

        <Lane y={340} c={C.X} text="3 · REPRODUCIBLE PIPELINE (experiments/run_all.py → this site)" />
        <Box x={10} y={355} w={240} stroke={C.X} title="python -m experiments.run_all" lines={["one seed, one command", "every condition × strength"]} />
        <Box x={290} y={355} w={240} stroke={C.X} title="Reference profiles" lines={["built on one seed range", "tested on held-out seeds"]} />
        <Box x={570} y={355} w={240} stroke={C.X} title="results/*.json + figures" lines={["manifest: versions, git SHA", "sha256 of all results"]} />
        <Box x={850} y={355} w={240} stroke={C.X} title="React site (static)" lines={["reads JSON only", "no number typed by hand"]} />
        <Arrow d="M250,395 L288,395" /><Arrow d="M530,395 L568,395" /><Arrow d="M810,395 L848,395" />
        <text x="10" y="480" fill={C.i3} fontSize="12">The same Qiskit code powers the instruments and the pipeline. Nothing on this page is simulated in the browser.</text>
      </svg>
    </div>
  );
}
