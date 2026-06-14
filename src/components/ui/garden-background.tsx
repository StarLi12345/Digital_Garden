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

export function GardenBackground() {
  const [loaded, setLoaded] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobile());
    const onResize = () => setMobile(isMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Listen for theme changes for dark-mode image swap
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => {
      try { setIsDark(document.documentElement.classList.contains("dark")); } catch { setIsDark(false); }
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Pick the right image
  const base = isDark ? "alt-01" : "moonlight-04";
  const suffix = mobile ? "@0.5x" : "";
  const webp = `/themes/garden/backgrounds/${base}${suffix}.webp`;
  const jpg = `/themes/garden/backgrounds/${base}.jpg`;

  return (
    <>
      {/* Invisible preload detector */}
      <img
        src={webp}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          // WebP not supported — fallback to JPG
          (e.target as HTMLImageElement).src = jpg;
          setLoaded(true);
        }}
        alt=""
        className="hidden"
        aria-hidden="true"
      />
      {/* Visible background */}
      <div
        className="fixed inset-0 -z-10 transition-opacity duration-700"
        style={{
          backgroundImage: `url(${loaded ? (webp) : ""})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          opacity: loaded ? 1 : 0,
        }}
      />
    </>
  );
}
