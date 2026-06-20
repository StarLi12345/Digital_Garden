"use client";

// ============================================================
// Digital Garden — Weather Widget v3（真实天气）
// ============================================================
// · OpenWeather Current Weather Data API
// · API Key: localStorage "garden-owm-key" 或内置默认 Key
// · 使用浏览器 Geolocation 获取定位，失败回退北京
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

const DAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const DEFAULT_KEY = "0a81956b3315eb718b0cf79850b56296";

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
    windSpeed: Math.round(data.wind.speed * 3.6),
    city: data.name,
  };
}

async function fetchWeather(apiKey: string, lat?: number, lon?: number): Promise<WeatherData | null> {
  try {
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

/** IP-based geolocation fallback — used when browser geolocation is blocked (e.g. non-HTTPS mobile) */
async function fetchIPLocation(): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.latitude && data.longitude) {
      return { lat: data.latitude, lon: data.longitude };
    }
    return null;
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
      try { return localStorage.getItem("garden-owm-key") || DEFAULT_KEY; } catch { return DEFAULT_KEY; }
    })();

    const applyWeather = (data: WeatherData | null) => {
      if (data) {
        setWeather(data);
        try { localStorage.setItem("garden-weather-condition", data.condition); } catch {}
        window.dispatchEvent(new CustomEvent("garden-weather"));
      }
      setLoading(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => { applyWeather(await fetchWeather(apiKey, pos.coords.latitude, pos.coords.longitude)); },
        async () => {
          // Browser geolocation blocked (common on HTTP/non-localhost mobile)
          const ipLoc = await fetchIPLocation();
          if (ipLoc) applyWeather(await fetchWeather(apiKey, ipLoc.lat, ipLoc.lon));
          else applyWeather(await fetchWeather(apiKey)); // fallback to Beijing
        }
      );
    } else {
      fetchWeather(apiKey).then(applyWeather);
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
