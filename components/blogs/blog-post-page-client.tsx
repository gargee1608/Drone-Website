"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";

import type { BlogPost } from "@/components/blogs/blog-data";
import { landingFontClassName } from "@/components/landing/landing-fonts";
import {
  fetchBlogByIdFromApi,
  isBlogPostPublished,
  mapApiRowToBlogPost,
  parseBlogDbSlug,
} from "@/lib/blog-api";
import {
  BLOG_ADMIN_UPDATED_EVENT,
  subscribeBlogCatalogBroadcast,
} from "@/lib/blog-admin-storage";
import {
  getMergedPostBySlug,
  isBlogSlugHiddenFromCatalog,
} from "@/lib/blog-merge";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

const headline = "font-[family-name:var(--font-landing-headline)]";
const body = "font-[family-name:var(--font-landing-body)]";

export function BlogPostPageClient({
  slug,
  initialPost,
}: {
  slug: string;
  initialPost: BlogPost | null;
}) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (isBlogSlugHiddenFromCatalog(slug)) {
      setPost(null);
      setReady(true);
      return;
    }

    const id = parseBlogDbSlug(slug);
    if (id != null) {
      if (
        initialPost &&
        isBlogPostPublished(initialPost) &&
        !isBlogSlugHiddenFromCatalog(slug)
      ) {
        setPost(initialPost);
        setReady(true);
        return;
      }
      let cancelled = false;
      setReady(false);
      fetchBlogByIdFromApi(id)
        .then((row) => {
          if (cancelled) return;
          if (isBlogSlugHiddenFromCatalog(slug)) {
            setPost(null);
            setReady(true);
            return;
          }
          const mapped = row ? mapApiRowToBlogPost(row) : null;
          setPost(mapped && isBlogPostPublished(mapped) ? mapped : null);
          setReady(true);
        })
        .catch(() => {
          if (!cancelled) {
            setPost(null);
            setReady(true);
          }
        });
      return () => {
        cancelled = true;
      };
    }

    const merged = getMergedPostBySlug(slug);
    setPost(merged && isBlogPostPublished(merged) ? merged : null);
    setReady(true);
    return undefined;
  }, [slug, initialPost]);

  useEffect(() => {
    const sync = () => {
      if (isBlogSlugHiddenFromCatalog(slug)) {
        setPost(null);
        setReady(true);
        return;
      }
      const id = parseBlogDbSlug(slug);
      if (id != null) {
        void fetchBlogByIdFromApi(id)
          .then((row) => {
            if (isBlogSlugHiddenFromCatalog(slug)) {
              setPost(null);
              setReady(true);
              return;
            }
            const mapped = row ? mapApiRowToBlogPost(row) : null;
            setPost(mapped && isBlogPostPublished(mapped) ? mapped : null);
            setReady(true);
          })
          .catch(() => {
            setPost(null);
            setReady(true);
          });
      } else {
        const merged = getMergedPostBySlug(slug);
        setPost(merged && isBlogPostPublished(merged) ? merged : null);
        setReady(true);
      }
    };

    window.addEventListener(BLOG_ADMIN_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    const unsubBroadcast = subscribeBlogCatalogBroadcast(sync);
    return () => {
      window.removeEventListener(BLOG_ADMIN_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
      unsubBroadcast();
    };
  }, [slug]);

  useEffect(() => {
    if (!post?.title) return;
    document.title = `${post.title} | Blogs | Hire A Drone`;
  }, [post]);

  if (!ready) {
    return (
      <div
        className={cn(
          landingFontClassName,
          "min-h-[50vh] flex-1 bg-[#fcfcff] dark:bg-background pt-22 sm:pt-24"
        )}
      >
        <div className="mx-auto max-w-3xl px-6 py-16 text-foreground">
          Loading…
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div
        className={cn(
          landingFontClassName,
          "min-h-[50vh] flex-1 bg-[#fcfcff] dark:bg-background pt-22 sm:pt-24"
        )}
      >
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className={ADMIN_PAGE_TITLE_CLASS}>Post not found</h1>
          <p className="mt-2 text-sm text-foreground">
            This Flight Log entry does not exist or was removed.
          </p>
          <Link
            href="/blogs"
            className="mt-8 inline-block text-sm font-bold uppercase tracking-widest text-[#008B8B] dark:text-[#4ddbd9]"
          >
            ← Back to Flight Log
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        landingFontClassName,
        "min-h-0 flex-1 bg-white dark:bg-background pt-22 text-foreground sm:pt-24"
      )}
    >
      <main className="mx-auto min-w-0 max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:max-w-6xl lg:pb-24">
        <nav
          className="mb-8 flex flex-wrap items-center gap-1.5 text-sm"
          aria-label="Breadcrumb"
        >
          <Link
            href="/blogs"
            className={cn(
              body,
              "font-medium text-[#008B8B] dark:text-[#4ddbd9] transition-colors hover:text-[#006b6b] dark:hover:text-[#7ce8e5]"
            )}
          >
            Flight Log
          </Link>
          <ChevronRight
            className="size-4 shrink-0 text-slate-400 dark:text-slate-500"
            aria-hidden
          />
          <span
            className={cn(body, "max-w-[min(100%,28rem)] truncate text-foreground")}
          >
            {post.title}
          </span>
        </nav>

        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,17.5rem)] md:items-start md:gap-10 lg:gap-12">
          <div className="order-2 min-w-0 md:order-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#006a6e] dark:text-[#4ddbd9]">
              {post.category}
            </p>
            <h1 className={cn("mt-3", ADMIN_PAGE_TITLE_CLASS)}>{post.title}</h1>
            <div className="mt-8 space-y-4">
              {post.body.map((paragraph, i) => (
                <p
                  key={i}
                  className={cn(
                    body,
                    "text-[0.9375rem] leading-relaxed text-foreground sm:text-base"
                  )}
                >
                  {paragraph}
                </p>
              ))}
            </div>
            <Link
              href="/blogs"
              className={cn(
                headline,
                "mt-10 inline-block text-sm font-bold uppercase tracking-widest text-[#008B8B] dark:text-[#4ddbd9] transition-colors hover:text-[#006b6b] dark:hover:text-[#7ce8e5]"
              )}
            >
              ← Back to Flight Log
            </Link>
          </div>

          <aside className="order-1 mx-auto w-full max-w-[17.5rem] md:order-2 md:mx-0 md:max-w-none md:justify-self-end md:sticky md:top-28 md:w-full">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-card shadow-sm dark:border-slate-700">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <Image
                  src={post.image}
                  alt={post.imageAlt || post.title}
                  fill
                  priority
                  unoptimized
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 280px, 320px"
                />
              </div>

              <div className="space-y-4 border-t border-slate-200 p-4 dark:border-slate-700 sm:p-5">
                <h2
                  className={cn(
                    headline,
                    "text-base font-bold leading-snug text-foreground sm:text-lg"
                  )}
                >
                  {post.title}
                </h2>
                <div>
                  <p
                    className={cn(
                      headline,
                      "text-[11px] font-semibold uppercase tracking-wide text-[#006a6e] dark:text-[#4ddbd9]"
                    )}
                  >
                    Published
                  </p>
                  <p className={cn(body, "mt-1 text-sm leading-relaxed text-foreground")}>
                    {post.date}
                  </p>
                </div>
                <div>
                  <p
                    className={cn(
                      headline,
                      "text-[11px] font-semibold uppercase tracking-wide text-[#006a6e] dark:text-[#4ddbd9]"
                    )}
                  >
                    Author
                  </p>
                  <p className={cn(body, "mt-1 text-sm leading-relaxed text-foreground")}>
                    {post.author}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
