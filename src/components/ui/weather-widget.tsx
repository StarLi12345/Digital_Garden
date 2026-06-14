"use client";

// ============================================================
// Digital Garden — Weather Widget v2（真实天气 + Mock 回退）
// ============================================================
// · OpenWeather One Call API 3.0 / Current Weather Data
// · API Key 从 localStorage "garden-owm-key" 读取
// · 无 Key 或请求失败时自动回退 Mock 数据
// ============================================================

import { useState, useEffect } from "react";

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
  city?: string;
}

const MOCK_POOL: WeatherData[] = [
  { temp: 28, condition: "晴朗", icon: "☀️", humidity: 45, windSpeed: 12 },
  { temp: 22, condition: "多云", icon: "⛅", humidity: 60, windSpeed: 8 },
  { temp: 18, condition: "小雨", icon: "🌧", humidity: 80, windSpeed: 15 },
  { temp: 30, condition: "炎热", icon: "🔥", humidity: 35, windSpeed: 5 },
  { temp: 15, condition: "凉爽", icon: "🍃", humidity: 55, windSpeed: 20 },
  { temp: 8, condition: "寒冷", icon: "❄️", humidity: 70, windSpeed: 10 },
];

const DAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function getMockWeather(): WeatherData {
  return MOCK_POOL[new Date().getDate() % MOCK_POOL.length];
}

// OpenWeather condition code → icon + Chinese label
function owmToWeather(data: {
  main: { temp: number; humidity: number };
  weather: [{ id: number; description: string }];
  wind: { speed: number };
  name: string;
}): WeatherData {
  const code = data.weather[0].id;
  let icon = "☀️";
  if (code >= 200 && code < 300) icon = "⛈";
  else if (code >= 300 && code < 500) icon = "🌦";
  else if (code >= 500 && code < 600) icon = "🌧";
  else if (code >= 600 && code < 700) icon = "❄️";
  else if (code >= 700 && code < 800) icon = "🌫";
  else if (code === 800) icon = "☀️";
  else if (code > 800) icon = "⛅";

  return {
    temp: Math.round(data.main.temp),
    condition: data.weather[0].description,
    icon,
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 3.6), // m/s → km/h
    city: data.name,
  };
}

async function fetchWeather(apiKey: string, lat?: number, lon?: number): Promise<WeatherData | null> {
  try {
    // Try geolocation or default to Beijing
    const url = lat && lon
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`
      : `https://api.openweathermap.org/data/2.5/weather?q=Beijing&appid=${apiKey}&units=metric&lang=zh_cn`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return owmToWeather(json);
  } catch {
    return null;
  }
}

export function WeatherWidget({ className = "" }: { className?: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const apiKey = (() => {
      try { return localStorage.getItem("garden-owm-key") || ""; } catch { return ""; }
    })();

    if (apiKey) {
      // Try geolocation for accurate weather
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const data = await fetchWeather(apiKey, pos.coords.latitude, pos.coords.longitude);
            const w = data || getMockWeather();
            setWeather(w);
            try { localStorage.setItem("garden-weather-condition", w.condition); } catch {}
            window.dispatchEvent(new CustomEvent("garden-weather"));
            setLoading(false);
          },
          async () => {
            const data = await fetchWeather(apiKey);
            const w = data || getMockWeather();
            setWeather(w);
            try { localStorage.setItem("garden-weather-condition", w.condition); } catch {}
            window.dispatchEvent(new CustomEvent("garden-weather"));
            setLoading(false);
          }
        );
      } else {
        fetchWeather(apiKey).then((data) => {
          setWeather(data || getMockWeather());
          setLoading(false);
        });
      }
    } else {
      const w = getMockWeather();
      setWeather(w);
      try { localStorage.setItem("garden-weather-condition", w.condition); } catch {}
      setLoading(false);
    }
  }, []);

  if (!mounted || !weather) return null;

  const now = new Date();
  const dayName = DAYS[now.getDay()];
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;

  return (
    <div className={`select-none ${className}`}>
      {loading ? (
        <p className="text-[0.688rem] text-muted-foreground">加载中…</p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{weather.icon}</span>
            <div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-semibold text-foreground">{weather.temp}°</span>
                <span className="text-[0.625rem] text-muted-foreground">C</span>
              </div>
              <p className="text-[0.625rem] text-muted-foreground">
                {weather.condition}
                {weather.city && weather.city !== "本地" && (
                  <span className="ml-1">· {weather.city}</span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[0.5rem] text-muted-foreground/70">
            <span>{dayName}</span>
            <span>{dateStr}</span>
            {weather.humidity !== undefined && <span>💧{weather.humidity}%</span>}
            {weather.windSpeed !== undefined && <span>🌬{weather.windSpeed}km/h</span>}
          </div>
        </>
      )}
    </div>
  );
}
