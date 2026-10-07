# CrowdPulse Frontend

Web dashboard for CrowdPulse AI. It shows live crowd risk from a CCTV or phone camera, helps you connect that camera, and charts occupancy and risk over time.

It needs the detection service from the companion repository, `crowdpulse-backend`, to be running.

## Features

- **Landing page** explaining what is measured, how capacity is worked out, which cameras are supported and how to connect one.
- **Camera check on entry.** Opening the dashboard first asks the backend whether a camera is connected. If not, it opens the setup screen.
- **Camera setup screen** with three options:
  - CCTV or IP camera: pick the brand (Hikvision is listed first and marked recommended), enter IP, login, port, channel and stream. Includes brand-specific instructions, a connection test and automatic stream discovery.
  - Phone camera: Android IP Webcam or DroidCam, with step-by-step instructions.
  - Paste an address: any RTSP or HTTP stream URL.
- **Live dashboard:**
  - Risk banner with the current level, advice and a surge alert
  - Metric cards: people in view, occupancy, density with crowd level, change, time above limit, risk score
  - Live video with person detection, or the detected floor area
  - Zone capacity panel with a field to enter the real floor area
  - Automatic recalibration status and a Recalibrate button
  - People count chart with safe and maximum capacity lines
  - Risk score chart with threshold lines
  - Five minute occupancy heatmap
  - Share of time in each risk level and a log of every level change
- **Light and dark themes.** The toggle sits at the right end of the navigation bar. It follows the system setting on first visit and remembers your choice.

## Requirements

- Node.js 20.9 or newer
- The CrowdPulse backend running and reachable

## Quick start

```bash
git clone https://github.com/Charan7sai/crowdpulse-frontend.git
cd crowdpulse-frontend

npm install

cp .env.local.example .env.local     # Windows: copy .env.local.example .env.local
# edit .env.local if the backend is not on this computer

npm run dev
```

Open `http://localhost:3000`.

Start the backend first (`python app.py` in the backend folder), then open the dashboard.

## Configuration

Settings live in `.env.local`.

| Variable | Default | Description |
|---|---|---|
| `BACKEND_URL` | `http://127.0.0.1:5001` | Where the Next.js server reaches the backend for data requests |
| `NEXT_PUBLIC_BACKEND_URL` | `http://127.0.0.1:5001` | Where the browser loads the live video streams from. It must be reachable from the browser |
| `CAMERA_ADMIN_TOKEN` | empty | Only needed if the backend has `CAMERA_ADMIN_TOKEN` set. Sent by the server, never exposed to the browser |

If the backend runs on another machine, set both URLs to that machine's address, for example `http://192.168.1.20:5001`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |

## How it works

Data requests go to the app's own `/api/backend/*` route, which forwards them to the backend. Only the known backend endpoints are allowed through. This keeps the backend address and admin token on the server and avoids cross-origin problems.

The live video streams (`/video_feed` and `/zone_preview`) are loaded by the browser directly from the backend.

The dashboard refreshes on these intervals:

| Data | Interval |
|---|---|
| Current reading | 2 seconds |
| Two minute history | 5 seconds |
| Five minute history | 10 seconds |
| Zone capacity | 10 seconds |
| Recalibration status | 4 seconds |
| Camera status | 5 seconds |

## Project structure

```
src/
  app/
    layout.js                      Page shell, theme script
    globals.css                    Styles for both themes
    page.js                        Landing page
    dashboard/page.js              Camera check, setup and dashboard
    api/backend/[...path]/route.js Server proxy to the backend
  components/
    Navbar.js
    ThemeToggle.js
    dashboard/
      SetupWizard.js               Camera setup screen
      DashboardView.js             Live dashboard
      Charts.js                    Trend, risk, heatmap and event charts
  lib/
    api.js                         Request helper and polling hook
    risk.js                        Risk levels, reading cleanup, formatting
```

## Deployment notes

- Build with `npm run build` and serve with `npm run start`, or deploy to any Node host.
- The backend must be reachable from the server running this app, and its video endpoints must be reachable from the user's browser. Use HTTPS for both if the dashboard is served over HTTPS, otherwise browsers block the video stream.
- Do not commit `.env.local`.

## Troubleshooting

| Problem | What to check |
|---|---|
| "The backend is not reachable" | Start the backend and check `BACKEND_URL`. Restart `npm run dev` after editing `.env.local` |
| Dashboard shows data but the video is blank | Check `NEXT_PUBLIC_BACKEND_URL` and use the Reload video button |
| Camera test fails | Check the IP, login and that RTSP is enabled on the camera. See the instructions beside the form |
| Capacity looks too high | Enter the real floor area in the Zone capacity panel |
| Charts are empty | They fill after a few readings, about 10 seconds after the camera connects |
