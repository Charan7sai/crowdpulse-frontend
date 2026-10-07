export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const minutes = searchParams.get("minutes") || 2;
  try {
    const response = await fetch(
      `http://127.0.0.1:5001/history?minutes=${minutes}`,
      { cache: "no-store" }
    );
    if (!response.ok) throw new Error("Backend error");
    const data = await response.json();
    return Response.json(data);
  } catch {
    return Response.json([], { status: 503 });
  }
}