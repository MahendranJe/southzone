import { NextResponse } from "next/server";

export const runtime = "nodejs";

// User-level per-alert operations are no longer supported.
// Admin manages alerts via /api/admin/alerts
export function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
