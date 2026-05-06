import type { BlogPost } from "@/components/blogs/blog-data";

export const BLOG_OVERRIDES_STORAGE_KEY = "aerolaminar_blog_overrides_v1";
export const BLOG_EXTRAS_STORAGE_KEY = "aerolaminar_blog_extras_v1";
export const BLOG_DELETED_BUILTINS_KEY = "aerolaminar_blog_deleted_builtins_v1";
export const BLOG_ADMIN_UPDATED_EVENT = "aerolaminar-blog-admin-updated";

const BLOG_CATALOG_BROADCAST_NAME = "aerolaminar-blogs-catalog";

/** Same-tab `CustomEvent` plus cross-tab `BroadcastChannel` (API + localStorage catalog). */
export function notifyBlogCatalogUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BLOG_ADMIN_UPDATED_EVENT));
  try {
    const bc = new BroadcastChannel(BLOG_CATALOG_BROADCAST_NAME);
    bc.postMessage({ type: "updated" } as const);
    bc.close();
  } catch {
    // BroadcastChannel may be unavailable.
  }
}

/** Other browser tabs do not receive `CustomEvent`; listen here for catalog refetches. */
export function subscribeBlogCatalogBroadcast(onUpdate: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(BLOG_CATALOG_BROADCAST_NAME);
    bc.onmessage = () => {
      onUpdate();
    };
  } catch {
    // ignore
  }
  return () => {
    bc?.close();
  };
}

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
  notifyBlogCatalogUpdated();
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
  notifyBlogCatalogUpdated();
}

/** Built-in post slugs the admin chose to remove from the merged catalog. */
export function loadBlogDeletedBuiltins(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BLOG_DELETED_BUILTINS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function saveBlogDeletedBuiltins(slugs: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BLOG_DELETED_BUILTINS_KEY, JSON.stringify(slugs));
  notifyBlogCatalogUpdated();
}

/** Hide a built-in post everywhere the merged list is used; clears overrides for that slug. */
export function deleteBuiltinFromCatalog(slug: string): void {
  if (typeof window === "undefined") return;
  const dels = new Set(loadBlogDeletedBuiltins());
  dels.add(slug);
  saveBlogDeletedBuiltins([...dels]);
  const ov = loadBlogOverrides();
  if (ov[slug]) {
    delete ov[slug];
    saveBlogOverrides(ov);
  }
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
