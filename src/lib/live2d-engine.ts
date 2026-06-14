// ============================================================
// Digital Garden — Live2D Shared Engine
// ============================================================
// Wraps window.initWidget() (the live2d-widgets library API).
// Note: this library renders into document.body (#waifu), NOT
// into a custom container. We manage model switching by
// re-calling initWidget() after updating localStorage.modelId.
// ============================================================

import { getActiveModel } from "./live2d-config";

// ── Script injection (once per page load) ──────────────────

let scriptPromise: Promise<void> | null = null;

function injectScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    if ((window as any).initWidget) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "/resources/live2d/lib/autoload.js";
    s.async = true;
    s.onload = () => {
      // autoload.js loads waifu-tips.js as module → deferred.
      // Poll until window.initWidget appears.
      let ticks = 0;
      const check = () => {
        if ((window as any).initWidget) return resolve();
        if (++ticks > 50) return resolve(); // timeout
        setTimeout(check, 100);
      };
      check();
    };
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });

  return scriptPromise;
}

// ── Model index mapping ────────────────────────────────────
// MUST stay in sync with waifu-tips.json "models" array order.

const MODEL_PATH_TO_INDEX: Record<string, number> = {
  // Group: 小春姐妹
  "/resources/live2d/models/haru-01/haru01.model.json": 0,
  "/resources/live2d/models/haru-02/haru02.model.json": 0,
  // Group: 小春 & Haruto 兄妹
  "/resources/live2d/models/koharu/koharu.model.json": 1,
  "/resources/live2d/models/haruto/haruto.model.json": 1,
  // Group: Nico 家族
  "/resources/live2d/models/nico/nico.model.json": 2,
  "/resources/live2d/models/nietzsche/nietzche.model.json": 2,
  "/resources/live2d/models/nipsilon/nipsilon.model.json": 2,
  "/resources/live2d/models/nito/nito.model.json": 2,
  // Group: 动物伙伴
  "/resources/live2d/models/tororo/tororo.model.json": 3,
  "/resources/live2d/models/hijiki/hijiki.model.json": 3,
  "/resources/live2d/models/wanko/wanko.model.json": 3,
  // Solo
  "/resources/live2d/models/chitose/chitose.model.json": 4,
  "/resources/live2d/models/epsilon2_1/Epsilon2.1.model.json": 5,
  "/resources/live2d/models/izumi/izumi.model.json": 6,
  "/resources/live2d/models/shizuku/shizuku.model.json": 7,
  "/resources/live2d/models/unitychan/unitychan.model.json": 8,
  "/resources/live2d/models/z16/z16.model.json": 9,
};

const DEFAULT_MODEL_INDEX = 0;

// ── Timer tracking (prevents message spam on re-init) ────

const libraryTimerIds: number[] = [];

// ── Engine state ──────────────────────────────────────────

let lastModelIndex: number = -1;

// ── Public API ────────────────────────────────────────────

export function initLive2D(): void {
  if (typeof window === "undefined") return;

  const initWidget = (window as any).initWidget;
  if (!initWidget) {
    console.warn("[Live2D Engine] window.initWidget 不存在，等待 autoload.js 加载...");
    return;
  }

  const model = getActiveModel();
  if (!model.jsonPath) {
    console.warn("[Live2D Engine] getActiveModel() 无 jsonPath");
    return;
  }

  const modelIndex = MODEL_PATH_TO_INDEX[model.jsonPath];
  if (modelIndex === undefined) {
    console.warn("[Live2D Engine] 模型路径未在 waifu-tips.json 中注册:", model.jsonPath);
    return;
  }

  // ── Skip if model unchanged ─────────────────────────────
  if (modelIndex === lastModelIndex) {
    console.log("[Live2D Engine] 模型未改变，跳过:", modelIndex);
    return;
  }

  // ── Clean old widget (DOM + timers) ──────────────────────
  const knownIds = ["waifu", "waifu-toggle", "waifu-tips", "waifu-canvas", "waifu-tool"];
  for (const id of knownIds) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
  // Clear library timers from previous init (prevents message spam)
  if (libraryTimerIds.length > 0) {
    for (const id of libraryTimerIds) { clearTimeout(id); clearInterval(id); }
    libraryTimerIds.length = 0;
  }

  // ── Set model index ─────────────────────────────────────
  localStorage.setItem("modelId", String(modelIndex));
  localStorage.setItem("modelTexturesId", "0");
  localStorage.removeItem("waifu-display");

  console.log("[Live2D Engine] initWidget →", {
    modelIndex,
    jsonPath: model.jsonPath,
    modelName: model.name,
  });

  // ── Wrap timers to collect IDs for cleanup on next init ─
  const _si: Function = window.setInterval.bind(window);
  const _st: Function = window.setTimeout.bind(window);
  (window as any).setInterval = (...args: any[]) => { const id = _si(...args); libraryTimerIds.push(id); return id; };
  (window as any).setTimeout = (...args: any[]) => { const id = _st(...args); libraryTimerIds.push(id); return id; };

  try {
    initWidget({
      waifuPath: "/resources/live2d/lib/waifu-tips.json",
      cubism2Path: "/resources/live2d/lib/live2d.min.js",
      cubism5Path: "/resources/live2d/lib/live2dcubismcore.min.js",
      logLevel: "warn",
      drag: true,
    });
    lastModelIndex = modelIndex;
  } catch (e) {
    console.error("[Live2D Engine] initWidget 异常:", e);
  } finally {
    (window as any).setInterval = _si;
    (window as any).setTimeout = _st;
  }
}

export function ensureEngineReady(): Promise<void> {
  return injectScript();
}

export function resetEngineState(): void {
  lastModelIndex = -1;
}

export function isEngineActive(): boolean {
  return lastModelIndex >= 0;
}
