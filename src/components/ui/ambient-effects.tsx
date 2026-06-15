"use client";

// ============================================================
// Digital Garden — Ambient Effects Wrapper
// ============================================================
// Sakura petals → moved to AmbientProvider (樱飘 in env effects)
// CRT scanline → kept here
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { CrtOverlay } from "./crt-overlay";

function getBool(key: string, fallback: boolean): boolean {
  try { return localStorage.getItem(key) === "true"; } catch { return fallback; }
}

export function AmbientEffects() {
  const [crtOn, setCrtOn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setCrtOn(getBool("garden-crt", false));
  }, []);

  useEffect(() => {
    refresh();
    setMounted(true);
  }, [refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("garden-prefs", handler);
    return () => window.removeEventListener("garden-prefs", handler);
  }, [refresh]);

  if (!mounted) return null;

  return (
    <CrtOverlay
      enabled={crtOn}
      scanlineOpacity={0.06}
      flickerIntensity={0.6}
      curvature={false}
    />
  );
}
