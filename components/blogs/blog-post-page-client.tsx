"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { BlogPost } from "@/components/blogs/blog-data";
import { landingFontClassName } from "@/components/landing/landing-fonts";
import {
  fetchBlogByIdFromApi,
  mapApiRowToBlogPost,
  parseBlogDbSlug,
} from "@/lib/blog-api";
import {
  BLOG_ADMIN_UPDATED_EVENT,
  subscribeBlogCatalogBroadcast,
} from "@/lib/blog-admin-storage";
import { getMergedPostBySlug } from "@/lib/blog-merge";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

export function BlogPostPageClient({
  slug,
  initialPost,
}: {
  slug: string;
  initialPost: BlogPost | null;
}) {
  const [post, setPost] = useState<BlogPost | null>(initialPost);
  const [ready, setReady] = useState(
    Boolean(initialPost) || parseBlogDbSlug(slug) == null
  );

  useEffect(() => {
    const id = parseBlogDbSlug(slug);
    if (id != null) {
      if (initialPost) {
        setPost(initialPost);
        setReady(true);
        return undefined;
      }
      let cancelled = false;
      setReady(false);
      fetchBlogByIdFromApi(id)
        .then((row) => {
          if (cancelled) return;
          setPost(row ? mapApiRowToBlogPost(row) : null);
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
    setPost(getMergedPostBySlug(slug) ?? null);
    setReady(true);
    return undefined;
  }, [slug, initialPost]);

  useEffect(() => {
    const sync = () => {
      const id = parseBlogDbSlug(slug);
      if (id != null) {
        void fetchBlogByIdFromApi(id)
          .then((row) => {
            setPost(row ? mapApiRowToBlogPost(row) : null);
            setReady(true);
          })
          .catch(() => {
            setPost(null);
            setReady(true);
          });
      } else {
        setPost(getMergedPostBySlug(slug) ?? null);
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
    document.title = `${post.title} | Blogs | Drone Hire`;
  }, [post]);

  if (!ready) {
    return (
      <div
        className={cn(
          landingFontClassName,
          "min-h-[50vh] flex-1 bg-[#fcfcff] pt-22 sm:pt-24"
        )}
      >
        <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-[#41474d]">
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
          "min-h-[50vh] flex-1 bg-[#fcfcff] pt-22 sm:pt-24"
        )}
      >
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className={ADMIN_PAGE_TITLE_CLASS}>Post not found</h1>
          <p className="mt-2 text-sm text-[#41474d]">
            This Flight Log entry does not exist or was removed.
          </p>
          <Link
            href="/blogs"
            className="mt-8 inline-block text-sm font-bold uppercase tracking-widest text-[#008B8B]"
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
        "blogs-hud-grid min-h-0 flex-1 bg-[#fcfcff] pt-22 text-[#1a1c1e] sm:pt-24"
      )}
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 50%, #f1f3f9 0%, #fcfcff 100%)",
      }}
    >
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-[#006a6e]">
          {post.category}
        </p>
        <h1 className={cn("mt-3", ADMIN_PAGE_TITLE_CLASS)}>{post.title}</h1>
        <p className="mt-2 text-sm text-[#41474d]">
          {post.date} · By {post.author}
        </p>
        <div className="mt-10 space-y-6 font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-[#41474d]">
          {post.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        <Link
          href="/blogs"
          className={cn(
            "mt-12 inline-block font-[family-name:var(--font-landing-headline)] text-sm font-bold uppercase tracking-widest text-[#008B8B] transition-colors hover:text-[#006b6b]"
          )}
        >
          ← Back to Flight Log
        </Link>
      </div>
    </div>
  );
}
