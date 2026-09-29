import { useMemo, useState } from "react";
import { extract, Snippet } from "../code";

const KW = "def|return|if|elif|else|for|in|not|and|or|None|True|False|import|from|as|class|while|with|assert|lambda|is|raise|continue|break|pass|try|except";
const TOKEN = new RegExp(
  `(#[^\\n]*)|("""[\\s\\S]*?"""|"(?:\\\\.|[^"\\\\\\n])*"|'(?:\\\\.|[^'\\\\\\n])*')|\\b(${KW})\\b|\\b(\\d+(?:\\.\\d+)?)\\b|(@\\w+)`,
  "g"
);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Minimal Python highlighter: comments, strings, keywords, numbers, decorators. */
export function highlight(code: string) {
  let out = "", last = 0;
  for (const m of code.matchAll(TOKEN)) {
    out += esc(code.slice(last, m.index));
    const cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "k" : m[4] ? "n" : "d";
    out += `<span class="t${cls}">${esc(m[0])}</span>`;
    last = m.index! + m[0].length;
  }
  return out + esc(code.slice(last));
}

export function CodeBlock({ s, maxHeight = 420 }: { s: Snippet; maxHeight?: number }) {
  const { code, line } = useMemo(() => extract(s.file, s.fn), [s]);
  const html = useMemo(() => highlight(code), [code]);
  const [copied, setCopied] = useState(false);
  const n = code.split("\n").length;
  return (
    <div className="code">
      <div className="codebar">
        <span><span className="dotc" />{s.file}<span className="ln">:{line}</span></span>
        <button onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? "copied" : "copy"}</button>
      </div>
      <div className="codebody" style={{ maxHeight }}>
        <pre className="gutter">{Array.from({ length: n }, (_, i) => line + i).join("\n")}</pre>
        <pre dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
