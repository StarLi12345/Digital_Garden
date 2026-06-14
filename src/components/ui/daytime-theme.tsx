"use client";

// ============================================================
// Digital Garden — Daytime Dynamic Theme（昼夜动态主题）
// ============================================================
// 灵感来自 Day/Night-Cycle clock (1373816444)
// 随真实时间变化，自动调整页面整体色调与氛围
// · 六时段：黎明/早晨/正午/午后/黄昏/夜晚
// · 可选天气联动（需要 OpenWeather API Key）
// · CSS 变量驱动，全局平滑过渡
// ============================================================

import { useEffect, useRef } from "react";

type TimePeriod = "dawn" | "morning" | "noon" | "afternoon" | "dusk" | "night";

interface PeriodColors {
  warmth: number;       // 0-1 warm tint intensity
  brightness: number;   // -0.1 to 0.1 brightness offset
  saturation: number;   // 0.8-1.2 saturation multiplier
  skyTop: string;       // gradient color
  skyBottom: string;
  overlayOpacity: number;
}

const PERIODS: Record<TimePeriod, { hours: [number, number]; colors: PeriodColors }> = {
  night: {
    hours: [21, 5],
    colors: {
      warmth: 0.1, brightness: -0.08, saturation: 0.85,
      skyTop: "#0a0a2e", skyBottom: "#1a1a3e",
      overlayOpacity: 0.15,
    },
  },
  dawn: {
    hours: [5, 7],
    colors: {
      warmth: 0.7, brightness: -0.02, saturation: 0.9,
      skyTop: "#2d1b69", skyBottom: "#e8856b",
      overlayOpacity: 0.2,
    },
  },
  morning: {
    hours: [7, 11],
    colors: {
      warmth: 0.35, brightness: 0.03, saturation: 0.95,
      skyTop: "#4a90d9", skyBottom: "#f0e6d3",
      overlayOpacity: 0.08,
    },
  },
  noon: {
    hours: [11, 14],
    colors: {
      warmth: 0.15, brightness: 0.06, saturation: 1.0,
      skyTop: "#5599dd", skyBottom: "#ffffff",
      overlayOpacity: 0.03,
    },
  },
  afternoon: {
    hours: [14, 17],
    colors: {
      warmth: 0.4, brightness: 0.02, saturation: 0.95,
      skyTop: "#5b8cce", skyBottom: "#f5e6c8",
      overlayOpacity: 0.06,
    },
  },
  dusk: {
    hours: [17, 19],
    colors: {
      warmth: 0.8, brightness: -0.04, saturation: 0.9,
      skyTop: "#4a2080", skyBottom: "#f08050",
      overlayOpacity: 0.22,
    },
  },
};

// Weather mood modifiers
const WEATHER_MODS: Record<string, Partial<PeriodColors>> = {
  Clouds: { saturation: 0.9, brightness: -0.02, overlayOpacity: 0.05 },
  Rain: { saturation: 0.8, brightness: -0.05, overlayOpacity: 0.08 },
  Drizzle: { saturation: 0.85, brightness: -0.03, overlayOpacity: 0.05 },
  Thunderstorm: { saturation: 0.75, brightness: -0.07, overlayOpacity: 0.12 },
  Snow: { saturation: 0.7, brightness: 0.02, overlayOpacity: 0.06 },
  Mist: { saturation: 0.8, brightness: -0.02, overlayOpacity: 0.06 },
  Haze: { saturation: 0.85, brightness: 0, overlayOpacity: 0.04 },
  Clear: {},
};

function getPeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 11) return "morning";
  if (hour >= 11 && hour < 14) return "noon";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 19) return "dusk";
  return "night";
}

// Smooth interpolation factor within a period (0-1)
function periodProgress(hour: number, minute: number, period: TimePeriod): number {
  const [start, end] = PERIODS[period].hours;
  const totalMinutes = (end - start + 24) % 24;
  if (totalMinutes === 0) return 0;
  const currentMinutes = ((hour - start + 24) % 24) * 60 + minute;
  return Math.min(1, Math.max(0, currentMinutes / (totalMinutes * 60)));
}

function lerpColors(a: PeriodColors, b: PeriodColors, t: number): PeriodColors {
  return {
    warmth: a.warmth + (b.warmth - a.warmth) * t,
    brightness: a.brightness + (b.brightness - a.brightness) * t,
    saturation: a.saturation + (b.saturation - a.saturation) * t,
    skyTop: a.skyTop, // use current period's color
    skyBottom: a.skyBottom,
    overlayOpacity: a.overlayOpacity + (b.overlayOpacity - a.overlayOpacity) * t,
  };
}

function applyColors(c: PeriodColors) {
  const root = document.documentElement;
  root.style.setProperty("--daytime-warmth", String(c.warmth));
  root.style.setProperty("--daytime-brightness", String(c.brightness));
  root.style.setProperty("--daytime-saturation", String(c.saturation));
  root.style.setProperty("--daytime-sky-top", c.skyTop);
  root.style.setProperty("--daytime-sky-bottom", c.skyBottom);
  root.style.setProperty("--daytime-overlay-opacity", String(c.overlayOpacity));

  // Apply warmth as a subtle sepia/warm filter on the body
  const warmthPct = Math.round(c.warmth * 30); // 0-30% sepia
  const brightPct = 1 + c.brightness; // 0.9-1.1
  const satPct = c.saturation;
  document.body.style.filter = `sepia(${warmthPct}%) brightness(${brightPct}) saturate(${satPct})`;
}

function clearColors() {
  const root = document.documentElement;
  root.style.removeProperty("--daytime-warmth");
  root.style.removeProperty("--daytime-brightness");
  root.style.removeProperty("--daytime-saturation");
  root.style.removeProperty("--daytime-sky-top");
  root.style.removeProperty("--daytime-sky-bottom");
  root.style.removeProperty("--daytime-overlay-opacity");
  document.body.style.filter = "";
}

const THEME_KEY = "garden-daytime-theme";

export function isDaytimeThemeEnabled(): boolean {
  try { return localStorage.getItem(THEME_KEY) === "true"; } catch { return false; }
}

export function DaytimeThemeProvider() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const weatherRef = useRef<string>("");

  useEffect(() => {
    const enabled = isDaytimeThemeEnabled();
    if (!enabled) {
      clearColors();
      return;
    }

    const update = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      const period = getPeriod(hour);
      const progress = periodProgress(hour, minute, period);
      const colors = PERIODS[period].colors;

      // Apply weather modifier if available
      let mod: Partial<PeriodColors> = {};
      if (weatherRef.current) {
        mod = WEATHER_MODS[weatherRef.current] || {};
      }

      const final: PeriodColors = {
        warmth: colors.warmth + (mod.warmth ?? 0),
        brightness: colors.brightness + (mod.brightness ?? 0),
        saturation: colors.saturation * (mod.saturation ?? 1),
        skyTop: colors.skyTop,
        skyBottom: colors.skyBottom,
        overlayOpacity: colors.overlayOpacity + (mod.overlayOpacity ?? 0),
      };

      applyColors(final);
    };

    update();
    intervalRef.current = setInterval(update, 60_000); // every minute

    // Listen for weather updates
    const onWeather = () => {
      try {
        const raw = localStorage.getItem("garden-weather-condition");
        weatherRef.current = raw || "";
      } catch {}
      update();
    };
    window.addEventListener("garden-weather", onWeather);
    // Read initial weather
    try {
      weatherRef.current = localStorage.getItem("garden-weather-condition") || "";
    } catch {}

    // Listen for theme toggle
    const onPrefs = () => {
      if (!isDaytimeThemeEnabled()) {
        clearColors();
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        update();
        if (!intervalRef.current) {
          intervalRef.current = setInterval(update, 60_000);
        }
      }
    };
    window.addEventListener("garden-prefs", onPrefs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("garden-weather", onWeather);
      window.removeEventListener("garden-prefs", onPrefs);
    };
  }, []);

  return null;
}
