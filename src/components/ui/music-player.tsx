"use client";

// ============================================================
// Digital Garden 2.0 — Music Player v9
// ============================================================
// · 缩略按钮：深/浅双模适配，文字颜色跟随主题
// · 展开面板：新增音乐进度条（拖拽跳转 + 时间轴）
// · 音频可视化：修复逻辑，播放时稳定显示柱状频谱
// · loop mode 与 AudioProvider 无缝关联
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useAudio, type LoopMode } from "./audio-provider";
import { getAllTracks } from "@/lib/audio";
import { AudioVisualizer, getSharedAnalyser } from "./audio-visualizer";

const LOOP_TITLES: Record<LoopMode, string> = { one: "单曲循环", all: "列表循环", shuffle: "随机播放" };

// 单曲循环 = 顺时针环形箭头 + 下方 "1"；列表循环 = 纯环形箭头
export function LoopIcon({ mode, size = 12 }: { mode: LoopMode; size?: number }) {
  const s = size; const c = "currentColor";
  // 随机播放：交叉双箭头
  if (mode === "shuffle") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2 4 5.5 4 10 11 13.5 11" />
        <polyline points="11.5 9 13.5 11 11.5 13" />
        <polyline points="13.5 4 10.5 4 6 11 2.5 11" />
        <polyline points="4.5 9 2.5 11 4.5 13" />
      </svg>
    );
  }
  // 单曲/列表循环：clockwise near-full-circle arrow + optional "1"
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      {/* One sweep: from left (3,8) clockwise ~300° to bottom-left (4.5,13) */}
      <path d="M3 7A5.5 5.5 0 1 1 4.5 12.5" />
      {/* Arrowhead pointing clockwise (down-left, direction of travel) */}
      <polyline points="3 11.5 2.5 13.5 5 12.5" />
      {mode === "one" && (
        <text x="8" y="10.5" textAnchor="middle" fill={c} stroke="none" fontSize="7" fontWeight="bold">1</text>
      )}
    </svg>
  );
}

const DEFAULT_COVER = "/music-player/default-cover.png";

export function MusicPlayer() {
  const {
    enabled, trackId, volume, playing, loopMode,
    toggle, setTrack, setVolume, play, pause, next, prev, cycleLoop,
    currentTrack,
  } = useAudio();

  const [collapsed, setCollapsed] = useState(true);
  const [showList, setShowList] = useState(false);

  // ── Progress ───────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Track the global audio element
  useEffect(() => {
    const timer = setInterval(() => {
      const a = document.querySelector("audio[data-garden-audio]") as HTMLAudioElement | null;
      if (a) {
        audioRef.current = a;
        setCurrentTime(a.currentTime);
        setDuration(a.duration || 0);
        clearInterval(timer);
      }
    }, 200);
    return () => clearInterval(timer);
  }, [enabled, trackId]);

  // Sync progress via timeupdate
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => { setCurrentTime(a.currentTime); setDuration(a.duration || 0); };
    a.addEventListener("timeupdate", onTime);
    return () => a.removeEventListener("timeupdate", onTime);
  }, [enabled, trackId]);

  // ── Position ───────────────────────────────────────────
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const fracRef = useRef({ x: 0.88, y: 0.75 });
  const PLAYER_W = 280;

  const calcPos = (fx: number, fy: number) => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    const mw = collapsed ? 42 : PLAYER_W;
    const mh = collapsed ? 42 : 280;
    return {
      x: Math.max(0, Math.min(window.innerWidth - mw, Math.round(fx * window.innerWidth))),
      y: Math.max(0, Math.min(window.innerHeight - mh, Math.round(fy * window.innerHeight))),
    };
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gm-pos");
      if (raw) {
        const [x, y] = raw.split(",").map(Number);
        if (!isNaN(x) && !isNaN(y)) fracRef.current = { x, y };
      }
    } catch {}
    setMounted(true);
    setPos(calcPos(fracRef.current.x, fracRef.current.y));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const h = () => setPos(calcPos(fracRef.current.x, fracRef.current.y));
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [mounted, collapsed]);

  useEffect(() => {
    if (!mounted) return;
    setPos(calcPos(fracRef.current.x, fracRef.current.y));
  }, [collapsed, mounted]);

  // ── Smooth disc rotation ───────────────────────────────
  const discRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const rafRef = useRef(0);
  const lastTRef = useRef(0);

  useEffect(() => {
    if (!playing || !enabled) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const SPEED = 0.12;
    const spin = (ts: number) => {
      if (lastTRef.current) {
        const dt = ts - lastTRef.current;
        angleRef.current = (angleRef.current + SPEED * (dt / 16.67)) % 360;
        if (discRef.current) discRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      }
      lastTRef.current = ts;
      rafRef.current = requestAnimationFrame(spin);
    };
    lastTRef.current = 0;
    rafRef.current = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, enabled]);

  // ── Drag ────────────────────────────────────────────────
  const dragRef = useRef({ sx: 0, sy: 0, fx: 0, fy: 0, active: false });
  const moveDist = useRef(0);

  const onDown = (e: React.PointerEvent) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, fx: fracRef.current.x, fy: fracRef.current.y, active: true };
    moveDist.current = 0;
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.sx;
      const dy = e.clientY - dragRef.current.sy;
      moveDist.current = Math.abs(dx) + Math.abs(dy);
      if (moveDist.current > 3) {
        const fx = dragRef.current.fx + dx / window.innerWidth;
        const fy = dragRef.current.fy + dy / window.innerHeight;
        fracRef.current = { x: fx, y: fy };
        setPos(calcPos(fx, fy));
      }
    };
    const onUp = () => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      if (moveDist.current > 3) {
        let fx = fracRef.current.x;
        let fy = fracRef.current.y;
        const SNAP = 0.04;
        const GRID = 0.03;
        if (fx < SNAP) fx = 0; else if (fx > 1 - SNAP) fx = 1;
        if (fy < SNAP) fy = 0; else if (fy > 1 - SNAP) fy = 1;
        for (const g of [1/3, 1/2, 2/3]) {
          if (Math.abs(fx - g) < GRID) fx = g;
          if (Math.abs(fy - g) < GRID) fy = g;
        }
        fx = Math.max(0, Math.min(1, fx));
        fy = Math.max(0, Math.min(1, fy));
        fracRef.current = { x: fx, y: fy };
        try { localStorage.setItem("gm-pos", `${fx.toFixed(4)},${fy.toFixed(4)}`); } catch {}
        setPos(calcPos(fx, fy));
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, []);

  // ── Glow ────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !enabled) {
      document.documentElement.style.setProperty("--glow-opacity", "0");
      return;
    }
    const audio = document.querySelector("audio[data-garden-audio]") as HTMLAudioElement | null;
    if (!audio) return;

    const result = getSharedAnalyser(audio, {
      fftSize: 64,
      smoothingTimeConstant: 0.7,
      minDecibels: -90,
      maxDecibels: -10,
    });
    if (!result) return;
    const a2 = result.analyser;

    const d = new Uint8Array(32);
    let f = 0, eS = 0;
    const tick = () => {
      f = requestAnimationFrame(tick);
      a2.getByteFrequencyData(d);
      let s = 0;
      for (let i = 0; i < 16; i++) s += d[i];
      eS = eS * 0.7 + (s / (16 * 255)) * 0.3;
      document.documentElement.style.setProperty("--glow-speed", String(0.5 + eS * 3));
      document.documentElement.style.setProperty("--glow-opacity", String(0.3 + eS * 0.7));
    };
    tick();
    return () => { cancelAnimationFrame(f); document.documentElement.style.setProperty("--glow-opacity", "0"); };
  }, [playing, enabled]);

  // ── Progress formatting ─────────────────────────────────
  const fmtTime = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    const a = audioRef.current;
    if (!a || !duration) return;
    a.currentTime = (v / 100) * duration;
    setCurrentTime(a.currentTime);
  };

  // ── Expand direction ────────────────────────────────────
  const expandUp = typeof window !== "undefined" && pos.y > window.innerHeight - 300;

  // ═══════════════════════════════════════════════════════
  //  Collapsed
  // ═══════════════════════════════════════════════════════

  if (collapsed) {
    return (
      <div className="fixed z-50" style={{ left: pos.x, top: pos.y }} onPointerDown={onDown}>
        <button
          onClick={() => {
            if (moveDist.current < 4) {
              if (!enabled) toggle();
              setCollapsed(false);
            }
          }}
          className={`w-[42px] h-[42px] rounded-full flex items-center justify-center interactive shadow-lg text-base border
            ${playing
              ? "border-primary/40 bg-primary/15 text-primary garden-music-glow"
              : "border-border/60 bg-card/90 backdrop-blur text-foreground/70 hover:text-foreground hover:border-border"
            }
          `}
          title={enabled ? "展开播放器" : "开启音乐"}
        >
          🎵
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  //  Expanded
  // ═══════════════════════════════════════════════════════

  const allTracks = getAllTracks();

  return (
    <div className="fixed z-50" style={{ left: pos.x, top: pos.y }} onPointerDown={onDown}>
      {/* Playlist overlay */}
      {showList && (
        <div
          className={`absolute left-0 right-0 max-h-48 overflow-y-auto rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-xl p-2 z-10 ${
            expandUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wider px-2 py-1">播放列表</p>
          {allTracks.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTrack(t.id); if (!playing) play(); setShowList(false); }}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-[0.688rem] truncate interactive ${
                trackId === t.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {trackId === t.id ? "🎵 " : ""}{t.title}
            </button>
          ))}
        </div>
      )}

      {/* Main card */}
      <div
        className="garden-card backdrop-blur-xl overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ width: PLAYER_W }}
      >
        {/* ── Cover + Disc ── */}
        <div className="relative flex items-center justify-center pt-4 pb-1">
          <div
            ref={discRef}
            className="rounded-full shadow-lg"
            style={{
              width: 100, height: 100,
              background: `url(${DEFAULT_COVER}) center/cover no-repeat`,
              willChange: "transform",
            }}
          />
          <div
            className={`absolute rounded-full border-2 pointer-events-none transition-opacity duration-300 ${
              playing ? "border-primary/40 opacity-100" : "border-border opacity-0"
            }`}
            style={{ width: 104, height: 104 }}
          />
        </div>

        {/* ── Track Info ── */}
        <div className="text-center px-3 mb-0.5">
          <p className="text-[0.8rem] font-medium text-foreground truncate">
            {currentTrack?.title || "未选择曲目"}
          </p>
        </div>

        {/* ── Audio Visualizer ── */}
        <div className="px-3 mb-0.5 flex justify-center">
          <AudioVisualizer
            mode="bars"
            width={220}
            height={36}
            playing={playing && enabled}
          />
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center justify-center gap-2 px-3 pb-1">
          <CtrlBtn onClick={() => setShowList(!showList)} active={showList} title="播放列表">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </CtrlBtn>
          <CtrlBtn onClick={prev} title="上一首">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </CtrlBtn>

          <button
            onClick={playing ? pause : play}
            className={`w-9 h-9 rounded-full flex items-center justify-center interactive transition-all ${
              playing
                ? "bg-primary/15 text-primary hover:bg-primary/25"
                : "bg-primary text-white hover:bg-primary-hover"
            }`}
            title={playing ? "暂停" : "播放"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              {playing ? (
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              ) : (
                <path d="M8 5v14l11-7z"/>
              )}
            </svg>
          </button>

          <CtrlBtn onClick={next} title="下一首">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </CtrlBtn>

          <CtrlBtn onClick={cycleLoop} active={true} title={LOOP_TITLES[loopMode]}>
            <LoopIcon mode={loopMode} size={13} />
          </CtrlBtn>

          {/* Collapse */}
          <button
            onClick={() => setCollapsed(true)}
            className="text-[0.688rem] text-foreground/50 hover:text-foreground interactive shrink-0"
            title="最小化"
          >
            —
          </button>
        </div>

        {/* ── Volume ── */}
        <div className="px-2 pb-0.5 pt-0.5">
          <div className="flex items-center">
            <span className="text-[0.65rem] text-foreground/70 w-9 text-center leading-none shrink-0">
              {volume === 0 ? "🔇" : volume < 50 ? "🔉" : "🔊"}
            </span>
            <input
              type="range"
              min={0} max={100} step={5}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 mx-1.5"
              style={{ accentColor: "var(--color-primary)", height: 6, cursor: "pointer" }}
            />
            <span className="text-[0.65rem] text-foreground/70 tabular-nums text-right leading-none" style={{ width: "2.25rem", minWidth: "2.25rem" }}>
              {volume}
            </span>
          </div>
        </div>

        {/* ── Progress ── */}
        <div className="px-2 pb-3 pt-0.5">
          <div className="flex items-center">
            <span className="text-[0.65rem] text-foreground/70 tabular-nums w-9 text-right leading-none">
              {fmtTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={duration > 0 ? progressPct : 0}
              onChange={handleProgressChange}
              className="flex-1 mx-1.5"
              style={{ accentColor: "var(--color-primary)", height: 6, cursor: "pointer" }}
            />
            <span className="text-[0.65rem] text-foreground/70 tabular-nums text-right leading-none" style={{ width: "2.25rem", minWidth: "2.25rem" }}>
              {fmtTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small control button ──────────────────────────────────

function CtrlBtn({
  onClick, active, title, children,
}: {
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs interactive transition-colors ${
        active
          ? "bg-primary/15 text-primary"
          : "text-foreground/60 hover:text-foreground hover:bg-muted"
      }`}
      title={title}
    >
      {children}
    </button>
  );
}
