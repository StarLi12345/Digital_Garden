// ============================================================
// Digital Garden — Drag Handle Extension (Notion ⋮⋮)
// ============================================================
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const dragKey = new PluginKey("dragHandle");

export const DragHandle = Extension.create({
  name: "dragHandle",

  addProseMirrorPlugins() {
    let dragSrcPos = -1;

    return [
      new Plugin({
        key: dragKey,
        props: {
          decorations(state) {
            const decos: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (node.isBlock && node.type.name !== "doc") {
                const dom = document.createElement("span");
                dom.className = "block-drag-handle";
                dom.innerHTML = "⋮⋮";
                dom.setAttribute("draggable", "true");
                dom.setAttribute("data-drag-pos", String(pos));
                dom.title = "拖拽排序";
                decos.push(Decoration.widget(pos + 1, dom, { side: -1 }));
              }
            });
            return DecorationSet.create(state.doc, decos);
          },

          handleDOMEvents: {
            dragstart(view, event) {
              const target = event.target;
              if (!(target instanceof HTMLElement)) return false;
              if (!target.classList.contains("block-drag-handle")) return false;
              dragSrcPos = parseInt(target.getAttribute("data-drag-pos") || "-1");
              if (dragSrcPos < 0) return false;
              event.dataTransfer!.effectAllowed = "move";
              event.dataTransfer!.setData("text/plain", String(dragSrcPos));
              return true;
            },

            dragover(view, event) {
              if (dragSrcPos < 0) return false;
              event.preventDefault();
              event.dataTransfer!.dropEffect = "move";
              return true;
            },

            drop(view, event) {
              if (dragSrcPos < 0) return false;
              event.preventDefault();
              try {
                const target = event.target;
                const handle = (target instanceof HTMLElement) ? target.closest(".block-drag-handle") : null;
                const targetPos = handle
                  ? parseInt(handle.getAttribute("data-drag-pos") || "-1")
                  : view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
                if (targetPos == null || targetPos < 0 || dragSrcPos === targetPos) {
                  dragSrcPos = -1;
                  return false;
                }

                const srcNode = view.state.doc.nodeAt(dragSrcPos);
                if (!srcNode) { dragSrcPos = -1; return false; }

                const { tr } = view.state;
                const srcSize = srcNode.nodeSize;
                let insertPos = targetPos;
                if (dragSrcPos < targetPos) insertPos -= srcSize;
                insertPos = Math.max(0, Math.min(insertPos, tr.doc.content.size));

                tr.delete(dragSrcPos, dragSrcPos + srcSize);
                tr.insert(insertPos, srcNode.copy(srcNode.content));
                view.dispatch(tr);
              } finally {
                dragSrcPos = -1;
              }
              return true;
            },

            dragend() {
              dragSrcPos = -1;
              return false;
            },
          },
        },
      }),
    ];
  },
});
