// Risk levels, reading normalisation and formatting helpers.

export const LEVEL_ORDER = ["safe", "elevated", "high", "critical"];

export const LEVEL_HEX = {
  safe: "#2e9d68",
  elevated: "#c98a1e",
  high: "#e0652a",
  critical: "#d4373d",
};

export const LEVEL_LABEL = {
  safe: "Safe",
  elevated: "Elevated",
  high: "High",
  critical: "Critical",
};

export const LEVEL_ADVICE = {
  safe: "Normal conditions. No action needed.",
  elevated: "Getting full. Keep an eye on this zone.",
  high: "Crowded. Consider pausing entry.",
  critical: "Overcrowded. Act now.",
};

// The backend uses Safe / Elevated / High / Critical. Older builds used
// Low / Medium, so both are accepted.
export function levelKey(level) {
  const l = String(level || "").toLowerCase();
  if (l === "safe" || l === "low") return "safe";
  if (l === "elevated" || l === "medium") return "elevated";
  if (l === "high") return "high";
  if (l === "critical") return "critical";
  return "safe";
}

export function num(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function firstNum(d, keys) {
  for (const k of keys) {
    const v = num(d[k]);
    if (v !== null) return v;
  }
  return null;
}

function findByKey(d, re, type) {
  for (const [k, v] of Object.entries(d)) {
    if (re.test(k) && (!type || typeof v === type)) return v;
  }
  return undefined;
}

// Turns whatever /detect returns into one predictable shape.
export function normalizeReading(d) {
  if (!d || d.error) return null;
  return {
    raw: d,
    level: levelKey(d.risk_level),
    count: firstNum(d, ["current_count", "count", "people_count"]) ?? 0,
    smoothed: firstNum(d, ["smoothed_count"]),
    ratio: firstNum(d, ["density_ratio", "occupancy_ratio"]),
    growth: firstNum(d, ["growth_rate"]),
    score: firstNum(d, ["risk_score"]),
    surge: Boolean(d.surge_flag),
    duration: firstNum(d, ["duration_in_high_state"]),
    ppm2:
      firstNum(d, ["people_per_m2", "density_pm2", "density_per_m2", "people_per_sqm"]) ??
      (findByKey(d, /(per_m2|per_sqm|people_m2|pm2)/i, "number") ?? null),
    los: findByKey(d, /(^los|fruin)/i, "string") ?? null,
    breach: findByKey(d, /breach/i),
    timestamp: d.timestamp,
  };
}

// Fruin level of service, using the thresholds in the backend config.
export function fruinLevel(ppm2) {
  if (ppm2 === null || ppm2 === undefined) return null;
  if (ppm2 < 0.5) return "Free movement";
  if (ppm2 < 1.0) return "Restricted movement";
  if (ppm2 < 2.0) return "Body contact possible";
  if (ppm2 < 4.0) return "Pushing and pressure";
  return "Crush risk";
}

export function fmtDuration(sec) {
  if (sec === null || sec === undefined) return "n/a";
  const s = Math.round(sec);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export function fmtPct(ratio) {
  return ratio === null || ratio === undefined ? "n/a" : `${Math.round(ratio * 100)}%`;
}

export function fmtSigned(n, digits = 0) {
  if (n === null || n === undefined) return "n/a";
  const v = Number(n.toFixed(digits));
  return v > 0 ? `+${v}` : `${v}`;
}

export function fmtTime(iso) {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleTimeString([], { hour12: false });
}

export function timeAgo(value) {
  if (!value) return "never";
  const ms = typeof value === "number" ? value * 1000 : Date.parse(value);
  if (Number.isNaN(ms)) return "unknown";
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// Time to breach can arrive as a number, an object of numbers, or null.
export function fmtBreach(v) {
  if (v === undefined) return null;
  if (v === null) return "Not rising";
  if (typeof v === "number") return v > 0 ? fmtDuration(v) : "Not rising";
  if (typeof v === "object") {
    const vals = Object.values(v).filter((x) => typeof x === "number" && x > 0);
    return vals.length ? fmtDuration(Math.min(...vals)) : "Not rising";
  }
  return null;
}

export function sortByTime(rows) {
  return [...(rows || [])].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

export function thin(rows, max = 150) {
  if (rows.length <= max) return rows;
  const step = Math.ceil(rows.length / max);
  return rows.filter((_, i) => i % step === 0);
}
