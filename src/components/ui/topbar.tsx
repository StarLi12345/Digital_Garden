"use client";

// ============================================================
// Digital Garden — TopBar (fixed / auto-hide)
// ============================================================

import { useState, useEffect, useRef, type ReactNode } from "react";
import { getTopbarMode, type TopbarMode } from "@/lib/layout-config";

export function TopBarContainer({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TopbarMode>("fixed");
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setMode(getTopbarMode());

    const onStorage = () => setMode(getTopbarMode());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (mode !== "auto-hide") { setVisible(true); return; }

    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 10) { setVisible(true); }
      else if (currentY < lastScrollY.current) { setVisible(true); }
      else if (currentY > lastScrollY.current + 5) { setVisible(false); }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mode]);

  return (
    <header
      className={`sticky top-0 z-50 transition-transform duration-200 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {children}
    </header>
  );
}
