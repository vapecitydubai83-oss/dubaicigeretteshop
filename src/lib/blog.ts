// Shop blog: articles written for the office growth service and published after the owner's review.
// Read over Docker's internal network; the page still renders (empty list) when the service is unreachable.
const API = process.env.BLOG_API || "http://growth-ifw2bsm4g71ppst1f4z4rorn:8095/blog/dubai";

export type BlogPost = {
  id: number; slug: string; title: string; description: string; excerpt: string; category: string;
  read_minutes: number; published: string; tldr?: string; html?: string;
  faq?: { q: string; a: string }[]; keywords?: string[];
};

const TAGS = new Set(["h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "b", "i", "a", "table", "thead",
  "tbody", "tr", "th", "td", "blockquote", "br"]);

// Second line of defence (the growth service already cleans it): allowlisted tags, no attributes except a
// same-site href, no script/style/iframe content. The html is rendered with dangerouslySetInnerHTML.
export function sanitize(html: string): string {
  return html
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "") // control chars: two of them are placeholders below
    .replace(/<(script|style|iframe|object|embed|svg|math)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, (tag, name: string) => {
      const n = name.toLowerCase();
      if (!TAGS.has(n)) return "";
      if (tag.startsWith("</")) return `\u0001/${n}\u0002`;
      if (n !== "a") return `\u0001${n}\u0002`;
      const href = /href="([^"]*)"/i.exec(tag)?.[1] ?? "/";
      // no backslash (browsers read "/\evil.com" as "//evil.com") and no & (an entity can decode to one)
      const safe = !/[\\&]/.test(href) &&
        (/^\/(?!\/)[^\s<>"]*$/.test(href) || /^https:\/\/(www\.)?dubaicigeretteshop\.ae(\/[^\s<>"]*)?$/.test(href));
      return `\u0001a href="${safe ? href : "/"}"\u0002`;
    })
    .replace(/</g, "&lt;").replace(/>/g, "&gt;") // anything left over is text, not markup
    .replace(/\u0001/g, "<").replace(/\u0002/g, ">");
}

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(API + path, { next: { revalidate: 900 }, signal: AbortSignal.timeout(4000) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function listPosts(): Promise<BlogPost[]> {
  return (await get<{ posts: BlogPost[] }>(""))?.posts ?? [];
}

export async function getPost(id: number): Promise<BlogPost | null> {
  if (!Number.isInteger(id) || id < 1) return null;
  const p = (await get<{ post: BlogPost }>(`/${id}`))?.post;
  return p ? { ...p, html: p.html ? sanitize(p.html) : undefined } : null;
}

export const postDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
