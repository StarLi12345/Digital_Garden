// ============================================================
// Digital Garden — Keyboard Shortcuts Extension
// ============================================================
// 飞书/Notion 风格快捷键：自动格式化 + Markdown 快捷输入
// ============================================================

import { Extension } from "@tiptap/core";

export const KeyboardShortcuts = Extension.create({
  name: "keyboardShortcuts",

  addKeyboardShortcuts() {
    return {
      // ── 块级快捷键 ────────────────────────────────────
      // Ctrl+Shift+1~5: 快速插入标题
      "Mod-Shift-1": () => this.editor.chain().focus().toggleHeading({ level: 1 }).run(),
      "Mod-Shift-2": () => this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
      "Mod-Shift-3": () => this.editor.chain().focus().toggleHeading({ level: 3 }).run(),
      "Mod-Shift-4": () => this.editor.chain().focus().toggleHeading({ level: 4 }).run(),
      "Mod-Shift-5": () => this.editor.chain().focus().toggleHeading({ level: 5 }).run(),

      // Ctrl+Shift+0: 转换为正文
      "Mod-Shift-0": () => this.editor.chain().focus().setParagraph().run(),

      // Ctrl+Shift+C: 代码块
      "Mod-Shift-C": () => this.editor.chain().focus().toggleCodeBlock().run(),

      // Ctrl+Shift+Q: 引用块
      "Mod-Shift-Q": () => this.editor.chain().focus().toggleBlockquote().run(),

      // Ctrl+Shift+L: 有序列表
      "Mod-Shift-L": () => this.editor.chain().focus().toggleOrderedList().run(),

      // Ctrl+Shift+8: 无序列表
      "Mod-Shift-8": () => this.editor.chain().focus().toggleBulletList().run(),

      // Ctrl+Shift+9: 任务列表
      "Mod-Shift-9": () => this.editor.chain().focus().toggleTaskList().run(),

      // Ctrl+Shift+X: 水平分割线
      "Mod-Shift-X": () => this.editor.chain().focus().setHorizontalRule().run(),

      // ── 文本格式快捷键 ──────────────────────────────
      // Ctrl+U: 下划线
      "Mod-u": () => this.editor.chain().focus().toggleUnderline().run(),

      // Ctrl+Shift+S: 删除线
      "Mod-Shift-s": () => this.editor.chain().focus().toggleStrike().run(),

      // Ctrl+E: 行内代码
      "Mod-e": () => this.editor.chain().focus().toggleCode().run(),

      // Ctrl+K: 插入链接
      "Mod-k": () => {
        const url = window.prompt("输入链接 URL:");
        if (url) {
          this.editor.chain().focus().setLink({ href: url }).run();
        }
        return true;
      },

      // Ctrl+Shift+K: 移除链接
      "Mod-Shift-k": () => this.editor.chain().focus().unsetLink().run(),

      // ── 编辑操作 ────────────────────────────────────
      // Ctrl+D: 删除当前行
      "Mod-d": () => {
        const { $from } = this.editor.state.selection;
        const start = $from.start();
        const end = $from.end();
        this.editor.chain().focus().deleteRange({ from: start, to: end }).run();
        return true;
      },

      // Ctrl+Shift+D: 复制当前行
      "Mod-Shift-d": () => {
        const { state } = this.editor;
        const { $from } = state.selection;
        const lineStart = $from.start();
        const lineEnd = $from.end();
        const lineContent = state.doc.textBetween(lineStart, lineEnd);

        this.editor.chain().focus()
          .command(({ tr }) => {
            tr.insertText("\n" + lineContent, lineEnd);
            return true;
          })
          .run();
        return true;
      },

      // Ctrl+\: 清除所有格式
      "Mod-\\": () => this.editor.chain().focus().clearNodes().unsetAllMarks().run(),
    };
  },
});
