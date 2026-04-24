"use client";

import Image from "next/image";
import { Calendar, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";


import type { BlogPost } from "@/components/blogs/blog-data";
import {
  FEATURED_SLUG,
  featuredHero,
  gridPosts,
  postsBySlug,
} from "@/components/blogs/blog-data";
import { landingFontClassName } from "@/components/landing/landing-fonts";
import { apiUrl } from "@/lib/api-url";
import {
  fetchBlogsFromApi,
  mapApiRowToBlogPost,
  parseBlogDbSlug,
} from "@/lib/blog-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BLOG_ADMIN_UPDATED_EVENT,
  deleteBuiltinFromCatalog,
  loadBlogExtras,
  loadBlogOverrides,
  saveBlogExtras,
  saveBlogOverrides,
} from "@/lib/blog-admin-storage";
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

const CATEGORIES: BlogPost["category"][] = [
  "Technology",
  "Logistics",
  "Regulations",
  "Company News",
];

const TAG_TONES: BlogPost["tagTone"][] = ["emerald", "primary", "slate"];

function bodyToText(body: string[]) {
  return body.join("\n\n");
}

function textToBody(text: string): string[] {
  const parts = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text.trim() || " "];
}

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

export function BlogsView({
  initialApiPosts = [],
}: {
  initialApiPosts?: BlogPost[];
}) {
  const initialApiRef = useRef(initialApiPosts);
  initialApiRef.current = initialApiPosts;

  const [activeFilter, setActiveFilter] = useState<FilterKey>("All Logs");
  const [listPosts, setListPosts] = useState(() => [
    ...initialApiPosts,
    ...gridPosts,
  ]);
  const [featuredPost, setFeaturedPost] = useState(
    () => postsBySlug[FEATURED_SLUG]
  );

  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editInternalId, setEditInternalId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editBodyText, setEditBodyText] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editCategory, setEditCategory] =
    useState<BlogPost["category"]>("Technology");
  const [editImageAlt, setEditImageAlt] = useState("");
  const [editTagTone, setEditTagTone] =
    useState<BlogPost["tagTone"]>("primary");
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  function openEditor(post: BlogPost) {
    setEditingPost(post);
    setEditInternalId(
      loadBlogExtras().find((e) => e.slug === post.slug)?.internalId ?? null
    );
    setEditTitle(post.title);
    setEditImage(post.image);
    setEditBodyText(bodyToText(post.body));
    setEditExcerpt(post.excerpt);
    setEditDate(post.date);
    setEditAuthor(post.author);
    setEditCategory(post.category);
    setEditImageAlt(post.imageAlt);
    setEditTagTone(post.tagTone);
    setEditFormError(null);
  }

  function closeEditor() {
    setEditingPost(null);
    setEditInternalId(null);
    setEditFormError(null);
  }

  useEffect(() => {
    if (!editingPost) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEditor();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingPost]);

  async function saveEditor(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPost) return;
    const t = editTitle.trim();
    if (!t) {
      setEditFormError("Title is required.");
      return;
    }
    setEditSaving(true);
    setEditFormError(null);
    const slug = editingPost.slug;
    const dbId = parseBlogDbSlug(slug);
    const img =
      editImage.trim() || "https://placehold.co/800x600/e2e8f0/64748b?text=Blog";
    const content = editBodyText.trim() || " ";

    try {
      if (dbId != null) {
        const res = await fetch(apiUrl(`/api/blogs/${dbId}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: t, content, image: img }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!res.ok) {
          setEditFormError(
            typeof data.error === "string" ? data.error : "Update failed"
          );
          return;
        }
      } else {
        const body = textToBody(editBodyText);
        const ex = editExcerpt.trim();
        const baseFields: BlogPost = {
          slug,
          title: t,
          excerpt: ex || "—",
          date: editDate.trim() || "—",
          category: editCategory,
          author: editAuthor.trim() || "—",
          image: img,
          imageAlt: editImageAlt.trim() || t,
          tagTone: editTagTone,
          body,
        };
        if (editInternalId) {
          const nextExtras = loadBlogExtras().map((row) =>
            row.internalId === editInternalId
              ? {
                  ...row,
                  ...baseFields,
                  slug: row.slug,
                  internalId: row.internalId,
                  createdAt: row.createdAt,
                }
              : row
          );
          saveBlogExtras(nextExtras);
        } else if (postsBySlug[slug]) {
          const ov = loadBlogOverrides();
          saveBlogOverrides({
            ...ov,
            [slug]: {
              title: baseFields.title,
              excerpt: baseFields.excerpt,
              date: baseFields.date,
              category: baseFields.category,
              author: baseFields.author,
              image: baseFields.image,
              imageAlt: baseFields.imageAlt,
              tagTone: baseFields.tagTone,
              body: baseFields.body,
            },
          });
        } else {
          setEditFormError("This post cannot be edited here.");
          return;
        }
      }
      window.dispatchEvent(new CustomEvent(BLOG_ADMIN_UPDATED_EVENT));
      closeEditor();
    } catch {
      setEditFormError("Something went wrong. Try again.");
    } finally {
      setEditSaving(false);
    }
  }

  const editingIsDb =
    editingPost != null && parseBlogDbSlug(editingPost.slug) != null;

  useLayoutEffect(() => {
    let cancelled = false;

    const mergeLists = (apiMapped: BlogPost[]) => {
      const merged = getMergedGridPosts();
      setFeaturedPost(
        getMergedPostBySlug(FEATURED_SLUG) ?? postsBySlug[FEATURED_SLUG]
      );
      /** DB blogs only in the card grid; hero stays the original featured design. */
      setListPosts([...apiMapped, ...merged]);
    };

    const sync = () => {
      void (async () => {
        let apiMapped: BlogPost[] = [];
        try {
          const rows = await fetchBlogsFromApi();
          if (!cancelled) apiMapped = rows.map(mapApiRowToBlogPost);
        } catch {
          if (!cancelled) apiMapped = initialApiRef.current;
        }
        if (cancelled) return;
        mergeLists(apiMapped);
      })();
    };

    sync();
    window.addEventListener(BLOG_ADMIN_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) sync();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      cancelled = true;
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

  async function deletePost(post: BlogPost) {
    if (
      !window.confirm(`Delete “${post.title}”? This cannot be undone.`)
    ) {
      return;
    }
    const dbId = parseBlogDbSlug(post.slug);
    if (dbId != null) {
      const res = await fetch(apiUrl(`/api/blogs/${dbId}`), {
        method: "DELETE",
      });
      if (!res.ok) return;
      window.dispatchEvent(new CustomEvent(BLOG_ADMIN_UPDATED_EVENT));
      return;
    }
    const extra = loadBlogExtras().find((e) => e.slug === post.slug);
    if (extra) {
      saveBlogExtras(
        loadBlogExtras().filter((e) => e.internalId !== extra.internalId)
      );
      window.dispatchEvent(new CustomEvent(BLOG_ADMIN_UPDATED_EVENT));
      return;
    }
    if (postsBySlug[post.slug]) {
      deleteBuiltinFromCatalog(post.slug);
      window.dispatchEvent(new CustomEvent(BLOG_ADMIN_UPDATED_EVENT));
    }
  }

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
            className={cn("mb-3 sm:mb-4", ADMIN_PAGE_TITLE_ON_DARK_CLASS)}
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
                unoptimized={post.slug.startsWith("blog-")}
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
              <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-[#c1c7cf]/10 pt-4">
                <div className="min-w-0 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-tighter text-[#1a1c1e]">
                    By {post.author}
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 shrink-0 text-[#006a6e]" aria-hidden />
                    <span className="text-xs text-[#41474d]">{post.date}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEditor(post)}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#006a6e]/10 px-3 py-2 text-center font-[family-name:var(--font-landing-headline)] text-xs font-semibold text-[#006a6e] transition hover:bg-[#006a6e]/18"
                    )}
                  >
                    <Pencil className="size-3.5 shrink-0" aria-hidden />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void deletePost(post)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 font-[family-name:var(--font-landing-headline)] text-xs font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 className="size-3.5 shrink-0" aria-hidden />
                    Delete
                  </button>
                </div>
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

      {editingPost ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="presentation"
          onClick={closeEditor}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="blog-edit-title"
            className={cn(
              landingFontClassName,
              "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#c1c7cf]/40 bg-white p-5 shadow-xl sm:p-6"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2
                id="blog-edit-title"
                className="font-[family-name:var(--font-landing-headline)] text-lg font-bold text-[#1a1c1e]"
              >
                Edit article
              </h2>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-lg px-2 py-1 text-sm font-medium text-[#41474d] hover:bg-[#edeef2]"
              >
                Close
              </button>
            </div>
            <form onSubmit={(e) => void saveEditor(e)} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#41474d]">
                  Title
                </label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-11 w-full rounded-lg border-[#c1c7cf] bg-white"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#41474d]">
                  Cover image URL
                </label>
                <Input
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  className="h-11 w-full rounded-lg border-[#c1c7cf] bg-white font-mono text-xs"
                />
              </div>
              {!editingIsDb ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#41474d]">
                      Excerpt
                    </label>
                    <textarea
                      value={editExcerpt}
                      onChange={(e) => setEditExcerpt(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-[#c1c7cf] px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#41474d]">
                        Date
                      </label>
                      <Input
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="h-11 rounded-lg border-[#c1c7cf]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#41474d]">
                        Author
                      </label>
                      <Input
                        value={editAuthor}
                        onChange={(e) => setEditAuthor(e.target.value)}
                        className="h-11 rounded-lg border-[#c1c7cf]"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#41474d]">
                        Category
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) =>
                          setEditCategory(e.target.value as BlogPost["category"])
                        }
                        className="h-11 w-full rounded-lg border border-[#c1c7cf] bg-white px-3 text-sm"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#41474d]">
                        Tag tone
                      </label>
                      <select
                        value={editTagTone}
                        onChange={(e) =>
                          setEditTagTone(e.target.value as BlogPost["tagTone"])
                        }
                        className="h-11 w-full rounded-lg border border-[#c1c7cf] bg-white px-3 text-sm"
                      >
                        {TAG_TONES.map((tone) => (
                          <option key={tone} value={tone}>
                            {tone}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#41474d]">
                      Image alt text
                    </label>
                    <Input
                      value={editImageAlt}
                      onChange={(e) => setEditImageAlt(e.target.value)}
                      className="h-11 rounded-lg border-[#c1c7cf]"
                    />
                  </div>
                </>
              ) : null}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#41474d]">
                  Body (paragraphs separated by a blank line)
                </label>
                <textarea
                  value={editBodyText}
                  onChange={(e) => setEditBodyText(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-[#c1c7cf] px-3 py-2 font-mono text-xs leading-relaxed"
                />
              </div>
              {editFormError ? (
                <p className="text-sm font-medium text-red-600" role="alert">
                  {editFormError}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={editSaving}
                  className="rounded-full bg-[#006a6e] font-bold text-white hover:bg-[#005a5e]"
                >
                  {editSaving ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditor}
                  className="rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
    </div>
  );
}
