"use client";

// ============================================================
// Digital Garden — GardenSlider v2
// ============================================================
// · 修复：tooltip/marks 不再遮挡滑块中间区域
// · 数字输入框实时编辑，点击「确认」或 blur 才生效
// · 超出范围 → 重置旧值 + 弹出行内警告
// ============================================================

import { useState, useEffect, useRef, type ChangeEvent } from "react";

interface GardenSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** 单位后缀，如 "%" "px" */
  unit?: string;
  /** 显示数字输入框 */
  showInput?: boolean;
  /** 标记点，如 [0, 25, 50, 75, 100] */
  marks?: number[];
  /** 标记点标签 */
  markLabels?: Record<number, string>;
  className?: string;
}

export default function GardenSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  showInput = true,
  marks,
  markLabels,
  className = "",
}: GardenSliderProps) {
  const [localVal, setLocalVal] = useState(value);
  const [inputVal, setInputVal] = useState(String(value));
  const [showTooltip, setShowTooltip] = useState(false);
  const [warning, setWarning] = useState("");
  const sliderRef = useRef<HTMLInputElement>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showWarning = (msg: string) => {
    setWarning(msg);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    warningTimer.current = setTimeout(() => setWarning(""), 2000);
  };

  useEffect(() => {
    return () => { if (warningTimer.current) clearTimeout(warningTimer.current); };
  }, []);

  // Sync external value
  useEffect(() => {
    setLocalVal(value);
    setInputVal(String(value));
  }, [value]);

  // ── Slider change (real-time) ────────────────────────
  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setLocalVal(v);
    setInputVal(String(v));
    setWarning("");
    onChange(v);
  };

  // ── Input: allow free typing ─────────────────────────
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    setWarning(""); // clear on typing
  };

  // ── Confirm: validate and apply ──────────────────────
  const confirmInput = () => {
    const raw = inputVal.trim();
    if (raw === "") {
      // Reset to current slider value
      setInputVal(String(localVal));
      setWarning("");
      return;
    }
    const v = Number(raw);
    if (isNaN(v) || v < min || v > max) {
      setInputVal(String(localVal)); // reset
      showWarning(`请输入 ${min}-${max} 范围内的数字`);
      return;
    }
    const clamped = Math.min(max, Math.max(min, v));
    setLocalVal(clamped);
    setInputVal(String(clamped));
    setWarning("");
    onChange(clamped);
  };

  // ── Blur → auto-confirm ──────────────────────────────
  const handleInputBlur = () => {
    confirmInput();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      confirmInput();
    }
  };

  // ── Percent for tooltip positioning ──────────────────
  const percent = ((localVal - min) / (max - min)) * 100;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2">
        {/* Slider — tooltip rendered above via a wrapper */}
        <div className="relative flex-1 flex items-center">
          {/* Tooltip — outside slider hit area, pointer-events-none */}
          <div
            className="absolute -top-7 left-0 right-0 pointer-events-none"
            style={{ height: 20 }}
          >
            <div
              className={`absolute transition-opacity duration-150 text-[0.625rem] font-medium tabular-nums bg-foreground text-background rounded px-1.5 py-0.5 whitespace-nowrap ${
                showTooltip ? "opacity-100" : "opacity-0"
              }`}
              style={{
                left: `clamp(0%, ${percent}%, calc(100% - 2rem))`,
                transform: "translateX(-50%)",
              }}
            >
              {localVal}
              {unit}
            </div>
          </div>

          <input
            ref={sliderRef}
            type="range"
            min={min}
            max={max}
            step={step}
            value={localVal}
            onChange={handleSliderChange}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onPointerDown={() => setShowTooltip(true)}
            onPointerUp={() => setShowTooltip(false)}
            className="garden-slider w-full relative z-10"
            style={{
              accentColor: "var(--color-primary)",
              height: "24px",
              cursor: "pointer",
              background: "transparent",
            }}
          />

          {/* Marks — pointer-events-none so clicks pass through to slider */}
          {marks && (
            <div className="absolute top-4 left-0 right-0 flex justify-between px-[2px] pointer-events-none z-0">
              {marks.map((m) => (
                <div key={m} className="flex flex-col items-center">
                  <div className="w-0.5 h-1.5 bg-muted-foreground/30 rounded" />
                  {markLabels?.[m] && (
                    <span
                      className="text-[9px] text-muted-foreground mt-0.5 pointer-events-auto cursor-pointer hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocalVal(m);
                        setInputVal(String(m));
                        onChange(m);
                      }}
                    >
                      {markLabels[m]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Number input + confirm button */}
        {showInput && (
          <div className="flex items-center gap-1 shrink-0">
            <input
              type="number"
              value={inputVal}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="w-16 text-center rounded border border-border bg-card px-1 py-1 text-xs text-foreground focus:outline-none focus:border-primary appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={confirmInput}
              className="rounded bg-primary px-2 py-1 text-[0.625rem] text-white hover:bg-primary-hover interactive shrink-0"
            >
              确认
            </button>
            {unit && (
              <span className="text-[0.625rem] text-muted-foreground shrink-0">
                {unit}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Inline warning */}
      {warning && (
        <p className="text-[0.625rem] text-red-500 ml-1">{warning}</p>
      )}
    </div>
  );
}
