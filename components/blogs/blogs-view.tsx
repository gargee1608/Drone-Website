"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useMemo, useState } from "react";

import {
  FEATURED_SLUG,
  featuredHero,
  gridPosts,
} from "@/components/blogs/blog-data";
import { landingFontClassName } from "@/components/landing/landing-fonts";
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
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = gridPosts;
    if (activeFilter !== "All Logs") {
      list = list.filter((p) => p.category === activeFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeFilter, query]);

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
    <div className="mx-auto max-w-7xl px-6 py-12">
      <section className="group relative mb-16 overflow-hidden rounded-xl shadow-xl">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />
        <div className="relative h-[min(500px,70vh)] w-full md:h-[500px]">
          <Image
            src={featuredHero.image}
            alt={featuredHero.imageAlt}
            fill
            priority
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 z-20 flex max-w-3xl flex-col justify-end p-8 sm:p-12">
          <span className="mb-4 inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a1faff] backdrop-blur-md">
            Featured Publication
          </span>
          <h1 className="mb-6 font-[family-name:var(--font-landing-headline)] text-4xl font-extrabold leading-tight tracking-tighter text-white md:text-5xl lg:text-6xl">
            {featuredHero.headlineLead}{" "}
            <span className="bg-gradient-to-r from-[#a1faff] to-emerald-400 bg-clip-text text-transparent">
              {featuredHero.headlineGradient}
            </span>
          </h1>
          <p className="mb-8 max-w-2xl font-[family-name:var(--font-landing-body)] text-lg leading-relaxed text-slate-200">
            {featuredHero.subhead}
          </p>
          <Link
            href={`/blogs/${FEATURED_SLUG}`}
            className="inline-flex w-fit items-center justify-center rounded-md bg-white px-8 py-4 text-center font-[family-name:var(--font-landing-headline)] text-sm font-bold uppercase tracking-widest text-[#006a6e] transition-all hover:bg-slate-100 active:scale-95"
          >
            Read Flight Log
          </Link>
        </div>
      </section>

      <div className="mb-12 flex flex-col flex-wrap items-stretch justify-between gap-6 border-b border-[#c1c7cf]/30 pb-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 blogs-no-scrollbar">
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
        <div className="relative w-full shrink-0 lg:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#41474d]">
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search insights..."
            className="w-full rounded-md border border-[#c1c7cf] bg-white py-2 pl-10 pr-4 text-sm transition-all focus:border-[#006a6e] focus:outline-none focus:ring-1 focus:ring-[#006a6e]"
            aria-label="Search insights"
          />
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
