// ============================================================
// Digital Garden 2.0 — Mermaid Extension (Typora-style editing)
// ============================================================
// 点击 Mermaid 块 → 弹出编辑面板 → 左侧代码 / 右侧实时预览
// ============================================================
import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mermaid: {
      setMermaid: (diagram?: string) => ReturnType;
    };
  }
}

export const MermaidBlock = Node.create({
  name: "mermaid",
  group: "block",
  content: "text*",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      diagram: { default: "graph TD\n  A[开始] --> B[结束]" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='mermaid']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "mermaid" }), 0];
  },

  addCommands() {
    return {
      setMermaid: (diagram?: string) => ({ commands }) => {
        return commands.insertContent({
          type: "mermaid",
          content: [{ type: "text", text: diagram || "graph TD\n  A[开始] --> B[结束]" }],
        });
      },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("div");
      dom.setAttribute("data-type", "mermaid");
      dom.className = "mermaid-block rounded-lg border border-border bg-muted p-4 my-3 relative cursor-pointer hover:border-primary/30 transition-colors";

      const label = document.createElement("span");
      label.className = "absolute top-1 right-2 text-[0.625rem] text-muted-foreground font-mono";
      label.textContent = "mermaid";
      dom.appendChild(label);

      const preview = document.createElement("div");
      preview.className = "mermaid-preview mt-2 flex justify-center overflow-x-auto min-h-[3em]";
      dom.appendChild(preview);

      const editHint = document.createElement("div");
      editHint.className = "absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/5 rounded-lg pointer-events-none";
      editHint.innerHTML = '<span class="text-xs bg-card/90 px-3 py-1.5 rounded-full shadow border border-border">✏️ 点击编辑流程图</span>';
      dom.appendChild(editHint);

      let renderTimer: ReturnType<typeof setTimeout>;

      const renderMermaid = () => {
        clearTimeout(renderTimer);
        renderTimer = setTimeout(async () => {
          try {
            const mermaid = (await import("mermaid")).default;
            mermaid.initialize({
              startOnLoad: false,
              theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
            });
            const id = "mermaid-" + Math.random().toString(36).slice(2, 10);
            const code = node.textContent || "graph TD\n  A[开始] --> B[结束]";
            const { svg } = await mermaid.render(id, code);
            preview.innerHTML = svg;
          } catch {
            preview.innerHTML = '<span class="text-xs text-red-500">⚠ 语法错误，点击编辑</span>';
          }
        }, 300);
      };

      renderMermaid();

      // ── Click to open edit modal ──────────────────

      dom.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Remove existing modal if any
        const existing = document.querySelector(".mermaid-editor-modal");
        if (existing) existing.remove();

        const modal = document.createElement("div");
        modal.className = "mermaid-editor-modal";
        modal.style.cssText =
          "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;";
        modal.addEventListener("click", (ev) => {
          if (ev.target === modal) modal.remove();
        });

        const panel = document.createElement("div");
        panel.style.cssText =
          "background:var(--color-card);border-radius:12px;border:1px solid var(--color-border);box-shadow:0 20px 60px rgba(0,0,0,0.3);width:min(90vw,800px);max-height:85vh;display:flex;flex-direction:column;overflow:hidden;";
        modal.appendChild(panel);

        const header = document.createElement("div");
        header.style.cssText =
          "display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--color-border);font-size:13px;font-weight:600;color:var(--color-foreground);";
        header.innerHTML = '<span>📊 Mermaid 流程图编辑器</span><button style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--color-muted-foreground);">✕</button>';
        header.querySelector("button")!.addEventListener("click", () => modal.remove());
        panel.appendChild(header);

        const body = document.createElement("div");
        body.style.cssText = "display:flex;flex:1;min-height:0;overflow:hidden;";
        panel.appendChild(body);

        // Left: code editor
        const left = document.createElement("div");
        left.style.cssText = "flex:1;min-width:0;border-right:1px solid var(--color-border);display:flex;flex-direction:column;";
        body.appendChild(left);

        const textarea = document.createElement("textarea");
        textarea.style.cssText =
          "flex:1;padding:16px;border:none;outline:none;resize:none;font-family:monospace;font-size:13px;line-height:1.6;background:var(--color-muted);color:var(--color-foreground);";
        textarea.value = node.textContent || "graph TD\n  A[开始] --> B[结束]";
        textarea.spellcheck = false;
        left.appendChild(textarea);

        // Right: live preview
        const right = document.createElement("div");
        right.style.cssText = "flex:1;min-width:0;padding:16px;overflow:auto;display:flex;align-items:center;justify-content:center;background:var(--color-background);";
        body.appendChild(right);

        let editTimer: ReturnType<typeof setTimeout>;
        const updatePreview = () => {
          clearTimeout(editTimer);
          editTimer = setTimeout(async () => {
            try {
              const mermaid = (await import("mermaid")).default;
              mermaid.initialize({
                startOnLoad: false,
                theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
              });
              const id = "mermaid-edit-" + Math.random().toString(36).slice(2, 10);
              const { svg } = await mermaid.render(id, textarea.value || "graph TD\n  A[开始] --> B[结束]");
              right.innerHTML = svg;
            } catch { right.innerHTML = '<span class="text-xs text-red-500">⚠ 语法错误</span>'; }
          }, 400);
        };

        textarea.addEventListener("input", updatePreview);
        updatePreview();

        // Save button
        const footer = document.createElement("div");
        footer.style.cssText =
          "display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--color-border);";
        footer.innerHTML = `
          <button class="mermaid-cancel-btn" style="padding:6px 16px;border-radius:8px;border:1px solid var(--color-border);background:var(--color-card);color:var(--color-foreground);font-size:12px;cursor:pointer;">取消</button>
          <button class="mermaid-save-btn" style="padding:6px 20px;border-radius:8px;border:none;background:var(--color-primary);color:#fff;font-size:12px;cursor:pointer;">确认</button>
        `;
        panel.appendChild(footer);

        footer.querySelector(".mermaid-cancel-btn")!.addEventListener("click", () => modal.remove());
        footer.querySelector(".mermaid-save-btn")!.addEventListener("click", () => {
          const pos = getPos();
          if (typeof pos === "number") {
            editor.commands.command(({ tr }) => {
              tr.setNodeMarkup(pos, undefined, { diagram: textarea.value });
              const nodeAtPos = tr.doc.nodeAt(pos);
              if (nodeAtPos) {
                const textNode = editor.schema.text(textarea.value);
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
          if (updatedNode.textContent !== node.textContent) {
            renderMermaid();
          }
          return true;
        },
      };
    };
  },
});
