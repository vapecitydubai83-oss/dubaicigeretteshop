import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import type { AdminUser } from "@/lib/catalog-data";
import {
  hashAdminPassword,
  readAdminUsers,
  writeAdminUsers,
} from "@/lib/admin-users-store";

function authorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY || "";
  const provided = request.headers.get("x-admin-key") || "";
  if (!expected || !provided) return false;
  const ba = Buffer.from(provided);
  const bb = Buffer.from(expected);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function cleanStr(val: unknown, maxLen = 80): string {
  return typeof val === "string" ? val.trim().slice(0, maxLen) : "";
}

function stripHash(u: AdminUser): Omit<AdminUser, "passwordHash"> {
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    displayName: u.displayName,
    createdAt: u.createdAt,
  };
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await readAdminUsers();
  return NextResponse.json({ users: users.map(stripHash) });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    action?: string;
    user?: Partial<AdminUser> & { password?: string };
    id?: string;
    current?: string;
    next?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const users = await readAdminUsers();

  if (body.action === "upsert" && body.user && typeof body.user === "object") {
    const u = body.user;
    const username = cleanStr(u.username, 60).toLowerCase();
    if (!username) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }
    const clash = users.find(
      (x) => x.username.toLowerCase() === username && x.id !== u.id
    );
    if (clash) {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 }
      );
    }
    const existing = users.find((x) => x.id === u.id);

    let passwordHash = existing?.passwordHash;
    if (typeof u.password === "string" && u.password.length >= 6) {
      passwordHash = hashAdminPassword(u.password);
    } else if (
      typeof u.passwordHash === "string" &&
      /^[0-9a-f]{64}$/.test(u.passwordHash)
    ) {
      // Lets the browser upload a legacy localStorage account verbatim —
      // the client hashes with the same salted SHA-256, so it still verifies.
      passwordHash = u.passwordHash;
    }
    if (!passwordHash) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const next: AdminUser = {
      id: cleanStr(u.id, 60) || `u-${Date.now()}`,
      username,
      passwordHash,
      role: u.role === "admin" ? "admin" : "manager",
      displayName: cleanStr(u.displayName, 80) || username,
      createdAt:
        existing?.createdAt ||
        (typeof u.createdAt === "number" ? u.createdAt : Date.now()),
    };
    const idx = users.findIndex((x) => x.id === next.id);
    if (idx >= 0) users[idx] = next;
    else users.push(next);
    await writeAdminUsers(users);
    return NextResponse.json({ user: stripHash(next) });
  }

  if (body.action === "changePassword" && body.id) {
    const target = users.find((x) => x.id === body.id);
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (target.passwordHash !== hashAdminPassword(body.current || "")) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 403 }
      );
    }
    if (typeof body.next !== "string" || body.next.trim().length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }
    target.passwordHash = hashAdminPassword(body.next);
    await writeAdminUsers(users);
    return NextResponse.json({ success: true });
  }

  if (body.action === "delete" && body.id) {
    await writeAdminUsers(users.filter((x) => x.id !== body.id));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
