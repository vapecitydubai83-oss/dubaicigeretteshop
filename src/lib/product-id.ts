// Some imported ids contain percent-escapes (e.g. "vgod-e%e2%80%91liquid-60ml-in");
// Next.js hands routes the decoded id, so compare both sides decoded.
function decodeId(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function sameProductId(a: string, b: string): boolean {
  return a === b || decodeId(a) === decodeId(b);
}
