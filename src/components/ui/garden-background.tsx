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

export function GardenBackground({ opacity = 1 }: { opacity?: number }) {
  const [loaded, setLoaded] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobile());
    const onResize = () => setMobile(isMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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
          backgroundAttachment: "fixed",
          opacity: loaded ? opacity : 0,
        }}
      />
    </>
  );
}
