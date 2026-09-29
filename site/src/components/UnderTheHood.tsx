import { useState } from "react";
import { SNIPPETS } from "../code";
import { CodeBlock } from "./CodeBlock";

export function UnderTheHood() {
  const [id, setId] = useState(SNIPPETS[1].id);
  const s = SNIPPETS.find((x) => x.id === id)!;
  return (
    <div className="hood">
      <div className="hoodlist">
        {SNIPPETS.map((x, i) => (
          <button key={x.id} className={x.id === id ? "on" : ""} onClick={() => setId(x.id)}>
            <span className="mono">{String(i + 1).padStart(2, "0")}</span>{x.title}
          </button>
        ))}
      </div>
      <div>
        <div className="hoodwhy"><b>{s.title}.</b> {s.why}</div>
        <CodeBlock s={s} />
      </div>
    </div>
  );
}
