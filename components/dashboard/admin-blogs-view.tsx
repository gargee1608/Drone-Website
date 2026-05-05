"use client";

import Image from "next/image";
import { Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { postsBySlug, type BlogPost } from "@/components/blogs/blog-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchBlogsFromApi,
  mapApiRowToBlogPost,
} from "@/lib/blog-api";
import { apiUrl } from "@/lib/api-url";
import {
  BLOG_ADMIN_UPDATED_EVENT,
  deleteBuiltinFromCatalog,
  loadBlogExtras,
  loadBlogOverrides,
  saveBlogExtras,
  saveBlogOverrides,
  type AdminBlogExtra,
} from "@/lib/blog-admin-storage";
import { getMergedBlogPostsList } from "@/lib/blog-merge";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

type AdminBlogRow = BlogPost & { dbId?: number };

const CATEGORIES: BlogPost["category"][] = [
  "Technology",
  "Logistics",
  "Regulations",
  "Company News",
];

const TAG_TONES: BlogPost["tagTone"][] = ["emerald", "primary", "slate"];

const MAX_BLOG_COVER_BYTES = 2 * 1024 * 1024;

function readBlogCoverImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(
        new Error("Please choose an image file (JPEG, PNG, WebP, or GIF).")
      );
      return;
    }
    if (file.size > MAX_BLOG_COVER_BYTES) {
      reject(new Error("Cover image must be at most 2 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read the image."));
    };
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

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

type EditorMode = "closed" | "add" | "edit";

export function AdminBlogsView() {
  const [rows, setRows] = useState<AdminBlogRow[]>([]);
  const [extras, setExtras] = useState<AdminBlogExtra[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("closed");
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [editInternalId, setEditInternalId] = useState<string | null>(null);
  const [editDbId, setEditDbId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<BlogPost["category"]>("Technology");
  const [author, setAuthor] = useState("");
  const [image, setImage] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [tagTone, setTagTone] = useState<BlogPost["tagTone"]>("primary");
  const [bodyText, setBodyText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const openedEditSlugRef = useRef<string | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const clearCoverFileInput = () => {
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
  };

  async function onCoverFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await readBlogCoverImageFile(file);
      setImage(dataUrl);
      setFormError(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Invalid image.");
    }
  }

  const refresh = useCallback(async () => {
    let dbPosts: AdminBlogRow[] = [];
    try {
      const apiRows = await fetchBlogsFromApi();
      dbPosts = apiRows.map((r) => ({
        ...mapApiRowToBlogPost(r),
        dbId: r.id,
      }));
    } catch {
      dbPosts = [];
    }
    const merged = getMergedBlogPostsList();
    setRows([...dbPosts, ...merged]);
    setExtras(loadBlogExtras());
  }, []);

  useEffect(() => {
    void refresh().finally(() => setHydrated(true));
  }, [refresh]);

  useEffect(() => {
    const fn = () => void refresh();
    window.addEventListener(BLOG_ADMIN_UPDATED_EVENT, fn);
    return () => window.removeEventListener(BLOG_ADMIN_UPDATED_EVENT, fn);
  }, [refresh]);

  const builtinSlugs = useMemo(() => new Set(Object.keys(postsBySlug)), []);

  const openAdd = () => {
    setEditorMode("add");
    setEditSlug(null);
    setEditInternalId(null);
    setEditDbId(null);
    setTitle("");
    setExcerpt("");
    setDate(
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
      }).format(new Date())
    );
    setCategory("Technology");
    setAuthor("");
    setImage("");
    setImageAlt("");
    setTagTone("primary");
    setBodyText("");
    setFormError(null);
    clearCoverFileInput();
  };

  const openEdit = (post: AdminBlogRow) => {
    const extra = loadBlogExtras().find((e) => e.slug === post.slug);
    setEditorMode("edit");
    setEditSlug(post.slug);
    setEditInternalId(extra?.internalId ?? null);
    setEditDbId(typeof post.dbId === "number" ? post.dbId : null);
    setTitle(post.title);
    setExcerpt(post.excerpt);
    setDate(post.date);
    setCategory(post.category);
    setAuthor(post.author);
    setImage(post.image);
    setImageAlt(post.imageAlt);
    setTagTone(post.tagTone);
    setBodyText(bodyToText(post.body));
    setFormError(null);
    clearCoverFileInput();
  };

  useEffect(() => {
    if (!hydrated || rows.length === 0 || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const target = params.get("editSlug");
    if (!target) {
      openedEditSlugRef.current = null;
      return;
    }
    if (openedEditSlugRef.current === target) return;
    const post = rows.find((r) => r.slug === target);
    if (!post) return;
    openedEditSlugRef.current = target;
    openEdit(post);
    params.delete("editSlug");
    const q = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${q ? `?${q}` : ""}`
    );
  }, [hydrated, rows]);

  const closeEditor = () => {
    setEditorMode("closed");
    setEditSlug(null);
    setEditInternalId(null);
    setEditDbId(null);
    setFormError(null);
    clearCoverFileInput();
  };

  const saveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setFormError("Title is required.");
      return;
    }
    const body = textToBody(bodyText);
    const ex = excerpt.trim();
    const baseFields: BlogPost = {
      slug: "",
      title: t,
      excerpt: ex || "—",
      date: date.trim() || "—",
      category,
      author: author.trim() || "—",
      image: image.trim() || "https://placehold.co/800x600/e2e8f0/64748b?text=Blog",
      imageAlt: imageAlt.trim() || t,
      tagTone,
      body,
    };

    if (editorMode === "add") {
      const img =
        image.trim() || "https://placehold.co/800x600/e2e8f0/64748b?text=Blog";
      const content = bodyText.trim() || " ";
      try {
        const res = await fetch(apiUrl("/api/blogs"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: t, content, image: img }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!res.ok) {
          setFormError(
            typeof data.error === "string" ? data.error : "Save failed"
          );
          return;
        }
        await refresh();
        window.dispatchEvent(new CustomEvent(BLOG_ADMIN_UPDATED_EVENT));
        closeEditor();
      } catch {
        setFormError("Network error — is the backend running?");
      }
      return;
    }

    if (editorMode === "edit" && editDbId != null) {
      const img =
        image.trim() || "https://placehold.co/800x600/e2e8f0/64748b?text=Blog";
      const content = bodyText.trim() || " ";
      try {
        const res = await fetch(apiUrl(`/api/blogs/${editDbId}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: t, content, image: img }),
          }
        );
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!res.ok) {
          setFormError(
            typeof data.error === "string" ? data.error : "Update failed"
          );
          return;
        }
        await refresh();
        window.dispatchEvent(new CustomEvent(BLOG_ADMIN_UPDATED_EVENT));
        closeEditor();
      } catch {
        setFormError("Network error — is the backend running?");
      }
      return;
    }

    if (editorMode === "edit" && editSlug) {
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
      } else {
        const orig = postsBySlug[editSlug];
        if (!orig) {
          setFormError("Original post missing.");
          return;
        }
        const ov = loadBlogOverrides();
        saveBlogOverrides({
          ...ov,
          [editSlug]: {
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
      }
      await refresh();
      closeEditor();
    }
  };

  const deleteExtra = (internalId: string) => {
    const next = loadBlogExtras().filter((r) => r.internalId !== internalId);
    saveBlogExtras(next);
    void refresh();
    if (editInternalId === internalId) closeEditor();
  };

  const deleteBuiltin = (slug: string) => {
    if (editSlug === slug) closeEditor();
    deleteBuiltinFromCatalog(slug);
    void refresh();
  };

  const deleteDbBlog = async (id: number) => {
    try {
      const res = await fetch(apiUrl(`/api/blogs/${id}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        return;
      }
      await refresh();
      window.dispatchEvent(new CustomEvent(BLOG_ADMIN_UPDATED_EVENT));
      if (editDbId === id) closeEditor();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-w-0 text-foreground">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <h1 className={ADMIN_PAGE_TITLE_CLASS}>Blogs</h1>
        </div>
        <Button
          type="button"
          onClick={openAdd}
          className="shrink-0 rounded-full bg-[#008B8B] font-bold text-white hover:bg-[#007a7a]"
        >
          <Plus className="mr-2 size-4" aria-hidden />
          New blog
        </Button>
      </div>

      {editorMode !== "closed" ? (
        <section className="mb-10 rounded-2xl border-2 border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold text-foreground">
              {editorMode === "add" ? "New article" : "Edit article"}
            </h2>
          </div>
          <form onSubmit={saveForm} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 rounded-lg border-border"
                  required
                />
              </div>
              {editorMode === "add" ? (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">
                    New posts are saved to the database. The URL slug is set
                    automatically (e.g. blog-1).
                  </p>
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">
                    Slug:{" "}
                    <span className="font-mono font-medium text-foreground">
                      {editSlug}
                    </span>
                  </p>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as BlogPost["category"])
                  }
                  className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Date
                </label>
                <Input
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11 rounded-lg border-border"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Author
                </label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="h-11 rounded-lg border-border"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Tag tone
                </label>
                <select
                  value={tagTone}
                  onChange={(e) =>
                    setTagTone(e.target.value as BlogPost["tagTone"])
                  }
                  className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
                >
                  {TAG_TONES.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Excerpt
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Cover image
                </label>
                <div className="max-w-sm rounded-xl border border-border bg-card p-4 shadow-sm">
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    aria-label="Upload cover image from your computer"
                    onChange={onCoverFileSelected}
                  />
                  <div className="space-y-3">
                    <div
                      className={cn(
                        "relative aspect-[16/10] w-full overflow-hidden rounded-lg border bg-muted",
                        image
                          ? "border-border"
                          : "border-dashed border-muted-foreground/30"
                      )}
                    >
                      {image ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element -- data URLs + remote URLs */}
                          <img
                            src={image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            className="absolute right-1.5 top-1.5 z-10 flex size-7 items-center justify-center rounded-full border border-border bg-white text-slate-800 shadow-sm transition hover:bg-slate-50"
                            aria-label="Remove cover image"
                            onClick={() => {
                              setImage("");
                              clearCoverFileInput();
                            }}
                          >
                            <X
                              className="size-3.5"
                              strokeWidth={2.5}
                              aria-hidden
                            />
                          </button>
                        </>
                      ) : (
                        <div className="flex min-h-[5.5rem] flex-col items-center justify-center gap-1 px-3 py-4 text-center">
                          <Upload
                            className="size-6 text-muted-foreground/70"
                            aria-hidden
                          />
                          <span className="text-xs text-muted-foreground">
                            No cover yet — use Browser below
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full justify-center gap-2 rounded-lg border-[#008B8B] bg-background font-medium text-[#008B8B] hover:bg-[#008B8B]/10"
                      onClick={() => coverFileInputRef.current?.click()}
                    >
                      <Upload className="size-4 shrink-0" aria-hidden />
                      Browser
                    </Button>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      JPEG, PNG, WebP, or GIF · max 2 MB
                    </p>
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Image alt text
                </label>
                <Input
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="h-11 rounded-lg border-border"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Body (paragraphs separated by a blank line)
                </label>
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={10}
                  className="w-full rounded-lg border border-border px-3 py-2 font-mono text-xs leading-relaxed"
                />
              </div>
            </div>
            {formError ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="submit"
                variant="outline"
                className="rounded-full border-[#008B8B] bg-transparent font-bold text-[#008B8B] hover:bg-[#008B8B]/10 hover:text-[#007a7a]"
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeEditor}
                className="rounded-full font-normal"
              >
                Cancel
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="rounded-2xl border-2 border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-base font-bold text-foreground">
            All posts ({hydrated ? rows.length : "…"})
          </h2>
        </div>
        {!hydrated ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
            Loading…
          </p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
            No posts yet. Use &quot;New blog&quot; to add one.
          </p>
        ) : (
          <ul className="grid list-none grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 lg:gap-5">
            {rows.map((post) => {
              const isDb = typeof post.dbId === "number";
              const isBuiltIn = builtinSlugs.has(post.slug);
              const extra = extras.find((e) => e.slug === post.slug);
              const typeLabel = isDb
                ? "Database"
                : extra
                  ? "Custom"
                  : isBuiltIn
                    ? "Built-in"
                    : "—";
              const typeClass = isDb
                ? "border-emerald-700/30 bg-emerald-700/10 text-emerald-900"
                : extra
                  ? "border-[#008B8B]/25 bg-[#008B8B]/10 text-[#006d6d]"
                  : isBuiltIn
                    ? "border-border bg-muted text-foreground"
                    : "border-border bg-muted/50 text-muted-foreground";

              return (
                <li key={isDb ? `db-${post.dbId}` : post.slug}>
                  <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-[#008B8B]/35 hover:shadow-md">
                    <div className="relative aspect-[16/10] w-full shrink-0 bg-muted">
                      <Image
                        src={post.image}
                        alt={post.imageAlt || post.title}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            typeClass
                          )}
                        >
                          {typeLabel}
                        </span>
                        <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {post.category}
                        </span>
                      </div>
                      <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">
                        {post.title}
                      </h3>
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-medium text-muted-foreground">
                          {post.date}
                        </span>
                        <span className="mx-1.5 text-border" aria-hidden>
                          ·
                        </span>
                        <span>{post.author}</span>
                      </p>
                      <p className="font-mono text-[10px] leading-tight text-muted-foreground break-all">
                        {post.slug}
                      </p>
                      <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
                        <button
                          type="button"
                          onClick={() => openEdit(post)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#008B8B] bg-transparent px-3 py-2 text-xs font-semibold text-[#008B8B] transition hover:border-[#006f73] hover:text-[#006f73] min-[360px]:flex-none"
                        >
                          <Pencil className="size-3.5" aria-hidden />
                          Edit
                        </button>
                        {isDb ? (
                          <button
                            type="button"
                            onClick={() => void deleteDbBlog(post.dbId!)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-600 bg-transparent px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-700 hover:text-red-800 min-[360px]:flex-none"
                            aria-label={`Delete ${post.title}`}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            Delete
                          </button>
                        ) : extra ? (
                          <button
                            type="button"
                            onClick={() => deleteExtra(extra.internalId)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-600 bg-transparent px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-700 hover:text-red-800 min-[360px]:flex-none"
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            Delete
                          </button>
                        ) : isBuiltIn ? (
                          <button
                            type="button"
                            onClick={() => deleteBuiltin(post.slug)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-600 bg-transparent px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-700 hover:text-red-800 min-[360px]:flex-none"
                            aria-label={`Delete ${post.title}`}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
