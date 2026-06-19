"use client";

// ============================================================
// Digital Garden — UI Preferences Provider
// ============================================================

import { useEffect } from "react";
import { getMobilePrefs, applyPrefs } from "@/lib/ui-preferences";

export function UIPrefsProvider() {
  useEffect(() => {
    const tick = () => applyPrefs(getMobilePrefs());
    tick();
    window.addEventListener("storage", tick);
    return () => window.removeEventListener("storage", tick);
  }, []);

  return null;
}
