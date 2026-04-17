"use client";

import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { postsBySlug, type BlogPost } from "@/components/blogs/blog-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BLOG_ADMIN_UPDATED_EVENT,
  createInternalId,
  loadBlogExtras,
  loadBlogOverrides,
  saveBlogExtras,
  saveBlogOverrides,
  slugifyTitle,
  type AdminBlogExtra,
} from "@/lib/blog-admin-storage";
import { getMergedBlogPostsList } from "@/lib/blog-merge";
import { cn } from "@/lib/utils";

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

function ensureUniqueSlug(candidate: string, excludeSlug?: string): string {
  const slugs = new Set(
    getMergedBlogPostsList().map((p) => p.slug).filter((s) => s !== excludeSlug)
  );
  let s = candidate;
  let n = 0;
  while (slugs.has(s)) {
    n += 1;
    s = `${candidate}-${n}`;
  }
  return s;
}

type EditorMode = "closed" | "add" | "edit";

export function AdminBlogsView() {
  const [rows, setRows] = useState<BlogPost[]>([]);
  const [extras, setExtras] = useState<AdminBlogExtra[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("closed");
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [editInternalId, setEditInternalId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<BlogPost["category"]>("Technology");
  const [author, setAuthor] = useState("");
  const [image, setImage] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [tagTone, setTagTone] = useState<BlogPost["tagTone"]>("primary");
  const [bodyText, setBodyText] = useState("");
  const [slugManual, setSlugManual] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setRows(getMergedBlogPostsList());
    setExtras(loadBlogExtras());
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);
  }, [refresh]);

  useEffect(() => {
    const fn = () => refresh();
    window.addEventListener(BLOG_ADMIN_UPDATED_EVENT, fn);
    return () => window.removeEventListener(BLOG_ADMIN_UPDATED_EVENT, fn);
  }, [refresh]);

  const builtinSlugs = useMemo(() => new Set(Object.keys(postsBySlug)), []);

  const openAdd = () => {
    setEditorMode("add");
    setEditSlug(null);
    setEditInternalId(null);
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
    setSlugManual("");
    setFormError(null);
  };

  const openEdit = (post: BlogPost) => {
    const extra = loadBlogExtras().find((e) => e.slug === post.slug);
    setEditorMode("edit");
    setEditSlug(post.slug);
    setEditInternalId(extra?.internalId ?? null);
    setTitle(post.title);
    setExcerpt(post.excerpt);
    setDate(post.date);
    setCategory(post.category);
    setAuthor(post.author);
    setImage(post.image);
    setImageAlt(post.imageAlt);
    setTagTone(post.tagTone);
    setBodyText(bodyToText(post.body));
    setSlugManual(post.slug);
    setFormError(null);
  };

  const closeEditor = () => {
    setEditorMode("closed");
    setEditSlug(null);
    setEditInternalId(null);
    setFormError(null);
  };

  const saveForm = (e: React.FormEvent) => {
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
      const rawSlug = slugManual.trim() || slugifyTitle(t);
      const slug = ensureUniqueSlug(rawSlug);
      const row: AdminBlogExtra = {
        ...baseFields,
        slug,
        internalId: createInternalId(),
        createdAt: Date.now(),
      };
      const next = [...loadBlogExtras(), row];
      saveBlogExtras(next);
      setExtras(next);
      refresh();
      closeEditor();
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
      refresh();
      closeEditor();
    }
  };

  const revertBuiltin = (slug: string) => {
    const ov = loadBlogOverrides();
    delete ov[slug];
    saveBlogOverrides(ov);
    refresh();
  };

  const deleteExtra = (internalId: string) => {
    const next = loadBlogExtras().filter((r) => r.internalId !== internalId);
    saveBlogExtras(next);
    refresh();
    if (editInternalId === internalId) closeEditor();
  };

  const hasOverride = (slug: string) => Boolean(loadBlogOverrides()[slug]);

  return (
    <div className="min-w-0 text-[#191c1d]">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#008B8B]">
            Command center
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Blogs
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Edit built-in Flight Log posts or publish new articles. Stored in
            this browser for demo; public pages pick up changes after save.
          </p>
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
        <section className="mb-10 rounded-2xl border-2 border-[#c1c6d7] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-[#191c1d]">
              {editorMode === "add" ? "New article" : "Edit article"}
            </h2>
            <button
              type="button"
              onClick={closeEditor}
              className="text-sm font-medium text-slate-500 hover:text-[#191c1d]"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={saveForm} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 rounded-lg border-slate-200"
                  required
                />
              </div>
              {editorMode === "add" ? (
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Slug (optional — auto from title if empty)
                  </label>
                  <Input
                    value={slugManual}
                    onChange={(e) => setSlugManual(e.target.value)}
                    placeholder="e.g. fleet-safety-2024"
                    className="h-11 rounded-lg border-slate-200 font-mono text-sm"
                  />
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">
                    Slug:{" "}
                    <span className="font-mono font-medium text-[#191c1d]">
                      {editSlug}
                    </span>
                  </p>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as BlogPost["category"])
                  }
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Date
                </label>
                <Input
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11 rounded-lg border-slate-200"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Author
                </label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="h-11 rounded-lg border-slate-200"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Tag tone
                </label>
                <select
                  value={tagTone}
                  onChange={(e) =>
                    setTagTone(e.target.value as BlogPost["tagTone"])
                  }
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                >
                  {TAG_TONES.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Excerpt
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Cover image URL
                </label>
                <Input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="h-11 rounded-lg border-slate-200 font-mono text-xs"
                  placeholder="https://…"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Image alt text
                </label>
                <Input
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="h-11 rounded-lg border-slate-200"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Body (paragraphs separated by a blank line)
                </label>
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={10}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs leading-relaxed"
                />
              </div>
            </div>
            {formError ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {formError}
              </p>
            ) : null}
            <Button
              type="submit"
              className="rounded-full bg-[#008B8B] font-bold text-white hover:bg-[#007a7a]"
            >
              Save
            </Button>
          </form>
        </section>
      ) : null}

      <section className="rounded-2xl border-2 border-[#c1c6d7] bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="text-base font-bold text-[#191c1d]">
            All posts ({hydrated ? rows.length : "…"})
          </h2>
        </div>
        {!hydrated ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">
            Loading…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-5">
                    Title
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-5">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-5">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((post) => {
                  const isBuiltIn = builtinSlugs.has(post.slug);
                  const extra = extras.find((e) => e.slug === post.slug);
                  return (
                    <tr key={post.slug} className="bg-white hover:bg-slate-50/80">
                      <td className="max-w-[14rem] px-4 py-3 font-semibold text-[#191c1d] sm:px-5">
                        {post.title}
                      </td>
                      <td className="font-mono text-xs text-slate-600 sm:px-5">
                        {post.slug}
                      </td>
                      <td className="text-xs text-slate-600 sm:px-5">
                        {extra
                          ? "Custom"
                          : isBuiltIn
                            ? "Built-in"
                            : "—"}
                      </td>
                      <td className="px-4 py-3 text-right sm:px-5">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(post)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#008B8B] hover:bg-[#008B8B]/10"
                          >
                            <Pencil className="size-3.5" aria-hidden />
                            Edit
                          </button>
                          {isBuiltIn ? (
                            <button
                              type="button"
                              disabled={!hasOverride(post.slug)}
                              onClick={() => revertBuiltin(post.slug)}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100",
                                !hasOverride(post.slug) && "opacity-40"
                              )}
                              title={
                                hasOverride(post.slug)
                                  ? "Discard edits"
                                  : "No overrides"
                              }
                            >
                              <RotateCcw className="size-3.5" aria-hidden />
                              Revert
                            </button>
                          ) : extra ? (
                            <button
                              type="button"
                              onClick={() => deleteExtra(extra.internalId)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
