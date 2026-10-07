"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./Dashboard.module.css";

// ── Risk colour map ───────────────────────────
const RISK_COLORS = {
  Low:      "#10b981",
  Medium:   "#f59e0b",
  High:     "#f97316",
  Critical: "#ef4444",
};

// ── Fruin colour map ──────────────────────────
const FRUIN_COLORS = {
  Free:        "#10b981",
  Restricted:  "#3b82f6",
  Constrained: "#f59e0b",
  Dangerous:   "#f97316",
  Critical:    "#ef4444",
};

// ── Fruin descriptions ────────────────────────
const FRUIN_DESC = {
  Free:        "Free movement",
  Restricted:  "Restricted movement",
  Constrained: "Body contact possible",
  Dangerous:   "Pushing / crowd pressure",
  Critical:    "Crush risk",
};

export default function Dashboard() {
  const [stats, setStats]             = useState(null);
  const [zone, setZone]               = useState(null);
  const [trendData, setTrend]         = useState([]);
  const [heatData, setHeat]           = useState([]);
  const [error, setError]             = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [recalibrating, setRecalibrating] = useState(false);
  const [recalibMsg, setRecalibMsg]   = useState(null);

  // ── Fetch current stats ───────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Backend offline");
      const data = await res.json();
      setStats(data);
      setError(false);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setError(true);
    }
  }, []);

  // ── Fetch zone info ───────────────────────
  const fetchZone = useCallback(async () => {
    try {
      const res = await fetch("/api/zone");
      if (!res.ok) return;
      const data = await res.json();
      setZone(data);
    } catch {}
  }, []);

  // ── Fetch trend chart data ────────────────
  const fetchTrend = useCallback(async () => {
    try {
      const res = await fetch("/api/history?minutes=2");
      if (!res.ok) return;
      const rows = await res.json();
      const formatted = rows.map((r) => ({
        time:    new Date(r.timestamp).toLocaleTimeString(),
        density: Math.round((r.occupancy_ratio || r.density_ratio || 0) * 100),
        count:   r.current_count,
      }));
      setTrend(formatted);
    } catch {}
  }, []);

  // ── Fetch heatmap data ────────────────────
  const fetchHeat = useCallback(async () => {
    try {
      const res = await fetch("/api/history?minutes=5");
      if (!res.ok) return;
      const rows = await res.json();
      setHeat(rows);
    } catch {}
  }, []);

  // ── Recalibrate zone ──────────────────────
  const handleRecalibrate = async () => {
    setRecalibrating(true);
    setRecalibMsg(null);
    try {
      const res = await fetch("/api/recalibrate", { method: "POST" });
      const data = await res.json();
      if (data.status === "recalibrated") {
        setRecalibMsg("Recalibrated successfully");
        fetchZone();
        fetchStats();
      } else {
        setRecalibMsg("Recalibration failed — try again");
      }
    } catch {
      setRecalibMsg("Backend offline");
    }
    setRecalibrating(false);
    setTimeout(() => setRecalibMsg(null), 4000);
  };

  // ── Polling intervals ─────────────────────
  useEffect(() => {
    fetchStats();
    fetchZone();
    fetchTrend();
    fetchHeat();
    const i1 = setInterval(fetchStats, 2000);
    const i2 = setInterval(fetchTrend, 5000);
    const i3 = setInterval(fetchHeat,  10000);
    const i4 = setInterval(fetchZone,  30000);
    return () => {
      clearInterval(i1);
      clearInterval(i2);
      clearInterval(i3);
      clearInterval(i4);
    };
  }, [fetchStats, fetchTrend, fetchHeat, fetchZone]);

  // ── Heatmap bucket builder ────────────────
  const buildHeatBuckets = () => {
    if (!heatData.length) return [];
    const buckets = {};
    heatData.forEach((r) => {
      const t   = new Date(r.timestamp);
      const key = Math.floor(t.getTime() / 15000) * 15000;
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(r.occupancy_ratio || r.density_ratio || 0);
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => a - b)
      .slice(-20)
      .map(([key, vals]) => ({
        time: new Date(Number(key)).toLocaleTimeString(),
        avg:  vals.reduce((a, b) => a + b, 0) / vals.length,
      }));
  };

  const heatBuckets = buildHeatBuckets();

  // ── Occupancy bar calculations ────────────
  const occupancyPct = stats
    ? Math.min((stats.current_count / (stats.zone_max_capacity || 1)) * 100, 100)
    : 0;

  const safeLinePct = stats && stats.zone_max_capacity
    ? ((stats.zone_safe_capacity || 0) / stats.zone_max_capacity) * 100
    : 70;

  // ── Offline screen ────────────────────────
  if (error) {
    return (
      <div className={styles.offlineContainer}>
        <div className={styles.offlineBox}>
          <div className={styles.offlineDot} />
          <h2>Backend Offline</h2>
          <p>Make sure the Python Flask server is running on port 5001.</p>
          <code>python app.py</code>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>

      {/* ── Header ───────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>CrowdPulse AI</h1>
          <p className={styles.subtitle}>
            {zone
              ? `${zone.zone_name} · ${zone.usable_area_m2} m² · AI-inferred capacity`
              : "Connecting to backend..."}
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.liveChip}>
            <span className={styles.liveDot} />
            LIVE
          </div>
          {lastUpdated && (
            <span className={styles.lastUpdated}>Updated {lastUpdated}</span>
          )}
        </div>
      </div>

      {/* ── Recalibrate bar ──────────────── */}
      <div className={styles.recalibrateRow}>
        <button
          className={styles.recalibrateBtn}
          onClick={handleRecalibrate}
          disabled={recalibrating}
        >
          {recalibrating ? "Recalibrating..." : "Recalibrate Zone"}
        </button>
        {recalibMsg && (
          <span className={styles.recalibMsg}>{recalibMsg}</span>
        )}
        <span className={styles.recalibrateHint}>
          Clear the area before recalibrating
        </span>
      </div>

      {/* ── Occupancy bar ────────────────── */}
      {stats && (
        <div className={styles.occupancySection}>
          <div className={styles.occupancyHeader}>
            <span className={styles.occupancyLabel}>Occupancy</span>
            <span className={styles.occupancyCount}>
              <strong>{stats.current_count}</strong>
              <span> / {stats.zone_safe_capacity} safe · {stats.zone_max_capacity} max</span>
            </span>
            <span className={styles.occupancyPct}>{stats.occupancy_pct}</span>
          </div>
          <div className={styles.occupancyBar}>
            <div
              className={styles.occupancyFill}
              style={{
                width:      `${occupancyPct}%`,
                background: RISK_COLORS[stats.risk_level] || "#10b981",
              }}
            />
            <div
              className={styles.safeMarker}
              style={{ left: `${safeLinePct}%` }}
              title={`Safe limit: ${stats.zone_safe_capacity}`}
            />
          </div>
          <div className={styles.occupancyLegend}>
            <span>0</span>
            <span style={{ marginLeft: `${safeLinePct}%` }}>
              Safe ({stats.zone_safe_capacity})
            </span>
            <span style={{ marginLeft: "auto" }}>
              Max ({stats.zone_max_capacity})
            </span>
          </div>
        </div>
      )}

      {/* ── Metric cards ─────────────────── */}
      <div className={styles.cardsGrid}>

        <div className={styles.card}>
          <div className={styles.cardLabel}>People detected</div>
          <div className={styles.cardValue}>
            {stats ? stats.current_count : "—"}
          </div>
          <div className={styles.cardSub}>
            {stats ? `${stats.safe_slots_left} slots before alert` : ""}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Risk level</div>
          <div
            className={styles.cardValue}
            style={{ color: stats ? RISK_COLORS[stats.risk_level] : "#888" }}
          >
            {stats ? stats.risk_level : "—"}
          </div>
          <div className={styles.cardSub}>
            Score: {stats ? stats.risk_score : "—"}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Fruin LoS</div>
          <div
            className={styles.cardValue}
            style={{ color: stats ? FRUIN_COLORS[stats.fruin_level] : "#888" }}
          >
            {stats ? stats.fruin_level : "—"}
          </div>
          <div className={styles.cardSub}>
            {stats ? FRUIN_DESC[stats.fruin_level] : ""}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Density</div>
          <div className={styles.cardValue}>
            {stats ? stats.density_per_m2 : "—"}
          </div>
          <div className={styles.cardSub}>people / m²</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Time to safe limit</div>
          <div
            className={styles.cardValue}
            style={{
              color:
                stats?.time_to_safe_breach_sec != null &&
                stats.time_to_safe_breach_sec < 120
                  ? "#ef4444"
                  : "#10b981",
            }}
          >
            {stats ? stats.time_to_safe_breach_label : "—"}
          </div>
          <div className={styles.cardSub}>
            Fill rate: {stats ? `${stats.fill_rate_per_min} p/min` : "—"}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Surge alert</div>
          <div
            className={styles.cardValue}
            style={{ color: stats?.surge_flag ? "#ef4444" : "#10b981" }}
          >
            {stats ? (stats.surge_flag ? "SURGE" : "Normal") : "—"}
          </div>
          <div className={styles.cardSub}>
            Growth: {stats ? `${stats.growth_rate} people` : "—"}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Overload duration</div>
          <div className={styles.cardValue}>
            {stats ? `${stats.duration_in_high_state}s` : "—"}
          </div>
          <div className={styles.cardSub}>seconds in high state</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Zone area</div>
          <div className={styles.cardValue}>
            {stats ? `${stats.zone_area_m2} m²` : "—"}
          </div>
          <div className={styles.cardSub}>AI-inferred · YOLOv8-seg</div>
        </div>

      </div>

      {/* ── Video feeds row ──────────────── */}
      <div className={styles.mediaRow}>

        <div className={styles.videoCard}>
          <div className={styles.sectionTitle}>Live camera — YOLO detection</div>
          <img
            src="http://127.0.0.1:5001/video_feed"
            alt="Live Camera Feed"
            className={styles.videoFeed}
          />
        </div>

        <div className={styles.videoCard}>
          <div className={styles.sectionTitle}>Floor detection — AI zone map</div>
          <img
            src="http://127.0.0.1:5001/zone_preview"
            alt="Zone Preview"
            className={styles.videoFeed}
          />
        </div>

      </div>

      {/* ── Trend chart ──────────────────── */}
      <div className={styles.chartCard}>
        <div className={styles.sectionTitle}>Occupancy trend — last 2 minutes</div>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={(v) => [`${v}%`, "Occupancy"]} />
              <Line
                type="monotone"
                dataKey="density"
                stroke="#7F77DD"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.noData}>Waiting for data...</div>
        )}
      </div>

      {/* ── Heatmap ──────────────────────── */}
      <div className={styles.chartCard}>
        <div className={styles.sectionTitle}>Density heatmap — last 5 minutes</div>
        {heatBuckets.length > 0 ? (
          <div className={styles.heatmap}>
            {heatBuckets.map((b, i) => (
              <div
                key={i}
                className={styles.heatCell}
                title={`${b.time}: ${Math.round(b.avg * 100)}%`}
              >
                <div
                  className={styles.heatFill}
                  style={{
                    height:     `${Math.min(b.avg * 100, 100)}%`,
                    background:
                      b.avg > 0.8 ? "#ef4444"
                      : b.avg > 0.6 ? "#f97316"
                      : b.avg > 0.4 ? "#f59e0b"
                      : "#10b981",
                  }}
                />
                <span className={styles.heatLabel}>
                  {b.time.split(":").slice(1).join(":")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noData}>Waiting for data...</div>
        )}
      </div>

    </div>
  );
}