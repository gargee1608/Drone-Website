"use client";

import Image from "next/image";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminServicesCatalog } from "@/hooks/use-admin-services-catalog";
import {
  createAdminServiceId,
  DEFAULT_ADMIN_SERVICE_IMAGE,
  DEFAULT_ADMIN_SERVICE_IMAGE_ALT,
  loadAdminServices,
  saveAdminServices,
  type AdminService,
} from "@/lib/admin-services";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

function formatAddedDate(iso: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatAddedTime(iso: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function AdminServicesView() {
  const items = useAdminServicesCatalog();
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.createdAt - a.createdAt),
    [items]
  );
  type FormMode = "closed" | "add" | "edit";
  const [formMode, setFormMode] = useState<FormMode>("closed");
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceLabel, setPriceLabel] = useState("");
  const [image, setImage] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const resetFormFields = () => {
    setTitle("");
    setDescription("");
    setPriceLabel("");
    setImage("");
    setImageAlt("");
  };

  const openAddForm = () => {
    setFormMode("add");
    setEditId(null);
    resetFormFields();
    setFormError(null);
  };

  const openEditForm = (row: AdminService) => {
    setFormMode("edit");
    setEditId(row.id);
    setTitle(row.title);
    setDescription(row.description);
    setPriceLabel(row.priceLabel);
    setImage(row.image);
    setImageAlt(row.imageAlt);
    setFormError(null);
  };

  const closeForm = () => {
    setFormMode("closed");
    setEditId(null);
    setFormError(null);
    resetFormFields();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const d = description.trim();
    const p = priceLabel.trim();
    const img = image.trim();
    const alt = imageAlt.trim();
    if (!t) {
      setFormError("Enter a service title.");
      return;
    }
    if (!p) {
      setFormError("Enter a price or label (e.g. $49 or From $120/h).");
      return;
    }
    setFormError(null);
    const imageUrl = img || DEFAULT_ADMIN_SERVICE_IMAGE;
    const imageAltResolved = alt
      ? alt
      : img
        ? t
        : DEFAULT_ADMIN_SERVICE_IMAGE_ALT;

    if (formMode === "edit" && editId) {
      const rows = loadAdminServices();
      const existing = rows.find((r) => r.id === editId);
      if (!existing) {
        setFormError("Service not found.");
        return;
      }
      const updated: AdminService = {
        ...existing,
        title: t,
        description: d || "—",
        priceLabel: p,
        image: imageUrl,
        imageAlt: imageAltResolved,
      };
      saveAdminServices(rows.map((r) => (r.id === editId ? updated : r)));
      closeForm();
      return;
    }

    if (formMode === "add") {
      const next: AdminService = {
        id: createAdminServiceId(),
        title: t,
        description: d || "—",
        priceLabel: p,
        createdAt: Date.now(),
        image: imageUrl,
        imageAlt: imageAltResolved,
      };
      saveAdminServices([...loadAdminServices(), next]);
      closeForm();
    }
  };

  const remove = (id: string) => {
    const merged = loadAdminServices().filter((r) => r.id !== id);
    saveAdminServices(merged);
    if (editId === id) closeForm();
  };

  return (
    <div className="min-w-0 text-foreground">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <h1 className={ADMIN_PAGE_TITLE_CLASS}>Services</h1>
        </div>
        <Button
          type="button"
          onClick={openAddForm}
          className="shrink-0 rounded-full bg-[#008B8B] font-bold text-white hover:bg-[#007a7a]"
        >
          <Plus className="mr-2 size-4" aria-hidden />
          Add New Service
        </Button>
      </div>

      {formMode !== "closed" ? (
        <section className="mb-10 rounded-2xl border-2 border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">
              {formMode === "add" ? "New service" : "Edit service"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <p className="mb-5 text-sm text-muted-foreground">
            Required: title and price label. Description and image URL are
            optional (default image used if URL is empty).
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {formMode === "edit" && editId ? (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">
                    Service ID:{" "}
                    <span className="font-mono font-medium text-foreground">
                      {editId}
                    </span>
                  </p>
                </div>
              ) : null}
              <div className="sm:col-span-2">
                <label
                  htmlFor="admin-svc-title"
                  className="mb-1.5 block text-xs font-semibold text-foreground"
                >
                  Title
                </label>
                <Input
                  id="admin-svc-title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="e.g. Medical logistics"
                  className="h-11 rounded-lg border-border bg-card"
                  autoComplete="off"
                />
              </div>
              <div>
                <label
                  htmlFor="admin-svc-price"
                  className="mb-1.5 block text-xs font-semibold text-foreground"
                >
                  Price / label
                </label>
                <Input
                  id="admin-svc-price"
                  value={priceLabel}
                  onChange={(e) => {
                    setPriceLabel(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="e.g. $49 or $120/h"
                  className="h-11 rounded-lg border-border bg-card"
                  autoComplete="off"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="admin-svc-desc"
                  className="mb-1.5 block text-xs font-semibold text-foreground"
                >
                  Short description
                </label>
                <textarea
                  id="admin-svc-desc"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setFormError(null);
                  }}
                  rows={3}
                  placeholder="What the customer gets in one or two sentences."
                  className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/80 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#008B8B]/35"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="admin-svc-image"
                  className="mb-1.5 block text-xs font-semibold text-foreground"
                >
                  Cover image URL (optional)
                </label>
                <Input
                  id="admin-svc-image"
                  value={image}
                  onChange={(e) => {
                    setImage(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="https://… or leave empty for default cover"
                  className="h-11 rounded-lg border-border bg-card font-mono text-xs"
                  autoComplete="off"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="admin-svc-image-alt"
                  className="mb-1.5 block text-xs font-semibold text-foreground"
                >
                  Image alt text (optional)
                </label>
                <Input
                  id="admin-svc-image-alt"
                  value={imageAlt}
                  onChange={(e) => {
                    setImageAlt(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="Describe the image for accessibility"
                  className="h-11 rounded-lg border-border bg-card"
                  autoComplete="off"
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
              className="rounded-full bg-[#008B8B] px-6 font-bold text-white hover:bg-[#007a7a]"
            >
              Save
            </Button>
          </form>
        </section>
      ) : null}

      <section className="rounded-2xl border-2 border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-base font-bold text-foreground">
            All services ({items.length})
          </h2>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
            No services yet. Click &quot;Add New Service&quot; to create one.
          </p>
        ) : (
          <ul className="grid list-none grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 lg:gap-5">
            {sortedItems.map((row) => (
              <li key={row.id}>
                <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-[#008B8B]/35 hover:shadow-md">
                  <div className="relative aspect-[16/10] w-full shrink-0 bg-muted">
                    <Image
                      src={row.image}
                      alt={row.imageAlt}
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
                          "border-[#008B8B]/25 bg-[#008B8B]/10 text-[#006d6d]"
                        )}
                      >
                        Service
                      </span>
                      <span
                        className="max-w-full truncate rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-semibold tabular-nums tracking-wide text-muted-foreground normal-case"
                        title={row.priceLabel}
                      >
                        {row.priceLabel}
                      </span>
                    </div>
                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">
                      {row.title}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {row.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-muted-foreground">
                        {formatAddedDate(row.createdAt)}
                      </span>
                      <span className="mx-1.5 text-border" aria-hidden>
                        ·
                      </span>
                      <span>{formatAddedTime(row.createdAt)}</span>
                    </p>
                    <p className="font-mono text-[10px] leading-tight text-muted-foreground break-all">
                      {row.id}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
                      <button
                        type="button"
                        onClick={() => openEditForm(row)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#008B8B]/10 px-3 py-2 text-xs font-semibold text-[#008B8B] transition hover:bg-[#008B8B]/18 min-[360px]:flex-none"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(row.id)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 min-[360px]:flex-none"
                        aria-label={`Delete ${row.title}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
