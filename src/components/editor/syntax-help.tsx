"use client";

// ============================================================
// Digital Garden 3.0 — Syntax Help Modal
// ============================================================
// Mermaid 流程图 & LaTeX 公式语法速查
// ============================================================

import { useState, useEffect, useCallback } from "react";

interface SyntaxHelpProps {
  open: boolean;
  onClose: () => void;
}

export default function SyntaxHelp({ open, onClose }: SyntaxHelpProps) {
  const [tab, setTab] = useState<"mermaid" | "latex">("mermaid");

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div
      className="syntax-help-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="syntax-help-panel"
        style={{
          background: "var(--color-card)",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          width: "min(92vw, 760px)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--color-border)",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-foreground)" }}>
            📖 语法速查手册
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: "var(--color-muted-foreground)",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "1px solid var(--color-border)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setTab("mermaid")}
            style={{
              flex: 1,
              padding: "8px 16px",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: tab === "mermaid" ? 600 : 400,
              background: tab === "mermaid" ? "var(--color-background)" : "transparent",
              color:
                tab === "mermaid"
                  ? "var(--color-foreground)"
                  : "var(--color-muted-foreground)",
              borderBottom: tab === "mermaid" ? "2px solid var(--color-primary)" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            📊 Mermaid 流程图
          </button>
          <button
            onClick={() => setTab("latex")}
            style={{
              flex: 1,
              padding: "8px 16px",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: tab === "latex" ? 600 : 400,
              background: tab === "latex" ? "var(--color-background)" : "transparent",
              color:
                tab === "latex"
                  ? "var(--color-foreground)"
                  : "var(--color-muted-foreground)",
              borderBottom: tab === "latex" ? "2px solid var(--color-primary)" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            📐 LaTeX 数学公式
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "16px",
            fontSize: "12px",
            lineHeight: 1.8,
            color: "var(--color-foreground)",
          }}
        >
          {tab === "mermaid" ? <MermaidRef /> : <LatexRef />}
        </div>
      </div>
    </div>
  );
}

// ── Mermaid Reference ────────────────────────────────────

function MermaidRef() {
  const examples = [
    {
      title: "流程图 (Flowchart)",
      code: `graph TD
  A[开始] --> B{判断条件}
  B -->|是| C[执行操作]
  B -->|否| D[结束]
  C --> D`,
    },
    {
      title: "时序图 (Sequence)",
      code: `sequenceDiagram
  用户->>服务器: 发送请求
  服务器->>数据库: 查询数据
  数据库-->>服务器: 返回结果
  服务器-->>用户: 响应数据`,
    },
    {
      title: "甘特图 (Gantt)",
      code: `gantt
  title 项目计划
  dateFormat YYYY-MM-DD
  section 阶段一
  需求分析  :a1, 2025-01-01, 7d
  设计      :a2, after a1, 5d
  section 阶段二
  开发      :b1, after a2, 10d
  测试      :b2, after b1, 5d`,
    },
    {
      title: "状态图 (State)",
      code: `stateDiagram-v2
  [*] --> 待审核
  待审核 --> 审核通过
  待审核 --> 审核拒绝
  审核通过 --> [*]
  审核拒绝 --> 待审核`,
    },
    {
      title: "饼图 (Pie)",
      code: `pie title 技术栈占比
  "TypeScript" : 45
  "CSS" : 25
  "Prisma" : 15
  "其他" : 15`,
    },
    {
      title: "思维导图 (Mindmap)",
      code: `mindmap
  root((数字花园))
    写作
      日记
      技术笔记
      读书摘录
    系统
      Next.js
      Prisma
      SQLite
    设计
      暗色主题
      响应式布局`,
    },
  ];

  return (
    <div>
      <p style={{ color: "var(--color-muted-foreground)", marginBottom: 12 }}>
        Mermaid 是一种用纯文本绘制图表的语言。支持流程图、时序图、甘特图、状态图、饼图等。
        在编辑器中输入 <code style={inlineCodeStyle}>/</code> → 选择「流程图」插入。
      </p>
      {examples.map((ex, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: "13px", fontWeight: 600, marginBottom: 6, color: "var(--color-foreground)" }}>
            {ex.title}
          </h4>
          <pre
            style={{
              background: "var(--color-muted)",
              borderRadius: "8px",
              padding: "10px 14px",
              overflow: "auto",
              fontSize: "11px",
              lineHeight: 1.7,
              fontFamily: "ui-monospace, SFMono-Regular, 'Consolas', monospace",
              border: "1px solid var(--color-border)",
            }}
          >
            <code>{ex.code}</code>
          </pre>
        </div>
      ))}
      <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "var(--color-muted)", border: "1px solid var(--color-border)", fontSize: "11px", color: "var(--color-muted-foreground)" }}>
        💡 <strong>节点形状：</strong>
        <code style={inlineCodeStyle}>A[矩形]</code>{" "}
        <code style={inlineCodeStyle}>B(圆角)</code>{" "}
        <code style={inlineCodeStyle}>C{"{菱形}"}</code>{" "}
        <code style={inlineCodeStyle}>D((圆形))</code>{" "}
        <code style={inlineCodeStyle}>E{"[斜边形]"}</code>
        <br />
        💡 <strong>连接线：</strong>
        <code style={inlineCodeStyle}>--&gt;</code> 实线箭头{" "}
        <code style={inlineCodeStyle}>-.&gt;</code> 虚线箭头{" "}
        <code style={inlineCodeStyle}>==&gt;</code> 粗线箭头{" "}
        <code style={inlineCodeStyle}>--文本--&gt;</code> 带标签
      </div>
    </div>
  );
}

// ── LaTeX Reference ──────────────────────────────────────

function LatexRef() {
  const sections = [
    {
      title: "基本结构",
      items: [
        { desc: "上标", code: "x^{2}" },
        { desc: "下标", code: "x_{i}" },
        { desc: "分数", code: "\\frac{a}{b}" },
        { desc: "根号", code: "\\sqrt{x}" },
        { desc: "n次根号", code: "\\sqrt[n]{x}" },
        { desc: "向量", code: "\\vec{v}" },
        { desc: "点乘", code: "\\cdot" },
        { desc: "空格", code: "\\;" },
      ],
    },
    {
      title: "希腊字母",
      items: [
        { desc: "alpha", code: "\\alpha" },
        { desc: "beta", code: "\\beta" },
        { desc: "gamma", code: "\\gamma" },
        { desc: "delta", code: "\\delta" },
        { desc: "theta", code: "\\theta" },
        { desc: "lambda", code: "\\lambda" },
        { desc: "mu", code: "\\mu" },
        { desc: "pi", code: "\\pi" },
        { desc: "sigma", code: "\\sigma" },
        { desc: "omega", code: "\\omega" },
      ],
    },
    {
      title: "运算符 & 关系",
      items: [
        { desc: "求和", code: "\\sum_{i=1}^{n}" },
        { desc: "积分", code: "\\int_{a}^{b}" },
        { desc: "极限", code: "\\lim_{x \\to \\infty}" },
        { desc: "乘积", code: "\\prod_{i=1}^{n}" },
        { desc: "约等于", code: "\\approx" },
        { desc: "不等于", code: "\\neq" },
        { desc: "大于等于", code: "\\geq" },
        { desc: "小于等于", code: "\\leq" },
        { desc: "属于", code: "\\in" },
        { desc: "无穷", code: "\\infty" },
      ],
    },
    {
      title: "括号 & 矩阵",
      items: [
        { desc: "自适应括号", code: "\\left( \\frac{a}{b} \\right)" },
        { desc: "花括号", code: "\\{ x \\}" },
        { desc: "矩阵", code: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
        { desc: "分段函数", code: "f(x) = \\begin{cases} x & x>0 \\\\ 0 & x\\le0 \\end{cases}" },
      ],
    },
    {
      title: "常用符号",
      items: [
        { desc: "点号", code: "\\dots" },
        { desc: "箭头", code: "\\rightarrow" },
        { desc: "双箭头", code: "\\Rightarrow" },
        { desc: "全称量词", code: "\\forall" },
        { desc: "存在量词", code: "\\exists" },
        { desc: "偏导", code: "\\partial" },
        { desc: "度数", code: "90^{\\circ}" },
        { desc: "模运算", code: "a \\bmod m" },
      ],
    },
  ];

  return (
    <div>
      <p style={{ color: "var(--color-muted-foreground)", marginBottom: 12 }}>
        LaTeX 是科学排版语言，用于书写数学公式。支持行内公式 <code style={inlineCodeStyle}>$E=mc^2$</code> 和块级公式。
        在编辑器中输入 <code style={inlineCodeStyle}>/</code> → 选择「数学公式」插入块级公式。
      </p>
      {sections.map((section, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: "13px", fontWeight: 600, marginBottom: 6, color: "var(--color-foreground)" }}>
            {section.title}
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "4px 12px",
            }}
          >
            {section.items.map((item, j) => (
              <div
                key={j}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  background: "var(--color-muted)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <span style={{ color: "var(--color-muted-foreground)" }}>{item.desc}</span>
                <code
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, 'Consolas', monospace",
                    fontSize: "11px",
                    color: "var(--color-foreground)",
                    background: "var(--color-background)",
                    padding: "1px 6px",
                    borderRadius: "3px",
                  }}
                >
                  {item.code}
                </code>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Shared style ─────────────────────────────────────────

const inlineCodeStyle: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, 'Consolas', monospace",
  fontSize: "11px",
  background: "var(--color-background)",
  padding: "1px 5px",
  borderRadius: "3px",
  border: "1px solid var(--color-border)",
};
