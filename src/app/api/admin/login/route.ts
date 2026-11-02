import { NextRequest, NextResponse } from "next/server";

// Verifies admin credentials against the server environment and hands back
// the write key used for catalog mutations. Keeps the key out of the bundle.
export async function POST(request: NextRequest) {
  const user = process.env.ADMIN_USERNAME || "";
  const pass = process.env.ADMIN_PASSWORD || "";
  const key = process.env.ADMIN_API_KEY || "";
  if (!user || !pass || !key) {
    return NextResponse.json(
      { error: "Server admin login is not configured" },
      { status: 503 }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.username === user && body.password === pass) {
    return NextResponse.json({ ok: true, key });
  }
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
