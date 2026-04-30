import type { BlogPost } from "@/components/blogs/blog-data";
import { apiUrl } from "@/lib/api-url";

export type BlogApiRow = {
  id: number;
  title: string;
  content: string;
  image: string;
  created_at: string;
};

const TAG_TONES: BlogPost["tagTone"][] = ["emerald", "primary", "slate"];

export function blogDbSlug(id: number): string {
  return `blog-${id}`;
}

export function parseBlogDbSlug(slug: string): number | null {
  const m = /^blog-(\d+)$/.exec(slug);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) ? id : null;
}

function excerptFromContent(content: string, max = 180): string {
  const t = content.trim();
  if (t.length <= max) return t || "—";
  return `${t.slice(0, max - 1)}…`;
}

function bodyFromContent(content: string): string[] {
  const parts = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length > 0) return parts;
  const one = content.trim();
  return one.length > 0 ? [one] : [" "];
}

function coerceApiRow(raw: BlogApiRow): BlogApiRow {
  const id = typeof raw.id === "string" ? Number.parseInt(raw.id, 10) : raw.id;
  return {
    id: Number.isFinite(id) ? id : 0,
    title: raw.title == null ? "" : String(raw.title),
    content: raw.content == null ? "" : String(raw.content),
    image: raw.image == null ? "" : String(raw.image),
    created_at:
      raw.created_at == null ? "" : String(raw.created_at),
  };
}

export function mapApiRowToBlogPost(row: BlogApiRow): BlogPost {
  const r = coerceApiRow(row);
  const slug = blogDbSlug(r.id);
  const created = r.created_at ? new Date(r.created_at) : null;
  const date =
    created && !Number.isNaN(created.getTime())
      ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
          created
        )
      : "—";

  return {
    slug,
    title: r.title,
    excerpt: excerptFromContent(r.content),
    date,
    category: "Company News",
    author: "Drone Hire",
    image: r.image?.trim() || "https://via.placeholder.com/400",
    imageAlt: r.title,
    tagTone: TAG_TONES[Math.abs(r.id) % TAG_TONES.length],
    body: bodyFromContent(r.content),
  };
}

export async function fetchBlogsFromApi(): Promise<BlogApiRow[]> {
  const res = await fetch(apiUrl("/api/blogs"), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Blogs API error: ${res.status}`);
  }
  const data = (await res.json()) as BlogApiRow[];
  return Array.isArray(data) ? data : [];
}

export async function fetchBlogByIdFromApi(
  id: number
): Promise<BlogApiRow | null> {
  const res = await fetch(apiUrl(`/api/blogs/id/${id}`), { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Blog API error: ${res.status}`);
  }
  return res.json() as Promise<BlogApiRow>;
}
