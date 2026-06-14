"use client";

// ============================================================
// Digital Garden — Digital Clock Widget（数字时钟组件）
// ============================================================
// 集成自 ZZZ TV clock.js (3333357727) + EVA clock (2255557200)
// · 8 种字体风格切换 · 12/24 小时 · emoji 分隔符闪烁
// ============================================================

import { useState, useEffect } from "react";

type ClockFont =
  | "dot"
  | "alarm"
  | "technology"
  | "open24"
  | "arcade"
  | "digital-7"
  | "gameover"
  | "pixel";

interface DigitalClockProps {
  format24h?: boolean;
  font?: ClockFont;
  showSeconds?: boolean;
  className?: string;
}

const FONT_FAMILIES: Record<ClockFont, string> = {
  dot: "'DotMatrix', 'Courier New', monospace",
  alarm: "'Alarm Clock', 'Courier New', monospace",
  technology: "'Technology', 'Courier New', monospace",
  open24: "'Open24', 'DS-Digital', 'Courier New', monospace",
  arcade: "'ARCADE_I', 'Press Start 2P', monospace",
  "digital-7": "'Digital-7', 'DS-Digital', 'Courier New', monospace",
  gameover: "'game_over', 'Courier New', monospace",
  pixel: "'LLPIXEL3', 'Courier New', monospace",
};

export function DigitalClock({
  format24h = true,
  font = "dot",
  showSeconds = false,
  className = "",
}: DigitalClockProps) {
  const [time, setTime] = useState(new Date());
  const [colonVisible, setColonVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date());
      setColonVisible((v) => !v);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const hours = time.getHours();
  const displayHours = format24h
    ? hours
    : hours > 12
    ? hours - 12
    : hours === 0
    ? 12
    : hours;

  const hh = String(displayHours).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");

  return (
    <span
      className={`font-mono tabular-nums tracking-wider select-none ${className}`}
      style={{
        fontFamily: FONT_FAMILIES[font],
        textShadow: font === "technology" || font === "arcade"
          ? "0 0 8px currentColor"
          : "none",
      }}
      title={time.toLocaleString("zh-CN")}
    >
      <span>{hh[0]}</span>
      <span>{hh[1]}</span>
      <span
        className="mx-0.5 transition-opacity duration-100"
        style={{ opacity: colonVisible ? 1 : 0.15 }}
      >
        :
      </span>
      <span>{mm[0]}</span>
      <span>{mm[1]}</span>
      {showSeconds && (
        <>
          <span
            className="mx-0.5 transition-opacity duration-100"
            style={{ opacity: colonVisible ? 1 : 0.15 }}
          >
            :
          </span>
          <span>{ss[0]}</span>
          <span>{ss[1]}</span>
        </>
      )}
    </span>
  );
}
