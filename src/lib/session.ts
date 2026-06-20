// ============================================================
// Digital Garden — Device-Level Session Management
// ============================================================
// 同一用户可在不同设备同时登录，
// 但同一设备（同 deviceKey）只能有一个活跃 session。
// 新登录自动踢掉同设备的旧 session。

import { prisma } from "./prisma";
import { parseOS, parseBrowser, extractIP, hashDeviceKey } from "./auth";
import { cookies } from "next/headers";

const SESSION_COOKIE_ID = "garden-session-id";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

// ── Cookie helpers ──────────────────────────────────

export function sessionCookieOpts(request: Request) {
  return {
    httpOnly: true,
    secure: request.url.startsWith("https://"),
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

// ── Core session operations ─────────────────────────

/**
 * Create a new session for a user on a device.
 * Automatically kicks out any existing session on the same device.
 * Returns the new session token.
 */
export async function createSession(
  userId: string,
  request: Request,
): Promise<string> {
  const ip = extractIP(request);
  const ua = request.headers.get("user-agent") || "";
  const os = parseOS(ua);
  const deviceKey = hashDeviceKey(ip, os);
  const deviceName = `${os} ${parseBrowser(ua)}`.trim();
  const token = crypto.randomUUID();

  // Kick out old session on the same device
  const kicked = await prisma.session.deleteMany({
    where: { userId, deviceKey },
  });
  if (kicked.count > 0) {
    console.log(`[session] Kicked ${kicked.count} old session(s) on device "${deviceName}" (key: ${deviceKey}) for user ${userId}`);
  }

  // Create new session
  await prisma.session.create({
    data: { userId, deviceKey, token, deviceName },
  });
  console.log(`[session] Created: userId=${userId} device="${deviceName}"`);

  return token;
}

/**
 * Validate a session token and return the userId if valid.
 * Returns null if the token is invalid or expired.
 */
export async function validateSession(token: string): Promise<string | null> {
  if (!token) return null;
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      select: { userId: true },
    });
    if (!session) {
      console.log(`[session] Rejected invalid token: ${token.slice(0, 8)}...`);
    }
    return session?.userId ?? null;
  } catch {
    return null;
  }
}

/**
 * Delete a specific session by token.
 */
export async function deleteSession(token: string): Promise<void> {
  if (!token) return;
  try {
    await prisma.session.deleteMany({ where: { token } });
  } catch { /* ignore */ }
}

/**
 * Delete all sessions for a user (used when deleting account).
 */
export async function deleteAllSessions(userId: string): Promise<void> {
  try {
    await prisma.session.deleteMany({ where: { userId } });
  } catch { /* ignore */ }
}

/**
 * Read session token from cookies (server-side).
 */
export async function getSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_ID)?.value ?? null;
  } catch {
    return null;
  }
}
