// ============================================================
// Digital Garden — Ambient Effects Configuration
// ============================================================

export type AmbientEffect = "none" | "petal" | "dust" | "snow" | "rain";
export type CursorEffect = "none" | "petal" | "dust" | "snow";

const AMBIENT_KEY = "garden-ambient-effect";
const CURSOR_KEY = "garden-cursor-effect";

export function getAmbientEffect(): AmbientEffect {
  if (typeof window === "undefined") return "none";
  try { return (localStorage.getItem(AMBIENT_KEY) as AmbientEffect) || "rain"; } catch { return "rain"; }
}
export function setAmbientEffect(e: AmbientEffect) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(AMBIENT_KEY, e); } catch { /* */ }
}

export function getCursorEffect(): CursorEffect {
  if (typeof window === "undefined") return "none";
  try {
    const saved = localStorage.getItem(CURSOR_KEY);
    if (saved) return saved as CursorEffect;
    // No cursor on mobile — default to "none"
    return window.innerWidth < 768 ? "none" : "dust";
  } catch { return "dust"; }
}
export function setCursorEffect(e: CursorEffect) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(CURSOR_KEY, e); } catch { /* */ }
}
