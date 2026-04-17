import type { BlogPost } from "@/components/blogs/blog-data";

export const BLOG_OVERRIDES_STORAGE_KEY = "aerolaminar_blog_overrides_v1";
export const BLOG_EXTRAS_STORAGE_KEY = "aerolaminar_blog_extras_v1";
export const BLOG_ADMIN_UPDATED_EVENT = "aerolaminar-blog-admin-updated";

/** Partial edits on top of built-in `blog-data` posts (keyed by slug). */
export type BlogOverrides = Record<string, Partial<BlogPost>>;

/** Admin-created posts (full records, unique slugs). */
export type AdminBlogExtra = BlogPost & {
  internalId: string;
  createdAt: number;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isBlogPostShape(v: unknown): v is BlogPost {
  if (!isRecord(v)) return false;
  return (
    typeof v.slug === "string" &&
    typeof v.title === "string" &&
    typeof v.excerpt === "string" &&
    typeof v.date === "string" &&
    typeof v.author === "string" &&
    typeof v.image === "string" &&
    typeof v.imageAlt === "string" &&
    typeof v.tagTone === "string" &&
    Array.isArray(v.body) &&
    v.body.every((x) => typeof x === "string")
  );
}

function isAdminBlogExtra(v: unknown): v is AdminBlogExtra {
  if (!isRecord(v)) return false;
  if (typeof v.internalId !== "string" || typeof v.createdAt !== "number") {
    return false;
  }
  const { internalId: _i, createdAt: _c, ...rest } = v;
  return isBlogPostShape(rest);
}

export function loadBlogOverrides(): BlogOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(BLOG_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};
    const out: BlogOverrides = {};
    for (const [k, val] of Object.entries(parsed)) {
      if (typeof k === "string" && isRecord(val)) {
        out[k] = val as Partial<BlogPost>;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function saveBlogOverrides(next: BlogOverrides): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BLOG_OVERRIDES_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(BLOG_ADMIN_UPDATED_EVENT));
}

export function loadBlogExtras(): AdminBlogExtra[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BLOG_EXTRAS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAdminBlogExtra);
  } catch {
    return [];
  }
}

export function saveBlogExtras(rows: AdminBlogExtra[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BLOG_EXTRAS_STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(BLOG_ADMIN_UPDATED_EVENT));
}

export function createInternalId(): string {
  return `blog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function slugifyTitle(title: string): string {
  const s = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (s || "post").slice(0, 48);
}
