"use client";

import { useEffect, useState } from "react";
import { ensureEngineReady, initLive2D, resetEngineState } from "@/lib/live2d-engine";

const LIVE2D_ENABLED_KEY = "garden-live2d-enabled";

function isLive2DEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try { return localStorage.getItem(LIVE2D_ENABLED_KEY) !== "false"; } catch { return true; }
}

function removeLive2D() {
  const ids = ["waifu", "waifu-toggle", "waifu-tips", "waifu-canvas", "waifu-tool", "live2d"];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
}

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
  const [enabled, setEnabled] = useState(() => isLive2DEnabled());

  useEffect(() => {
    const onToggle = () => setEnabled(isLive2DEnabled());
    window.addEventListener("live2d-toggle", onToggle);
    return () => window.removeEventListener("live2d-toggle", onToggle);
  }, []);

  useEffect(() => {
    if (!enabled) {
      removeLive2D();
      resetEngineState();
      return;
    }
    resetEngineState();
    zoomWatching = false;
    ensureEngineReady().then(() => {
      setTimeout(() => { initLive2D(); setTimeout(startWatching, 500); }, 400);
    }).catch(() => {});
    return () => { resetEngineState(); };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const handler = () => {
      zoomWatching = false;
      setTimeout(() => { initLive2D(); setTimeout(startWatching, 500); }, 200);
    };
    window.addEventListener("live2d-config-changed", handler);
    return () => window.removeEventListener("live2d-config-changed", handler);
  }, [enabled]);

  // ── Tap to toggle waifu toolbar via waifu library's own event (no conflict with dialogue) ──
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const toggleToolbar = () => {
      const tool = document.getElementById("waifu-tool");
      if (!tool) return;
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      if (tool.classList.contains("waifu-tool-visible")) {
        tool.classList.remove("waifu-tool-visible");
      } else {
        tool.classList.add("waifu-tool-visible");
        hideTimer = setTimeout(() => {
          tool.classList.remove("waifu-tool-visible");
        }, 3000);
      }
    };

    window.addEventListener("live2d:tapbody", toggleToolbar);
    return () => {
      window.removeEventListener("live2d:tapbody", toggleToolbar);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return (
    <style>{`
      /* Dialogue bubble sits exactly on top of canvas, no gap or overlap */
      #waifu-tips { top: auto !important; bottom: 100% !important; margin-top: 0 !important; margin-bottom: 0 !important; }

      #live2d { width: 300px; height: 300px; zoom: 0.75; }

      @media (max-width: 640px) {
        #waifu { left: -20px !important; }
      }
    `}</style>
  );
}
