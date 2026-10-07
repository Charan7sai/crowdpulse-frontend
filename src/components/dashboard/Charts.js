"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  LEVEL_HEX,
  LEVEL_LABEL,
  LEVEL_ORDER,
  fmtTime,
  levelKey,
  sortByTime,
  thin,
} from "../../lib/risk";

const PALETTE = {
  light: { grid: "#e4e2da", axis: "#566068", accent: "#0f5c4d" },
  dark: { grid: "#2a3238", axis: "#9aa4ab", accent: "#4fc3a8" },
};

// Recharts needs real colour values, so follow the theme set on <html>.
function useChartTheme() {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    const read = () =>
      setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  const c = PALETTE[theme];
  return { grid: c.grid, accent: c.accent, axis: { fontSize: 12, fill: c.axis } };
}

const TOOLTIP = {
  contentStyle: {
    background: "var(--panel)",
    border: "1px solid var(--line-strong)",
    borderRadius: 4,
    color: "var(--ink)",
    fontSize: 13,
  },
  labelStyle: { color: "var(--muted)" },
  itemStyle: { color: "var(--ink)" },
};

function Empty({ text }) {
  return <div className="empty">{text}</div>;
}

export function TrendChart({ rows, safe, max }) {
  const t = useChartTheme();
  const data = thin(sortByTime(rows)).map((r) => ({
    time: fmtTime(r.timestamp),
    count: r.current_count,
  }));
  if (data.length < 2) return <Empty text="Collecting readings. The chart appears after a few seconds." />;

  const top = Math.max(...data.map((d) => d.count), max || 0, safe || 0) + 1;
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={t.grid} vertical={false} />
          <XAxis dataKey="time" tick={t.axis} minTickGap={36} tickLine={false} />
          <YAxis tick={t.axis} allowDecimals={false} domain={[0, top]} tickLine={false} axisLine={false} />
          <Tooltip {...TOOLTIP} />
          {safe != null && (
            <ReferenceLine y={safe} stroke={LEVEL_HEX.elevated} strokeDasharray="5 4" label={{ value: `Safe ${safe}`, position: "insideTopRight", fontSize: 12, fill: LEVEL_HEX.elevated }} />
          )}
          {max != null && (
            <ReferenceLine y={max} stroke={LEVEL_HEX.critical} strokeDasharray="5 4" label={{ value: `Max ${max}`, position: "insideTopRight", fontSize: 12, fill: LEVEL_HEX.critical }} />
          )}
          <Line type="monotone" dataKey="count" name="People" stroke={t.accent} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RiskChart({ rows }) {
  const t = useChartTheme();
  const data = thin(sortByTime(rows)).map((r) => ({
    time: fmtTime(r.timestamp),
    score: typeof r.risk_score === "number" ? Number(r.risk_score.toFixed(2)) : null,
  }));
  if (data.length < 2 || data.every((d) => d.score === null)) {
    return <Empty text="Collecting readings." />;
  }
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={t.grid} vertical={false} />
          <XAxis dataKey="time" tick={t.axis} minTickGap={36} tickLine={false} />
          <YAxis tick={t.axis} domain={[0, 1]} ticks={[0, 0.4, 0.6, 0.8, 1]} tickLine={false} axisLine={false} />
          <Tooltip {...TOOLTIP} />
          <ReferenceLine y={0.4} stroke={LEVEL_HEX.safe} strokeDasharray="3 4" />
          <ReferenceLine y={0.6} stroke={LEVEL_HEX.elevated} strokeDasharray="3 4" />
          <ReferenceLine y={0.8} stroke={LEVEL_HEX.critical} strokeDasharray="3 4" />
          <Area type="monotone" dataKey="score" name="Risk score" stroke={t.accent} strokeWidth={2} fill={t.accent} fillOpacity={0.12} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function heatColor(ratio) {
  if (ratio === null) return "var(--track)";
  if (ratio < 0.5) return LEVEL_HEX.safe;
  if (ratio < 0.8) return LEVEL_HEX.elevated;
  if (ratio < 1.0) return LEVEL_HEX.high;
  return LEVEL_HEX.critical;
}

// Average occupancy per 15 second bucket over the last 5 minutes.
export function Heatmap({ rows, bucketSec = 15, totalSec = 300 }) {
  const sorted = sortByTime(rows).filter((r) => typeof r.density_ratio === "number");
  if (sorted.length < 2) return <Empty text="Collecting readings." />;

  const end = Date.parse(sorted[sorted.length - 1].timestamp);
  const n = totalSec / bucketSec;
  const start = end - totalSec * 1000;
  const buckets = Array.from({ length: n }, () => ({ sum: 0, c: 0 }));
  sorted.forEach((r) => {
    const t = Date.parse(r.timestamp);
    if (Number.isNaN(t) || t < start) return;
    const i = Math.min(n - 1, Math.floor((t - start) / (bucketSec * 1000)));
    buckets[i].sum += r.density_ratio;
    buckets[i].c += 1;
  });

  return (
    <div>
      <div className="heat" role="img" aria-label="Occupancy over the last five minutes in 15 second buckets">
        {buckets.map((b, i) => {
          const ratio = b.c ? b.sum / b.c : null;
          const secsAgo = (n - i) * bucketSec;
          return (
            <div
              key={i}
              className="heat-cell"
              style={{ background: heatColor(ratio) }}
              title={ratio === null ? `${secsAgo}s ago: no data` : `${secsAgo}s ago: ${Math.round(ratio * 100)}% occupancy`}
            />
          );
        })}
      </div>
      <div className="heat-axis">
        <span>5 min ago</span>
        <span>now</span>
      </div>
      <div className="legend">
        <span><i style={{ background: LEVEL_HEX.safe }} /> Under 50%</span>
        <span><i style={{ background: LEVEL_HEX.elevated }} /> 50 to 80%</span>
        <span><i style={{ background: LEVEL_HEX.high }} /> 80 to 100%</span>
        <span><i style={{ background: LEVEL_HEX.critical }} /> Over 100%</span>
        <span><i style={{ background: "var(--track)" }} /> No data</span>
      </div>
    </div>
  );
}

export function LevelShare({ rows }) {
  if (!rows || rows.length === 0) return <Empty text="Collecting readings." />;
  const counts = { safe: 0, elevated: 0, high: 0, critical: 0 };
  rows.forEach((r) => {
    counts[levelKey(r.risk_level)] += 1;
  });
  const total = rows.length;
  return (
    <div>
      <div className="stack" role="img" aria-label="Share of time in each risk level">
        {LEVEL_ORDER.map((k) =>
          counts[k] ? <div key={k} style={{ width: `${(counts[k] / total) * 100}%`, background: LEVEL_HEX[k] }} title={`${LEVEL_LABEL[k]}: ${Math.round((counts[k] / total) * 100)}%`} /> : null
        )}
      </div>
      <div className="legend">
        {LEVEL_ORDER.map((k) => (
          <span key={k}>
            <i style={{ background: LEVEL_HEX[k] }} />
            {LEVEL_LABEL[k]} {Math.round((counts[k] / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

// Every change of risk level in the history, newest first.
export function EventLog({ rows }) {
  const sorted = sortByTime(rows);
  const events = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = levelKey(sorted[i - 1].risk_level);
    const b = levelKey(sorted[i].risk_level);
    if (a !== b) events.push({ time: sorted[i].timestamp, from: a, to: b, count: sorted[i].current_count });
  }
  if (events.length === 0) {
    return <p className="note">No change in risk level in the last 5 minutes.</p>;
  }
  return (
    <ul className="events">
      {events.reverse().slice(0, 12).map((e, i) => (
        <li key={i}>
          <time>{fmtTime(e.time)}</time>
          <span>
            <span className="dot" style={{ background: LEVEL_HEX[e.to] }} />
            {LEVEL_LABEL[e.from]} to {LEVEL_LABEL[e.to]} at {e.count} {e.count === 1 ? "person" : "people"}
          </span>
        </li>
      ))}
    </ul>
  );
}
