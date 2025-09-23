import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest, context: { params: { slug?: string[] } }) {
  if (context.params.slug?.join("/") === "__mwcheck") {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function HEAD(req: NextRequest, context: { params: { slug?: string[] } }) {
  if (context.params.slug?.join("/") === "__mwcheck") {
    return new NextResponse(null, { status: 200 });
  }
  return new NextResponse(null, { status: 404 });
}
