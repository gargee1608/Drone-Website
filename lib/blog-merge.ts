import {
  FEATURED_SLUG,
  blogPosts,
  gridPosts,
  postsBySlug,
  type BlogPost,
} from "@/components/blogs/blog-data";
import { isBlogPostPublished } from "@/lib/blog-api";
import { parseBlogDbSlug } from "@/lib/blog-api";
import {
  loadBlogDeletedBuiltins,
  loadBlogExtras,
  loadBlogOverrides,
  type AdminBlogExtra,
} from "@/lib/blog-admin-storage";

function mergeBuiltin(slug: string): BlogPost | undefined {
  const base = postsBySlug[slug];
  if (!base) return undefined;
  const ov = loadBlogOverrides()[slug];
  if (!ov) return { ...base };
  return { ...base, ...ov, body: ov.body ?? base.body, slug: base.slug };
}

/** Resolve a post by slug: extras first, then built-in + overrides. Client-only (uses storage). */
export function getMergedPostBySlug(slug: string): BlogPost | undefined {
  if (typeof window === "undefined") return postsBySlug[slug];
  if (new Set(loadBlogDeletedBuiltins()).has(slug)) return undefined;
  const extra = loadBlogExtras().find((p) => p.slug === slug);
  if (extra) {
    const { internalId: _i, createdAt: _c, ...post } = extra;
    return post;
  }
  return mergeBuiltin(slug);
}

function listAdminExtrasPosts(): BlogPost[] {
  const builtinSlugs = new Set(blogPosts.map((p) => p.slug));
  return loadBlogExtras()
    .filter((e) => !builtinSlugs.has(e.slug))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((e) => {
      const { internalId: _i, createdAt: _c, ...post } = e;
      return post;
    });
}

export function getMergedBlogPostsList(): BlogPost[] {
  if (typeof window === "undefined") return [...blogPosts];
  const deleted = new Set(loadBlogDeletedBuiltins());
  const adminExtras = listAdminExtrasPosts();
  const builtinMerged = blogPosts
    .filter((p) => !deleted.has(p.slug))
    .map((p) => mergeBuiltin(p.slug) ?? p);
  return [...adminExtras, ...builtinMerged];
}

export function getMergedGridPosts(): BlogPost[] {
  return getMergedBlogPostsList().filter((p) => p.slug !== FEATURED_SLUG);
}

/** Drop API rows the admin removed from this browser catalog (incl. after DB delete). */
export function filterApiPostsForCatalog(apiMapped: BlogPost[]): BlogPost[] {
  if (typeof window === "undefined") return apiMapped;
  const deleted = new Set(loadBlogDeletedBuiltins());
  return apiMapped.filter((p) => !deleted.has(p.slug));
}

/** Public /blogs grid: live API posts + merged built-in/extras, respecting deletions. */
export function buildPublicBlogGridList(apiMapped: BlogPost[]): BlogPost[] {
  const apiFiltered = filterApiPostsForCatalog(apiMapped).filter(
    isBlogPostPublished
  );
  if (typeof window === "undefined") {
    return [...apiFiltered, ...gridPosts];
  }
  return [...apiFiltered, ...getMergedGridPosts().filter(isBlogPostPublished)];
}

export function resolvePublicFeaturedPost(): BlogPost | null {
  if (typeof window === "undefined") {
    return postsBySlug[FEATURED_SLUG] ?? null;
  }
  return getMergedPostBySlug(FEATURED_SLUG) ?? null;
}

export function isBlogSlugHiddenFromCatalog(slug: string): boolean {
  if (typeof window === "undefined") return false;
  if (parseBlogDbSlug(slug) != null) return false;
  return new Set(loadBlogDeletedBuiltins()).has(slug);
}
