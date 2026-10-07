import Link from "next/link";

// Illustrative data for the sample panel. Not live.
const SAMPLE = [
  2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 4, 5, 5, 6, 6, 5, 6, 7, 7, 8, 8, 7, 7, 6, 6, 5, 5, 4,
];

function SampleChart() {
  const w = 520;
  const h = 170;
  const pad = { l: 28, r: 8, t: 10, b: 20 };
  const maxY = 10;
  const x = (i) => pad.l + (i / (SAMPLE.length - 1)) * (w - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / maxY) * (h - pad.t - pad.b);
  const line = SAMPLE.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Example of people count over two minutes with safe and maximum capacity lines">
      {[0, 5, 10].map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} style={{ stroke: "var(--line)" }} />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" style={{ fill: "var(--faint)" }}>
            {t}
          </text>
        </g>
      ))}
      <line x1={pad.l} x2={w - pad.r} y1={y(5)} y2={y(5)} style={{ stroke: "var(--elevated)" }} strokeWidth="1.5" strokeDasharray="5 4" />
      <line x1={pad.l} x2={w - pad.r} y1={y(7)} y2={y(7)} style={{ stroke: "var(--critical)" }} strokeWidth="1.5" strokeDasharray="5 4" />
      <polyline points={line} fill="none" style={{ stroke: "var(--accent-text)" }} strokeWidth="2.5" strokeLinejoin="round" />
      <text x={pad.l} y={h - 5} fontSize="11" style={{ fill: "var(--faint)" }}>2 min ago</text>
      <text x={w - pad.r} y={h - 5} textAnchor="end" fontSize="11" style={{ fill: "var(--faint)" }}>now</text>
    </svg>
  );
}

const MEASURES = [
  {
    title: "Head count",
    text: "People detected by YOLOv8 in the live frame, with a box drawn around each one on the video.",
  },
  {
    title: "Occupancy",
    text: "The count compared with the safe and maximum capacity worked out for the monitored floor.",
  },
  {
    title: "Density",
    text: "People per square metre, labelled with the Fruin level of service from free movement to crush risk.",
  },
  {
    title: "Growth and surge",
    text: "How many people arrived over the last few readings. A surge flag appears when the increase is sudden.",
  },
  {
    title: "Time above the limit",
    text: "How long the zone has stayed crowded. Staying crowded for more than a few seconds raises the risk level.",
  },
  {
    title: "History",
    text: "A two minute trend, a five minute heatmap, and a log of every change in risk level.",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>Crowd risk monitoring from an ordinary camera feed</h1>
            <p className="lede">
              CrowdPulse counts the people in view of a CCTV or phone camera, compares that
              count with the floor area it detects, and shows a risk level that updates every
              2 seconds.
            </p>
            <div className="hero-actions">
              <Link href="/dashboard" className="btn btn-primary">
                Open the dashboard
              </Link>
              <a href="#setup" className="btn">
                How to connect a camera
              </a>
            </div>
            <p className="hero-note">
              Works over RTSP with Hikvision, Dahua, CP Plus, Axis, Reolink, Tapo and others.
              Android and iPhone camera apps work too.
            </p>
          </div>

          <div className="sample" aria-label="Example reading">
            <div className="sample-head">
              <span>Main Hall, example reading</span>
              <span className="sample-tag">SAMPLE DATA</span>
            </div>
            <div className="sample-body">
              <div className="sample-row">
                <div className="sample-stat">
                  <span>People in view</span>
                  <strong>6</strong>
                </div>
                <div className="sample-stat">
                  <span>Safe / max capacity</span>
                  <strong>5 / 7</strong>
                </div>
                <div className="sample-stat">
                  <span>Risk level</span>
                  <strong className="sample-level">Elevated</strong>
                </div>
              </div>
              <SampleChart />
            </div>
            <div className="sample-foot">
              <span className="key"><i /> People count</span>
              <span className="key"><i className="dash" /> Safe capacity</span>
              <span className="key"><i className="dash2" /> Maximum capacity</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="measures">
        <div className="container">
          <p className="eyebrow">What it measures</p>
          <h2>Six readings, all from one camera</h2>
          <div className="feature-grid">
            {MEASURES.map((m) => (
              <div className="feature" key={m.title}>
                <h3>{m.title}</h3>
                <p>{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="capacity">
        <div className="container">
          <p className="eyebrow">Capacity</p>
          <h2>The limit comes from the floor, not from a number you type in</h2>
          <p className="sub">
            Most counters need someone to enter a maximum occupancy by hand. CrowdPulse works
            it out from the camera image.
          </p>
          <ol className="steps">
            <li>
              <div>
                <strong>Find the walkable floor</strong>
                <span>
                  A segmentation model marks furniture and other objects, and the top fifth of the
                  image (ceiling and upper walls) is left out. People count as floor.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Convert pixels to square metres</strong>
                <span>
                  The floor area is scaled from the camera view. It is an estimate, and works best
                  for cameras mounted high and looking down.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Apply crowd safety densities</strong>
                <span>
                  Safe capacity is 1.0 person per square metre. Maximum capacity is 1.5 people per
                  square metre.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Keep it current</strong>
                <span>
                  The estimate refreshes every 30 seconds while people are in view, because
                  furniture and crowds move. It skips the refresh when the floor is empty. The
                  Recalibrate button on the dashboard runs it on demand.
                </span>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="section" id="cameras">
        <div className="container">
          <p className="eyebrow">Cameras</p>
          <h2>Use the cameras you already have</h2>
          <div className="two-col">
            <div className="box">
              <h3>CCTV and IP cameras (RTSP)</h3>
              <ul>
                <li>Hikvision and HiWatch</li>
                <li>Dahua, CP Plus, Amcrest and Lorex</li>
                <li>Axis, Uniview, Hanwha and Vivotek</li>
                <li>Reolink, TP-Link Tapo, Foscam and EZVIZ</li>
                <li>Any other camera that gives you an RTSP address</li>
              </ul>
            </div>
            <div className="box">
              <h3>Phones and webcams</h3>
              <ul>
                <li>Android phone with the IP Webcam app</li>
                <li>DroidCam on Android or iPhone</li>
                <li>Any app that gives you an RTSP or HTTP video address</li>
                <li>A webcam plugged into the computer running the backend</li>
              </ul>
            </div>
          </div>
          <p className="callout">
            Not sure which stream address your camera uses? The setup screen can try the known
            addresses for you and show which ones work.
          </p>
        </div>
      </section>

      <section className="section" id="setup">
        <div className="container">
          <p className="eyebrow">Setup</p>
          <h2>Connected in about two minutes</h2>
          <ol className="steps">
            <li>
              <div>
                <strong>Open the dashboard</strong>
                <span>It checks whether a camera is connected. If not, it opens the setup screen.</span>
              </div>
            </li>
            <li>
              <div>
                <strong>Pick your camera type and enter its details</strong>
                <span>
                  Choose the brand (Hikvision is listed first), then the camera IP address, a
                  username and password, and the channel. The setup screen explains where to find
                  each one.
                </span>
              </div>
            </li>
            <li>
              <div>
                <strong>Test, then connect</strong>
                <span>
                  The test opens the stream and reads one frame, so a wrong password or address
                  shows up before you go to the dashboard.
                </span>
              </div>
            </li>
          </ol>
          <p className="callout">
            What it does not do: it counts people visible to one camera, so anyone outside the
            frame is not counted. It supports safety staff and does not replace them.
          </p>
        </div>
      </section>

      <section className="cta">
        <div className="container cta-inner">
          <h2>See a live reading from your own camera</h2>
          <Link href="/dashboard" className="btn btn-primary">
            Open the dashboard
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="container">CrowdPulse AI. Flask and YOLOv8 backend, Next.js frontend.</div>
      </footer>
    </>
  );
}
