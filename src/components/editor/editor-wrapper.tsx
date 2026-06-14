"use client";

// ============================================================
// Digital Garden — Dynamic Editor Wrapper
// ============================================================
// 使用 next/dynamic 延迟加载 TipTap Editor。
// SSR 阶段渲染骨架屏，客户端挂载后才加载真实编辑器。
//
// 这是 TipTap 在 Next.js App Router 中正确工作的必要封装。
// ============================================================

import dynamic from "next/dynamic";
import type { EditorChangePayload } from "./tiptap-editor";

// ── Dynamic import ─────────────────────────────────────

const TipTapEditor = dynamic(() => import("./tiptap-editor"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

// ── Skeleton ───────────────────────────────────────────

function EditorSkeleton() {
  return (
    <div className="garden-editor-area" style={{ minHeight: 500 }}>
      <div style={{ padding: "2em 3em", minHeight: 480 }} className="space-y-3">
        <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

// ── Wrapper props ──────────────────────────────────────

interface EditorWrapperProps {
  initialContent?: Record<string, unknown>;
  onChange?: (payload: EditorChangePayload) => void;
  placeholder?: string;
}

export default function EditorWrapper({
  initialContent, onChange, placeholder,
}: EditorWrapperProps) {
  return (
    <TipTapEditor
      initialContent={initialContent}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}
