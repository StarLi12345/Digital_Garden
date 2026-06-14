// ============================================================
// Digital Garden — Background Catalog
// ============================================================
// 背景图分类映射表。
// 云端部署时大图片走 CDN（Phase 2）。
// 用户选择存储于 localStorage key: garden-background。
//
// 添加新背景：在对应分类数组中追加文件路径 + 标签即可。
// ============================================================

import { resolveAssetUrl } from "./cdn";

export interface BackgroundOption {
  path: string;   // local path (for localStorage key & comparison)
  label: string;  // display name in Settings
}

export interface BackgroundCategory {
  label: string;
  icon: string;   // emoji
  backgrounds: BackgroundOption[];
}

export const BACKGROUND_CATEGORIES: BackgroundCategory[] = [
  {
    label: "花园",
    icon: "🌿",
    backgrounds: [
      { path: "/backgrounds/garden-01.jpg", label: "午后阳光" },
      { path: "/backgrounds/garden-02.jpg", label: "林间小路" },
      { path: "/backgrounds/garden-03.jpg", label: "花园小径" },
      { path: "/backgrounds/garden-04.png", label: "草木之间" },
    ],
  },
  {
    label: "月夜",
    icon: "🌙",
    backgrounds: [
      { path: "/backgrounds/moonlight-01.jpg", label: "星夜" },
      { path: "/backgrounds/moonlight-02.jpg", label: "月下" },
      { path: "/backgrounds/moonlight-03.jpg", label: "静夜" },
      { path: "/backgrounds/moonlight-04.jpg", label: "深夜" },
    ],
  },
];

export const BG_STORAGE_KEY = "garden-background";

/** Get the currently selected background path, or null if none. */
export function getStoredBackground(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(BG_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Save a background path selection. Pass empty string to disable. */
export function setStoredBackground(path: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BG_STORAGE_KEY, path);
  } catch { /* quota exceeded */ }
}

/** Resolve a background path through CDN if configured, otherwise return local path */
export function resolveBackgroundUrl(localPath: string): string {
  return resolveAssetUrl(localPath);
}
