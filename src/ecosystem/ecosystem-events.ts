// ============================================================
// Digital Garden — Ecosystem Events（生态事件实现）
// ============================================================
// 每个事件通过修改 shared state 来影响 Canvas 氛围层
// 不直接操作 DOM、不分配新对象池
// ============================================================

import type { DayPeriod } from "./ecosystem-config";
import { getDayPeriod } from "./ecosystem-config";

/** Shared ambient state — mutated by events, read by scene renderer */
export interface EcoAmbientState {
  // Breeze
  breezeActive: boolean;
  breezeIntensity: number;       // 0-1, affects sway amplitude & petal count multiplier
  // Butterfly
  butterflyActive: boolean;
  butterflyX: number;           // normalized screen position (0-1)
  butterflyY: number;
  butterflyAngle: number;       // radians, flight direction
  butterflyProgress: number;    // 0-1 through the flight path
  // Birds
  birdsActive: boolean;
  birdsX: number;               // normalized screen position
  // Sunlight
  sunlightActive: boolean;
  sunlightOffset: number;       // -0.05 to 0 brightness offset
  // Pollen
  pollenActive: boolean;
  pollenDensity: number;        // particle count multiplier
  // Day period
  dayPeriod: DayPeriod;
  // Light overlay
  lightOverlayR: number;
  lightOverlayG: number;
  lightOverlayB: number;
  lightOverlayA: number;
  lightTransition: number;      // 0-1 lerp toward target
}

/** Create initial state */
export function createAmbientState(): EcoAmbientState {
  const period = getDayPeriod();
  return {
    breezeActive: false, breezeIntensity: 0,
    butterflyActive: false, butterflyX: 0, butterflyY: 0, butterflyAngle: 0, butterflyProgress: 0,
    birdsActive: false, birdsX: 0,
    sunlightActive: false, sunlightOffset: 0,
    pollenActive: false, pollenDensity: 0,
    dayPeriod: period,
    lightOverlayR: 0, lightOverlayG: 0, lightOverlayB: 0, lightOverlayA: 0,
    lightTransition: 0,
  };
}

/** Smooth lerp helper */
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

// ═════════════════════════════════════════════════
//  Event tick — called each frame to animate transitions
// ═════════════════════════════════════════════════

export function tickAmbientState(s: EcoAmbientState, dt: number) {
  // Breeze — decay when inactive
  if (!s.breezeActive && s.breezeIntensity > 0.001) {
    s.breezeIntensity = lerp(s.breezeIntensity, 0, dt * 0.3);
  }
  // Butterfly — animate flight path
  if (s.butterflyActive) {
    s.butterflyProgress += dt / 6; // 6 seconds flight
    if (s.butterflyProgress >= 1) { s.butterflyActive = false; s.butterflyProgress = 0; }
    // Meandering path: base direction + sinusoidal wobble
    s.butterflyX += Math.cos(s.butterflyAngle) * dt * 0.08;
    s.butterflyY += Math.sin(s.butterflyAngle) * dt * 0.08 + Math.sin(s.butterflyProgress * 20) * dt * 0.01;
  }
  // Birds — fly across then disappear
  if (s.birdsActive) {
    s.birdsX += dt * 0.1;
    if (s.birdsX > 1.2) { s.birdsActive = false; s.birdsX = -0.2; }
  }
  // Sunlight — decay
  if (!s.sunlightActive && Math.abs(s.sunlightOffset) > 0.001) {
    s.sunlightOffset = lerp(s.sunlightOffset, 0, dt * 0.15);
  }
  // Pollen — decay
  if (!s.pollenActive && s.pollenDensity > 0.001) {
    s.pollenDensity = lerp(s.pollenDensity, 0, dt * 0.3);
  }
  // Light overlay — smooth transition toward target
  if (s.lightTransition < 0.98) {
    s.lightTransition = lerp(s.lightTransition, 1, dt * 0.2);
  }
}

// ═════════════════════════════════════════════════
//  Event handlers
// ═════════════════════════════════════════════════

export function triggerBreeze(s: EcoAmbientState, intensity: number) {
  s.breezeActive = true;
  s.breezeIntensity = 0.3 + intensity * 0.7;
  // Auto-decay after event duration — scheduler calls finish
  setTimeout(() => { s.breezeActive = false; }, 7000);
}

export function triggerButterfly(s: EcoAmbientState, intensity: number) {
  s.butterflyActive = true;
  // Random starting position (screen edge)
  const fromLeft = Math.random() > 0.5;
  s.butterflyX = fromLeft ? -0.1 : 1.1;
  s.butterflyY = 0.2 + Math.random() * 0.5;
  s.butterflyAngle = fromLeft ? Math.random() * 0.5 - 0.25 : Math.PI + Math.random() * 0.5 - 0.25;
  s.butterflyProgress = 0;
}

export function triggerBirds(s: EcoAmbientState, intensity: number) {
  s.birdsActive = true;
  s.birdsX = -0.2; // start off-screen left
}

export function triggerSunlight(s: EcoAmbientState, intensity: number) {
  s.sunlightActive = true;
  s.sunlightOffset = (Math.random() > 0.5 ? 1 : -1) * (0.02 + intensity * 0.04);
  setTimeout(() => { s.sunlightActive = false; }, 18000);
}

export function triggerPollen(s: EcoAmbientState, intensity: number) {
  s.pollenActive = true;
  s.pollenDensity = 0.3 + intensity * 0.7;
  setTimeout(() => { s.pollenActive = false; }, 5500);
}
