// ============================================================
// Digital Garden — UI Personalization Config (Enhanced)
// ============================================================
// localStorage key: garden-ui-prefs
// All preferences applied as CSS custom properties on :root.
// ============================================================

export interface UIPreferences {
  fontFamily: string;           // CSS font-family value
  fontSize: number;             // px (10-48)
  fontWeight: number;           // 100-900
  fontStyle: "normal" | "italic";
  lineHeight: number;           // e.g. 1.6 (1.0-3.0)
  letterSpacing: number;        // px (-2 to 8)
  blockSpacing: number;         // px — margin between major sections (8-120)
  paraSpacing: number;          // px — paragraph gap (2-40)
  themeColor: string;           // hex, overrides --color-primary
  textColor: string | null;     // hex or null → follow theme CSS
  useCustomTextColor: boolean;  // true when user explicitly set textColor
  modules: ModuleVisibility;
  moduleOrder: string[];        // drag-to-rearrange order on home page
}

export interface ModuleVisibility {
  greeting: boolean;
  stats: boolean;
  gardenMemory: boolean;
  recentEntries: boolean;
}

export const DEFAULT_MODULE_ORDER = [
  "greeting", "stats", "gardenMemory", "recentEntries",
];

export const DEFAULT_PREFS: UIPreferences = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  fontWeight: 400,
  fontStyle: "normal",
  lineHeight: 1.78,
  letterSpacing: 0,
  blockSpacing: 32,
  paraSpacing: 15,
  themeColor: "#6b8c5c",
  textColor: null,
  useCustomTextColor: false,
  modules: {
    greeting: true, stats: true,
    gardenMemory: true, recentEntries: true,
  },
  moduleOrder: [...DEFAULT_MODULE_ORDER],
};

function getStorageKey(): string {
  if (typeof window === "undefined") return "garden-ui-prefs";
  const uid = document.cookie.split("; ").find((r) => r.startsWith("garden-user-id="))?.split("=")[1];
  return uid ? `garden-ui-prefs:${uid}` : "garden-ui-prefs";
}

export function getPrefs(): UIPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS, moduleOrder: [...DEFAULT_MODULE_ORDER] };
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return { ...DEFAULT_PREFS, moduleOrder: [...DEFAULT_MODULE_ORDER] };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      modules: { ...DEFAULT_PREFS.modules, ...(parsed.modules || {}) },
      moduleOrder: parsed.moduleOrder || [...DEFAULT_MODULE_ORDER],
    };
  } catch { return { ...DEFAULT_PREFS, moduleOrder: [...DEFAULT_MODULE_ORDER] }; }
}

export function setPrefs(p: Partial<UIPreferences>) {
  if (typeof window === "undefined") return;
  const current = getPrefs();
  const merged = { ...current, ...p, modules: { ...current.modules, ...(p.modules || {}) } };
  try { localStorage.setItem(getStorageKey(), JSON.stringify(merged)); } catch { /* */ }
}

export function resetPrefs() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(getStorageKey()); } catch { /* */ }
}

/** Apply prefs as CSS custom properties */
export function applyPrefs(p: UIPreferences) {
  const s = document.documentElement.style;
  s.setProperty("--ui-font-family", p.fontFamily);
  s.setProperty("--ui-font-size", p.fontSize + "px");
  // Set html font-size so all rem-based Tailwind classes scale
  document.documentElement.style.fontSize = p.fontSize + "px";
  s.setProperty("--ui-font-weight", String(p.fontWeight));
  s.setProperty("--ui-font-style", p.fontStyle);
  s.setProperty("--ui-line-height", String(p.lineHeight));
  s.setProperty("--ui-letter-spacing", p.letterSpacing + "px");
  s.setProperty("--ui-block-spacing", p.blockSpacing + "px");
  s.setProperty("--ui-para-spacing", p.paraSpacing + "px");
  s.setProperty("--ui-theme-color", p.themeColor);
  s.setProperty("--color-primary", p.themeColor);
  s.setProperty("--color-primary-hover", p.themeColor + "cc");
  // Only override foreground if user explicitly set a custom text color
  if (p.useCustomTextColor && p.textColor) {
    s.setProperty("--ui-text-color", p.textColor);
    s.setProperty("--color-foreground", p.textColor);
  } else {
    s.removeProperty("--ui-text-color");
    s.removeProperty("--color-foreground");
  }
  // Module visibility
  for (const [k, v] of Object.entries(p.modules)) {
    s.setProperty(`--ui-show-${k}`, v ? "block" : "none");
  }
}

// ── Expanded Font Families ─────────────────────────────────
export const FONT_FAMILIES = [
  { v: "var(--font-sans)", label: "系统无衬线", icon: "🔤", preview: "Aa" },
  { v: "var(--font-mono)", label: "等宽", icon: "⌨️", preview: "Aa" },
  { v: "'Microsoft YaHei', '微软雅黑', sans-serif", label: "微软雅黑", icon: "📝", preview: "雅" },
  { v: "'SimSun', '宋体', STSong, serif", label: "宋体", icon: "📖", preview: "宋" },
  { v: "'SimHei', '黑体', STHeiti, sans-serif", label: "黑体", icon: "✒️", preview: "黑" },
  { v: "'KaiTi', '楷体', STKaiti, serif", label: "楷体", icon: "🖋", preview: "楷" },
  { v: "Georgia, 'Times New Roman', serif", label: "衬线", icon: "📰", preview: "Aa" },
  { v: "'Comic Sans MS', '幼圆', YouYuan, cursive", label: "圆体/手写", icon: "🎨", preview: "圆" },
];

export const FONT_SIZES = { small: 13, medium: 15, large: 19, xlarge: 24 };
export const LINE_HEIGHTS = { compact: 1.4, standard: 1.78, relaxed: 2.0, spacious: 2.4 };
export const SPACINGS = { compact: 16, standard: 32, relaxed: 48, spacious: 72 };
export const FONT_WEIGHTS = [
  { v: 300, label: "细体 (Light)" },
  { v: 400, label: "常规 (Regular)" },
  { v: 500, label: "中等 (Medium)" },
  { v: 600, label: "半粗 (Semibold)" },
  { v: 700, label: "粗体 (Bold)" },
];

// ── Theme color presets ─────────────────────────────────────
export const THEME_COLOR_PRESETS = [
  { v: "#6b8c5c", label: "花园绿", icon: "🌿" },
  { v: "#c9a96e", label: "月夜金", icon: "🌙" },
  { v: "#c97a8b", label: "樱花粉", icon: "🌸" },
  { v: "#6b8d9e", label: "雨蓝", icon: "🌧" },
  { v: "#8b5cf6", label: "紫罗兰", icon: "💜" },
  { v: "#ef4444", label: "赤红", icon: "❤️" },
  { v: "#f59e0b", label: "琥珀", icon: "🧡" },
  { v: "#10b981", label: "翡翠", icon: "💚" },
  { v: "#3b82f6", label: "天蓝", icon: "💙" },
  { v: "#ec4899", label: "粉红", icon: "💗" },
  { v: "#6366f1", label: "靛蓝", icon: "🔷" },
  { v: "#14b8a6", label: "青绿", icon: "🩵" },
];
