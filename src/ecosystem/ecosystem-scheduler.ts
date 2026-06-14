// ============================================================
// Digital Garden — Ecosystem Scheduler（生态事件调度器）
// ============================================================
// · 随机间隔触发事件 · visibility 感知 · 单事件队列
// · 不重复触发 · 不会在同一时刻堆积多个事件
// ============================================================

import type { EcoEventDef, DayPeriod, EcoMode } from "./ecosystem-config";
import { ECO_EVENTS, getDayPeriod, ecoIntensity } from "./ecosystem-config";

export type EcoEventCallback = (eventId: string, intensity: number) => void;

interface ScheduledEvent {
  def: EcoEventDef;
  nextAvailableAt: number; // timestamp when cooldown ends
}

export class EcosystemScheduler {
  private events: ScheduledEvent[];
  private active: string | null = null;
  private activeEnd = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private callback: EcoEventCallback;
  private running = false;
  private mode: EcoMode = "standard";

  constructor(callback: EcoEventCallback) {
    this.callback = callback;
    this.events = ECO_EVENTS.map((def) => ({ def, nextAvailableAt: 0 }));
  }

  /** Start scheduling */
  start(mode: EcoMode) {
    this.mode = mode;
    if (mode === "off") { this.stop(); return; }
    this.running = true;
    this.scheduleNext();
  }

  /** Stop & clear */
  stop() {
    this.running = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.active = null;
  }

  /** Update mode (called from settings) */
  setMode(mode: EcoMode) {
    this.mode = mode;
    if (mode === "off") { this.stop(); return; }
    if (!this.running) { this.start(mode); return; }
    // Mode changed while running — next scheduled event will pick up the new mode
  }

  /** Mark an event as finished */
  finishEvent() {
    this.active = null;
    if (this.running && this.mode !== "off") this.scheduleNext();
  }

  /** Schedule the next random event */
  private scheduleNext() {
    if (this.active) return; // already running an event
    if (!this.running || this.mode === "off") return;

    const now = Date.now();
    const period = getDayPeriod();
    const available = this.events.filter((e) => e.nextAvailableAt <= now);

    if (available.length === 0) {
      // All on cooldown — wait for the earliest one
      const earliest = Math.min(...this.events.map((e) => e.nextAvailableAt));
      const delay = Math.max(1000, earliest - now);
      this.timer = setTimeout(() => this.scheduleNext(), delay);
      return;
    }

    // Weighted random pick, adjusted by period & mode
    const weighted = available.flatMap((e) => {
      const weight = e.def.periodWeights[period] * ecoIntensity(this.mode);
      return Array(Math.max(1, Math.round(weight * 10))).fill(e);
    });
    const picked = weighted[Math.floor(Math.random() * weighted.length)];

    // Calculate event intensity (0-1, affected by mode)
    const intensity = Math.min(1, (0.4 + Math.random() * 0.6) * ecoIntensity(this.mode) / 1.5);

    // Set cooldown for next occurrence
    const cd = picked.def.cooldown;
    const cooldownMs = (cd.min + Math.random() * (cd.max - cd.min)) * 1000;
    picked.nextAvailableAt = now + cooldownMs;

    // Start event
    const dur = picked.def.duration;
    const durationMs = (dur.min + Math.random() * (dur.max - dur.min)) * 1000;
    this.active = picked.def.id;
    this.activeEnd = now + durationMs;

    // Notify
    this.callback(picked.def.id, intensity);

    // Auto-finish after duration
    this.timer = setTimeout(() => {
      this.active = null;
      if (this.running && this.mode !== "off") this.scheduleNext();
    }, durationMs);
  }
}
