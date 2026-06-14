// ============================================================
// Digital Garden — Layout Configuration
// ============================================================
// localStorage keys: garden-topbar-mode, garden-sidebar-open
// ============================================================

export type TopbarMode = "fixed" | "auto-hide";

export const TOPBAR_MODE_KEY = "garden-topbar-mode";
export const SIDEBAR_OPEN_KEY = "garden-sidebar-open";

export function getTopbarMode(): TopbarMode {
  if (typeof window === "undefined") return "fixed";
  try { return (localStorage.getItem(TOPBAR_MODE_KEY) as TopbarMode) || "fixed"; } catch { return "fixed"; }
}

export function setTopbarMode(mode: TopbarMode) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(TOPBAR_MODE_KEY, mode); } catch { /* */ }
}

export function getSidebarOpen(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(SIDEBAR_OPEN_KEY) !== "false"; } catch { return false; }
}

export function setSidebarOpen(open: boolean) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(SIDEBAR_OPEN_KEY, String(open)); } catch { /* */ }
}
