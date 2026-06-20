// ============================================================
// Digital Garden 2.0 — Theme Definitions (multi-binding)
// ============================================================
// 4 种花园主题，每种绑定：背景 / 音乐 / 动效 / 色彩模式
// ============================================================

export interface ThemeDef {
  id: string;
  label: string;
  icon: string;
  description: string;
  /** Associated background preset filename */
  background: string;
  /** Suggested music track ID */
  musicTrack: string;
  /** Suggested ambient effect */
  ambient: string;
  /** Suggested color mode (light/dark/system) */
  mode: "light" | "dark" | "system";
  /** Primary color */
  primaryColor: string;
}

export const THEMES: ThemeDef[] = [
  {
    id: "garden",
    label: "花园",
    icon: "🪴",
    description: "玻璃温室 · 晨光与绿植",
    background: "/backgrounds/moonlight-04.jpg",
    musicTrack: "01",
    ambient: "none",
    mode: "system",
    primaryColor: "#7a9668",
  },
  {
    id: "starry",
    label: "星空",
    icon: "✨",
    description: "深邃夜空，星河璀璨",
    background: "/backgrounds/starry-night.jpg",
    musicTrack: "08",
    ambient: "dust",
    mode: "dark",
    primaryColor: "#c9a96e",
  },
  {
    id: "sakura",
    label: "樱庭",
    icon: "🌸",
    description: "樱花飞舞，温柔春光",
    background: "/backgrounds/sakura-garden.jpg",
    musicTrack: "03",
    ambient: "petal",
    mode: "light",
    primaryColor: "#c97a8b",
  },
  {
    id: "rain",
    label: "雨",
    icon: "🌧",
    description: "清冷雨幕，沉静思考",
    background: "/backgrounds/rain-window.jpg",
    musicTrack: "02",
    ambient: "rain",
    mode: "dark",
    primaryColor: "#6b8d9e",
  },
];

export const THEME_STORAGE_KEY = "garden-theme";

export function getStoredTheme(): string {
  if (typeof window === "undefined") return "garden";
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || "garden";
  } catch {
    return "garden";
  }
}

export function setStoredTheme(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
    document.cookie = `${THEME_STORAGE_KEY}=${id};path=/;max-age=31536000;SameSite=Lax`;
  } catch { /* */ }
}

export function getThemeById(id: string): ThemeDef | undefined {
  return THEMES.find((t) => t.id === id);
}

/** Apply all theme bindings — call this when theme is changed */
export function applyThemeBindings(theme: ThemeDef) {
  if (typeof window === "undefined") return;

  if (theme.id === "garden") {
    // Garden theme: background image + 50% opacity + Tea Time music. That's it.
    try {
      localStorage.setItem("garden-background", theme.background);
      localStorage.setItem("garden-bg-opacity", "50");
      localStorage.setItem("garden-bgm-track", theme.musicTrack);
      localStorage.setItem("garden-bgm-enabled", "true");
      localStorage.setItem("gm-loop", "shuffle");
    } catch {}
    window.dispatchEvent(new CustomEvent("garden-theme-changed", { detail: theme }));
    return;
  }

  // Canvas scene themes (starry, sakura, rain)
  const sceneThemes = ["starry", "sakura", "rain"];
  if (sceneThemes.includes(theme.id)) {
    try { localStorage.setItem("garden-background", ""); } catch {}
  } else {
    try { localStorage.setItem("garden-background", theme.background); } catch {}
  }
  // Set ambient effect (auto-bind theme → ambient)
  try { localStorage.setItem("garden-ambient-effect", theme.ambient); } catch {}
  // Set primary color
  try { document.documentElement.style.setProperty("--color-primary", theme.primaryColor); } catch {}
  // Clear custom text color so theme CSS takes over
  try {
    document.documentElement.style.removeProperty("--color-foreground");
    document.documentElement.style.removeProperty("--ui-text-color");
    const uid = document.cookie.split("; ").find((r) => r.startsWith("garden-user-id="))?.split("=")[1];
    const key = uid ? `garden-ui-prefs:${uid}` : "garden-ui-prefs";
    const raw = localStorage.getItem(key);
    if (raw) {
      const prefs = JSON.parse(raw);
      prefs.useCustomTextColor = false;
      prefs.textColor = null;
      localStorage.setItem(key, JSON.stringify(prefs));
    }
  } catch {}
  // Set mask defaults based on theme mode
  try {
    if (theme.mode === "dark") {
      localStorage.setItem("garden-banner-mask", "rgba(0,0,0,0.3)");
      localStorage.setItem("garden-banner-mask-opacity", "40");
      localStorage.setItem("garden-bg-mask", "rgba(0,0,0,0.3)");
      localStorage.setItem("garden-bg-mask-opacity", "30");
    } else {
      localStorage.removeItem("garden-banner-mask");
      localStorage.removeItem("garden-banner-mask-opacity");
      localStorage.removeItem("garden-bg-mask");
      localStorage.removeItem("garden-bg-mask-opacity");
    }
  } catch {}
  // Dispatch events for other components to pick up
  window.dispatchEvent(new CustomEvent("garden-theme-changed", { detail: theme }));
}
