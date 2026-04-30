"use client";

import Image from "next/image";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/lib/api-url";
import { readResponseJson } from "@/lib/read-response-json";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { cn } from "@/lib/utils";

type AdminService = {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  createdAt?: string;
};

export function AdminServicesView() {
  const [items, setItems] = useState<AdminService[]>([]);

  const [formMode, setFormMode] = useState<"closed" | "add" | "edit">("closed");
  const [editId, setEditId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");

  const [formError, setFormError] = useState<string | null>(null);

  // ================= FETCH SERVICES =================
  const fetchServices = async () => {
    try {
      const res = await fetch(apiUrl("/api/services"));
      const body = await readResponseJson(res);
      if (!body.okParse || !res.ok || !Array.isArray(body.data)) {
        setItems([]);
        return;
      }
      setItems(body.data as AdminService[]);
    } catch (err) {
      console.log(err);
      setItems([]);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // ================= RESET =================
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setImage("");
    setEditId(null);
    setFormMode("closed");
  };

  // ================= ADD =================
  const addService = async () => {
    if (!title.trim() || !price.trim()) {
      setFormError("Title and Price are required");
      return;
    }

    setFormError(null);
    try {
      const res = await fetch(apiUrl("/api/services"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          image,
        }),
      });
      const body = await readResponseJson(res);
      if (!res.ok) {
        const msg =
          body.okParse &&
          body.data &&
          typeof body.data === "object" &&
          "error" in body.data &&
          typeof (body.data as { error?: unknown }).error === "string"
            ? (body.data as { error: string }).error
            : "Could not save service";
        setFormError(msg);
        return;
      }
    } catch {
      setFormError("Network error while saving service");
      return;
    }

    resetForm();
    fetchServices();
  };

  // ================= EDIT OPEN =================
  const openEdit = (item: AdminService) => {
    setFormMode("edit");
    setEditId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setPrice(String(item.price));
    setImage(item.image);
  };

  // ================= UPDATE =================
  const updateService = async () => {
    if (!editId) return;

    await fetch(apiUrl(`/api/services/${editId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        price: Number(price),
        image,
      }),
    });

    resetForm();
    fetchServices();
  };

  // ================= DELETE =================
  const deleteService = async (id: number) => {
    await fetch(apiUrl(`/api/services/${id}`), {
      method: "DELETE",
    });

    fetchServices();
  };

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.id - a.id),
    [items]
  );

  return (
    <div className="min-w-0 text-foreground">

      {/* HEADER */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className={ADMIN_PAGE_TITLE_CLASS}>Services</h1>

        <Button
          onClick={() => setFormMode("add")}
          className="bg-[#008B8B] text-white"
        >
          <Plus className="mr-2 size-4" />
          Add New Service
        </Button>
      </div>

      {/* FORM */}
      {formMode !== "closed" && (
        <div className="mb-8 rounded-xl border p-5 bg-white">
          <h2 className="mb-4 font-bold">
            {formMode === "add" ? "Add Service" : "Edit Service"}
          </h2>

          <div className="space-y-3">

            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Input
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <Input
              placeholder="Image URL"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />

            {formError && (
              <p className="text-red-600 text-sm">{formError}</p>
            )}

            <div className="flex gap-2">
              {formMode === "add" ? (
                <Button
                  onClick={addService}
                  variant="outline"
                  className="border-[#0D9488] bg-transparent text-[#0D9488] hover:bg-transparent hover:border-[#0f766e] hover:text-[#0f766e]"
                >
                  Save
                </Button>
              ) : (
                <Button onClick={updateService}>Update</Button>
              )}

              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CARDS */}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedItems.map((row) => (
          <li key={row.id}>
            <div className="rounded-xl border bg-white shadow">

              <div className="relative h-40 w-full">
                <Image
                  src={row.image}
                  alt={row.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-4">
                <h3 className="font-bold">{row.title}</h3>
                <p className="text-sm">{row.description}</p>
                <p className="font-semibold mt-1">₹{row.price}</p>

                <div className="mt-3 flex gap-2">

                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="flex items-center gap-1 rounded border border-[#008B8B] bg-transparent px-3 py-1 text-sm font-medium text-[#008B8B] transition-colors hover:bg-[#008B8B]/10"
                  >
                    <Pencil size={14} aria-hidden /> Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteService(row.id)}
                    className="flex items-center gap-1 rounded border border-red-600 bg-transparent px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={14} aria-hidden /> Delete
                  </button>

                </div>
              </div>

            </div>
          </li>
        ))}
      </ul>

    </div>
  );
}