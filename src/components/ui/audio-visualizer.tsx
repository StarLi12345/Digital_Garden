"use client";

// ============================================================
// Digital Garden — Audio Spectrum Visualizer v3
// ============================================================
// · 共享 AudioContext + MediaElementSource —— 全局单例，避免
//   createMediaElementSource 被多次调用导致的 race condition
// · 音乐播放器 glow 效果和可视化的柱状频谱共用同一个 source
// · getSharedAnalyser 可以多次调用，每次创建新的 AnalyserNode
//   挂载在共享 source 上
// ============================================================

import { useEffect, useRef } from "react";

export type VizMode = "radial" | "bars" | "wave";

interface AudioVisualizerProps {
  mode?: VizMode;
  width?: number;
  height?: number;
  color?: string;
  playing: boolean;
}

// ── Shared singleton ──────────────────────────────────

let sharedAudioCtx: AudioContext | null = null;
let sharedSource: MediaElementAudioSourceNode | null = null;

export interface AnalyserOpts {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
}

/**
 * 获取（或创建）共享的 AudioContext + MediaElementSource，
 * 然后在共享 source 上创建一个新的 AnalyserNode。
 *
 * - 第一次调用：创建 AudioContext → createMediaElementSource → 挂载 analyser
 * - 后续调用：复用已有的 context + source，只创建新的 analyser 节点
 *
 * 避免了对同一个 <audio> 重复调用 createMediaElementSource 导致的错误。
 */
export function getSharedAnalyser(
  audio: HTMLAudioElement,
  opts: AnalyserOpts = {}
): { analyser: AnalyserNode; ctx: AudioContext } | null {
  const {
    fftSize = 256,
    smoothingTimeConstant = 0.6,
    minDecibels = -90,
    maxDecibels = -10,
  } = opts;

  // Already have source → just add a new analyser node
  if (sharedAudioCtx && sharedAudioCtx.state !== "closed" && sharedSource) {
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
    const analyser = sharedAudioCtx.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothingTimeConstant;
    analyser.minDecibels = minDecibels;
    analyser.maxDecibels = maxDecibels;
    sharedSource.connect(analyser);
    return { analyser, ctx: sharedAudioCtx };
  }

  // First-time setup
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    sharedAudioCtx = ctx;
    const src = ctx.createMediaElementSource(audio);

    // Connect source → destination (pass-through so audio still plays)
    src.connect(ctx.destination);

    sharedSource = src;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothingTimeConstant;
    analyser.minDecibels = minDecibels;
    analyser.maxDecibels = maxDecibels;
    src.connect(analyser);

    return { analyser, ctx };
  } catch {
    // Source already created by external code (shouldn't happen with this
    // singleton, but guard anyway)
    if (sharedAudioCtx && sharedSource) {
      const analyser = sharedAudioCtx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothingTimeConstant;
      analyser.minDecibels = minDecibels;
      analyser.maxDecibels = maxDecibels;
      sharedSource.connect(analyser);
      return { analyser, ctx: sharedAudioCtx };
    }
    return null;
  }
}

/** 关闭共享 context（一般不调用，留给 app 卸载时） */
export function closeSharedAudio() {
  if (sharedAudioCtx && sharedAudioCtx.state !== "closed") {
    sharedAudioCtx.close().catch(() => {});
  }
  sharedAudioCtx = null;
  sharedSource = null;
}

// ═══════════════════════════════════════════════════════
//  AudioVisualizer component
// ═══════════════════════════════════════════════════════

export function AudioVisualizer({
  mode = "bars",
  width = 240,
  height = 48,
  color,
  playing,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const audio = document.querySelector("audio[data-garden-audio]") as HTMLAudioElement | null;
    if (!audio) return;

    // Only create a new analyser if we don't already have one
    if (!analyserRef.current) {
      const result = getSharedAnalyser(audio, {
        fftSize: 256,
        smoothingTimeConstant: 0.6,
        minDecibels: -90,
        maxDecibels: -10,
      });
      if (!result) return;
      analyserRef.current = result.analyser;
    }

    const analyser = analyserRef.current;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    // Resume AudioContext if suspended (autoplay policy)
    if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Read current theme color every frame — follows live theme switches
      const vizColor = color || getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim() || "#7a9668";

      const w = canvas.width;
      const h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);

      if (mode === "radial") {
        drawRadial(ctx2d, dataArray, w, h, vizColor);
      } else if (mode === "wave") {
        drawWave(ctx2d, dataArray, w, h, vizColor);
      } else {
        drawBars(ctx2d, dataArray, w, h, vizColor);
      }
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [playing, mode, color]);

  return (
    <canvas
      ref={canvasRef}
      width={width * 2}
      height={height * 2}
      className="block"
      style={{ width, height, imageRendering: "auto" }}
    />
  );
}

// ── Bar Spectrum — 镜像山峰，两侧对称 ─────────────

function drawBars(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  w: number,
  h: number,
  color: string
) {
  const barCount = 24;
  const half = barCount / 2; // 12 — each side mirrors the other
  const gap = 2;
  const totalGap = gap * (barCount + 1);
  const barWidth = Math.max(2, (w - totalGap) / barCount);
  const maxH = h;
  const bins = data.length; // 128 for fftSize=256

  for (let i = 0; i < barCount; i++) {
    // ══ Mirror index: both halves map to the same frequency bins ══
    // i=0 → mirror=0 (edge), i=11 → mirror=11 (center)
    // i=12 → mirror=11 (center), i=23 → mirror=0 (edge)
    const mirror = i < half ? i : barCount - 1 - i;

    // Logarithmic bin mapping: mirror=0→bass (edge), mirror=11→treble (center)
    // Limit to the first ~64 bins where most music has energy
    const t = 1 - mirror / (half - 1);
    const minBin = 2, maxBin = Math.floor(bins * 0.55); // ~70
    const binIdx = Math.floor(minBin * Math.pow(maxBin / minBin, t));
    let val = data[binIdx] / 255;

    // Smooth over neighboring bins for treble (mirror near center) to avoid dead spots
    if (mirror > half - 4 && binIdx - 2 >= 0) {
      val = (val + data[binIdx - 1] / 255 + data[binIdx - 2] / 255) / 3;
    }

    // ══ Mountain profile: edges peaked (bass), center tapered (treble) ══
    const dist = (half - 1 - mirror) / (half - 1); // 0=center, 1=edge
    const mountain = 0.7 + dist * 1.8; // 0.7 center → 2.5 edges  (wider range)
    val = Math.min(1, val * mountain);

    // Lift curve — moderate: preserve dynamic range
    val = Math.pow(val, 0.65);

    const minH = 2;
    const barH = Math.max(minH, val * maxH);

    const x = gap + i * (barWidth + gap);

    // Color: edge (bass) = full theme color, center (treble) = lighter tint
    const alpha = 0.25 + val * 0.75;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    // Blend toward white at center for extra differentiation
    const blend = 0.15 * (1 - dist); // 15% white at center, 0% at edge
    const rr = Math.round(r + (255 - r) * blend);
    const gg = Math.round(g + (255 - g) * blend);
    const bb = Math.round(b + (255 - b) * blend);

    ctx.fillStyle = `rgba(${rr},${gg},${bb},${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.roundRect(x, h - barH, barWidth, barH, [3, 3, 0, 0]);
    ctx.fill();
  }
}

// ── Waveform ─────────────────────────────────────

function drawWave(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  w: number,
  h: number,
  color: string
) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";

  const step = Math.floor(data.length / 64);
  const midY = h / 2;

  for (let i = 0; i < 64; i++) {
    let val = data[i * step] / 255;
    val = Math.pow(val, 0.8);
    const x = (i / 63) * w;
    const y = midY + (val - 0.5) * h * 0.8;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.stroke();

  // Mirror
  ctx.beginPath();
  ctx.strokeStyle = color + "99";
  ctx.lineWidth = 1;
  for (let i = 0; i < 64; i++) {
    let val = data[i * step] / 255;
    val = Math.pow(val, 0.8);
    const x = (i / 63) * w;
    const y = midY - (val - 0.5) * h * 0.8;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// ── Radial / Circular Spectrum ───────────────────

function drawRadial(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  w: number,
  h: number,
  color: string
) {
  const cx = w / 2;
  const cy = h / 2;
  const barCount = 64;
  const radius = Math.min(w, h) / 4;
  const maxLen = radius * 0.8;

  for (let i = 0; i < barCount; i++) {
    let val = data[i % data.length] / 255;
    val = Math.pow(val, 0.7);
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
    const barLen = Math.max(2, val * maxLen);

    const alpha = 0.15 + val * 0.85;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.lineTo(
      cx + Math.cos(angle) * (radius + barLen),
      cy + Math.sin(angle) * (radius + barLen)
    );
    ctx.stroke();
  }
}
