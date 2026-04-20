"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useLayoutEffect, useMemo, useState } from "react";

import {
  FEATURED_SLUG,
  featuredHero,
  gridPosts,
  postsBySlug,
} from "@/components/blogs/blog-data";
import { landingFontClassName } from "@/components/landing/landing-fonts";
import { BLOG_ADMIN_UPDATED_EVENT } from "@/lib/blog-admin-storage";
import { getMergedGridPosts, getMergedPostBySlug } from "@/lib/blog-merge";
import { ADMIN_PAGE_TITLE_ON_DARK_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

const filterLabels = [
  "All Logs",
  "Technology",
  "Logistics",
  "Regulations",
  "Company News",
] as const;

type FilterKey = (typeof filterLabels)[number];

function tagToneClasses(tone: "emerald" | "primary" | "slate") {
  switch (tone) {
    case "emerald":
      return "text-emerald-700";
    case "primary":
      return "text-[#006a6e]";
    default:
      return "text-slate-700";
  }
}

export function BlogsView() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("All Logs");
  const [listPosts, setListPosts] = useState(gridPosts);
  const [featuredPost, setFeaturedPost] = useState(
    () => postsBySlug[FEATURED_SLUG]
  );

  useLayoutEffect(() => {
    const sync = () => {
      setListPosts(getMergedGridPosts());
      setFeaturedPost(
        getMergedPostBySlug(FEATURED_SLUG) ?? postsBySlug[FEATURED_SLUG]
      );
    };
    sync();
    window.addEventListener(BLOG_ADMIN_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) sync();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener(BLOG_ADMIN_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  const filtered = useMemo(() => {
    let list = listPosts;
    if (activeFilter !== "All Logs") {
      list = list.filter((p) => p.category === activeFilter);
    }
    return list;
  }, [listPosts, activeFilter]);

  return (
    <div
      className={cn(
        landingFontClassName,
        "blogs-hud-grid min-h-0 flex-1 bg-white pt-22 text-[#1a1c1e] sm:pt-24"
      )}
    >
    <div className="mx-auto max-w-7xl px-6 py-12">
      <section className="group relative mb-12 overflow-hidden rounded-xl shadow-lg sm:mb-14">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />
        <div className="relative h-[min(280px,50vh)] w-full sm:h-[min(320px,45vh)] md:h-[340px] lg:h-[360px]">
          <Image
            src={featuredHero.image}
            alt={featuredHero.imageAlt}
            fill
            priority
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 z-20 flex max-w-2xl flex-col justify-end p-5 sm:p-7 md:p-8">
          <span className="mb-2 inline-block rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a1faff] backdrop-blur-md sm:mb-3 sm:px-3 sm:py-1 sm:text-[10px]">
            Featured Publication
          </span>
          <h1
            className={cn(
              "mb-3 sm:mb-4",
              ADMIN_PAGE_TITLE_ON_DARK_CLASS
            )}
          >
            {featuredHero.headlineLead}{" "}
            <span className="bg-gradient-to-r from-[#a1faff] to-emerald-400 bg-clip-text text-transparent">
              {featuredHero.headlineGradient}
            </span>
          </h1>
          <p className="mb-5 max-w-xl font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-slate-200 sm:mb-6 sm:text-base md:max-w-2xl">
            {featuredPost?.excerpt ?? featuredHero.subhead}
          </p>
          <Link
            href={`/blogs/${FEATURED_SLUG}`}
            className="inline-flex w-fit items-center justify-center rounded-md bg-white px-6 py-2.5 text-center font-[family-name:var(--font-landing-headline)] text-xs font-bold uppercase tracking-widest text-[#006a6e] transition-all hover:bg-slate-100 active:scale-95 sm:px-7 sm:py-3 sm:text-sm"
          >
            Read this blog
          </Link>
        </div>
      </section>

      <div className="mb-12 border-b border-[#c1c7cf]/30 pb-6">
        <div className="flex flex-wrap items-center justify-center gap-2 pb-1 sm:gap-3">
          {filterLabels.map((label) => {
            const isAll = label === "All Logs";
            const active =
              (isAll && activeFilter === "All Logs") ||
              (!isAll && activeFilter === label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActiveFilter(label)}
                className={cn(
                  "whitespace-nowrap rounded-full px-6 py-2 font-[family-name:var(--font-landing-headline)] text-xs font-bold uppercase tracking-widest transition-colors",
                  active
                    ? "bg-[#006a6e] text-white"
                    : "bg-[#edeef2] text-[#41474d] hover:bg-[#e7e9ef]"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-24 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <article
            key={post.slug}
            className="group flex flex-col overflow-hidden rounded-xl border border-[#c1c7cf]/30 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-[#006a6e]/5"
          >
            <Link href={`/blogs/${post.slug}`} className="relative block h-56 overflow-hidden">
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width:768px) 100vw, 33vw"
              />
              <div className="absolute left-4 top-4">
                <span
                  className={cn(
                    "rounded border border-[#c1c7cf]/30 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-md",
                    tagToneClasses(post.tagTone)
                  )}
                >
                  {post.category}
                </span>
              </div>
            </Link>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="mb-3 font-[family-name:var(--font-landing-headline)] text-xl font-bold leading-tight text-[#1a1c1e] transition-colors group-hover:text-[#006a6e]">
                <Link href={`/blogs/${post.slug}`}>{post.title}</Link>
              </h3>
              <p className="mb-6 line-clamp-3 font-[family-name:var(--font-landing-body)] text-sm text-[#41474d]">
                {post.excerpt}
              </p>
              <div className="mt-auto flex items-center justify-between border-t border-[#c1c7cf]/10 pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-[#006a6e]" aria-hidden />
                  <span className="text-xs text-[#41474d]">{post.date}</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-tighter text-[#1a1c1e]">
                  By {post.author}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="pb-24 text-center text-sm text-[#41474d]">
          No flight logs match your filters.
        </p>
      ) : null}
    </div>
    </div>
  );
}
