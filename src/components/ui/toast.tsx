"use client";

// ============================================================
// Digital Garden — Toast（仿 Element Plus ElMessage）
// ============================================================
// 全局轻量通知 · 自动消失 · 支持 success/error/warning/info
// 用法: toast.success("保存成功") / toast.error("失败")
// ============================================================

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// Singleton for global use (outside React)
let globalAdd: ((type: ToastType, msg: string) => void) | null = null;

export const toast = {
  success: (msg: string) => globalAdd?.("success", msg),
  error: (msg: string) => globalAdd?.("error", msg),
  warning: (msg: string) => globalAdd?.("warning", msg),
  info: (msg: string) => globalAdd?.("info", msg),
};

// ── Provider ─────────────────────────────────────────

let _id = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((type: ToastType, message: string) => {
    const id = ++_id;
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => { globalAdd = add; return () => { globalAdd = null; }; }, [add]);

  const ctx: ToastContextValue = {
    success: (msg) => add("success", msg),
    error: (msg) => add("error", msg),
    warning: (msg) => add("warning", msg),
    info: (msg) => add("info", msg),
  };

  const icons: Record<ToastType, string> = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
  const bgColors: Record<ToastType, string> = {
    success: "bg-emerald-500", error: "bg-red-500", warning: "bg-amber-500", info: "bg-sky-500",
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Toast container — fixed top-center */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none" style={{ zIndex: 2000 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 ${bgColors[t.type]} text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg animate-toast-in`}
          >
            <span className="text-sm">{icons[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-toast-in { animation: toastIn 0.25s ease-out; }
      `}</style>
    </ToastContext.Provider>
  );
}
