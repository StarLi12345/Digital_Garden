"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

/**
 * FooterConditional — hides the global footer on /chat and /plant pages.
 */
const HIDDEN_ON = ["/chat", "/plant"];

export function FooterConditional({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;
  return <>{children}</>;
}
