// ============================================================
// Digital Garden — Garden Ecosystem Engine（花园生态引擎）
// ============================================================
// 事件驱动，不循环。调度器 → 事件 → 共享状态 → Canvas 消费。
// ============================================================

import type { EcoMode, DayPeriod } from "./ecosystem-config";
import { getDayPeriod, dayPeriodLight, getStoredEcoMode, ECO_MODE_KEY } from "./ecosystem-config";
import { EcosystemScheduler } from "./ecosystem-scheduler";
import type { EcoEventCallback } from "./ecosystem-scheduler";
import {
  createAmbientState,
  tickAmbientState,
  triggerBreeze,
  triggerButterfly,
  triggerBirds,
  triggerSunlight,
  triggerPollen,
  type EcoAmbientState,
} from "./ecosystem-events";

export { type EcoAmbientState } from "./ecosystem-events";

export class GardenEcosystem {
  state: EcoAmbientState;
  private scheduler: EcosystemScheduler;
  private periodInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.state = createAmbientState();
    const handler: EcoEventCallback = (eventId, intensity) => {
      switch (eventId) {
        case "breeze": triggerBreeze(this.state, intensity); break;
        case "butterfly": triggerButterfly(this.state, intensity); break;
        case "birds": triggerBirds(this.state, intensity); break;
        case "sunlight": triggerSunlight(this.state, intensity); break;
        case "pollen": triggerPollen(this.state, intensity); break;
      }
    };
    this.scheduler = new EcosystemScheduler(handler);
  }

  /** Start the ecosystem */
  start(mode?: EcoMode) {
    const m = mode ?? getStoredEcoMode();
    this.scheduler.start(m);
    // Period checker — update day period + light overlay every 60s
    this.periodInterval = setInterval(() => {
      const period = getDayPeriod();
      this.state.dayPeriod = period;
      const [r, g, b, a] = dayPeriodLight(period);
      this.state.lightOverlayR = r;
      this.state.lightOverlayG = g;
      this.state.lightOverlayB = b;
      this.state.lightOverlayA = a;
      this.state.lightTransition = 0; // start lerping toward new target
    }, 60_000);
  }

  /** Stop everything */
  stop() {
    this.scheduler.stop();
    if (this.periodInterval) { clearInterval(this.periodInterval); this.periodInterval = null; }
  }

  /** Update mode */
  setMode(mode: EcoMode) {
    this.scheduler.setMode(mode);
    if (mode === "off") {
      if (this.periodInterval) { clearInterval(this.periodInterval); this.periodInterval = null; }
    } else if (!this.periodInterval) {
      this.periodInterval = setInterval(() => {
        const period = getDayPeriod();
        this.state.dayPeriod = period;
      }, 60_000);
    }
  }

  /** Call each frame from the Canvas render loop */
  tick(dt: number) {
    tickAmbientState(this.state, dt);
  }
}

/** Singleton — one instance across the app */
let instance: GardenEcosystem | null = null;

export function getEcosystem(): GardenEcosystem {
  if (!instance) instance = new GardenEcosystem();
  return instance;
}
