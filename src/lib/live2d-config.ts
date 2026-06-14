// ============================================================
// Digital Garden — Live2D Model Configuration
// ============================================================
// 模型预设列表 · localStorage 持久化 · 自定义模型支持
// ============================================================

export interface Live2DModel {
  id: string;
  name: string;
  description: string;
  /** CDN path to .model.json (or .model3.json for Cubism 5 models) */
  jsonPath: string;
  /** Preset or custom */
  source: "preset" | "custom-url" | "custom-upload";
  /** Thumbnail color for preview */
  previewColor: string;
}

// ── 4 preset models via CDN ─────────────────────────────

export const LIVE2D_PRESETS: Live2DModel[] = [
  {
    id: "koharu",
    name: "小春",
    description: "棕色短发，元气少女",
    jsonPath: "/resources/live2d/models/koharu/koharu.model.json",
    source: "preset",
    previewColor: "#d4956a",
  },
  {
    id: "shizuku",
    name: "静久",
    description: "蓝色长发，文静气质",
    jsonPath: "/resources/live2d/models/shizuku/shizuku.model.json",
    source: "preset",
    previewColor: "#6b8d9e",
  },
  {
    id: "haru",
    name: "小春 (校服)",
    description: "粉色双马尾，学园风",
    jsonPath: "/resources/live2d/models/haru/haru02.model.json",
    source: "preset",
    previewColor: "#c97a8b",
  },
  {
    id: "chitose",
    name: "千岁",
    description: "绿色长发，和风美人",
    jsonPath: "/resources/live2d/models/chitose/chitose.model.json",
    source: "preset",
    previewColor: "#6b8c5c",
  },
];

// ── Config persistence ──────────────────────────────────

const STORAGE_KEY = "garden-live2d-model";

export interface Live2DConfig {
  modelId: string;          // "koharu" | "shizuku" | "haru" | "chitose" | "custom"
  customJsonPath: string;   // user-provided URL for custom model
  enabled: boolean;
}

const DEFAULT_CONFIG: Live2DConfig = {
  modelId: "koharu",
  customJsonPath: "",
  enabled: true,
};

export function getLive2DConfig(): Live2DConfig {
  if (typeof window === "undefined") return { ...DEFAULT_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch { return { ...DEFAULT_CONFIG }; }
}

export function setLive2DConfig(config: Partial<Live2DConfig>) {
  if (typeof window === "undefined") return;
  const current = getLive2DConfig();
  const merged = { ...current, ...config };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
  // Dispatch event so companion can react
  window.dispatchEvent(new CustomEvent("live2d-config-changed", { detail: merged }));
}

export function getActiveModel(): Live2DModel {
  const config = getLive2DConfig();
  if (config.modelId === "custom") {
    const jsonPath = config.customJsonPath || "";
    return {
      id: "custom",
      name: "自定义",
      description: "用户自定义模型",
      jsonPath,
      source: jsonPath.startsWith("blob:") ? "custom-upload" as const : "custom-url" as const,
      previewColor: "#8b5cf6",
    };
  }
  return LIVE2D_PRESETS.find((m) => m.id === config.modelId) || LIVE2D_PRESETS[0];
}
