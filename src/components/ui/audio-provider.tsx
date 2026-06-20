"use client";

// ============================================================
// Digital Garden — Audio Provider v3（彻底重构）
// ============================================================
// 所有音频逻辑集中于此。MusicPlayer 只是纯 UI。
// · ended 处理器使用 ref 读取最新状态（零闭包过期问题）
// · loopMode/volume/track 全部 localStorage 持久化
// · "one" 模式用原生 loop, 其余用 ended → advance
// ============================================================

import {
  createContext, useContext, useState, useEffect, useRef, useCallback,
  type ReactNode,
} from "react";
import {
  AUDIO_TRACKS, getAllTracks,
  BGM_ENABLED_KEY, BGM_TRACK_KEY, BGM_VOLUME_KEY,
} from "@/lib/audio";

// ── Types ─────────────────────────────────────────────

export type LoopMode = "one" | "all" | "shuffle";

const LOOP_KEY = "gm-loop";
const LOOP_CYCLE: LoopMode[] = ["one", "all", "shuffle"];

interface AudioState {
  enabled: boolean;
  trackId: string;
  volume: number;
  playing: boolean;
  loopMode: LoopMode;
  toggle: () => void;
  setTrack: (id: string) => void;
  setVolume: (v: number) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  cycleLoop: () => void;
  setLoopMode: (mode: LoopMode) => void;
  currentTrack: { id: string; title: string } | null;
  allTracks: { id: string; title: string }[];
}

const AudioCtx = createContext<AudioState | null>(null);

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

// ── localStorage helpers ──────────────────────────────

function storedStr(key: string, fallback: string): string {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function storedNum(key: string, fallback: number): number {
  try { const v = localStorage.getItem(key); return v ? Number(v) : fallback; } catch { return fallback; }
}
function storedBool(key: string, fallback: boolean): boolean {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v === "true"; } catch { return fallback; }
}
function storedLoop(): LoopMode {
  try {
    const v = localStorage.getItem(LOOP_KEY);
    if (v && LOOP_CYCLE.includes(v as LoopMode)) return v as LoopMode;
  } catch {}
  return "shuffle";
}

// ── Provider ──────────────────────────────────────────

export function AudioProvider({ children }: { children: ReactNode }) {
  // ── State ─────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [trackId, setTrackId] = useState(AUDIO_TRACKS[0].id);
  const [volume, setVol] = useState(40);
  const [playing, setPlaying] = useState(false);
  const [loopMode, setLoopMode] = useState<LoopMode>("shuffle");

  // ── Refs — always fresh, used inside event handlers ────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIdRef = useRef(trackId);
  const loopRef = useRef<LoopMode>("shuffle");
  const volRef = useRef(40);
  const playIntentRef = useRef(false);

  // Shuffle
  const shufListRef = useRef<string[]>([]);
  const shufIdxRef = useRef(0);

  // ── Init from localStorage ────────────────────────────
  useEffect(() => {
    const t = storedStr(BGM_TRACK_KEY, AUDIO_TRACKS[0].id);
    const v = storedNum(BGM_VOLUME_KEY, 40);
    const e = storedBool(BGM_ENABLED_KEY, true);
    const l = storedLoop();
    trackIdRef.current = t;
    loopRef.current = l;
    volRef.current = v;
    setTrackId(t);
    setVol(v);
    setEnabled(e);
    setLoopMode(l);
    setMounted(true);
  }, []);

  // ── Keep refs in sync ─────────────────────────────────
  useEffect(() => { trackIdRef.current = trackId; }, [trackId]);
  useEffect(() => { loopRef.current = loopMode; }, [loopMode]);
  useEffect(() => { volRef.current = volume; }, [volume]);

  // ── Create <audio> element ONCE ───────────────────────
  useEffect(() => {
    if (!mounted) return;
    const a = new Audio();
    a.volume = volRef.current / 100;
    a.preload = "auto";
    a.style.display = "none";
    a.setAttribute("data-garden-audio", "");
    document.body.appendChild(a);
    audioRef.current = a;
    return () => { a.pause(); a.src = ""; a.remove(); audioRef.current = null; };
  }, [mounted]);

  // ── Native loop attribute ─────────────────────────────
  // 必须和 src 设置同步 —— 因为浏览器在设置 .src 后会重置 .loop
  const syncLoop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.loop = loopRef.current === "one";
    }
  }, []);

  useEffect(() => { syncLoop(); }, [loopMode, syncLoop]);

  // ── Resume playback on first user interaction ─────────
  // Browsers block autoplay with sound — retry on first click/tap/keypress.
  useEffect(() => {
    if (!mounted) return;
    const resume = () => {
      const a = audioRef.current;
      if (!a) return;
      if (!enabled) return;
      if (!a.paused) return; // already playing
      if (a.src) {
        a.play().then(() => setPlaying(true)).catch(() => {});
        playIntentRef.current = true;
      } else {
        const track = getAllTracks().find((t) => t.id === trackIdRef.current);
        if (track) {
          a.src = track.path;
          a.load();
          syncLoop();
          a.play().then(() => setPlaying(true)).catch(() => {});
          playIntentRef.current = true;
        }
      }
    };
    const once = () => { resume(); cleanup(); };
    const events = ["click", "keydown", "touchstart"];
    for (const e of events) document.addEventListener(e, once, { once: true });
    const cleanup = () => {
      for (const e of events) document.removeEventListener(e, once);
    };
    return cleanup;
  }, [mounted, enabled, syncLoop]);

  // ── Volume sync ──────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  // ── Track change → load + auto-play ──────────────────
  const loadAndPlay = useCallback((id: string, intent: boolean) => {
    const a = audioRef.current;
    if (!a) return;
    const track = getAllTracks().find((t) => t.id === id);
    if (!track) return;
    a.src = track.path;
    a.load();
    syncLoop(); // 浏览器在设置 src 后会重置 loop，重新应用
    if (intent) {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [syncLoop]);

  useEffect(() => {
    if (!mounted) return;
    loadAndPlay(trackId, playIntentRef.current);
  }, [trackId, mounted, loadAndPlay]);

  // ── Enabled toggle ────────────────────────────────────
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !mounted) return;
    if (enabled) {
      const track = getAllTracks().find((t) => t.id === trackIdRef.current);
      if (track && !a.src.includes(track.path)) {
        a.src = track.path;
        a.load();
        syncLoop(); // 浏览器在设置 src 后会重置 loop
      }
      a.play().then(() => { setPlaying(true); playIntentRef.current = true; }).catch(() => setPlaying(false));
    } else {
      a.pause();
      setPlaying(false);
      playIntentRef.current = false;
    }
  }, [enabled, mounted, syncLoop]);

  // ── Build shuffle list ────────────────────────────────
  const buildShuffle = useCallback(() => {
    const ids = getAllTracks().map((t) => t.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    shufListRef.current = ids;
    shufIdxRef.current = 0;
  }, []);

  // ═══════════════════════════════════════════════════════
  //  EVENT LISTENERS — the core engine
  // ═══════════════════════════════════════════════════════

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !mounted) return;

    const onPlay = () => { setPlaying(true); playIntentRef.current = true; };
    const onPause = () => {
      // Don't mark as paused if the audio is seeking or changing src
      if (a.readyState >= 2 && !a.ended) {
        setPlaying(false);
        playIntentRef.current = false;
      }
    };
    const onError = () => { console.warn("Audio error"); setPlaying(false); };

    // ★★★ THE ENDED HANDLER ★★★
    const onEnded = () => {
      const mode = loopRef.current;        // fresh via ref
      const all = getAllTracks();

      if (mode === "one") {
        // 单曲循环 — 原生 loop 属性应已处理，此处作为保险 fallback
        syncLoop(); // 确保 loop 属性仍正确
        a.currentTime = 0;
        a.play().then(() => setPlaying(true)).catch(() => {});
        return;
      }

      if (mode === "all") {
        const idx = all.findIndex((t) => t.id === trackIdRef.current);
        const nextId = all[(idx + 1) % all.length].id;
        trackIdRef.current = nextId;
        try { localStorage.setItem(BGM_TRACK_KEY, nextId); } catch {}
        playIntentRef.current = true;
        setTrackId(nextId);
        return;
      }

      if (mode === "shuffle") {
        if (shufListRef.current.length === 0) buildShuffle();
        const list = shufListRef.current;
        let si = shufIdxRef.current;

        // Pick next; regenerate if exhausted
        if (si >= list.length - 1) {
          buildShuffle();
          si = 0;
          shufIdxRef.current = 0;
        } else {
          si++;
          shufIdxRef.current = si;
        }

        const nextId = shufListRef.current[si];
        // 防止连续播放同一首（shuffle 重排后可能撞到当前曲）
        if (nextId === trackIdRef.current && list.length > 1) {
          // 跳到下一个
          const nextSi = si + 1 >= list.length ? 0 : si + 1;
          shufIdxRef.current = nextSi;
          const altId = shufListRef.current[nextSi];
          trackIdRef.current = altId;
          try { localStorage.setItem(BGM_TRACK_KEY, altId); } catch {}
          playIntentRef.current = true;
          setTrackId(altId);
        } else {
          trackIdRef.current = nextId;
          try { localStorage.setItem(BGM_TRACK_KEY, nextId); } catch {}
          playIntentRef.current = true;
          setTrackId(nextId);
        }
        return;
      }

    };

    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);

    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
    };
  }, [mounted, buildShuffle]);

  // ── Actions ───────────────────────────────────────────

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(BGM_ENABLED_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const setTrack = useCallback((id: string) => {
    trackIdRef.current = id;
    playIntentRef.current = true;
    setTrackId(id);
    try { localStorage.setItem(BGM_TRACK_KEY, id); } catch {}
  }, []);

  const setVolume = useCallback((v: number) => {
    setVol(v);
    try { localStorage.setItem(BGM_VOLUME_KEY, String(v)); } catch {}
  }, []);

  const play = useCallback(() => {
    playIntentRef.current = true;
    audioRef.current?.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    playIntentRef.current = false;
    audioRef.current?.pause();
  }, []);

  const advance = useCallback((delta: 1 | -1) => {
    const mode = loopRef.current;
    const all = getAllTracks();

    if (mode === "shuffle") {
      // ── Navigate within the shuffle list ──────────────
      let list = shufListRef.current;
      if (list.length === 0) buildShuffle();
      list = shufListRef.current;

      // Sync: find current track in shuffle list
      const curPos = list.indexOf(trackIdRef.current);
      if (curPos !== -1) {
        shufIdxRef.current = curPos;
      } else {
        // Track not in shuffle list (e.g. manually selected) — rebuild
        buildShuffle();
        list = shufListRef.current;
        const pos = list.indexOf(trackIdRef.current);
        shufIdxRef.current = pos !== -1 ? pos : 0;
      }

      let newIdx = shufIdxRef.current + delta;

      if (delta === 1) {
        // Next: advance or regenerate at end
        if (newIdx >= list.length) {
          buildShuffle();
          list = shufListRef.current;
          // Keep current track at start so "prev" can go back to it
          const pos = list.indexOf(trackIdRef.current);
          if (pos !== -1) { list.splice(pos, 1); list.unshift(trackIdRef.current); }
          shufIdxRef.current = 0;
          newIdx = 1;
          if (newIdx >= list.length) newIdx = 0;
        }
      } else {
        // Prev: step back, wrap to end
        if (newIdx < 0) newIdx = list.length - 1;
      }

      shufIdxRef.current = newIdx;
      const nextId = list[newIdx];
      trackIdRef.current = nextId;
      playIntentRef.current = true;
      try { localStorage.setItem(BGM_TRACK_KEY, nextId); } catch {}
      setTrackId(nextId);
      return;
    }

    // ── Sequential: "one" / "all" ──────────────────────
    const idx = all.findIndex((t) => t.id === trackIdRef.current);
    const nextId = all[(idx + delta + all.length) % all.length].id;
    trackIdRef.current = nextId;
    playIntentRef.current = true;
    try { localStorage.setItem(BGM_TRACK_KEY, nextId); } catch {}
    setTrackId(nextId);
  }, [buildShuffle]);

  const next = useCallback(() => advance(1), [advance]);
  const prev = useCallback(() => advance(-1), [advance]);

  const cycleLoop = useCallback(() => {
    const idx = LOOP_CYCLE.indexOf(loopRef.current);
    const n = LOOP_CYCLE[(idx + 1) % LOOP_CYCLE.length];
    loopRef.current = n;
    try { localStorage.setItem(LOOP_KEY, n); } catch {}
    if (n === "shuffle") buildShuffle();
    setLoopMode(n);
  }, [buildShuffle]);

  const setLoop = useCallback((mode: LoopMode) => {
    loopRef.current = mode;
    try { localStorage.setItem(LOOP_KEY, mode); } catch {}
    if (mode === "shuffle") buildShuffle();
    setLoopMode(mode);
  }, [buildShuffle]);

  const currentTrack = getAllTracks().find((t) => t.id === trackId) || null;
  const allTracks = getAllTracks().map((t) => ({ id: t.id, title: t.title }));

  return (
    <AudioCtx.Provider
      value={{
        enabled, trackId, volume, playing, loopMode,
        toggle, setTrack, setVolume, play, pause, next, prev, cycleLoop, setLoopMode: setLoop,
        currentTrack: currentTrack ? { id: currentTrack.id, title: currentTrack.title } : null,
        allTracks,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
}
