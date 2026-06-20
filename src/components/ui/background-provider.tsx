"use client";

// ============================================================
// Digital Garden 3.0 — Background Provider
// ============================================================
// 全屏背景：图片 / 视频 · 透明度/模糊 · 蒙版
// 云端部署时大背景图走 CDN（Phase 2）。
// 视频 layer 与页面横幅一致，保证稳定渲染。
// ============================================================

import { useEffect, useState } from "react";
import { resolveBackgroundUrl } from "@/lib/backgrounds";
import { GardenBackground } from "@/components/ui/garden-background";
import { loadBackgroundImage } from "@/lib/file-storage";

interface BgState {
  src: string | null;
  isVideo: boolean;
  opacity: number;
  blur: number;
  maskColor: string;
  maskOpacity: number;
}

function isVideoSrc(src: string | null): boolean {
  if (!src) return false;
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(src)) return true;
  if (src.startsWith("data:video/")) return true;
  return false;
}

const DEFAULT_BG = "/backgrounds/moonlight-04.jpg";

function resolveBgSrc(): string {
  if (typeof window === "undefined") return DEFAULT_BG;
  try {
    const stored = localStorage.getItem("garden-background");
    // If user has explicitly picked a background path, use it.
    // Skip ephemeral blob URLs (they die on page reload) and empty strings.
    if (stored && !stored.startsWith("blob:") && stored !== "") return stored;
    // Garden theme always shows moonlight-04.jpg
    const theme = localStorage.getItem("garden-theme") || "garden";
    if (theme === "garden") return DEFAULT_BG;
    // Other scene themes: empty → canvas scene shows through
    return "";
  } catch {
    return DEFAULT_BG;
  }
}

function getStored(): BgState {
  if (typeof window === "undefined")
    return { src: DEFAULT_BG, isVideo: false, opacity: 0.5, blur: 0, maskColor: "transparent", maskOpacity: 0 };
  try {
    const src = resolveBgSrc();
    const isVideo = isVideoSrc(src);
    const opacity = Number(localStorage.getItem("garden-bg-opacity") || 25) / 100;
    const blur = Number(localStorage.getItem("garden-bg-blur") || 0);
    const maskColor = localStorage.getItem("garden-bg-mask") || "transparent";
    const maskOpacity = Number(localStorage.getItem("garden-bg-mask-opacity") || 0) / 100;
    return {
      src,
      isVideo,
      opacity: isNaN(opacity) ? 0.5 : opacity,
      blur: isNaN(blur) ? 0 : blur,
      maskColor,
      maskOpacity: isNaN(maskOpacity) ? 0 : maskOpacity,
    };
  } catch {
    return { src: DEFAULT_BG, isVideo: false, opacity: 0.5, blur: 0, maskColor: "transparent", maskOpacity: 0 };
  }
}

export function BackgroundProvider() {
  const [bg, setBg] = useState<BgState>(() => ({
    src: DEFAULT_BG, isVideo: false, opacity: 0.5, blur: 0, maskColor: "transparent", maskOpacity: 0,
  }));
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track dark mode via <html> class observer
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("garden-theme-changed", check);
    return () => {
      obs.disconnect();
      window.removeEventListener("garden-theme-changed", check);
    };
  }, []);

  // Track mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Seed defaults + sync from localStorage (+ IndexedDB fallback)
  useEffect(() => {
    if (!localStorage.getItem("garden-theme")) {
      localStorage.setItem("garden-theme", "garden");
    }
    if ((localStorage.getItem("garden-theme") || "garden") === "garden") {
      if (!localStorage.getItem("garden-background")) {
        localStorage.setItem("garden-background", DEFAULT_BG);
      }
      if (!localStorage.getItem("garden-bg-opacity")) {
        localStorage.setItem("garden-bg-opacity", "25");
      }
    }

    const syncFromStorage = () => {
      const state = getStored();
      // If no background in localStorage but IndexedDB has one, load it async
      const stored = localStorage.getItem("garden-background") || "";
      const bgMarker = localStorage.getItem("garden-bg-image") || "";
      if ((!stored || stored.startsWith("blob:")) && bgMarker === "idb:bg") {
        loadBackgroundImage().then((dataUrl) => {
          if (dataUrl) {
            // Restore to localStorage so future syncs pick it up
            try { localStorage.setItem("garden-background", dataUrl); } catch {}
            setBg((prev) => ({ ...prev, src: dataUrl, isVideo: isVideoSrc(dataUrl) }));
            return;
          }
          // IndexedDB load failed — use default
          setBg(state);
        });
        // Show default while loading
        setBg(state);
        return;
      }
      setBg(state);
    };

    syncFromStorage();
    setMounted(true);
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("garden-bg-changed", syncFromStorage);
    window.addEventListener("garden-theme-changed", syncFromStorage);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("garden-bg-changed", syncFromStorage);
      window.removeEventListener("garden-theme-changed", syncFromStorage);
    };
  }, []);

  if (!mounted || !bg.src) return null;

  const blurPx = bg.blur > 0 ? `${bg.blur}px` : "0px";
  const showMask = bg.maskOpacity > 0 && bg.maskColor !== "transparent";

  // Garden theme → always shows moonlight-04 via optimized GardenBackground.
  // Non-garden themes can still use moonlight-04 as a regular background overlay
  // (configurable opacity, rendered on top of the canvas scene).
  // This is a one-way binding: theme → background, not background → theme.
  const currentTheme = localStorage.getItem("garden-theme") || "garden";
  const useGardenBg = currentTheme === "garden" && bg.src === DEFAULT_BG && !bg.isVideo;

  if (useGardenBg) {
    return (
      <>
        <GardenBackground opacity={bg.opacity} />
        {showMask && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: -2,
              backgroundColor: bg.maskColor,
              opacity: bg.maskOpacity,
              transition: "opacity 0.3s ease",
              pointerEvents: "none",
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* ── Background image ──────────────────────────── */}
      {!bg.isVideo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: -3,
            backgroundImage: `url(${resolveBackgroundUrl(bg.src)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: [
              blurPx !== "0px" ? `blur(${blurPx})` : "",
              isDark ? "brightness(0.50)" : "",
            ].filter(Boolean).join(" ") || "none",
            transform: isMobile ? "scale(1.0)" : "scale(1.05)",
            opacity: bg.opacity,
            transition: "opacity 0.3s ease, filter 0.5s ease",
          }}
        />
      )}

      {/* ── Video background ──────────────────────────── */}
      {bg.isVideo && (
        <video
          key={bg.src}
          src={bg.src}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "fixed",
            inset: 0,
            zIndex: -3,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: [
              blurPx !== "0px" ? `blur(${blurPx})` : "",
              isDark ? "brightness(0.50)" : "",
            ].filter(Boolean).join(" ") || "none",
            opacity: bg.opacity,
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      {/* ── Mask overlay ──────────────────────────────── */}
      {showMask && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: -2,
            backgroundColor: bg.maskColor,
            opacity: bg.maskOpacity,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
}
