// ============================================================
// Digital Garden — Theme Runtime Engine
// ============================================================
// 统一管理：时间驱动 / 天气驱动 / 视觉参数运行时。
// 所有输出为 CSS 变量覆盖，不改变 DOM 结构。
// ============================================================

// ── Types ─────────────────────────────────────────────

export type TimeOfDay = "morning" | "day" | "evening" | "night";
export type WeatherType = "sunny" | "cloudy" | "rainy" | "snow";

export interface TimeConfig {
  enabled: boolean;
}

export interface WeatherConfig {
  mode: "off" | "mock";
  mockWeather: WeatherType;
}

// ── localStorage keys ─────────────────────────────────

const TIME_ENABLED_KEY = "garden-time-enabled";
const WEATHER_MODE_KEY = "garden-weather-mode";
const WEATHER_MOCK_KEY = "garden-weather-mock";

// ── Time detection ────────────────────────────────────

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "day";
  if (h >= 18 && h < 21) return "evening";
  return "night";
}

// ── Config getters/setters ────────────────────────────

export function getTimeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(TIME_ENABLED_KEY) === "true"; } catch { return false; }
}
export function setTimeEnabled(v: boolean) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(TIME_ENABLED_KEY, String(v)); } catch { /* */ }
}

export function getWeatherMode(): "off" | "mock" {
  if (typeof window === "undefined") return "off";
  try { return (localStorage.getItem(WEATHER_MODE_KEY) as "off" | "mock") || "off"; } catch { return "off"; }
}
export function setWeatherMode(v: "off" | "mock") {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(WEATHER_MODE_KEY, v); } catch { /* */ }
}

export function getMockWeather(): WeatherType {
  if (typeof window === "undefined") return "sunny";
  try { return (localStorage.getItem(WEATHER_MOCK_KEY) as WeatherType) || "sunny"; } catch { return "sunny"; }
}
export function setMockWeather(v: WeatherType) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(WEATHER_MOCK_KEY, v); } catch { /* */ }
}

// ── CSS variable computation ──────────────────────────

export interface ThemeOverrides {
  brightness: number;   // 0.8 ~ 1.2  (CSS filter: brightness)
  contrast: number;     // 0.85 ~ 1.1
  saturation: number;   // 0.7 ~ 1.1
  blurExtra: number;    // 0 ~ 4 (extra px added to bg blur)
  warmTint: number;     // 0 ~ 0.15 (overlay opacity for warm tint)
  coolTint: number;     // 0 ~ 0.1 (overlay opacity for cool tint)
}

export const NEUTRAL: ThemeOverrides = {
  brightness: 1, contrast: 1, saturation: 1,
  blurExtra: 0, warmTint: 0, coolTint: 0,
};

/** Compute time-of-day overrides */
function timeOverrides(tod: TimeOfDay): Partial<ThemeOverrides> {
  switch (tod) {
    case "morning":
      return { brightness: 1.05, saturation: 1.05, warmTint: 0.06 };
    case "day":
      return { brightness: 1.02, contrast: 1.02 };
    case "evening":
      return { brightness: 0.92, saturation: 0.95, warmTint: 0.1 };
    case "night":
      return { brightness: 0.82, contrast: 0.92, saturation: 0.85, coolTint: 0.04, blurExtra: 1 };
  }
}

/** Compute weather overrides */
function weatherOverrides(w: WeatherType): Partial<ThemeOverrides> {
  switch (w) {
    case "sunny":
      return { brightness: 1.08, saturation: 1.06, warmTint: 0.04 };
    case "cloudy":
      return { brightness: 0.95, contrast: 0.93, saturation: 0.92 };
    case "rainy":
      return { brightness: 0.88, saturation: 0.85, blurExtra: 2, coolTint: 0.03 };
    case "snow":
      return { brightness: 1.04, saturation: 0.8, contrast: 0.9, blurExtra: 1 };
  }
}

/** Combine all overrides */
export function computeOverrides(): ThemeOverrides {
  const result = { ...NEUTRAL };
  if (!getTimeEnabled() && getWeatherMode() === "off") return result;

  const patches: Partial<ThemeOverrides>[] = [];

  if (getTimeEnabled()) {
    patches.push(timeOverrides(getTimeOfDay()));
  }
  if (getWeatherMode() === "mock") {
    patches.push(weatherOverrides(getMockWeather()));
  }

  // Apply patches (multiply/accumulate)
  for (const p of patches) {
    if (p.brightness) result.brightness *= p.brightness;
    if (p.contrast) result.contrast *= p.contrast;
    if (p.saturation) result.saturation *= p.saturation;
    if (p.blurExtra) result.blurExtra += p.blurExtra;
    if (p.warmTint) result.warmTint += p.warmTint;
    if (p.coolTint) result.coolTint += p.coolTint;
  }

  // Clamp
  result.brightness = Math.max(0.7, Math.min(1.3, result.brightness));
  result.contrast = Math.max(0.8, Math.min(1.15, result.contrast));
  result.saturation = Math.max(0.6, Math.min(1.15, result.saturation));
  result.blurExtra = Math.max(0, Math.min(6, result.blurExtra));
  result.warmTint = Math.max(0, Math.min(0.2, result.warmTint));
  result.coolTint = Math.max(0, Math.min(0.12, result.coolTint));

  return result;
}

/** Check if overrides are neutral (no visual effect) */
function isNeutral(ov: ThemeOverrides): boolean {
  return (
    ov.brightness === 1 &&
    ov.contrast === 1 &&
    ov.saturation === 1 &&
    ov.blurExtra === 0 &&
    ov.warmTint === 0 &&
    ov.coolTint === 0
  );
}

/** Apply overrides to DOM as CSS variables */
export function applyOverrides(ov: ThemeOverrides) {
  const s = document.documentElement.style;
  // When neutral, remove inline overrides so CSS theme system is the
  // single source of truth — prevents unnecessary DOM mutations & flicker.
  if (isNeutral(ov)) {
    clearOverrides();
    return;
  }
  s.setProperty("--rt-brightness", String(ov.brightness));
  s.setProperty("--rt-contrast", String(ov.contrast));
  s.setProperty("--rt-saturation", String(ov.saturation));
  s.setProperty("--rt-blur-extra", ov.blurExtra + "px");
  s.setProperty("--rt-warm-tint", String(ov.warmTint));
  s.setProperty("--rt-cool-tint", String(ov.coolTint));
}

/** Remove runtime overrides */
export function clearOverrides() {
  const s = document.documentElement.style;
  for (const k of ["--rt-brightness","--rt-contrast","--rt-saturation","--rt-blur-extra","--rt-warm-tint","--rt-cool-tint"]) {
    s.removeProperty(k);
  }
}
