"use client";

// ============================================================
// Digital Garden — Mini Calendar Widget（迷你月历）
// ============================================================
// 改编自 ZZZ TV calendar.js (3333357727)
// · 月导航 · 今天高亮标记 · 星期头
// ============================================================

import { useState, useEffect, useCallback } from "react";

const MONTHS = [
  "一月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "十一月", "十二月",
];
const DAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function MiniCalendar({ className = "" }: { className?: string }) {
  const [date, setDate] = useState(new Date());
  const today = new Date();
  const isCurrentMonth =
    date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

  const year = date.getFullYear();
  const month = date.getMonth();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 0).getDay(); // day of week for the 1st

  // Tick at midnight to refresh "today" highlight
  const [, setTick] = useState(0);
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const t = setTimeout(() => setTick((n) => n + 1), msUntilMidnight + 1000);
    return () => clearTimeout(t);
  }, []);

  const prevMonth = () => setDate(new Date(year, month - 1, 1));
  const nextMonth = () => setDate(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to fill last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className={`select-none ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <button
          onClick={prevMonth}
          className="text-[0.625rem] text-muted-foreground hover:text-foreground interactive px-1"
        >
          ◀
        </button>
        <span className="text-[0.688rem] font-medium text-foreground">
          {year}年 {MONTHS[month]}
        </span>
        <button
          onClick={nextMonth}
          className="text-[0.625rem] text-muted-foreground hover:text-foreground interactive px-1"
        >
          ▶
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[0.5rem] text-muted-foreground/70 uppercase py-0.5"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          const isToday =
            day === todayDate && month === todayMonth && year === todayYear;
          return (
            <div
              key={i}
              className={`text-center text-[0.625rem] py-0.5 rounded-sm ${
                day === null
                  ? ""
                  : isToday
                  ? "bg-primary text-white font-bold"
                  : "text-foreground/80"
              }`}
            >
              {day ?? ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
