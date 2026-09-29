import { useEffect, useRef, useState } from "react";

// Shape of site/public/data/site_data.json, written by experiments/run_all.py.
export type Data = any;

export const C = {
  g1: "#141E22", g2: "#1B282D", g3: "#25363D", g4: "#345059",
  i0: "#EFEAE0", i1: "#C6C0B5", i2: "#96918A", i3: "#66635D",
  secure: "#3E7C5A", warn: "#9A760C", breach: "#B42D1A",
  X: "#C9A227", Y: "#C2731F", Z: "#4F7D8C",
};

const NAMES: Record<string, string> = {
  honest: "Honest channel",
  depolarising: "Depolarising noise",
  phase_damping: "Phase damping",
  amplitude_damping: "Amplitude damping",
  bit_flip: "Bit-flip noise",
  intercept_X: "Eve · X-basis intercept",
  intercept_Y: "Eve · Y-basis intercept",
  intercept_Z: "Eve · Z-basis intercept",
  intercept_random: "Eve · random-basis intercept",
  blind_forgery: "Blind forgery",
  INCONCLUSIVE: "Inconclusive",
};

export const name = (cls: string) => NAMES[cls] ?? cls.replace(/_/g, " ");
export const kind = (cls: string): "honest" | "noise" | "attack" =>
  cls === "honest" ? "honest" : cls.startsWith("intercept") || cls === "blind_forgery" ? "attack" : "noise";
export const kindColor = (cls: string) => ({ honest: C.secure, noise: C.Z, attack: C.breach }[kind(cls)]);

/** "intercept_Z@1.0" -> "Eve · Z-basis intercept · 100%" */
export const label = (key: string) => {
  const [cls, s] = key.split("@");
  const st = Number(s);
  if (cls === "honest") return name(cls);
  return `${name(cls)} · ${cls.startsWith("intercept") || cls === "blind_forgery" ? `${Math.round(st * 100)}%` : `p=${st}`}`;
};

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (el.classList.add("in"), io.disconnect()), { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function useData() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("data/site_data.json")
      .then((r) => { if (!r.ok) throw new Error("No results yet. Run: python -m experiments.run_all"); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return { data, error };
}
