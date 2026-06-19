// ============================================================
// Digital Garden 2.0 — Math/KaTeX Extension (Typora-style)
// ============================================================
// 点击 LaTeX 块 → 弹出编辑面板 → 左侧公式 / 右侧实时预览
// ============================================================
import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      setMathBlock: (formula?: string) => ReturnType;
    };
  }
}

export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  content: "text*",
  defining: true,
  isolating: true,

  addAttributes() {
    return { formula: { default: "E = mc^2" } };
  },

  parseHTML() {
    return [{ tag: "div[data-type='mathBlock']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "mathBlock" }), 0];
  },

  addCommands() {
    return {
      setMathBlock: (formula?: string) => ({ commands }) => {
        return commands.insertContent({
          type: "mathBlock",
          content: [{ type: "text", text: formula || "E = mc^2" }],
        });
      },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("div");
      dom.setAttribute("data-type", "mathBlock");
      dom.className = "math-block rounded-lg border border-border bg-muted p-4 my-3 relative cursor-pointer hover:border-primary/30 transition-colors";

      const label = document.createElement("span");
      label.className = "absolute top-1 right-2 text-[0.625rem] text-muted-foreground font-mono";
      label.textContent = "LaTeX";
      dom.appendChild(label);

      const preview = document.createElement("div");
      preview.className = "math-preview mt-2 flex justify-center text-foreground text-lg min-h-[2em]";
      dom.appendChild(preview);

      const editHint = document.createElement("div");
      editHint.className = "absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/5 rounded-lg pointer-events-none";
      editHint.innerHTML = '<span class="text-xs bg-card/90 px-3 py-1.5 rounded-full shadow border border-border">✏️ 点击编辑公式</span>';
      dom.appendChild(editHint);

      let renderTimer: ReturnType<typeof setTimeout>;
      let currentFormula = node.textContent || "E = mc^2";

      const renderMath = (formula?: string) => {
        clearTimeout(renderTimer);
        const formulaToRender = formula ?? currentFormula;
        renderTimer = setTimeout(async () => {
          try {
            const katex = (await import("katex")).default;
            const html = katex.renderToString(formulaToRender, {
              throwOnError: false,
              displayMode: true,
            });
            if (preview.isConnected) {
              preview.innerHTML = html;
            }
          } catch {
            if (preview.isConnected) {
              preview.innerHTML = '<span class="text-xs text-red-500">⚠ 语法错误，点击编辑</span>';
            }
          }
        }, 300);
      };

      renderMath();

      // ── Click to open edit modal ──────────────────

      dom.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const existing = document.querySelector(".math-editor-modal");
        if (existing) existing.remove();

        const modal = document.createElement("div");
        modal.className = "math-editor-modal";
        modal.style.cssText =
          "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;";
        modal.addEventListener("click", (ev) => {
          if (ev.target === modal) modal.remove();
        });

        const panel = document.createElement("div");
        panel.style.cssText =
          "background:var(--color-card);border-radius:12px;border:1px solid var(--color-border);box-shadow:0 20px 60px rgba(0,0,0,0.3);width:min(90vw,600px);max-height:85vh;display:flex;flex-direction:column;overflow:hidden;";
        modal.appendChild(panel);

        const header = document.createElement("div");
        header.style.cssText =
          "display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--color-border);font-size:13px;font-weight:600;color:var(--color-foreground);";
        header.innerHTML = '<span>📐 LaTeX 公式编辑器</span><button style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--color-muted-foreground);">✕</button>';
        header.querySelector("button")!.addEventListener("click", () => modal.remove());
        panel.appendChild(header);

        const body = document.createElement("div");
        body.style.cssText = "display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;padding:16px;gap:16px;";
        panel.appendChild(body);

        // Formula input
        const textarea = document.createElement("textarea");
        textarea.style.cssText =
          "width:100%;min-height:60px;padding:12px;border:1px solid var(--color-border);border-radius:8px;outline:none;resize:none;font-family:monospace;font-size:14px;line-height:1.6;background:var(--color-muted);color:var(--color-foreground);";
        textarea.value = node.textContent || "E = mc^2";
        textarea.spellcheck = false;
        textarea.placeholder = "输入 LaTeX 公式，如：\\sum_{i=1}^{n} x_i";
        body.appendChild(textarea);

        // Live preview
        const previewPanel = document.createElement("div");
        previewPanel.style.cssText =
          "min-height:80px;display:flex;align-items:center;justify-content:center;padding:16px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-background);font-size:1.3em;";
        body.appendChild(previewPanel);

        let editTimer: ReturnType<typeof setTimeout>;
        const updatePreview = () => {
          clearTimeout(editTimer);
          editTimer = setTimeout(async () => {
            try {
              const katex = (await import("katex")).default;
              const html = katex.renderToString(textarea.value || "E=mc^2", {
                throwOnError: false,
                displayMode: true,
              });
              previewPanel.innerHTML = html;
            } catch {
              previewPanel.innerHTML = '<span class="text-xs text-red-500">⚠ 语法错误</span>';
            }
          }, 400);
        };

        textarea.addEventListener("input", updatePreview);
        updatePreview();

        // Footer
        const footer = document.createElement("div");
        footer.style.cssText =
          "display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--color-border);";
        footer.innerHTML = `
          <button class="math-cancel-btn" style="padding:6px 16px;border-radius:8px;border:1px solid var(--color-border);background:var(--color-card);color:var(--color-foreground);font-size:12px;cursor:pointer;">取消</button>
          <button class="math-save-btn" style="padding:6px 20px;border-radius:8px;border:none;background:var(--color-primary);color:#fff;font-size:12px;cursor:pointer;">确认</button>
        `;
        panel.appendChild(footer);

        footer.querySelector(".math-cancel-btn")!.addEventListener("click", () => modal.remove());
        footer.querySelector(".math-save-btn")!.addEventListener("click", () => {
          const pos = getPos();
          if (typeof pos === "number") {
            const newCode = textarea.value;
            // Update the node's text content via editor transaction
            editor.commands.command(({ tr }) => {
              const nodeAtPos = tr.doc.nodeAt(pos);
              if (nodeAtPos) {
                tr.setNodeMarkup(pos, undefined, { formula: newCode });
                // Create a new text node with the updated content
                const textNode = editor.schema.text(newCode);
                tr.replaceWith(pos + 1, pos + nodeAtPos.nodeSize - 1, textNode);
              }
              return true;
            });
          }
          modal.remove();
        });

        document.body.appendChild(modal);
        textarea.focus();
      });

      return {
        dom,
        update: (updatedNode) => {
          const newFormula = updatedNode.textContent || "";
          if (newFormula !== currentFormula) {
            currentFormula = newFormula;
            renderMath(newFormula);
          }
          return true;
        },
      };
    };
  },
});
