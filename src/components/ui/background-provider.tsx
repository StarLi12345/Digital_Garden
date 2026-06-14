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
  const stored = localStorage.getItem("garden-background");
  // If user has explicitly picked a background path, use it
  if (stored) return stored;
  // Garden theme always shows moonlight-04.jpg
  const theme = localStorage.getItem("garden-theme") || "garden";
  if (theme === "garden") return DEFAULT_BG;
  // Other scene themes: empty → canvas scene shows through
  return stored || "";
}

function getStored(): BgState {
  if (typeof window === "undefined")
    return { src: DEFAULT_BG, isVideo: false, opacity: 0.5, blur: 0, maskColor: "transparent", maskOpacity: 0 };
  try {
    const src = resolveBgSrc();
    const isVideo = isVideoSrc(src);
    const opacity = Number(localStorage.getItem("garden-bg-opacity") || 50) / 100;
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

  // Seed defaults + sync from localStorage
  useEffect(() => {
    if (!localStorage.getItem("garden-theme")) {
      localStorage.setItem("garden-theme", "garden");
    }
    if ((localStorage.getItem("garden-theme") || "garden") === "garden") {
      if (!localStorage.getItem("garden-background")) {
        localStorage.setItem("garden-background", DEFAULT_BG);
      }
      if (!localStorage.getItem("garden-bg-opacity")) {
        localStorage.setItem("garden-bg-opacity", "50");
      }
    }
    const update = () => setBg(getStored());
    update();
    setMounted(true);
    window.addEventListener("storage", update);
    window.addEventListener("garden-bg-changed", update);
    window.addEventListener("garden-theme-changed", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("garden-bg-changed", update);
      window.removeEventListener("garden-theme-changed", update);
    };
  }, []);

  if (!mounted || !bg.src) return null;

  const blurPx = bg.blur > 0 ? `${bg.blur}px` : "0px";
  const showMask = bg.maskOpacity > 0 && bg.maskColor !== "transparent";

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
            transform: "scale(1.05)",
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
