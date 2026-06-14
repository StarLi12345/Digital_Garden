"use client";

// ============================================================
// Digital Garden 2.0 — Page Banner（透明度/模糊/蒙版）
// ============================================================
// · 拖拽调整图片位置 · 高度可设 · 有/无边界选项
// · 透明度 · 模糊 · 蒙版颜色+不透明度
// · 在 login / plant / home / entry / drafts 页面自动隐藏
// · z-index: 在背景之上，导航之下
// ============================================================

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { loadBannerImage } from "@/lib/file-storage";

const HIDDEN_PATHS = ["/login", "/plant", "/"];
const HIDDEN_PREFIXES = ["/entry", "/drafts"];

async function resolveBannerSrc(stored: string | null): Promise<string | null> {
  if (!stored) return null;
  if (stored === "idb:banner") return loadBannerImage();
  return stored;
}

function getStoredNum(key: string, def: number): number {
  try { const v = Number(localStorage.getItem(key)); return isNaN(v) ? def : v; } catch { return def; }
}

export function PageBanner() {
  const pathname = usePathname();
  const [src, setSrc] = useState<string | null>(null);
  const [height, setHeight] = useState(180);
  const [posY, setPosY] = useState(50);
  const [borderless, setBorderless] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);

  // Opacity / Blur / Mask
  const [bannerOpacity, setBannerOpacity] = useState(100);
  const [bannerBlur, setBannerBlur] = useState(0);
  const [maskColor, setMaskColor] = useState("transparent");
  const [maskOpacity, setMaskOpacity] = useState(0);

  const dragRef = useRef({ startY: 0, startPos: 50 });
  const bannerRef = useRef<HTMLDivElement>(null);

  const loadSettings = useCallback(() => {
    try {
      const raw = localStorage.getItem("garden-banner-image");
      resolveBannerSrc(raw).then(setSrc);
      setHeight(getStoredNum("garden-banner-height", 180));
      setPosY(getStoredNum("garden-banner-pos", 50));
      setBorderless(localStorage.getItem("garden-banner-borderless") === "true");
      setBannerOpacity(getStoredNum("garden-banner-opacity", 100));
      setBannerBlur(getStoredNum("garden-banner-blur", 0));
      setMaskColor(localStorage.getItem("garden-banner-mask") || "transparent");
      setMaskOpacity(getStoredNum("garden-banner-mask-opacity", 0));
    } catch {}
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  useEffect(() => {
    window.addEventListener("garden-banner-changed", loadSettings);
    window.addEventListener("storage", loadSettings);
    return () => {
      window.removeEventListener("garden-banner-changed", loadSettings);
      window.removeEventListener("storage", loadSettings);
    };
  }, [loadSettings]);

  // ── Pointer drag for image position ────────────────

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    dragRef.current = { startY: e.clientY, startPos: posY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [posY]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !bannerRef.current) return;
    const h = bannerRef.current.clientHeight;
    if (h < 10) return;
    const dy = e.clientY - dragRef.current.startY;
    const deltaPercent = (dy / h) * 100;
    const newPos = Math.round(Math.max(0, Math.min(100, dragRef.current.startPos + deltaPercent)));
    setPosY(newPos);
  }, [dragging]);

  const onPointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    try { localStorage.setItem("garden-banner-pos", String(posY)); } catch {}
  }, [dragging, posY]);

  if (!src || HIDDEN_PATHS.includes(pathname) || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const blurPx = bannerBlur > 0 ? `${bannerBlur}px` : "0px";
  const showMask = maskOpacity > 0 && maskColor !== "transparent";
  const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src) || src.startsWith("data:video/") || src.startsWith("blob:") && src.includes("video");

  return (
    <div
      ref={bannerRef}
      className={`w-full overflow-hidden relative select-none group border-border ${
        dragging ? "cursor-grabbing" : hover ? "cursor-grab" : "cursor-default"
      } ${borderless ? "" : "border-b"}`}
      style={{
        height: `${height}px`,
        zIndex: 1,
        position: "relative",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); if (dragging) onPointerUp(); }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Media layer */}
      {isVideo ? (
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none"
          style={{
            objectPosition: `center ${posY}%`,
            opacity: bannerOpacity / 100,
            filter: blurPx !== "0px" ? `blur(${blurPx})` : "none",
          }}
        />
      ) : (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover pointer-events-none"
          style={{
            objectPosition: `center ${posY}%`,
            opacity: bannerOpacity / 100,
            filter: blurPx !== "0px" ? `blur(${blurPx})` : "none",
          }}
          draggable={false}
        />
      )}

      {/* Mask overlay */}
      {showMask && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: maskColor,
            opacity: maskOpacity / 100,
          }}
        />
      )}

      {/* Drag hint */}
      {hover && !dragging && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none transition-opacity">
          <span className="text-white text-xs bg-black/40 rounded-full px-3 py-1 backdrop-blur">
            🖐 拖拽调整图片位置
          </span>
        </div>
      )}
      {dragging && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-xs bg-black/50 rounded-full px-3 py-1 backdrop-blur pointer-events-none">
          位置: {posY}%
        </div>
      )}
    </div>
  );
}
