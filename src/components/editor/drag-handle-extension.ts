// ============================================================
// Digital Garden — Drag Handle Extension (Notion ⋮⋮)
// ============================================================
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { NodeSelection } from "@tiptap/pm/state";

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
              const target = event.target as HTMLElement;
              if (!target.classList.contains("block-drag-handle")) return false;
              dragSrcPos = parseInt(target.getAttribute("data-drag-pos") || "-1");
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
              const target = event.target as HTMLElement;
              const handle = target.closest(".block-drag-handle");
              const targetPos = handle ? parseInt(handle.getAttribute("data-drag-pos") || "-1") : view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
              if (!targetPos || targetPos < 0 || dragSrcPos === targetPos) { dragSrcPos = -1; return false; }

              const srcNode = view.state.doc.nodeAt(dragSrcPos);
              if (!srcNode) { dragSrcPos = -1; return false; }

              const { tr } = view.state;
              // Delete source, insert at target
              const srcSize = srcNode.nodeSize;
              let insertPos = targetPos;
              if (dragSrcPos < targetPos) insertPos -= srcSize;
              tr.delete(dragSrcPos, dragSrcPos + srcSize);
              tr.insert(insertPos > tr.doc.content.size ? tr.doc.content.size : Math.max(0, insertPos), srcNode.copy(tr.doc.resolve(insertPos).node()?.content));
              view.dispatch(tr);
              dragSrcPos = -1;
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
