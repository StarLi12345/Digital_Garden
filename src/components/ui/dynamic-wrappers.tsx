"use client";

// Heavy non-critical components — loaded as client components
// Direct import instead of next/dynamic to avoid SSR bailout issues in Next.js 16

export { SceneThemeRenderer } from "@/components/ui/scene-themes";
export { WidgetPanel } from "@/components/ui/widget-panel";
