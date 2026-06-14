// ============================================================
// Digital Garden 3.0 — Shared Navigation Items
// ============================================================
// Single source of truth for nav links. Imported by both
// nav.tsx and sidebar.tsx to avoid duplication.

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: "🌱" },
  { href: "/garden", label: "Garden", icon: "📚" },
  { href: "/plant", label: "Plant", icon: "✏️" },
  { href: "/drafts", label: "Drafts", icon: "📋" },
  { href: "/graph", label: "Graph", icon: "🕸️" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];
