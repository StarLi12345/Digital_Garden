"use client";

// ============================================================
// Digital Garden — Cover Image (飞书风格 v2)
// ============================================================
// 醒目的全宽条幅 · 悬停出现更换/移除 · URL/上传/Ctrl+V
// ============================================================

import { useState, useRef, useCallback, useEffect, type DragEvent } from "react";

const COVER_HEIGHT = "220px";
const COVER_HEIGHT_EMPTY = "72px";

const PRESET_COVERS = [
  { src: "/backgrounds/garden-01.jpg", label: "午后阳光" },
  { src: "/backgrounds/garden-02.jpg", label: "林间小路" },
  { src: "/backgrounds/garden-03.jpg", label: "花园小径" },
  { src: "/backgrounds/garden-04.png", label: "草木之间" },
  { src: "/backgrounds/moonlight-01.jpg", label: "星夜" },
  { src: "/backgrounds/moonlight-02.jpg", label: "月下" },
];

interface CoverImageProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function CoverImage({ value, onChange }: CoverImageProps) {
  const [hover, setHover] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Ctrl+V paste: works when editor ISN'T focused ──────
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const active = document.activeElement;
      // Only handle paste if not inside an editable area
      if (active && (
        (active as HTMLElement).contentEditable === "true" ||
        active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA"
      )) return;

      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleFile(file);
          return;
        }
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, []);

  // ── File handling ────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    // Accept by extension as fallback (file.type can be empty)
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const validExts = ["jpg","jpeg","png","gif","webp","svg","bmp","mp4","webm","ogg","mov","avi","mkv"];
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/") && !validExts.includes(ext)) return;
    // Use object URL — instant, no memory issues
    const blobUrl = URL.createObjectURL(file);
    onChange(blobUrl);
    setShowPanel(false);
  }, [onChange]);

  const handleUrlApply = () => {
    const url = urlInput.trim();
    if (!url) return;
    onChange(url);
    setUrlInput("");
    setShowPanel(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── Detect video ────────────────────────────────────

  const isVideo = value
    ? /\.(mp4|webm|ogg|mov)(\?|$)/i.test(value) || value.startsWith("data:video/") || (value.startsWith("blob:") && value.includes("video"))
    : false;

  // ── Render: has cover image ──────────────────────────

  if (value) {
    return (
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg group"
        style={{ maxHeight: COVER_HEIGHT, height: "auto" }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {isVideo ? (
          <video
            src={value}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={value}
            alt="封面图"
            className="w-full h-full object-cover"
          />
        )}

        {/* Hover overlay with controls */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-center pb-4 gap-2 transition-opacity duration-200 ${hover ? "opacity-100" : "opacity-0"}`}>
          <button
            onClick={() => { fileRef.current?.click(); }}
            className="rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-white interactive shadow"
          >
            🖼 更换封面
          </button>
          <button
            onClick={() => { setShowPanel(true); }}
            className="rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-white interactive shadow"
          >
            🔗 链接
          </button>
          <button
            onClick={() => onChange(null)}
            className="rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-white interactive shadow"
          >
            ✕ 移除
          </button>
        </div>

        <input
          type="file"
          ref={fileRef}
          accept="image/*,video/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          className="hidden"
        />

        {/* URL input popup */}
        {showPanel && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-xl border border-gray-200 px-3 py-2">
              <input
                type="text" value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleUrlApply(); if (e.key === "Escape") setShowPanel(false); }}
                placeholder="粘贴图片 URL…"
                autoFocus
                className="text-xs bg-transparent border-b border-gray-300 px-1 py-0.5 focus:outline-none focus:border-primary w-56"
              />
              <button onClick={handleUrlApply} className="text-xs px-2 py-1 rounded bg-primary text-white hover:bg-primary-hover interactive">确定</button>
              <button onClick={() => setShowPanel(false)} className="text-xs text-gray-400 hover:text-gray-600 interactive">✕</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render: no cover (empty state) ────────────────────

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-lg border-2 border-dashed transition-all duration-200 ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
      style={{ height: dragOver ? COVER_HEIGHT : COVER_HEIGHT_EMPTY }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
        {(hover || dragOver) ? (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground interactive"
              >
                📁 上传封面
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowPanel(true); }}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground interactive"
              >
                🔗 粘贴链接
              </button>
            </div>

            {/* Preset covers */}
            <div className="flex items-center gap-2 mt-2">
              {PRESET_COVERS.map((c) => (
                <button
                  key={c.src}
                  onClick={(e) => { e.stopPropagation(); onChange(c.src); }}
                  className="w-12 h-8 rounded overflow-hidden border border-border hover:border-primary interactive transition-colors"
                  title={c.label}
                >
                  <img src={c.src} alt={c.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </>
        ) : (
          <span className="text-xs text-muted-foreground/30">添加封面 — 悬停或拖放图片</span>
        )}
      </div>

      <input
        type="file"
        ref={fileRef}
        accept="image/*,video/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        className="hidden"
      />

      {/* URL input popup */}
      {showPanel && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 bg-card rounded-lg shadow-xl border border-border px-3 py-2">
            <input
              type="text" value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleUrlApply(); if (e.key === "Escape") setShowPanel(false); }}
              placeholder="粘贴图片 URL…"
              autoFocus
              className="text-xs bg-transparent border-b border-border px-1 py-0.5 focus:outline-none focus:border-primary w-56 text-foreground"
            />
            <button onClick={handleUrlApply} className="text-xs px-2 py-1 rounded bg-primary text-white hover:bg-primary-hover interactive">确定</button>
            <button onClick={() => setShowPanel(false)} className="text-xs text-muted-foreground hover:text-foreground interactive">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
