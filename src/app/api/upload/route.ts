import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// Detect image format from magic bytes (never trust client filename or MIME alone;
// SVG/HTML are intentionally excluded to prevent stored XSS).
function detectImageExt(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  )
    return ".png";
  // GIF: GIF87a / GIF89a
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return ".gif";
  // WEBP: RIFF....WEBP
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  )
    return ".webp";
  // AVIF: ....ftypavif / avis
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return ".avif";
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const expected = process.env.ADMIN_API_KEY || "";
    const provided = request.headers.get("x-admin-key") || "";
    if (!expected || !safeEqual(provided, expected)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 8 MB limit" },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = detectImageExt(buffer);
    if (!ext) {
      return NextResponse.json(
        { error: "Unsupported image format (use JPG, PNG, WEBP, GIF, or AVIF)" },
        { status: 415 }
      );
    }

    const rawBase = path.basename(file.name, path.extname(file.name));
    const baseName = rawBase
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    const uniqueFileName = `${baseName || "image"}-${Date.now()}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueFileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${uniqueFileName}`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Failed to save uploaded image" },
      { status: 500 }
    );
  }
}
