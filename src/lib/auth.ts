import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE = "garden-session";
export const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 days

export interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export function getDefaultAvatar(username: string): string {
  const initial = (username || "?")[0].toUpperCase();
  const colors = [
    ["#6b8c5c", "#a8c97f"],
    ["#c9a96e", "#e8d5a3"],
    ["#c97a8b", "#f0b8c5"],
    ["#6b8d9e", "#a3c5d9"],
    ["#8b5cf6", "#c4b5fd"],
    ["#ef4444", "#fca5a5"],
    ["#f59e0b", "#fcd34d"],
    ["#10b981", "#6ee7b7"],
  ];
  const idx = initial.charCodeAt(0) % colors.length;
  const [c1, c2] = colors[idx];

  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${c1}"/><stop offset="100%" style="stop-color:${c2}"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(#g)"/><text x="50" y="68" font-size="48" font-family="sans-serif" fill="white" text-anchor="middle" font-weight="bold">${initial}</text></svg>`
  )}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getUserById(userId: string): Promise<UserInfo | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    avatar: user.avatar || getDefaultAvatar(user.username),
  };
}

export async function getAllUsers(): Promise<UserInfo[]> {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, displayName: true, avatar: true },
    orderBy: { createdAt: "asc" },
  });
  return users.map((u) => ({
    ...u,
    displayName: u.displayName || u.username,
    avatar: u.avatar || getDefaultAvatar(u.username),
  }));
}
