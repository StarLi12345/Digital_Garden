"use client";

// ============================================================
// Digital Garden — Garden Theme Responsive Background
// ============================================================
// · 首选 WebP，JPG 回退
// · 移动端加载 0.5x 分辨率
// · 暗色模式自动切换
// · 懒加载 + 淡入过渡
// ============================================================

import { useEffect, useState } from "react";

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

function getStoredBlur(): number {
  try { return Number(localStorage.getItem("garden-bg-blur")) || 0; } catch { return 0; }
}

export function GardenBackground({ opacity = 1 }: { opacity?: number }) {
  const [loaded, setLoaded] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [blur, setBlur] = useState(0);

  useEffect(() => {
    setMobile(isMobile());
    setBlur(getStoredBlur());
    const onResize = () => setMobile(isMobile());
    const onBgChange = () => setBlur(getStoredBlur());
    window.addEventListener("resize", onResize);
    window.addEventListener("garden-bg-changed", onBgChange);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("garden-bg-changed", onBgChange);
    };
  }, []);

  // Always use moonlight-04 — it's already a moonlit night scene,
  // so it fits both light and dark mode natively. No need to swap.
  const base = "moonlight-04";
  const suffix = mobile ? "@0.5x" : "";
  const webp = `/themes/garden/backgrounds/${base}${suffix}.webp`;
  const jpg = `/themes/garden/backgrounds/${base}.jpg`;
  const [imgSrc, setImgSrc] = useState(webp);

  // Reset imgSrc when webp path changes (e.g. mobile/desktop switch)
  useEffect(() => { setImgSrc(webp); }, [webp]);

  return (
    <>
      {/* Invisible preload detector */}
      <img
        src={imgSrc}
        onLoad={() => setLoaded(true)}
        onError={() => {
          // WebP not supported — fallback to JPG for both img and visible bg
          if (imgSrc === webp) { setImgSrc(jpg); setLoaded(false); }
          else setLoaded(true); // already tried JPG, give up
        }}
        alt=""
        className="hidden"
        aria-hidden="true"
      />
      {/* Visible background — uses the actual loaded image URL */}
      <div
        className="fixed inset-0 -z-10 transition-opacity duration-700"
        style={{
          backgroundImage: loaded ? `url(${imgSrc})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          // Fixed attachment is broken on mobile (iOS/Safari zooms in).
          // Use scroll on small screens to avoid the zoom artifact.
          backgroundAttachment: mobile ? "scroll" : "fixed",
          filter: blur > 0 ? `blur(${blur}px)` : "none",
          opacity: loaded ? opacity : 0,
        }}
      />
    </>
  );
}
