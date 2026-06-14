"use client";

// ============================================================
// Digital Garden 2.0 — Avatar Editor (crop + zoom + history)
// ============================================================
// CSS 驱动的圆形裁切预览 · 拖拽定位 · 缩放滑块 · 历史头像
// ============================================================

import { useState, useRef, useCallback, useEffect, type DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AvatarEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  currentAvatar: string | null;
}

const PREVIEW_SIZE = 240;
const OUTPUT_SIZE = 200;
const HISTORY_KEY = "garden-avatar-history";

function getHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToHistory(dataUrl: string) {
  try {
    const history = getHistory().filter((h) => h !== dataUrl);
    history.unshift(dataUrl);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 12)));
  } catch {}
}

export function AvatarEditor({ open, onClose, onSave, currentAvatar }: AvatarEditorProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const half = PREVIEW_SIZE / 2;

  // Reset + load history
  useEffect(() => {
    if (open) {
      setImage(null);
      setImageSrc(null);
      setZoom(1.2);
      setOffset({ x: 0, y: 0 });
      setHistory(getHistory());
    }
  }, [open]);

  // Load image from file or URL
  const loadImage = useCallback((src: string) => {
    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      setImageSrc(src);
      // Scale proportionally: longer side fills the circle diameter
      const maxDim = Math.max(img.naturalWidth, img.naturalHeight);
      const initZoom = PREVIEW_SIZE / maxDim;
      setZoom(Math.round(initZoom * 100) / 100);
      setOffset({ x: 0, y: 0 });
    };
    img.src = src;
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => loadImage(reader.result as string);
    reader.readAsDataURL(file);
  }, [loadImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // ── Drag ──────────────────────────────────────────

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!image) return;
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartOffset({ x: offset.x, y: offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragStartOffset.x + (e.clientX - dragStart.x),
      y: dragStartOffset.y + (e.clientY - dragStart.y),
    });
  };

  const handlePointerUp = () => setDragging(false);

  // ── Save ──────────────────────────────────────────

  const handleSave = useCallback(() => {
    if (!image) return;
    setSaving(true);

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setSaving(false); return; }

    const scale = OUTPUT_SIZE / PREVIEW_SIZE;
    const imgW = image.naturalWidth * zoom * scale;
    const imgH = image.naturalHeight * zoom * scale;
    const cx = OUTPUT_SIZE / 2;
    const cy = OUTPUT_SIZE / 2;

    // Circle clip
    ctx.beginPath();
    ctx.arc(cx, cy, cx, 0, Math.PI * 2);
    ctx.clip();

    // White bg
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // Draw image at centered position + offset
    const drawX = cx - imgW / 2 + offset.x * scale;
    const drawY = cy - imgH / 2 + offset.y * scale;
    ctx.drawImage(image, drawX, drawY, imgW, imgH);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    saveToHistory(dataUrl);
    onSave(dataUrl);
    setSaving(false);
    onClose();
  }, [image, zoom, offset, onSave, onClose]);

  // ── History select ────────────────────────────────

  const selectHistory = (src: string) => {
    loadImage(src);
  };

  // ── Modal drag ──────────────────────────────────

  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [modalDrag, setModalDrag] = useState(false);
  const modalDragRef = useRef({ sx: 0, sy: 0, fx: 0, fy: 0 });

  useEffect(() => {
    if (open && typeof window !== "undefined") {
      // Initial position: center-top area
      setModalPos({
        x: Math.max(0, (window.innerWidth - 380) / 2),
        y: Math.max(0, (window.innerHeight - 500) / 3),
      });
    }
  }, [open]);

  const handleModalDragDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setModalDrag(true);
    modalDragRef.current = { sx: e.clientX, sy: e.clientY, fx: modalPos.x, fy: modalPos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleModalDragMove = (e: React.PointerEvent) => {
    if (!modalDrag) return;
    const nx = modalDragRef.current.fx + (e.clientX - modalDragRef.current.sx);
    const ny = modalDragRef.current.fy + (e.clientY - modalDragRef.current.sy);
    setModalPos({
      x: Math.max(-100, Math.min(window.innerWidth - 280, nx)),
      y: Math.max(-40, Math.min(window.innerHeight - 100, ny)),
    });
  };

  const handleModalDragUp = () => setModalDrag(false);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute rounded-2xl border border-border bg-card shadow-2xl w-[380px] max-h-[85vh] overflow-y-auto"
          style={{ left: modalPos.x, top: modalPos.y }}
        >
          {/* ── Drag handle title bar ──────────────── */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-card/95 backdrop-blur border-b border-border rounded-t-2xl cursor-grab active:cursor-grabbing select-none"
            onPointerDown={handleModalDragDown}
            onPointerMove={handleModalDragMove}
            onPointerUp={handleModalDragUp}
            onPointerLeave={handleModalDragUp}
          >
            <span className="text-xs text-muted-foreground">⠿ 拖拽移动</span>
            <h3 className="text-sm font-semibold text-foreground">自定义头像</h3>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full bg-muted hover:bg-secondary interactive flex items-center justify-center text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="p-5"> {/* Content wrapper */}

          {/* ── Live preview with circle mask ────────── */}
          <div
            ref={containerRef}
            className="relative mx-auto mb-4 select-none"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, overflow: "hidden" }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* Image — centered via transform */}
            {image && (
              <img
                src={imageSrc!}
                alt=""
                className="absolute pointer-events-none max-w-none"
                draggable={false}
                style={{
                  width: image.naturalWidth * zoom,
                  height: image.naturalHeight * zoom,
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />
            )}

            {/* Circle mask: dark overlay outside, transparent inside */}
            <svg
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              className="absolute inset-0 pointer-events-none"
            >
              <defs>
                <mask id="avatar-mask">
                  <rect width={PREVIEW_SIZE} height={PREVIEW_SIZE} fill="white" />
                  <circle cx={half} cy={half} r={half - 3} fill="black" />
                </mask>
              </defs>
              <rect
                width={PREVIEW_SIZE}
                height={PREVIEW_SIZE}
                fill="rgba(0,0,0,0.55)"
                mask="url(#avatar-mask)"
              />
              <circle
                cx={half}
                cy={half}
                r={half - 3}
                fill="none"
                stroke="white"
                strokeWidth={2.5}
              />
            </svg>

            {/* Empty state */}
            {!image && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl mb-2">📷</span>
                <span className="text-xs text-muted-foreground">
                  {dragOver ? "✨ 松开放入" : "点击或拖放图片"}
                </span>
              </div>
            )}

            {!image && (
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            )}
          </div>

          {/* Hint */}
          {image && (
            <p className="text-center text-[0.625rem] text-muted-foreground -mt-2 mb-3">
              {dragging ? "松手定位" : "拖拽调整位置 · 滑块缩放"}
            </p>
          )}

          {/* ── Controls ─────────────────────────────── */}
          {image && (
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground shrink-0">缩放</span>
                <input
                  type="range"
                  min={0.3}
                  max={4}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: "var(--color-primary)" }}
                />
                <span className="text-[0.625rem] text-muted-foreground w-9 text-right">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-xs text-muted-foreground hover:text-foreground interactive"
              >
                🔄 更换图片
              </button>
            </div>
          )}

          {/* Hidden file input for re-upload */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* ── History ──────────────────────────────── */}
          {history.length > 0 && (
            <div className="mb-4">
              <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wider mb-2">
                历史头像
              </p>
              <div className="flex flex-wrap gap-2">
                {history.slice(0, 10).map((src, i) => (
                  <button
                    key={i}
                    onClick={() => selectHistory(src)}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-border hover:border-primary interactive transition-colors flex-shrink-0"
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Actions ──────────────────────────────── */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted interactive"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!image || saving}
              className="px-5 py-2 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-hover interactive disabled:opacity-50"
            >
              {saving ? "保存中…" : "确认"}
            </button>
          </div>
          </div>{/* End content wrapper */}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
