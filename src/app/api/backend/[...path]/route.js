// Server side proxy to the Flask backend. Keeps the backend URL and the
// optional admin token out of the browser and avoids CORS problems.

const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:5001";
const ADMIN_TOKEN = process.env.CAMERA_ADMIN_TOKEN || "";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "detect",
  "history",
  "zone",
  "zone/area",
  "recalibrate",
  "calibration_status",
  "camera/status",
  "camera/presets",
  "camera/test",
  "camera/source",
  "camera/discover",
]);

const SLOW = new Set(["camera/test", "camera/source", "camera/discover", "recalibrate"]);

async function forward(req, { params }) {
  const { path } = await params;
  const key = path.join("/");
  if (!ALLOWED.has(key)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const target = `${BACKEND}/${key}${url.search}`;
  const headers = {};
  let body;
  if (req.method !== "GET") {
    body = await req.text();
    headers["Content-Type"] = "application/json";
  }
  if (ADMIN_TOKEN) headers["X-Admin-Token"] = ADMIN_TOKEN;

  try {
    const res = await fetch(target, {
      method: req.method,
      headers,
      body: body || undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(SLOW.has(key) ? 120000 : 15000),
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
    });
  } catch {
    return Response.json(
      { error: "Backend unreachable. Is app.py running?" },
      { status: 502 }
    );
  }
}

export const GET = forward;
export const POST = forward;
