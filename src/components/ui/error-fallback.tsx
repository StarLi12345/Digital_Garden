"use client";

import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: "2rem",
          margin: "2rem auto",
          maxWidth: 500,
          background: "rgba(255,100,100,0.1)",
          border: "1px solid rgba(255,100,100,0.4)",
          borderRadius: 12,
          fontFamily: "monospace",
          fontSize: 13,
          lineHeight: 1.6,
        }}>
          <p style={{ fontWeight: 700, color: "var(--color-accent, #e55)", marginBottom: 8 }}>
            ⚠️ 页面渲染错误
          </p>
          <p style={{ color: "var(--color-foreground)", wordBreak: "break-all" }}>
            {this.state.error.message}
          </p>
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: "pointer", color: "var(--color-muted-foreground)" }}>
              堆栈跟踪
            </summary>
            <pre style={{
              marginTop: 4,
              padding: 8,
              background: "rgba(0,0,0,0.05)",
              borderRadius: 6,
              overflow: "auto",
              maxHeight: 200,
              fontSize: 11,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}>
              {this.state.error.stack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
