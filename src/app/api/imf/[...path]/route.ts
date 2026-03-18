import { NextRequest, NextResponse } from "next/server";

const IMF_BASE = "https://www.imf.org/external/datamapper/api/v1";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const upstreamUrl = `${IMF_BASE}/${path.join("/")}`;

  let res: Response;
  try {
    res = await fetch(upstreamUrl, {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GDP-Dashboard/1.0; +https://github.com/tonHS/GDP-and-related-intl-stats)",
        Accept: "application/json",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `Upstream returned HTTP ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
