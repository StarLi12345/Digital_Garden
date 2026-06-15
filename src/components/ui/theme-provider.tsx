"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// ───────────────────────────────────────────
// Types
// ───────────────────────────────────────────
type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolved: "light" | "dark";
}

// ───────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────
const THEME_COOKIE = "theme";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=31536000;SameSite=Lax`;
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  const toggle = () => {
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };
  // Use View Transition API for smooth crossfade (supported in Chrome 111+, Edge 111+)
  if (document.startViewTransition) {
    document.startViewTransition(() => toggle());
  } else {
    toggle();
  }
}

// ───────────────────────────────────────────
// Context
// ───────────────────────────────────────────
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// ───────────────────────────────────────────
// Provider
// ───────────────────────────────────────────
export function ThemeProvider({
  children,
  initialTheme = "system",
}: {
  children: ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    resolveTheme(initialTheme),
  );

  // Sync DOM on mount
  useEffect(() => {
    const stored = getCookie(THEME_COOKIE) as Theme | undefined;
    if (stored && stored !== theme) {
      setThemeState(stored);
    }
    const r = resolveTheme(stored || theme);
    setResolved(r);
    applyTheme(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const r: "light" | "dark" = e.matches ? "dark" : "light";
      setResolved(r);
      applyTheme(r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    setCookie(THEME_COOKIE, t);
    const r = resolveTheme(t);
    setResolved(r);
    applyTheme(r);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}
