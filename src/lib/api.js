"use client";

import { useCallback, useEffect, useState } from "react";

// Only used for the live video streams, which the browser loads directly.
export const BACKEND_PUBLIC_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5001";

// All JSON calls go through the Next.js proxy at /api/backend/*
export async function api(path, { method = "GET", body, timeoutMs = 15000 } = {}) {
  const res = await fetch(`/api/backend/${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function usePolling(path, intervalMs, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const run = async () => {
      try {
        const d = await api(path);
        if (alive) {
          setData(d);
          setError(null);
        }
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    const id = setInterval(run, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [path, intervalMs, enabled, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, refresh };
}
