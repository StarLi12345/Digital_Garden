// ============================================================
// Digital Garden — Shared Date/Time Utilities
// ============================================================
// Single source of truth for all date formatting and greetings.
// Eliminates duplication across page.tsx and garden/page.tsx.
// ============================================================

/** Format date as MM/DD in zh-CN locale */
export function fmtDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

/** Format date as "YYYY年M月" */
export function formatMonth(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

/** Format full date with time */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

/** Relative time in Chinese */
export function relativeTime(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;
  return `${Math.floor(days / 365)}年前`;
}

/** Time-of-day greeting in Chinese */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

/** Get season name + emoji for a month (1-12) */
export function getSeason(month: number): { name: string; icon: string } {
  if (month >= 3 && month <= 5) return { name: "春", icon: "🌸" };
  if (month >= 6 && month <= 8) return { name: "夏", icon: "☀️" };
  if (month >= 9 && month <= 11) return { name: "秋", icon: "🍂" };
  return { name: "冬", icon: "❄️" };
}
