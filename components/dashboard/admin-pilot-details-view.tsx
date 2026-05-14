"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  deletePilotById,
  getPilots,
  patchPilotProfile,
} from "@/app/services/pilotServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  flightHoursFromPilotRow,
  missionsCompletedFromPilotRow,
} from "@/lib/pilot-db-metrics";
import { normalizePilotDutyStatus } from "@/lib/pilot-duty-status";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { notifyAdminFleetUpdated } from "@/lib/admin-fleet-updated";

type PilotRow = Record<string, unknown>;

function pickStr(row: PilotRow, keys: readonly string[]): string {
  for (const k of keys) {
    const value = row[k];
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function parseDroneDetailsArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (x): x is Record<string, unknown> =>
        x != null && typeof x === "object" && !Array.isArray(x)
    );
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (x): x is Record<string, unknown> =>
            x != null && typeof x === "object" && !Array.isArray(x)
        );
      }
    } catch {
      return [];
    }
  }
  return [];
}

function formatUseCases(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v ?? "").trim())
      .filter(Boolean)
      .join(", ");
  }
  return String(value ?? "").trim();
}

function droneField(drone: Record<string, unknown>, keys: readonly string[]) {
  return pickStr(drone, keys) || "—";
}

export function AdminPilotDetailsView() {
  const [rows, setRows] = useState<PilotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLicense, setEditLicense] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editDutyStatus, setEditDutyStatus] = useState<"ACTIVE" | "INACTIVE">(
    "ACTIVE"
  );
  const [editCertLevel, setEditCertLevel] = useState("3");
  const [editExperienceRank, setEditExperienceRank] = useState("");
  const [editFlightHours, setEditFlightHours] = useState("0");
  const [editMissions, setEditMissions] = useState("0");

  async function loadPilots() {
    setLoading(true);
    setError(null);
    const data = await getPilots();
    if (!Array.isArray(data)) {
      setRows([]);
      setError("Could not load pilots right now.");
      setLoading(false);
      return;
    }
    const normalized = data.filter(
      (item): item is PilotRow =>
        item != null && typeof item === "object" && !Array.isArray(item)
    );
    setRows(normalized);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (cancelled) return;
      await loadPilots();
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function openEdit(row: PilotRow) {
    const id = pickStr(row, ["id"]);
    if (!id) return;
    setActionError(null);
    setEditingId(id);
    setEditName(pickStr(row, ["name", "full_name", "fullName"]));
    setEditEmail(pickStr(row, ["email"]));
    setEditPhone(pickStr(row, ["phone"]));
    setEditLicense(pickStr(row, ["license_number", "licenseNumber"]));
    setEditCity(pickStr(row, ["city"]));
    setEditState(pickStr(row, ["state"]));
    setEditDutyStatus(
      normalizePilotDutyStatus(row.duty_status ?? row.dutyStatus ?? row.status)
    );
    setEditCertLevel(pickStr(row, ["cert_level", "certLevel"]) || "3");
    setEditExperienceRank(pickStr(row, ["experience_rank", "experienceRank"]));
    setEditFlightHours(String(flightHoursFromPilotRow(row)));
    setEditMissions(String(missionsCompletedFromPilotRow(row)));
  }

  async function handleEditSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId) return;
    setActionError(null);
    const name = editName.trim();
    if (!name) {
      setActionError("Name is required.");
      return;
    }
    const flightHours = Number.parseInt(editFlightHours, 10);
    const missions = Number.parseInt(editMissions, 10);
    const certLevel = Number.parseInt(editCertLevel, 10);
    if (!Number.isFinite(flightHours) || flightHours < 0 || flightHours > 50000) {
      setActionError("Flight hours must be between 0 and 50000.");
      return;
    }
    if (!Number.isFinite(missions) || missions < 0 || missions > 10000) {
      setActionError("Mission completed must be between 0 and 10000.");
      return;
    }
    if (!Number.isFinite(certLevel) || certLevel < 1 || certLevel > 10) {
      setActionError("Certification level must be between 1 and 10.");
      return;
    }

    setSavingEdit(true);
    const result = await patchPilotProfile(editingId, {
      name,
      email: editEmail.trim(),
      phone: editPhone.trim(),
      licenseNumber: editLicense.trim(),
      city: editCity.trim(),
      state: editState.trim(),
      dutyStatus: editDutyStatus,
      certLevel,
      experienceRank: editExperienceRank.trim(),
      flightHours,
      missions,
    });
    setSavingEdit(false);
    if (!result || (typeof result === "object" && "error" in result)) {
      setActionError("Could not save pilot details.");
      return;
    }
    setEditingId(null);
    await loadPilots();
    notifyAdminFleetUpdated();
  }

  async function handleDelete(row: PilotRow) {
    const id = pickStr(row, ["id"]);
    const name = pickStr(row, ["name", "full_name", "fullName"]) || "this pilot";
    if (!id) return;
    if (!window.confirm(`Delete ${name}? This action cannot be undone.`)) return;
    setActionError(null);
    setDeletingId(id);
    const result = await deletePilotById(id);
    setDeletingId(null);
    if (!result || (typeof result === "object" && "error" in result)) {
      setActionError("Could not delete pilot.");
      return;
    }
    setRows((prev) => prev.filter((r) => pickStr(r, ["id"]) !== id));
    notifyAdminFleetUpdated();
  }

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) =>
      pickStr(a, ["name", "full_name", "fullName"]).localeCompare(
        pickStr(b, ["name", "full_name", "fullName"])
      )
    );
  }, [rows]);

  return (
    <div className="relative text-foreground">
      <div className="mx-auto max-w-7xl px-0 pb-8 pt-0 lg:px-2">
        <h1 className={ADMIN_PAGE_TITLE_CLASS}>Add Pilot Details</h1>
        {actionError ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground sm:px-5">
          Total pilots:{" "}
          <span className="font-semibold tabular-nums">{sortedRows.length}</span>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
            Loading pilot details...
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
            {error}
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
            No pilot records found.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {sortedRows.map((row) => {
              const id = pickStr(row, ["id"]) || "—";
              const name = pickStr(row, ["name", "full_name", "fullName"]) || "—";
              const email = pickStr(row, ["email"]) || "—";
              const phone = pickStr(row, ["phone"]) || "—";
              const license = pickStr(row, ["license_number", "licenseNumber"]) || "—";
              const status = normalizePilotDutyStatus(
                row.duty_status ?? row.dutyStatus ?? row.status
              );
              const statusLabel = status === "ACTIVE" ? "Active" : "Inactive";
              const certLevel = pickStr(row, ["cert_level", "certLevel"]) || "—";
              const experienceRank =
                pickStr(row, ["experience_rank", "experienceRank"]) || "—";
              const dgca = pickStr(row, ["dgca", "license_number"]) || "—";
              const city = pickStr(row, ["city"]) || "—";
              const state = pickStr(row, ["state"]) || "—";
              const drones = parseDroneDetailsArray(row.drone_details);
              const legacyUseCases =
                formatUseCases(row.use_cases ?? row.useCases) || "—";
              const flightHours = flightHoursFromPilotRow(row);
              const missions = missionsCompletedFromPilotRow(row);
              const isDeleting = deletingId === id;

              return (
                <section
                  key={`${id}-${name}`}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <h2 className="text-sm font-semibold text-foreground">Pilot details</h2>
                    <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openEdit(row)}
                      className="h-8 w-24 rounded-lg border-[#008080] text-xs text-foreground hover:bg-[#008080]/10"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleDelete(row)}
                      disabled={isDeleting}
                      className="h-8 w-24 rounded-lg border-red-300 bg-transparent text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                    </div>
                  </div>

                  <div className="px-4 py-4">
                      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                        <div className="sm:col-span-2 lg:col-span-3">
                          <dt className="text-xs font-semibold tracking-wide text-muted-foreground">Name</dt>
                          <dd className="mt-1 font-medium text-sm">{name}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold tracking-wide text-muted-foreground">Email</dt>
                          <dd className="mt-1 break-all">{email}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold tracking-wide text-muted-foreground">Phone</dt>
                          <dd className="mt-1">{phone}</dd>
                        </div>
                                                <div>
                          <dt className="text-xs font-semibold tracking-wide text-muted-foreground">Flight hours</dt>
                          <dd className="mt-1 tabular-nums">{flightHours.toLocaleString("en-IN")} h</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold tracking-wide text-muted-foreground">Missions completed</dt>
                          <dd className="mt-1 tabular-nums">{missions.toLocaleString("en-IN")}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold tracking-wide text-muted-foreground">Certification level</dt>
                          <dd className="mt-1">{certLevel}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold tracking-wide text-muted-foreground">Status</dt>
                          <dd className="mt-1">{statusLabel}</dd>
                        </div>
                      </dl>
                    </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {editingId ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close edit dialog"
            onClick={() => setEditingId(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-pilot-title"
            className="relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-5">
              <h2 id="edit-pilot-title" className="text-base text-foreground sm:text-lg">
                Edit pilot details
              </h2>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-lg p-2 text-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              noValidate
              onSubmit={(e) => void handleEditSave(e)}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5"
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="edit-pilot-name" className="text-sm text-foreground">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="edit-pilot-name"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-10 rounded-lg border-border bg-background text-foreground"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-pilot-email" className="text-sm text-foreground">
                      Email
                    </label>
                    <Input
                      id="edit-pilot-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="h-10 rounded-lg border-border bg-background text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-pilot-phone" className="text-sm text-foreground">
                      Phone
                    </label>
                    <Input
                      id="edit-pilot-phone"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="h-10 rounded-lg border-border bg-background text-foreground"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-pilot-flight-hours"
                      className="text-sm text-foreground"
                    >
                      Flight hours
                    </label>
                    <Input
                      id="edit-pilot-flight-hours"
                      type="number"
                      min={0}
                      max={50000}
                      value={editFlightHours}
                      onChange={(e) => setEditFlightHours(e.target.value)}
                      className="h-10 rounded-lg border-border bg-background text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-pilot-missions" className="text-sm text-foreground">
                      Mission Completed
                    </label>
                    <Input
                      id="edit-pilot-missions"
                      type="number"
                      min={0}
                      max={10000}
                      value={editMissions}
                      onChange={(e) => setEditMissions(e.target.value)}
                      className="h-10 rounded-lg border-border bg-background text-foreground"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-pilot-cert-level" className="text-sm text-foreground">
                      Certification level
                    </label>
                    <Input
                      id="edit-pilot-cert-level"
                      type="number"
                      min={1}
                      max={10}
                      value={editCertLevel}
                      onChange={(e) => setEditCertLevel(e.target.value)}
                      className="h-10 rounded-lg border-border bg-background text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-pilot-duty" className="text-sm text-foreground">
                    Duty status
                  </label>
                  <select
                    id="edit-pilot-duty"
                    value={editDutyStatus}
                    onChange={(e) =>
                      setEditDutyStatus(
                        e.target.value === "INACTIVE" ? "INACTIVE" : "ACTIVE"
                      )
                    }
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="submit"
                  variant="outline"
                  className="rounded-lg border-[#008080] bg-transparent text-foreground hover:bg-[#008080]/10"
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving Changes..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg"
                  disabled={savingEdit}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
