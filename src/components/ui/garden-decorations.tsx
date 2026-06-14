"use client";

// ============================================================
// Digital Garden — Garden Theme SVG Decorations
// ============================================================
// 角落装饰 · 空状态 · 卡片点缀
// 仅在花园主题激活时渲染
// ============================================================

import { useEffect, useState } from "react";

export function GardenDecorations() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const check = () => {
      try { setActive(document.documentElement.getAttribute("data-theme") === "garden"); }
      catch { setActive(false); }
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("garden-theme-changed", check);
    return () => { obs.disconnect(); window.removeEventListener("garden-theme-changed", check); };
  }, []);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2 }} aria-hidden="true">
      {/* Top-left: branch */}
      <img
        src="/themes/garden/decorations/leaf.svg"
        alt=""
        className="absolute opacity-[0.06] dark:opacity-[0.04]"
        style={{ top: "4rem", left: "-1rem", width: "140px", transform: "rotate(-15deg)" }}
      />
      {/* Bottom-right: leaf */}
      <img
        src="/themes/garden/decorations/leaf.svg"
        alt=""
        className="absolute opacity-[0.05] dark:opacity-[0.03]"
        style={{ bottom: "2rem", right: "-0.5rem", width: "120px", transform: "rotate(25deg) scaleX(-1)" }}
      />
      {/* Center-right: floating petal */}
      <img
        src="/themes/garden/decorations/petal.svg"
        alt=""
        className="absolute opacity-[0.06] dark:opacity-[0.04]"
        style={{ top: "35%", right: "2rem", width: "40px", transform: "rotate(40deg)" }}
      />
    </div>
  );
}
