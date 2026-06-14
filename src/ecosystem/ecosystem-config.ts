// ============================================================
// Digital Garden — Garden Ecosystem Config（生态层配置）
// ============================================================
// · 昼夜时段 · 事件定义 · 生态强度 · 性能参数
// ============================================================

/** Ecosystem intensity — mirrors the settings toggle */
export type EcoMode = "off" | "standard" | "enhanced";

/** Time-of-day period */
export type DayPeriod = "morning" | "day" | "evening" | "night";

/** Single event duration range (seconds) */
interface DurationRange { min: number; max: number; }

/** Single event cooldown range (seconds between events) */
interface CooldownRange { min: number; max: number; }

export interface EcoEventDef {
  id: string;
  label: string;
  duration: DurationRange;
  cooldown: DurationRange;
  /** Per-period probability multipliers (1 = default) */
  periodWeights: Record<DayPeriod, number>;
  /** How much the event scales with enhanced mode */
  enhancedMultiplier: number;
}

export const ECO_EVENTS: EcoEventDef[] = [
  {
    id: "breeze",
    label: "微风",
    duration: { min: 4, max: 8 },
    cooldown: { min: 20, max: 60 },
    periodWeights: { morning: 1.3, day: 1.1, evening: 1.2, night: 0.7 },
    enhancedMultiplier: 1.5,
  },
  {
    id: "butterfly",
    label: "蝴蝶经过",
    duration: { min: 4, max: 6 },
    cooldown: { min: 120, max: 300 },
    periodWeights: { morning: 1.3, day: 1.5, evening: 0.8, night: 0 },
    enhancedMultiplier: 1.3,
  },
  {
    id: "birds",
    label: "鸟群",
    duration: { min: 2, max: 4 },
    cooldown: { min: 300, max: 600 },
    periodWeights: { morning: 1.6, day: 1.4, evening: 0.5, night: 0 },
    enhancedMultiplier: 1.2,
  },
  {
    id: "sunlight",
    label: "阳光变化",
    duration: { min: 10, max: 20 },
    cooldown: { min: 30, max: 90 },
    periodWeights: { morning: 1.4, day: 1.3, evening: 1.4, night: 0 },
    enhancedMultiplier: 1.2,
  },
  {
    id: "pollen",
    label: "花粉流动",
    duration: { min: 3, max: 6 },
    cooldown: { min: 40, max: 120 },
    periodWeights: { morning: 1.0, day: 1.3, evening: 1.0, night: 0 },
    enhancedMultiplier: 1.4,
  },
];

/** Get current day period from local time */
export function getDayPeriod(hour?: number): DayPeriod {
  const h = hour ?? new Date().getHours();
  if (h >= 5 && h < 8) return "morning";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 20) return "evening";
  return "night";
}

/** Day period → ambient tint (r,g,b,a) */
export function dayPeriodLight(period: DayPeriod): [number, number, number, number] {
  switch (period) {
    case "morning": return [255, 220, 180, 0.08];
    case "day": return [255, 250, 235, 0.03];
    case "evening": return [255, 200, 150, 0.10];
    case "night": return [20, 25, 60, 0.18];
  }
}

/** Ecosystem intensity factor from setting */
export function ecoIntensity(mode: EcoMode): number {
  return mode === "enhanced" ? 1.5 : mode === "standard" ? 1.0 : 0;
}

/** localStorage key for eco mode */
export const ECO_MODE_KEY = "garden-eco-mode";
export function getStoredEcoMode(): EcoMode {
  try {
    const v = localStorage.getItem(ECO_MODE_KEY);
    if (v === "off" || v === "standard" || v === "enhanced") return v;
  } catch {}
  return "standard";
}
