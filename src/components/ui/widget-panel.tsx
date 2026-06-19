"use client";

// ============================================================
// Digital Garden — Widget Panel（桌面小组件面板）
// ============================================================
// 统一管理可选浮动组件：月历、天气
// 每个组件独立拖拽，localStorage 持久位置
// 通过自定义事件 "garden-prefs" 实时响应设置变更
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { WidgetContainer } from "./widget-container";
import { MiniCalendar } from "./mini-calendar";
import { WeatherWidget } from "./weather-widget";

function getBool(key: string, fallback = false): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "true";
  } catch { return fallback; }
}

export function WidgetPanel() {
  const [showCal, setShowCal] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setShowCal(getBool("garden-widget-cal", false));
    setShowWeather(getBool("garden-widget-weather", false));
  }, []);

  useEffect(() => {
    refresh();
    setMounted(true);
  }, [refresh]);

  // Listen for real-time prefs changes (from settings page)
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("garden-prefs", handler);
    return () => window.removeEventListener("garden-prefs", handler);
  }, [refresh]);

  if (!mounted) return null;
  if (!showCal && !showWeather) return null;

  return (
    <>
      {showCal && (
        <WidgetContainer
          id="calendar"
          title="月历"
          defaultPos={{ x: 0.75, y: 0.15 }}
          onClose={() => {
            setShowCal(false);
            try { localStorage.setItem("garden-widget-cal", "false"); } catch {}
            window.dispatchEvent(new CustomEvent("garden-prefs"));
          }}
        >
          <MiniCalendar />
        </WidgetContainer>
      )}
      {showWeather && (
        <WidgetContainer
          id="weather"
          title="天气"
          defaultPos={{ x: 0.75, y: 0.45 }}
          onClose={() => {
            setShowWeather(false);
            try { localStorage.setItem("garden-widget-weather", "false"); } catch {}
            window.dispatchEvent(new CustomEvent("garden-prefs"));
          }}
        >
          <WeatherWidget />
        </WidgetContainer>
      )}
    </>
  );
}
