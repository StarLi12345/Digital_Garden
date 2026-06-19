"use client";

// ============================================================
// Digital Garden — Draggable Widget Container（可拖拽组件容器）
// ============================================================
// 改编自 Widget Wallpaper (3470738721) 的拖拽吸附系统
// · 自由拖拽 · 双击居中 · 四角吸附 · localStorage 持久位置
// ============================================================

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";

interface Position {
  x: number; // fraction 0-1
  y: number;
}

interface WidgetContainerProps {
  id: string;         // unique key for localStorage
  title?: string;
  defaultPos?: Position;
  children: ReactNode;
  className?: string;
  minWidth?: number;
  onClose?: () => void;
}

const SNAP_THRESHOLD = 0.04; // snap to edges within 4% of screen
const GRID_SNAP = 0.03;       // snap to 1/3 grid lines
const NEIGHBOR_SNAP = 0.025;  // snap to neighbor widget edges

// Shared registry of mounted widgets for cross-widget snapping
const mountedWidgets = new Map<string, { el: HTMLElement; pos: Position }>();

function snapToNeighbor(fx: number, fy: number, myId: string, myEl: HTMLElement): Position {
  let x = fx, y = fy;
  const myRect = myEl.getBoundingClientRect();
  const myW = myRect.width / window.innerWidth;
  const myH = myRect.height / window.innerHeight;

  for (const [id, info] of mountedWidgets) {
    if (id === myId) continue;
    const nRect = info.el.getBoundingClientRect();
    const nfx = nRect.left / (window.innerWidth - nRect.width);
    const nfy = nRect.top / (window.innerHeight - nRect.height);
    const nw = nRect.width / window.innerWidth;
    const nh = nRect.height / window.innerHeight;

    // Snap horizontally: my left to neighbor right, my right to neighbor left
    if (Math.abs(fx - (nfx + nw)) < NEIGHBOR_SNAP) x = nfx + nw;
    else if (Math.abs(fx + myW - nfx) < NEIGHBOR_SNAP) x = nfx - myW;
    else if (Math.abs(fx - nfx) < NEIGHBOR_SNAP) x = nfx; // align left edges

    // Snap vertically: my top to neighbor bottom, etc.
    if (Math.abs(fy - (nfy + nh)) < NEIGHBOR_SNAP) y = nfy + nh;
    else if (Math.abs(fy + myH - nfy) < NEIGHBOR_SNAP) y = nfy - myH;
    else if (Math.abs(fy - nfy) < NEIGHBOR_SNAP) y = nfy; // align top edges
  }

  return { x, y };
}

function snapToEdge(fx: number, fy: number): Position {
  let x = fx, y = fy;

  // Snap to screen edges
  if (fx < SNAP_THRESHOLD) x = 0;
  else if (fx > 1 - SNAP_THRESHOLD) x = 1;
  if (fy < SNAP_THRESHOLD) y = 0;
  else if (fy > 1 - SNAP_THRESHOLD) y = 1;

  // Snap to 1/3 and 1/2 grid lines
  for (const grid of [1/3, 1/2, 2/3]) {
    if (Math.abs(fx - grid) < GRID_SNAP) x = grid;
    if (Math.abs(fy - grid) < GRID_SNAP) y = grid;
  }

  // Clamp
  x = Math.max(0, Math.min(1, x));
  y = Math.max(0, Math.min(1, y));

  return { x, y };
}

function loadPos(id: string): Position | null {
  try {
    const raw = localStorage.getItem(`widget-pos-${id}`);
    if (!raw) return null;
    const [x, y] = raw.split(",").map(Number);
    if (!isNaN(x) && !isNaN(y) && x >= 0 && x <= 1 && y >= 0 && y <= 1) return { x, y };
  } catch {}
  return null;
}

function savePos(id: string, pos: Position) {
  try { localStorage.setItem(`widget-pos-${id}`, `${pos.x.toFixed(4)},${pos.y.toFixed(4)}`); } catch {}
}

export function WidgetContainer({
  id,
  title,
  defaultPos = { x: 0.88, y: 0.35 },
  children,
  className = "",
  onClose,
}: WidgetContainerProps) {
  const [pos, setPos] = useState<Position>(defaultPos);
  const [mounted, setMounted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ sx: 0, sy: 0, fx: 0, fy: 0, active: false, moved: false });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Init position
  useEffect(() => {
    const saved = loadPos(id);
    if (saved) setPos(saved);
    else setPos(defaultPos);
    setMounted(true);
  }, [id]);

  // Calculate pixel position from fraction
  const calcPixelPos = useCallback(
    (fx: number, fy: number) => {
      if (typeof window === "undefined") return { left: 0, top: 0 };
      const el = widgetRef.current;
      const w = el?.offsetWidth || 200;
      const h = el?.offsetHeight || 100;
      return {
        left: Math.round(fx * (window.innerWidth - w)),
        top: Math.round(fy * (window.innerHeight - h)),
      };
    },
    []
  );

  const [pixelPos, setPixelPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!mounted) return;
    setPixelPos(calcPixelPos(pos.x, pos.y));
    const onResize = () => setPixelPos(calcPixelPos(pos.x, pos.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mounted, pos.x, pos.y, calcPixelPos]);

  // Register for cross-widget snap detection
  useEffect(() => {
    if (!widgetRef.current) return;
    mountedWidgets.set(id, { el: widgetRef.current, pos });
    return () => { mountedWidgets.delete(id); };
  }, [id, pos]);

  // Drag handlers
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a, input")) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      fx: pos.x,
      fy: pos.y,
      active: true,
      moved: false,
    };
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.sx;
      const dy = e.clientY - dragRef.current.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        dragRef.current.moved = true;
        setDragging(true);
        const nfx = dragRef.current.fx + dx / window.innerWidth;
        const nfy = dragRef.current.fy + dy / window.innerHeight;
        setPixelPos(calcPixelPos(nfx, nfy));
      }
    };
    const onUp = () => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      setDragging(false);

      if (dragRef.current.moved) {
        // Calculate final fraction and snap
        const el = widgetRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const fx = rect.left / (window.innerWidth - rect.width);
        const fy = rect.top / (window.innerHeight - rect.height);
        let snapped = snapToEdge(
          Math.max(0, Math.min(1, fx)),
          Math.max(0, Math.min(1, fy))
        );
        // Then cross-widget snap
        snapped = snapToNeighbor(snapped.x, snapped.y, id, el);
        snapped.x = Math.max(0, Math.min(1, snapped.x));
        snapped.y = Math.max(0, Math.min(1, snapped.y));
        setPos(snapped);
        savePos(id, snapped);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [pos, id, calcPixelPos]);

  // Double-click to center
  const onDoubleClick = () => {
    const centered = { x: 0.5, y: 0.5 };
    setPos(centered);
    savePos(id, centered);
  };

  if (!mounted) return null;

  return (
    <div
      ref={widgetRef}
      className={`fixed z-40 garden-card backdrop-blur-md p-3 select-none ${
        dragging ? "cursor-grabbing shadow-xl" : "cursor-grab"
      } ${className}`}
      style={{
        left: pixelPos.left,
        top: pixelPos.top,
        minWidth: 160,
        touchAction: "none",
        transition: dragging ? "none" : "left 0.15s ease-out, top 0.15s ease-out",
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
    >
      {/* Title bar */}
      {title && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[0.625rem] text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[0.625rem] text-muted-foreground hover:text-foreground interactive"
            >
              ✕
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
