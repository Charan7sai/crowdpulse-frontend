export async function GET() {
  try {
    const response = await fetch("http://127.0.0.1:5001/zone", {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Backend error");
    const data = await response.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: "Backend offline" }, { status: 503 });
  }
}