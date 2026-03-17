import { NextRequest, NextResponse } from "next/server";

const IMF_BASE = "https://www.imf.org/external/datamapper/api/v1";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const upstreamUrl = `${IMF_BASE}/${path.join("/")}`;

  const res = await fetch(upstreamUrl, {
    next: { revalidate: 3600 },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
