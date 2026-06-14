"use client";

// ============================================================
// Digital Garden — Ambient Effects Wrapper（环境特效聚合器）
// ============================================================
// 统一管理可选环境特效：樱花飘落、CRT 扫描线
// 通过自定义事件 "garden-prefs" 实时响应设置变更
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { SakuraPetals } from "./sakura-petals";
import { CrtOverlay } from "./crt-overlay";

function getBool(key: string, fallback: boolean): boolean {
  try { return localStorage.getItem(key) === "true"; } catch { return fallback; }
}

export function AmbientEffects() {
  const [sakuraOn, setSakuraOn] = useState(false);
  const [crtOn, setCrtOn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setSakuraOn(getBool("garden-sakura", false));
    setCrtOn(getBool("garden-crt", false));
  }, []);

  useEffect(() => {
    refresh();
    setMounted(true);
  }, [refresh]);

  // Listen for real-time prefs changes (from settings page)
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("garden-prefs", handler);
    return () => window.removeEventListener("garden-prefs", handler);
  }, [refresh]);

  if (!mounted) return null;

  return (
    <>
      <SakuraPetals enabled={sakuraOn} density={0.5} />
      <CrtOverlay
        enabled={crtOn}
        scanlineOpacity={0.06}
        flickerIntensity={0.6}
        curvature={false}
      />
    </>
  );
}
