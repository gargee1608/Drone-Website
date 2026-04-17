import {
  FEATURED_SLUG,
  blogPosts,
  postsBySlug,
  type BlogPost,
} from "@/components/blogs/blog-data";
import {
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
  const extra = loadBlogExtras().find((p) => p.slug === slug);
  if (extra) {
    const { internalId: _i, createdAt: _c, ...post } = extra;
    return post;
  }
  return mergeBuiltin(slug);
}

export function getMergedBlogPostsList(): BlogPost[] {
  if (typeof window === "undefined") return [...blogPosts];
  const extras = loadBlogExtras().map((e) => {
    const { internalId: _i, createdAt: _c, ...post } = e;
    return post;
  });
  const builtinMerged = blogPosts.map((p) => mergeBuiltin(p.slug) ?? p);
  const builtinSlugs = new Set(blogPosts.map((p) => p.slug));
  const onlyNew = extras.filter((e) => !builtinSlugs.has(e.slug));
  return [...builtinMerged, ...onlyNew];
}

export function getMergedGridPosts(): BlogPost[] {
  return getMergedBlogPostsList().filter((p) => p.slug !== FEATURED_SLUG);
}
