// Weather via Open-Meteo (https://open-meteo.com) — free, keyless, called
// directly from the browser. We ask for a single day's forecast at a lat/lng.
// Open-Meteo only forecasts ~16 days out, so far-future trip dates return
// `outOfRange` and the UI shows a seasonal hint instead of a fake number.

import { useEffect, useState } from "react";

export interface DayWeather {
  code: number;
  tMax: number;
  tMin: number;
  precipProb: number | null;
}

export interface WeatherResult {
  loading: boolean;
  data: DayWeather | null;
  outOfRange: boolean;
  error: boolean;
}

// WMO weather-code → emoji + short label. Coarse buckets are plenty here.
export function weatherGlyph(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "☀️", label: "Clear" };
  if (code <= 2) return { icon: "🌤️", label: "Mostly clear" };
  if (code === 3) return { icon: "☁️", label: "Overcast" };
  if (code <= 48) return { icon: "🌫️", label: "Fog" };
  if (code <= 57) return { icon: "🌦️", label: "Drizzle" };
  if (code <= 67) return { icon: "🌧️", label: "Rain" };
  if (code <= 77) return { icon: "🌨️", label: "Snow" };
  if (code <= 82) return { icon: "🌧️", label: "Showers" };
  if (code <= 86) return { icon: "🌨️", label: "Snow showers" };
  if (code <= 99) return { icon: "⛈️", label: "Thunderstorm" };
  return { icon: "🌡️", label: "—" };
}

const cache = new Map<string, DayWeather | "oor" | "err">();

function withinForecastWindow(date: string): boolean {
  const target = new Date(date + "T00:00:00Z").getTime();
  const now = Date.now();
  const days = (target - now) / 86400000;
  return days >= -1 && days <= 15;
}

async function fetchDay(lat: number, lng: number, date: string): Promise<DayWeather | "oor" | "err"> {
  if (!withinForecastWindow(date)) return "oor";
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&start_date=${date}&end_date=${date}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return "err";
    const j = (await res.json()) as {
      daily?: {
        weather_code?: number[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_probability_max?: (number | null)[];
      };
    };
    const d = j.daily;
    if (!d || !d.weather_code?.length) return "err";
    return {
      code: d.weather_code[0],
      tMax: Math.round(d.temperature_2m_max?.[0] ?? 0),
      tMin: Math.round(d.temperature_2m_min?.[0] ?? 0),
      precipProb: d.precipitation_probability_max?.[0] ?? null,
    };
  } catch {
    return "err";
  }
}

export function useWeather(lat: number | null | undefined, lng: number | null | undefined, date: string | null): WeatherResult {
  const [result, setResult] = useState<WeatherResult>({ loading: false, data: null, outOfRange: false, error: false });

  useEffect(() => {
    if (lat == null || lng == null || !date) {
      setResult({ loading: false, data: null, outOfRange: false, error: false });
      return;
    }
    const key = `${lat.toFixed(3)},${lng.toFixed(3)},${date}`;
    const cached = cache.get(key);
    if (cached) {
      setResult({ loading: false, data: cached === "oor" || cached === "err" ? null : cached, outOfRange: cached === "oor", error: cached === "err" });
      return;
    }
    let alive = true;
    setResult({ loading: true, data: null, outOfRange: false, error: false });
    fetchDay(lat, lng, date).then((r) => {
      cache.set(key, r);
      if (!alive) return;
      setResult({ loading: false, data: r === "oor" || r === "err" ? null : r, outOfRange: r === "oor", error: r === "err" });
    });
    return () => {
      alive = false;
    };
  }, [lat, lng, date]);

  return result;
}
