"use client";

import { useCallback, useEffect, useState } from "react";
import { api, usePolling } from "../../lib/api";
import DashboardView from "../../components/dashboard/DashboardView";
import SetupWizard from "../../components/dashboard/SetupWizard";

const WEBCAM_KEY = "crowdpulse_webcam_ok";

export default function DashboardPage() {
  // checking | connecting | offline | setup | ready
  const [phase, setPhase] = useState("checking");
  const [notice, setNotice] = useState("");
  const [seen, setSeen] = useState(null);

  // Gate: is a usable camera connected?
  useEffect(() => {
    if (phase !== "checking" && phase !== "connecting") return;
    let alive = true;
    let timer;
    let tries = 0;

    const check = async () => {
      try {
        const info = await api("camera/status");
        if (!alive) return;
        setSeen(info);
        const isWebcam = String(info.source).startsWith("webcam:");
        const webcamOk = sessionStorage.getItem(WEBCAM_KEY) === "1";

        if (info.ready) {
          if (isWebcam && !webcamOk) {
            setNotice("The backend is currently using this computer's webcam. Connect a CCTV or phone camera for real monitoring, or continue with the webcam.");
            setPhase("setup");
          } else {
            setPhase("ready");
          }
          return;
        }
        if (isWebcam) {
          setNotice("No camera is connected yet.");
          setPhase("setup");
          return;
        }
        // A remote camera is configured but not delivering frames yet.
        tries += 1;
        if (tries === 1) setPhase("connecting");
        if (tries >= 6) {
          setNotice(`The saved camera (${info.source}) is not responding. Check the details below or connect a different one.`);
          setPhase("setup");
          return;
        }
        timer = setTimeout(check, 2000);
      } catch {
        if (alive) setPhase("offline");
      }
    };

    check();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [phase]);

  const live = usePolling("camera/status", 5000, { enabled: phase === "ready" });
  const camera = live.data || seen;

  const connected = useCallback(() => {
    setNotice("");
    setPhase("ready");
  }, []);

  const useWebcam = useCallback(() => {
    sessionStorage.setItem(WEBCAM_KEY, "1");
    setNotice("");
    setPhase("ready");
  }, []);

  if (phase === "checking") {
    return (
      <div className="container state-page">
        <h1>
          <span className="spinner" />
          Checking for a camera
        </h1>
        <p>Contacting the backend.</p>
      </div>
    );
  }

  if (phase === "connecting") {
    return (
      <div className="container state-page">
        <h1>
          <span className="spinner" />
          Connecting to your camera
        </h1>
        <p className="mono">{seen?.source}</p>
        <p>This can take up to 10 seconds for CCTV streams.</p>
        <button
          className="btn"
          onClick={() => {
            setNotice("");
            setPhase("setup");
          }}
        >
          Use a different camera
        </button>
      </div>
    );
  }

  if (phase === "offline") {
    return (
      <div className="container state-page">
        <h1>The backend is not reachable</h1>
        <p>The dashboard could not contact the detection service. To start it:</p>
        <ol>
          <li>Open a terminal in the backend folder.</li>
          <li>
            Run <span className="code">python app.py</span> and wait until it prints that the
            server is running.
          </li>
          <li>
            If it runs on another address, set <span className="code">BACKEND_URL</span> in{" "}
            <span className="code">.env.local</span> and restart the frontend.
          </li>
        </ol>
        <p style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => setPhase("checking")}>
            Try again
          </button>
        </p>
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <SetupWizard
        camera={seen}
        notice={notice}
        onConnected={connected}
        onUseWebcam={useWebcam}
        onCancel={seen?.ready ? connected : undefined}
      />
    );
  }

  return (
    <DashboardView
      camera={camera}
      onChangeCamera={() => {
        setNotice("");
        setSeen(camera);
        setPhase("setup");
      }}
    />
  );
}
