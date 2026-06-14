"use client";

import { useEffect } from "react";
import { ensureEngineReady, initLive2D, resetEngineState } from "@/lib/live2d-engine";

// ── Wheel zoom via CSS zoom (no conflict with library internals) ──

let zoomWatching = false;

function startWatching() {
  if (zoomWatching) return;
  zoomWatching = true;

  // Wait for #live2d to appear, then hook wheel
  const tryHook = () => {
    const canvas = document.getElementById("live2d") as HTMLCanvasElement | null;
    if (!canvas || (canvas as any)._gardenZoomed) return;
    (canvas as any)._gardenZoomed = true;

    // Read current CSS zoom (from companion stylesheet)
    const initial = parseFloat(getComputedStyle(canvas).zoom) || 0.7;
    canvas.style.zoom = String(initial);

    canvas.addEventListener("wheel", (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const cur = parseFloat(canvas.style.zoom) || 0.7;
      const next = Math.max(0.2, Math.min(4, cur + (e.deltaY > 0 ? -0.06 : 0.06)));
      canvas.style.zoom = String(Math.round(next * 100) / 100);
    }, { passive: false });
  };

  tryHook();
  // Fallback: watch for late-arriving canvas
  const obs = new MutationObserver(() => { tryHook(); });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 10000);
}

// ── Component ──────────────────────────────────────────

export function CompanionWidget() {
  useEffect(() => {
    resetEngineState();
    zoomWatching = false;
    ensureEngineReady().then(() => {
      setTimeout(() => { initLive2D(); setTimeout(startWatching, 500); }, 400);
    });
    return () => { resetEngineState(); };
  }, []);

  useEffect(() => {
    const handler = () => {
      zoomWatching = false;
      setTimeout(() => { initLive2D(); setTimeout(startWatching, 500); }, 200);
    };
    window.addEventListener("live2d-config-changed", handler);
    return () => window.removeEventListener("live2d-config-changed", handler);
  }, []);

  return (
    <style>{`
      /* Dialogue bubble sits exactly on top of canvas, no gap or overlap */
      #waifu-tips { top: auto !important; bottom: 100% !important; margin-top: 0 !important; margin-bottom: 0 !important; }

      #live2d { width: 300px; height: 300px; zoom: 0.75; }
    `}</style>
  );
}
