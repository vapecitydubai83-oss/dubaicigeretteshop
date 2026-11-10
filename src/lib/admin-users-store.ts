import { createHash } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import type { AdminUser } from "@/lib/catalog-data";

// Staff accounts live in the persistent uploads volume (same as catalog.json
// and orders.json) so a login works from any device.
const DATA_DIR = path.join(process.cwd(), "public", "uploads", "_store");
const DATA_FILE = path.join(DATA_DIR, "admin-users.json");

// Must match the client-side hashPassword in catalog-data.ts.
export function hashAdminPassword(password: string): string {
  return createHash("sha256").update(`dcs-salt::${password}`).digest("hex");
}

export async function readAdminUsers(): Promise<AdminUser[]> {
  let raw: string;
  try {
    raw = await readFile(DATA_FILE, "utf-8");
  } catch {
    // First run: seed a manager so staff can log in from any device.
    const seed: AdminUser = {
      id: "u-manager",
      username:
        (process.env.MANAGER_USERNAME || "manager").trim().toLowerCase() ||
        "manager",
      passwordHash: hashAdminPassword(
        process.env.MANAGER_PASSWORD || "manager123"
      ),
      role: "manager",
      displayName: "Store Manager",
      createdAt: Date.now(),
    };
    try {
      await writeAdminUsers([seed]);
    } catch {}
    return [seed];
  }
  try {
    const j = JSON.parse(raw);
    if (Array.isArray(j.users)) return j.users;
  } catch {}
  console.error("admin-users.json is unreadable; refusing to clobber it");
  return [];
}

export async function writeAdminUsers(users: AdminUser[]) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  await writeFile(tmp, JSON.stringify({ users }), "utf-8");
  await rename(tmp, DATA_FILE);
}
