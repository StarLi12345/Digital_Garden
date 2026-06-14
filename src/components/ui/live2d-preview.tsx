"use client";

import { useEffect, useState } from "react";
import { getActiveModel, type Live2DModel } from "@/lib/live2d-config";

function getModelMeta(model: Live2DModel) {
  const sizeEstimates: Record<string, string> = {
    "/resources/live2d/models/koharu/koharu.model.json": "~2 MB",
    "/resources/live2d/models/shizuku/shizuku.model.json": "~4 MB",
    "/resources/live2d/models/haru/haru02.model.json": "~5 MB",
    "/resources/live2d/models/chitose/chitose.model.json": "~3 MB",
  };
  return {
    size: sizeEstimates[model.jsonPath] ?? "—",
    format: model.jsonPath.endsWith(".model3.json") ? "Cubism 3+" : "Cubism 2",
  };
}

export function Live2DPreview() {
  const [model, setModel] = useState<Live2DModel>(getActiveModel);

  useEffect(() => {
    const handler = () => setModel(getActiveModel());
    window.addEventListener("live2d-config-changed", handler);
    return () => window.removeEventListener("live2d-config-changed", handler);
  }, []);

  const meta = getModelMeta(model);

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 self-start">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: model.previewColor }}
        />
        <span className="text-sm font-medium text-foreground truncate">{model.name}</span>
        <span className="text-[0.563rem] text-muted-foreground font-mono ml-auto">
          {meta.format}
        </span>
      </div>

      <p className="text-[0.688rem] text-muted-foreground">{model.description}</p>

      {/* Quick info */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[0.625rem]">
        <span className="text-muted-foreground">格式</span>
        <span className="text-foreground font-mono">{meta.format}</span>
        <span className="text-muted-foreground">大小</span>
        <span className="text-foreground font-mono">{meta.size}</span>
        <span className="text-muted-foreground">路径</span>
        <span className="text-foreground font-mono break-all">{model.jsonPath}</span>
      </div>

      <p className="text-[0.563rem] text-muted-foreground/40 border-t border-border pt-2">
        模型实时渲染在页面左下角 · 鼠标按住可拖动 · 滚轮缩放
      </p>
    </div>
  );
}
