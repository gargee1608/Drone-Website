"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminServicesCatalog } from "@/hooks/use-admin-services-catalog";
import {
  createAdminServiceId,
  loadAdminServices,
  saveAdminServices,
  type AdminService,
} from "@/lib/admin-services";
import { cn } from "@/lib/utils";

function formatAdded(iso: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function AdminServicesView() {
  const items = useAdminServicesCatalog();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceLabel, setPriceLabel] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const d = description.trim();
    const p = priceLabel.trim();
    if (!t) {
      setFormError("Enter a service title.");
      return;
    }
    if (!p) {
      setFormError("Enter a price or label (e.g. $49 or From $120/h).");
      return;
    }
    setFormError(null);
    const next: AdminService = {
      id: createAdminServiceId(),
      title: t,
      description: d || "—",
      priceLabel: p,
      createdAt: Date.now(),
    };
    const merged = [...loadAdminServices(), next];
    saveAdminServices(merged);
    setTitle("");
    setDescription("");
    setPriceLabel("");
  };

  const remove = (id: string) => {
    const merged = loadAdminServices().filter((r) => r.id !== id);
    saveAdminServices(merged);
  };

  return (
    <div className="min-w-0 text-[#191c1d]">
      <div className="mb-8 max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#008B8B]">
          Command center
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Services
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Add offerings that appear in your admin catalog. Data is stored in
          this browser for demo purposes.
        </p>
      </div>

      <section className="mb-10 rounded-2xl border-2 border-[#c1c6d7] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-[#191c1d]">Add a service</h2>
        <p className="mt-1 text-sm text-slate-600">
          Required: title and price label. Description is optional.
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="admin-svc-title"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
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
                className="h-11 rounded-lg border-slate-200 bg-white"
                autoComplete="off"
              />
            </div>
            <div>
              <label
                htmlFor="admin-svc-price"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
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
                className="h-11 rounded-lg border-slate-200 bg-white"
                autoComplete="off"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="admin-svc-desc"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
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
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#191c1d] placeholder:text-slate-400 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#008B8B]/35"
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
            <Plus className="mr-2 size-4" aria-hidden />
            Add service
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border-2 border-[#c1c6d7] bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="text-base font-bold text-[#191c1d]">
            Your services ({items.length})
          </h2>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-600 sm:px-6">
            No services yet. Use the form above to add the first one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-5">
                    Title
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-5">
                    Price
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-5">
                    Description
                  </th>
                  <th className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:table-cell sm:px-5">
                    Added
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((row) => (
                  <tr key={row.id} className="bg-white hover:bg-slate-50/80">
                    <td className="max-w-[12rem] px-4 py-3 font-semibold text-[#191c1d] sm:px-5">
                      {row.title}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex rounded-md bg-[#008B8B]/12 px-2 py-0.5 text-xs font-bold text-[#006d6d]">
                        {row.priceLabel}
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-3 text-slate-600 sm:px-5">
                      <span className="line-clamp-2">{row.description}</span>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-slate-500 md:table-cell sm:px-5">
                      {formatAdded(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right sm:px-5">
                      <button
                        type="button"
                        onClick={() => remove(row.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700",
                          "transition hover:bg-red-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-red-200"
                        )}
                        aria-label={`Remove ${row.title}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
