"use client";

import { useState } from "react";
import { BACKEND_PUBLIC_URL, api, usePolling } from "../../lib/api";
import {
  LEVEL_ADVICE,
  LEVEL_HEX,
  LEVEL_LABEL,
  fmtBreach,
  fmtDuration,
  fmtPct,
  fmtSigned,
  fruinLevel,
  normalizeReading,
  timeAgo,
} from "../../lib/risk";
import { EventLog, Heatmap, LevelShare, RiskChart, TrendChart } from "./Charts";

function Metric({ label, value, unit, hint }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {value}
        {unit && <small>{unit}</small>}
      </div>
      <div className="metric-hint">{hint}</div>
    </div>
  );
}

function VideoPanel({ cameraKey }) {
  const [view, setView] = useState("detect");
  const [failed, setFailed] = useState(false);
  const [nonce, setNonce] = useState(0);
  const path = view === "detect" ? "video_feed" : "zone_preview";

  return (
    <div>
      <div className="video-bar">
        <div className="seg" role="tablist" aria-label="Video view">
          <button role="tab" aria-selected={view === "detect"} className={view === "detect" ? "on" : ""} onClick={() => { setView("detect"); setFailed(false); }}>
            People detection
          </button>
          <button role="tab" aria-selected={view === "zone"} className={view === "zone" ? "on" : ""} onClick={() => { setView("zone"); setFailed(false); }}>
            Detected floor area
          </button>
        </div>
        <button className="btn btn-small" onClick={() => { setFailed(false); setNonce((n) => n + 1); }}>
          Reload video
        </button>
      </div>
      <div className="video">
        <div className="video-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={`${path}-${nonce}-${cameraKey}`}
            src={`${BACKEND_PUBLIC_URL}/${path}?n=${nonce}`}
            alt={view === "detect" ? "Live camera with detected people outlined" : "Live camera with detected floor area highlighted"}
            onError={() => setFailed(true)}
            onLoad={() => setFailed(false)}
          />
          {failed && (
            <div className="video-msg">
              <strong>No video</strong>
              <span>The stream is not available yet. It can take a few seconds after connecting a camera.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AreaControl({ zone, onDone }) {
  const [value, setValue] = useState("");
  const [state, setState] = useState({ busy: false, msg: "" });

  async function send(area) {
    setState({ busy: true, msg: "" });
    try {
      await api("zone/area", { method: "POST", body: { area_m2: area } });
      setValue("");
      setState({ busy: false, msg: area ? "Saved." : "Back to the camera estimate. Recalculating." });
      onDone();
    } catch (e) {
      setState({ busy: false, msg: e.message });
    }
  }

  const manual = zone?.area_source === "manual";
  return (
    <div style={{ marginTop: 14 }}>
      <div className="field" style={{ marginBottom: 8 }}>
        <label htmlFor="area">Real floor area (m2)</label>
        <div className="pw">
          <input id="area" className="input" inputMode="decimal" placeholder={manual ? String(zone.usable_area_m2) : "e.g. 12"} value={value} onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))} />
          <button className="btn btn-small" disabled={state.busy || !value} onClick={() => send(Number(value))}>
            Apply
          </button>
        </div>
        <small>Length times width of the area the camera covers. This is more accurate than the camera estimate, especially for angled cameras.</small>
      </div>
      {manual && (
        <button className="btn-link" disabled={state.busy} onClick={() => send(null)}>
          Go back to the camera estimate
        </button>
      )}
      {state.msg && <p className="note">{state.msg}</p>}
    </div>
  );
}

export default function DashboardView({ camera, onChangeCamera }) {
  const stats = usePolling("detect", 2000);
  const hist2 = usePolling("history?minutes=2", 5000);
  const hist5 = usePolling("history?minutes=5", 10000);
  const zoneQ = usePolling("zone", 10000);
  const cal = usePolling("calibration_status", 4000);
  const [recal, setRecal] = useState({ state: "idle", msg: "" });

  const reading = normalizeReading(stats.data);
  const zone = zoneQ.data && !zoneQ.data.error ? zoneQ.data : null;
  const calStatus = cal.data && !cal.data.error ? cal.data : null;
  const noSignal = !reading && !!stats.error;

  const lvl = reading?.level;
  const lvlColor = lvl ? LEVEL_HEX[lvl] : "#8a9299";

  const area = zone?.usable_area_m2 ?? null;
  const ppm2 = reading ? (reading.ppm2 ?? (area ? reading.count / area : null)) : null;
  const los = reading?.los || fruinLevel(ppm2);
  const breach = reading ? fmtBreach(reading.breach) : null;

  async function recalibrate() {
    setRecal({ state: "busy", msg: "" });
    try {
      const r = await api("recalibrate", { method: "POST", timeoutMs: 60000 });
      setRecal({
        state: "ok",
        msg: `Done. Usable area ${r.zone.usable_area_m2} m2, safe capacity ${r.zone.safe_capacity}, maximum ${r.zone.max_capacity}.`,
      });
      zoneQ.refresh();
      cal.refresh();
    } catch (e) {
      setRecal({ state: "error", msg: e.message });
    }
  }

  const camOk = camera?.ready;
  const camClass = camOk ? "good" : camera?.status === "connected" ? "warn" : "bad";
  const camText = camOk ? "Camera connected" : camera?.status === "reconnecting" ? "Camera reconnecting" : "No camera signal";

  return (
    <div className="dash container-wide">
      <div className="dash-head">
        <div className="dash-title">
          <h1>{zone?.zone_name || "Live monitoring"}</h1>
          <p className="mono">{camera?.source || "no source"}</p>
        </div>
        <div className="dash-actions">
          <span className={`chip ${camClass}`}>
            <i />
            {camText}
          </span>
          <button className="btn btn-small" onClick={onChangeCamera}>
            Change camera
          </button>
          <button className="btn btn-primary btn-small" onClick={recalibrate} disabled={recal.state === "busy"}>
            {recal.state === "busy" ? "Recalibrating..." : "Recalibrate"}
          </button>
        </div>
      </div>

      {recal.msg && (
        <div className={`result ${recal.state === "ok" ? "ok" : "bad"}`} style={{ marginBottom: 16 }}>
          {recal.msg}
        </div>
      )}

      <div className="banner" style={{ "--lvl": lvlColor }}>
        <div className="banner-level">
          <small>Risk level</small>
          {noSignal ? "No signal" : reading ? LEVEL_LABEL[lvl] : "Loading"}
        </div>
        <div className="banner-text">
          {reading ? (
            <>
              <strong>
                {reading.count} {reading.count === 1 ? "person" : "people"} in view
                {zone ? `. Safe capacity ${zone.safe_capacity}, maximum ${zone.max_capacity}.` : "."}
              </strong>
              <span>{LEVEL_ADVICE[lvl]}</span>
            </>
          ) : (
            <>
              <strong>{noSignal ? "No reading from the backend" : "Waiting for the first reading"}</strong>
              <span>{noSignal ? stats.error.message : "This takes a few seconds after connecting a camera."}</span>
            </>
          )}
        </div>
        {reading?.surge && <div className="surge">Surge detected</div>}
      </div>

      <div className="metrics">
        <Metric label="People in view" value={reading ? reading.count : "n/a"} hint={reading?.smoothed != null ? `Smoothed ${reading.smoothed.toFixed(1)}` : ""} />
        <Metric label="Occupancy" value={reading ? fmtPct(reading.ratio) : "n/a"} hint={zone ? `Safe capacity ${zone.safe_capacity}` : "Waiting for calibration"} />
        <Metric label="Density" value={ppm2 != null ? ppm2.toFixed(2) : "n/a"} unit="per m2" hint={los || ""} />
        <Metric label="Change" value={reading ? fmtSigned(reading.growth, 1) : "n/a"} hint="Against 3 readings ago" />
        <Metric label="Time above limit" value={reading ? fmtDuration(reading.duration ?? 0) : "n/a"} hint="Time spent crowded" />
        <Metric label="Risk score" value={reading?.score != null ? reading.score.toFixed(2) : "n/a"} hint="0 is calm, 1 is severe" />
        {breach && <Metric label="Time to breach" value={breach} hint="At the current rate of arrival" />}
      </div>

      <div className="dash-grid">
        <VideoPanel cameraKey={camera?.source} />

        <div className="side">
          <div className="panel">
            <h3>Zone capacity</h3>
            {zone ? (
              <ul className="zone-list">
                <li><span>Usable floor area</span><span>{zone.usable_area_m2} m2</span></li>
                <li><span>Safe capacity</span><span>{zone.safe_capacity} people</span></li>
                <li><span>Maximum capacity</span><span>{zone.max_capacity} people</span></li>
                <li><span>Safe density</span><span>{zone.fruin_safe_density} per m2</span></li>
                <li><span>Maximum density</span><span>{zone.fruin_max_density} per m2</span></li>
                <li><span>Area source</span><span>{zone.area_source === "manual" ? "Entered by you" : "Camera estimate"}</span></li>
                <li><span>Floor in frame</span><span>{zone.floor_coverage_pct != null ? `${zone.floor_coverage_pct}%` : "n/a"}</span></li>
                <li><span>Last calibrated</span><span>{timeAgo(zone.last_calibrated_at)}</span></li>
              </ul>
            ) : (
              <p className="note">
                Calibrating. Capacity appears once the first frame has been analysed, usually
                within 10 seconds.
              </p>
            )}
            {zone && <AreaControl zone={zone} onDone={() => { zoneQ.refresh(); cal.refresh(); }} />}
            {zone && zone.area_source !== "manual" && (
              <p className="note">The camera estimate is approximate. Enter the real area above for reliable capacity numbers.</p>
            )}
          </div>

          <div className="panel">
            <h3>Automatic recalibration</h3>
            {calStatus ? (
              <ul className="zone-list">
                <li><span>Status</span><span>{calStatus.auto_enabled ? `Every ${calStatus.interval_sec}s` : "Off"}</span></li>
                <li><span>Last run</span><span>{timeAgo(calStatus.last_run)}{calStatus.last_reason ? ` (${calStatus.last_reason})` : ""}</span></li>
                <li><span>Runs so far</span><span>{calStatus.run_count}</span></li>
                <li><span>Next check</span><span>{calStatus.next_check_in_sec != null ? `${calStatus.next_check_in_sec}s` : "n/a"}</span></li>
              </ul>
            ) : (
              <p className="note">Status unavailable.</p>
            )}
            <p className="note">
              It refreshes the floor estimate while people are in view and skips the refresh
              when the floor is empty.
              {calStatus?.last_skip ? ` Last skip ${timeAgo(calStatus.last_skip.at)}: ${calStatus.last_skip.reason}.` : ""}
              {calStatus?.last_error ? ` Last error: ${calStatus.last_error}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="charts">
        <div className="chart-card">
          <h3>People count</h3>
          <p className="sub">Last 2 minutes, with safe and maximum capacity</p>
          <TrendChart rows={hist2.data || []} safe={zone?.safe_capacity} max={zone?.max_capacity} />
        </div>
        <div className="chart-card">
          <h3>Risk score</h3>
          <p className="sub">Last 2 minutes. Lines mark the Elevated, High and Critical thresholds.</p>
          <RiskChart rows={hist2.data || []} />
        </div>
        <div className="chart-card">
          <h3>Occupancy heatmap</h3>
          <p className="sub">Last 5 minutes in 15 second blocks</p>
          <Heatmap rows={hist5.data || []} />
        </div>
        <div className="chart-card">
          <h3>Time in each risk level</h3>
          <p className="sub">Share of readings over the last 5 minutes</p>
          <LevelShare rows={hist5.data || []} />
          <h3 style={{ marginTop: 18 }}>Changes in risk level</h3>
          <EventLog rows={hist5.data || []} />
        </div>
      </div>
    </div>
  );
}
