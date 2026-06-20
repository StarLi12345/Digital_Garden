"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

/**
 * FooterConditional — hides the global footer on editor pages
 * and full-screen pages where the footer would distract.
 */
const HIDDEN_ON = ["/chat", "/plant", "/drafts"];
const HIDDEN_PREFIXES = ["/entry/"];

export function FooterConditional({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  return <>{children}</>;
}
