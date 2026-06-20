"use client";

// ============================================================
// Digital Garden — Page View Tracker
// ============================================================
// Fires POST /api/views on every page navigation.
// Debounced per-page to avoid duplicate firing.
// ============================================================

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const firedPaths = new Set<string>();

export function ViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef("");

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    // Dedupe within session
    if (firedPaths.has(pathname)) return;
    firedPaths.add(pathname);

    // Extract entry slug from path
    const entrySlug = pathname.startsWith("/entry/")
      ? pathname.slice("/entry/".length)
      : null;

    const payload = {
      path: pathname,
      entrySlug,
    };

    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // fire-and-forget — don't block navigation
      keepalive: true,
    }).catch(() => {
      // silent — non-critical
    });
  }, [pathname]);

  return null;
}
