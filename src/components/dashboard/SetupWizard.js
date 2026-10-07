"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

const BRAND_HELP = {
  hikvision: [
    "Find the camera IP with Hikvision's SADP tool, or read it from your router's device list or the NVR.",
    "RTSP uses port 554 by default. If the stream will not open, check that RTSP is enabled in the camera's network settings.",
    "Create a separate user with live view permission only, and use that login here instead of admin.",
    "Channel 1 main stream is 101 and the sub stream is 102. On an NVR, camera 2 main is 201.",
  ],
  dahua: [
    "Find the camera IP with Dahua's ConfigTool, or read it from your router's device list or the recorder.",
    "RTSP uses port 554 by default. CP Plus, Amcrest and Lorex cameras use the same address format.",
    "Create a separate user with live view permission only.",
    "Subtype 0 is the main stream and subtype 1 is the sub stream.",
  ],
  tapo: [
    "In the Tapo app open the camera, then Advanced Settings, then Camera Account, and create a username and password.",
    "Use that camera account here. Your Tapo cloud login will not work.",
    "Find the camera IP in the Tapo app under the camera's device info, or in your router.",
  ],
  ezviz: [
    "The username is admin. The password is the device verification code printed on the camera label.",
    "Find the camera IP in your router's device list.",
  ],
};

const GENERIC_STEPS = [
  "Put the computer that runs the backend on the same network as the camera.",
  "Find the camera's IP address in your router's device list, on the recorder, or with the maker's discovery tool.",
  "Use a viewer account for this, not the main admin account.",
  "If the video lags, switch the stream to Sub. It is lighter to process.",
];

const PHONE_STEPS = {
  android_ipwebcam: [
    "Install the IP Webcam app on the phone.",
    "Connect the phone and the computer to the same Wi-Fi network, or connect the computer to the phone's hotspot.",
    "In the app, scroll down and tap Start server.",
    "Enter the IP address shown at the bottom of the phone screen, for example 192.168.1.50.",
  ],
  droidcam: [
    "Install DroidCam on the phone and open it.",
    "Connect the phone and the computer to the same Wi-Fi network.",
    "Enter the Wi-Fi IP address shown in the DroidCam app.",
  ],
};

export default function SetupWizard({ camera, notice, onConnected, onUseWebcam, onCancel }) {
  const [presets, setPresets] = useState([]);
  const [tab, setTab] = useState("cctv");
  const [brand, setBrand] = useState("hikvision");
  const [form, setForm] = useState({
    ip: "",
    user: "",
    password: "",
    port: "",
    channel: "1",
    stream: "main",
  });
  const [showPw, setShowPw] = useState(false);
  const [phoneApp, setPhoneApp] = useState("android_ipwebcam");
  const [phoneIp, setPhoneIp] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);
  const [found, setFound] = useState(null);

  useEffect(() => {
    api("camera/presets")
      .then(setPresets)
      .catch(() => setPresets([]));
  }, []);

  const cctv = useMemo(() => {
    const list = presets.filter((p) => p.type === "rtsp");
    return [...list].sort((a, b) => {
      if (a.id === "hikvision") return -1;
      if (b.id === "hikvision") return 1;
      if (a.id === "generic_rtsp") return 1;
      if (b.id === "generic_rtsp") return -1;
      return a.label.localeCompare(b.label);
    });
  }, [presets]);
  const phones = presets.filter((p) => p.type === "http");
  const activePreset = presets.find((p) => p.id === brand);

  const isWebcam = String(camera?.source || "").startsWith("webcam:");

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setResult(null);
  }

  function bodyFor() {
    if (tab === "url") return { url: url.trim() };
    if (tab === "phone") return { brand: phoneApp, ip: phoneIp.trim() };
    return {
      brand,
      ip: form.ip.trim(),
      user: form.user,
      password: form.password,
      port: form.port ? Number(form.port) : undefined,
      channel: Number(form.channel) || 1,
      stream: form.stream,
    };
  }

  function validate() {
    if (tab === "url" && !url.trim()) return "Paste a camera address first.";
    if (tab === "phone" && !phoneIp.trim()) return "Enter the phone's IP address.";
    if (tab === "cctv" && !form.ip.trim()) return "Enter the camera's IP address.";
    return null;
  }

  async function run(kind) {
    const problem = validate();
    if (problem) {
      setResult({ ok: false, text: problem });
      return;
    }
    setBusy(kind);
    setResult(null);
    try {
      if (kind === "test") {
        const r = await api("camera/test", { method: "POST", body: bodyFor(), timeoutMs: 40000 });
        setResult({ ok: true, text: `Connected. The camera sends ${r.width} by ${r.height} video. Click Connect to use it.` });
      } else {
        await api("camera/source", { method: "POST", body: bodyFor(), timeoutMs: 60000 });
        setResult({ ok: true, text: "Connected. Opening the dashboard." });
        onConnected();
      }
    } catch (e) {
      setResult({ ok: false, text: e.message });
    } finally {
      setBusy(null);
    }
  }

  async function discover() {
    if (!form.ip.trim()) {
      setResult({ ok: false, text: "Enter the camera's IP address first." });
      return;
    }
    setBusy("discover");
    setResult(null);
    setFound(null);
    try {
      const r = await api("camera/discover", {
        method: "POST",
        timeoutMs: 120000,
        body: {
          ip: form.ip.trim(),
          user: form.user,
          password: form.password,
          port: form.port ? Number(form.port) : undefined,
          channel: Number(form.channel) || 1,
        },
      });
      setFound(r);
      if (!r.working.length) {
        setResult({
          ok: false,
          text: `No working stream found after ${r.tried} attempts. Check the IP address, username and password, and that RTSP is enabled on the camera.`,
        });
      }
    } catch (e) {
      setResult({ ok: false, text: e.message });
    } finally {
      setBusy(null);
    }
  }

  async function useFound(w) {
    setBusy("connect");
    try {
      await api("camera/source", {
        method: "POST",
        timeoutMs: 60000,
        body: {
          brand: w.select.brand,
          stream: w.select.stream,
          path: w.select.path || undefined,
          ip: form.ip.trim(),
          user: form.user,
          password: form.password,
          port: form.port ? Number(form.port) : undefined,
          channel: Number(form.channel) || 1,
        },
      });
      onConnected();
    } catch (e) {
      setResult({ ok: false, text: e.message });
    } finally {
      setBusy(null);
    }
  }

  async function useWebcam() {
    setBusy("webcam");
    try {
      if (!isWebcam) {
        await api("camera/source", { method: "POST", body: { url: "0" }, timeoutMs: 30000 });
      }
      onUseWebcam();
    } catch (e) {
      setResult({ ok: false, text: e.message });
    } finally {
      setBusy(null);
    }
  }

  const help =
    tab === "phone"
      ? PHONE_STEPS[phoneApp] || []
      : tab === "cctv"
        ? BRAND_HELP[brand] || []
        : [];

  return (
    <section className="setup container">
      <div className="setup-head">
        <h1>Connect a camera</h1>
        <p className="lede">
          The dashboard needs a live video source. Choose your camera type, enter its details,
          and test the connection before continuing.
        </p>
        {notice && <p className="notice">{notice}</p>}
      </div>

      <div className="tabs" role="tablist">
        {[
          ["cctv", "CCTV or IP camera"],
          ["phone", "Phone camera"],
          ["url", "Paste an address"],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={`tab ${tab === id ? "on" : ""}`}
            onClick={() => {
              setTab(id);
              setResult(null);
              setFound(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="setup-grid">
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            run("connect");
          }}
        >
          {tab === "cctv" && (
            <>
              <h2>Camera brand</h2>
              <div className="brands" role="radiogroup" aria-label="Camera brand">
                {cctv.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    role="radio"
                    aria-checked={brand === p.id}
                    className={`brand-opt ${brand === p.id ? "on" : ""}`}
                    onClick={() => {
                      setBrand(p.id);
                      setForm((f) => ({ ...f, port: "" }));
                      setResult(null);
                    }}
                  >
                    {p.label}
                    {p.id === "hikvision" && <span className="rec">Recommended</span>}
                    <small>Port {p.default_port}</small>
                  </button>
                ))}
              </div>

              <div className="field">
                <label htmlFor="ip">Camera IP address</label>
                <input id="ip" className="input" placeholder="192.168.1.64" value={form.ip} onChange={(e) => setField("ip", e.target.value)} autoComplete="off" />
              </div>
              <div className="field-row-2">
                <div className="field">
                  <label htmlFor="user">Username</label>
                  <input id="user" className="input" value={form.user} onChange={(e) => setField("user", e.target.value)} autoComplete="off" />
                </div>
                <div className="field">
                  <label htmlFor="pw">Password</label>
                  <div className="pw">
                    <input id="pw" className="input" type={showPw ? "text" : "password"} value={form.password} onChange={(e) => setField("password", e.target.value)} autoComplete="new-password" />
                    <button type="button" className="btn btn-small" onClick={() => setShowPw((s) => !s)}>
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="port">Port</label>
                  <input id="port" className="input" inputMode="numeric" placeholder={String(activePreset?.default_port || 554)} value={form.port} onChange={(e) => setField("port", e.target.value.replace(/\D/g, ""))} />
                </div>
                <div className="field">
                  <label htmlFor="channel">Channel</label>
                  <input id="channel" className="input" inputMode="numeric" value={form.channel} onChange={(e) => setField("channel", e.target.value.replace(/\D/g, ""))} />
                </div>
                <div className="field">
                  <label htmlFor="stream">Stream</label>
                  <select id="stream" className="input" value={form.stream} onChange={(e) => setField("stream", e.target.value)}>
                    <option value="main">Main (sharper)</option>
                    <option value="sub">Sub (lighter)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {tab === "phone" && (
            <>
              <h2>Phone app</h2>
              <div className="brands" role="radiogroup" aria-label="Phone app">
                {phones.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    role="radio"
                    aria-checked={phoneApp === p.id}
                    className={`brand-opt ${phoneApp === p.id ? "on" : ""}`}
                    onClick={() => {
                      setPhoneApp(p.id);
                      setResult(null);
                    }}
                  >
                    {p.label}
                    <small>Port {p.default_port}</small>
                  </button>
                ))}
              </div>
              <div className="field">
                <label htmlFor="phoneIp">Phone IP address</label>
                <input id="phoneIp" className="input" placeholder="192.168.1.50" value={phoneIp} onChange={(e) => { setPhoneIp(e.target.value); setResult(null); }} autoComplete="off" />
                <small>The app shows this address on the phone screen once the server is running.</small>
              </div>
            </>
          )}

          {tab === "url" && (
            <>
              <h2>Camera address</h2>
              <div className="field">
                <label htmlFor="url">RTSP or HTTP address</label>
                <input id="url" className="input" placeholder="rtsp://user:password@192.168.1.64:554/Streaming/Channels/101" value={url} onChange={(e) => { setUrl(e.target.value); setResult(null); }} autoComplete="off" />
                <small>Starts with rtsp://, rtsps://, http:// or https://. Use this if your camera is not in the brand list.</small>
              </div>
            </>
          )}

          <div className="actions">
            <button type="button" className="btn" disabled={!!busy} onClick={() => run("test")}>
              {busy === "test" ? "Testing..." : "Test connection"}
            </button>
            <button type="submit" className="btn btn-primary" disabled={!!busy}>
              {busy === "connect" ? "Connecting..." : "Connect"}
            </button>
            {onCancel && (
              <button type="button" className="btn" disabled={!!busy} onClick={onCancel}>
                Back to dashboard
              </button>
            )}
          </div>

          {result && <div className={`result ${result.ok ? "ok" : "bad"}`}>{result.text}</div>}

          {tab === "cctv" && (
            <>
              <div className="divider" />
              <h3>Not sure which stream address works?</h3>
              <p className="warn">
                This tries every known address for the IP above and lists the ones that open.
                Make sure the username and password are right first. Some cameras lock the
                account for a while after several failed logins.
              </p>
              <div className="actions">
                <button type="button" className="btn" disabled={!!busy} onClick={discover}>
                  {busy === "discover" ? (
                    <>
                      <span className="spinner" />
                      Trying addresses...
                    </>
                  ) : (
                    "Find the stream automatically"
                  )}
                </button>
              </div>
              {found && found.working.length > 0 && (
                <div className="found">
                  {found.working.map((w, i) => (
                    <div className="found-item" key={i}>
                      <span>
                        {w.label}, {w.stream} stream, {w.width} by {w.height}
                      </span>
                      <button type="button" className="btn btn-primary btn-small" disabled={!!busy} onClick={() => useFound(w)}>
                        Use this
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="divider" />
          <p className="warn">
            No camera to hand?{" "}
            <button type="button" className="btn-link" disabled={!!busy} onClick={useWebcam}>
              {isWebcam ? "Continue with this computer's webcam" : "Use this computer's webcam"}
            </button>
          </p>
        </form>

        <aside className="panel help">
          <h3>Where to find these details</h3>
          {help.length > 0 && (
            <ol>
              {help.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ol>
          )}
          {tab === "cctv" && activePreset?.note && <p>{activePreset.note}</p>}
          {tab !== "phone" && (
            <>
              <h3>For any camera</h3>
              <ol>
                {GENERIC_STEPS.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ol>
            </>
          )}
          {tab === "phone" && phones.find((p) => p.id === phoneApp)?.note && (
            <p>{phones.find((p) => p.id === phoneApp).note}</p>
          )}
          {tab === "url" && (
            <p>
              Typical formats: <span className="code">rtsp://user:pass@IP:554/path</span> for CCTV
              and <span className="code">http://IP:8080/video</span> for phone apps. Special
              characters in a password, such as @ or #, must be URL encoded here. The brand form
              does that for you.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
