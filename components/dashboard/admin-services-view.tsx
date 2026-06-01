"use client";

import Image from "next/image";
import { Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildAdminServiceRows,
  normalizeServiceRow,
  type AdminServiceRow,
} from "@/lib/admin-services-merge";
import { apiUrl } from "@/lib/api-url";
import { readResponseJson } from "@/lib/read-response-json";
import {
  notifyServicesDbUpdated,
  subscribeServicesDbUpdated,
} from "@/lib/services-db-updated";
import {
  ADMIN_PAGE_TITLE_CLASS,
  ADMIN_PAGE_TOP_PADDING_CLASS,
} from "@/lib/page-heading";
import { fetchSuppressedServiceSlugs } from "@/lib/fetch-suppressed-service-slugs";
import { serviceSlugFromTitle } from "@/lib/service-catalog";
import { cn } from "@/lib/utils";

const MAX_SERVICE_IMAGE_BYTES = 2 * 1024 * 1024;

function readServiceCoverImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(
        new Error("Please choose an image file (JPEG, PNG, WebP, or GIF).")
      );
      return;
    }
    if (file.size > MAX_SERVICE_IMAGE_BYTES) {
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

export function AdminServicesView({
  initialDbRows = [],
  initialSuppressedSlugs = [],
}: {
  /** Database services loaded on the server (same as the public services page). */
  initialDbRows?: AdminServiceRow[];
  initialSuppressedSlugs?: string[];
}) {
  const initialDbRowsRef = useRef(initialDbRows);
  const suppressedSlugsRef = useRef(initialSuppressedSlugs);
  const [items, setItems] = useState<AdminServiceRow[]>(() =>
    buildAdminServiceRows(initialDbRows, initialSuppressedSlugs)
  );

  const [formMode, setFormMode] = useState<"closed" | "add" | "edit">("closed");
  const [editId, setEditId] = useState<number | null>(null);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [catalogOnlyEdit, setCatalogOnlyEdit] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  function apiErrorMessage(
    body: Awaited<ReturnType<typeof readResponseJson>>,
    fallback: string
  ): string {
    if (
      body.okParse &&
      body.data &&
      typeof body.data === "object" &&
      body.data !== null &&
      "error" in body.data &&
      typeof (body.data as { error?: unknown }).error === "string"
    ) {
      return (body.data as { error: string }).error;
    }
    if (!body.okParse && body.bodyPreview) {
      return body.bodyPreview;
    }
    return fallback;
  }

  const clearCoverFileInput = () => {
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
  };

  async function onCoverFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await readServiceCoverImageFile(file);
      setImage(dataUrl);
      setFormError(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Invalid image.");
    }
  }

  // ================= FETCH SERVICES =================
  const fetchServices = async () => {
    let dbRows = initialDbRowsRef.current;
    let suppressed = suppressedSlugsRef.current;
    try {
      const [servicesRes, suppressedSlugs] = await Promise.all([
        fetch(apiUrl("/api/services")),
        fetchSuppressedServiceSlugs(),
      ]);
      suppressed = suppressedSlugs;
      suppressedSlugsRef.current = suppressed;
      const body = await readResponseJson(servicesRes);
      if (body.okParse && servicesRes.ok && Array.isArray(body.data)) {
        dbRows = (body.data as unknown[])
          .map(normalizeServiceRow)
          .filter((row): row is AdminServiceRow => row !== null);
        initialDbRowsRef.current = dbRows;
      }
    } catch (err) {
      console.log(err);
    }
    setItems(buildAdminServiceRows(dbRows, suppressed));
  };

  useEffect(() => {
    void fetchServices();
    return subscribeServicesDbUpdated(() => {
      void fetchServices();
    });
  }, []);

  // ================= RESET =================
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setImage("");
    setEditId(null);
    setEditSlug(null);
    setCatalogOnlyEdit(false);
    setFormMode("closed");
    clearCoverFileInput();
  };

  // ================= ADD =================
  const addService = async () => {
    if (!title.trim() || !price.trim()) {
      setFormError("Title and Price are required");
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum)) {
      setFormError("Enter a valid price");
      return;
    }

    setFormError(null);
    setActionError(null);
    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/services"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description,
          price: priceNum,
          image,
        }),
      });
      const body = await readResponseJson(res);
      if (!res.ok) {
        setFormError(apiErrorMessage(body, "Could not save service"));
        return;
      }
    } catch {
      setFormError("Network error while saving service");
      return;
    } finally {
      setSaving(false);
    }

    resetForm();
    await fetchServices();
    notifyServicesDbUpdated();
  };

  // ================= EDIT OPEN =================
  const openEdit = (item: AdminServiceRow) => {
    clearCoverFileInput();
    setFormMode("edit");
    if (item.catalogOnly) {
      setEditId(null);
      setCatalogOnlyEdit(true);
      setEditSlug(
        item.slug?.trim() || serviceSlugFromTitle(item.title) || null
      );
    } else {
      setEditId(item.id);
      setCatalogOnlyEdit(false);
      setEditSlug(item.slug ?? null);
    }
    setTitle(item.title);
    setDescription(item.description);
    setPrice(String(item.price));
    setImage(item.image);
  };

  // ================= UPDATE =================
  const updateService = async () => {
    if (!catalogOnlyEdit && !editId) return;
    if (!title.trim() || !price.trim()) {
      setFormError("Title and Price are required");
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum)) {
      setFormError("Enter a valid price");
      return;
    }

    const existing =
      editId != null ? items.find((r) => r.id === editId) : undefined;
    const slug =
      editSlug?.trim() ||
      existing?.slug?.trim() ||
      serviceSlugFromTitle(title.trim());

    setFormError(null);
    setActionError(null);
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description,
        price: priceNum,
        image,
        ...(slug ? { slug } : {}),
      };

      const res = catalogOnlyEdit
        ? await fetch(apiUrl("/api/services"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(apiUrl(`/api/services/${editId}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const body = await readResponseJson(res);
      if (!res.ok) {
        setFormError(
          apiErrorMessage(
            body,
            catalogOnlyEdit
              ? "Could not save service to the database"
              : "Could not update service"
          )
        );
        return;
      }

      resetForm();
      await fetchServices();
      notifyServicesDbUpdated();
    } catch {
      setFormError("Network error while updating service");
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE =================
  const rowDeleteKey = (row: AdminServiceRow) =>
    row.catalogOnly
      ? `catalog:${row.slug ?? serviceSlugFromTitle(row.title)}`
      : `db:${row.id}`;

  const deleteService = async (row: AdminServiceRow) => {
    const label = row.title.trim() || "this service";
    if (
      !window.confirm(
        `Delete "${label}"? It will be removed from the website catalog.`
      )
    ) {
      return;
    }

    const deleteKey = rowDeleteKey(row);
    setActionError(null);
    setDeletingKey(deleteKey);
    try {
      if (row.catalogOnly) {
        const slug =
          row.slug?.trim() || serviceSlugFromTitle(row.title);
        if (!slug) {
          setActionError("Could not determine service slug.");
          return;
        }
        const res = await fetch(apiUrl("/api/services/suppress"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const body = await readResponseJson(res);
        if (!res.ok) {
          setActionError(apiErrorMessage(body, "Could not remove service"));
          return;
        }
        if (catalogOnlyEdit && editSlug === slug) {
          resetForm();
        }
      } else {
        const res = await fetch(apiUrl(`/api/services/${row.id}`), {
          method: "DELETE",
        });
        const body = await readResponseJson(res);
        if (!res.ok) {
          setActionError(apiErrorMessage(body, "Could not delete service"));
          return;
        }
        if (editId === row.id) {
          resetForm();
        }
      }
      await fetchServices();
      notifyServicesDbUpdated();
    } catch {
      setActionError("Network error while deleting service");
    } finally {
      setDeletingKey(null);
    }
  };

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.catalogOnly !== b.catalogOnly) {
          return a.catalogOnly ? 1 : -1;
        }
        return b.id - a.id;
      }),
    [items]
  );

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formMode === "add") await addService();
    else await updateService();
  };

  return (
    <div className={cn("min-w-0 text-foreground", ADMIN_PAGE_TOP_PADDING_CLASS)}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <h1 className={ADMIN_PAGE_TITLE_CLASS}>Services</h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            clearCoverFileInput();
            setFormMode("add");
          }}
          className="shrink-0 gap-2 rounded-full border-[#008B8B] bg-transparent px-5 font-bold leading-none text-[#008B8B] hover:bg-[#008B8B]/10 hover:text-[#007a7a]"
        >
          <Plus data-icon="inline-start" className="size-4 shrink-0" aria-hidden />
          Add Services
        </Button>
      </div>

      {formMode !== "closed" ? (
        <section className="mb-10 rounded-2xl border-2 border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold text-foreground">
              {formMode === "add" ? "New service" : "Edit service"}
            </h2>
          </div>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="admin-service-name"
                  className="mb-1.5 block text-xs font-semibold text-foreground"
                >
                  Name
                </label>
                <Input
                  id="admin-service-name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 rounded-lg border-border"
                  required
                />
              </div>
              {formMode === "add" ? (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">
                    New services are saved to the database and appear on the
                    public Services page.
                  </p>
                </div>
              ) : (
                <div className="sm:col-span-2 space-y-1">
                  {catalogOnlyEdit ? (
                    <p className="text-xs text-muted-foreground">
                      This service is from the website catalog. Saving will
                      store it in the database so you can manage it here.
                    </p>
                  ) : editId != null ? (
                    <p className="text-xs text-muted-foreground">
                      Service ID:{" "}
                      <span className="font-mono font-medium text-foreground">
                        {editId}
                      </span>
                    </p>
                  ) : null}
                  {(editSlug ??
                    sortedItems.find((r) => r.id === editId)?.slug) ? (
                    <p className="text-xs text-muted-foreground">
                      URL slug:{" "}
                      <span className="font-mono font-medium text-foreground">
                        {editSlug ??
                          sortedItems.find((r) => r.id === editId)?.slug}
                      </span>
                    </p>
                  ) : null}
                </div>
              )}
              <div>
                <label
                  htmlFor="admin-service-price"
                  className="mb-1.5 block text-xs font-semibold text-foreground"
                >
                  Price (Rs.)
                </label>
                <Input
                  id="admin-service-price"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-11 rounded-lg border-border"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="admin-service-details"
                  className="mb-1.5 block text-xs font-semibold text-foreground"
                >
                  Details
                </label>
                <textarea
                  id="admin-service-details"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
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
                    aria-label="Upload service cover image from your computer"
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
                            className="absolute right-1.5 top-1.5 z-10 flex size-7 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-muted"
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
                disabled={saving}
                className="rounded-full border-[#008B8B] bg-transparent font-bold text-[#008B8B] hover:bg-[#008B8B]/10 hover:text-[#007a7a]"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
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
            All services ({sortedItems.length})
          </h2>
          {actionError ? (
            <p className="mt-2 text-sm font-medium text-red-600" role="alert">
              {actionError}
            </p>
          ) : null}
        </div>
        {sortedItems.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
            No services found. Use Add Services or check that the database
            and API are running.
          </p>
        ) : null}
        <ul className="grid list-none grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 lg:gap-5">
          {sortedItems.map((row) => (
            <li key={row.catalogOnly ? `catalog:${row.slug}` : `db:${row.id}`}>
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-[#008B8B]/35 hover:shadow-md">
                <div className="relative h-40 w-full shrink-0 bg-muted">
                  {row.image ? (
                    <Image
                      src={row.image}
                      alt={row.title}
                      fill
                      unoptimized={row.image.startsWith("data:")}
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No cover image
                    </div>
                  )}
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
                  {row.catalogOnly ? (
                    <span className="w-fit rounded-full border border-[#008B8B]/40 bg-[#008B8B]/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#008B8B]">
                      Website catalog
                    </span>
                  ) : null}
                  <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">
                    {row.title}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {row.description}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    Rs. {row.price}
                  </p>

                  <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#008B8B] bg-transparent px-3 py-2 text-xs font-semibold text-[#008B8B] transition hover:border-[#006f73] hover:text-[#006f73] min-[360px]:flex-none"
                    >
                      <Pencil className="size-3.5" aria-hidden /> Edit
                    </button>

                    <button
                      type="button"
                      disabled={deletingKey === rowDeleteKey(row)}
                      onClick={() => void deleteService(row)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-600 bg-transparent px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-700 hover:text-red-800 disabled:opacity-50 min-[360px]:flex-none"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      {deletingKey === rowDeleteKey(row)
                        ? "Deleting…"
                        : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
