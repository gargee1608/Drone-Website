"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  deletePilotById,
  getPilots,
  patchPilotProfile,
  registerPilot,
} from "@/app/services/pilotServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  flightHoursFromPilotRow,
  missionsCompletedFromPilotRow,
} from "@/lib/pilot-db-metrics";
import { normalizePilotDutyStatus } from "@/lib/pilot-duty-status";
import {
  ADMIN_PAGE_TITLE_CLASS,
  ADMIN_PAGE_TOP_PADDING_CLASS,
} from "@/lib/page-heading";
import { notifyAdminFleetUpdated } from "@/lib/admin-fleet-updated";
import { cn } from "@/lib/utils";

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

const ADD_PILOT_MODAL_LABEL_CLASS = "text-xs font-medium text-foreground";
const ADD_PILOT_MODAL_FIELD_CLASS =
  "h-8 rounded-lg border-border bg-background text-xs text-foreground";
const ADD_PILOT_MODAL_SELECT_CLASS =
  "h-8 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground";
const ADD_PILOT_MODAL_BTN_CLASS =
  "h-8 rounded-lg px-3 text-xs font-medium";

function InlinePilotField({ label, value }: { label: string; value: string }) {
  return (
    <p className="min-w-0 text-xs leading-snug text-muted-foreground">
      <span className="font-semibold text-foreground">{label}</span>
      {" : "}
      <span className="text-foreground">{value}</span>
    </p>
  );
}

type AdminPilotDetailCardProps = {
  id: string;
  name: string;
  email: string;
  phone: string;
  license: string;
  city: string;
  statusLabel: string;
  certLevel: string;
  flightHours: number;
  missions: number;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function AdminPilotDetailCard({
  id,
  name,
  email,
  phone,
  license,
  city,
  statusLabel,
  certLevel,
  flightHours,
  missions,
  deleting,
  onEdit,
  onDelete,
}: AdminPilotDetailCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Pilot details
          </p>
          <h2 className="mt-1 truncate text-sm font-semibold text-foreground">{name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Pilot ID</span>
            {" : "}
            {id}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="h-8 rounded-lg border border-[#008080] px-3 text-xs font-medium text-foreground transition hover:bg-[#008080]/10"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="h-8 rounded-lg border border-red-300 bg-transparent px-3 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      <div className="space-y-4 px-4 py-3 sm:px-5 sm:py-4">
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <InlinePilotField label="Email" value={email} />
          <InlinePilotField label="Phone" value={phone} />
          <InlinePilotField
            label="Flight hours"
            value={`${flightHours.toLocaleString("en-IN")} h`}
          />
          <InlinePilotField label="License" value={license} />
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <InlinePilotField
            label="Missions completed"
            value={missions.toLocaleString("en-IN")}
          />
          <InlinePilotField label="Certification level" value={certLevel} />
          <InlinePilotField label="Status" value={statusLabel} />
          <InlinePilotField label="City" value={city} />
        </div>
      </div>
    </section>
  );
}

export function AdminPilotDetailsView() {
  const [rows, setRows] = useState<PilotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showAddPilotModal, setShowAddPilotModal] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);

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

  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addFlightHours, setAddFlightHours] = useState("0");
  const [addMissions, setAddMissions] = useState("0");
  const [addCertLevel, setAddCertLevel] = useState("3");
  const [addDutyStatus, setAddDutyStatus] = useState<"ACTIVE" | "INACTIVE">(
    "ACTIVE"
  );

  function resetAddPilotForm() {
    setAddName("");
    setAddEmail("");
    setAddPhone("");
    setAddPassword("");
    setAddFlightHours("0");
    setAddMissions("0");
    setAddCertLevel("3");
    setAddDutyStatus("ACTIVE");
  }

  function openAddPilotModal() {
    setActionError(null);
    resetAddPilotForm();
    setShowAddPilotModal(true);
  }

  function closeAddPilotModal() {
    setShowAddPilotModal(false);
    resetAddPilotForm();
  }

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

  async function handleAddSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionError(null);
    const name = addName.trim();
    const password = addPassword.trim();
    if (!name) {
      setActionError("Name is required.");
      return;
    }
    if (password.length < 6) {
      setActionError("Password must be at least 6 characters.");
      return;
    }
    const flightHours = Number.parseInt(addFlightHours, 10);
    const missions = Number.parseInt(addMissions, 10);
    const certLevel = Number.parseInt(addCertLevel, 10);
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

    setSavingAdd(true);
    try {
      const registerResult = await registerPilot({
        name,
        email: addEmail.trim(),
        phone: addPhone.trim(),
        experience: flightHours,
        license_number: "",
        password,
      });

      if (
        !registerResult ||
        (typeof registerResult === "object" && "error" in registerResult)
      ) {
        setActionError(
          "Could not create pilot. Check email is unique and try again."
        );
        return;
      }

      const created =
        registerResult &&
        typeof registerResult === "object" &&
        "data" in registerResult &&
        registerResult.data &&
        typeof registerResult.data === "object"
          ? (registerResult.data as PilotRow)
          : (registerResult as PilotRow);
      const newId = pickStr(created, ["id"]);
      if (!newId) {
        setActionError("Pilot was created but the response had no id.");
        return;
      }

      const patchResult = await patchPilotProfile(newId, {
        name,
        email: addEmail.trim(),
        phone: addPhone.trim(),
        licenseNumber: "",
        city: "",
        state: "",
        dutyStatus: addDutyStatus,
        certLevel,
        experienceRank: "",
        flightHours,
        missions,
      });
      if (
        !patchResult ||
        (typeof patchResult === "object" && "error" in patchResult)
      ) {
        setActionError("Pilot was created but extra details could not be saved.");
        await loadPilots();
        notifyAdminFleetUpdated();
        closeAddPilotModal();
        return;
      }

      closeAddPilotModal();
      await loadPilots();
      notifyAdminFleetUpdated();
    } finally {
      setSavingAdd(false);
    }
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
      <div
        className={cn(
          "mx-auto max-w-7xl px-0 pb-8 lg:px-2",
          ADMIN_PAGE_TOP_PADDING_CLASS
        )}
      >
        <h1 className={ADMIN_PAGE_TITLE_CLASS}>Add Pilot Details</h1>
        {actionError ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <div className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-foreground shadow-sm">
            Total pilots:{" "}
            <span className="font-semibold tabular-nums">{sortedRows.length}</span>
          </div>
          <button
            type="button"
            onClick={openAddPilotModal}
            className="h-8 rounded-lg border border-[#008080] bg-transparent px-3 text-xs font-medium text-foreground transition hover:bg-[#008080]/10"
          >
            Add New Pilot Details
          </button>
        </div>

        {loading ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-sm text-muted-foreground shadow-sm">
            Loading pilot details...
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
            {error}
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-sm text-muted-foreground shadow-sm">
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
              const city = pickStr(row, ["city"]) || "—";
              const status = normalizePilotDutyStatus(
                row.duty_status ?? row.dutyStatus ?? row.status
              );
              const statusLabel = status === "ACTIVE" ? "Active" : "Inactive";
              const certLevel = pickStr(row, ["cert_level", "certLevel"]) || "—";
              const flightHours = flightHoursFromPilotRow(row);
              const missions = missionsCompletedFromPilotRow(row);

              return (
                <AdminPilotDetailCard
                  key={`${id}-${name}`}
                  id={id}
                  name={name}
                  email={email}
                  phone={phone}
                  license={license}
                  city={city}
                  statusLabel={statusLabel}
                  certLevel={certLevel}
                  flightHours={flightHours}
                  missions={missions}
                  deleting={deletingId === id}
                  onEdit={() => openEdit(row)}
                  onDelete={() => void handleDelete(row)}
                />
              );
            })}
          </div>
        )}
      </div>

      {showAddPilotModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Close add pilot dialog"
            onClick={closeAddPilotModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-pilot-title"
            className="relative z-10 flex max-h-[min(85dvh,560px)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-white text-card-foreground shadow-xl dark:bg-black"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5">
              <h2 id="add-pilot-title" className="text-sm font-semibold text-foreground">
                Add New Pilot Details
              </h2>
              <button
                type="button"
                onClick={closeAddPilotModal}
                className="rounded-lg p-1.5 text-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              noValidate
              onSubmit={(e) => void handleAddSave(e)}
              className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="add-pilot-name" className={ADD_PILOT_MODAL_LABEL_CLASS}>
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="add-pilot-name"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className={ADD_PILOT_MODAL_FIELD_CLASS}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="add-pilot-email" className={ADD_PILOT_MODAL_LABEL_CLASS}>
                      Email
                    </label>
                    <Input
                      id="add-pilot-email"
                      type="email"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      className={ADD_PILOT_MODAL_FIELD_CLASS}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="add-pilot-phone" className={ADD_PILOT_MODAL_LABEL_CLASS}>
                      Phone
                    </label>
                    <Input
                      id="add-pilot-phone"
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      className={ADD_PILOT_MODAL_FIELD_CLASS}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="add-pilot-password" className={ADD_PILOT_MODAL_LABEL_CLASS}>
                    Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="add-pilot-password"
                    type="password"
                    required
                    minLength={6}
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className={ADD_PILOT_MODAL_FIELD_CLASS}
                    autoComplete="new-password"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="add-pilot-flight-hours"
                      className={ADD_PILOT_MODAL_LABEL_CLASS}
                    >
                      Flight hours
                    </label>
                    <Input
                      id="add-pilot-flight-hours"
                      type="number"
                      min={0}
                      max={50000}
                      value={addFlightHours}
                      onChange={(e) => setAddFlightHours(e.target.value)}
                      className={ADD_PILOT_MODAL_FIELD_CLASS}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="add-pilot-missions" className={ADD_PILOT_MODAL_LABEL_CLASS}>
                      Mission Completed
                    </label>
                    <Input
                      id="add-pilot-missions"
                      type="number"
                      min={0}
                      max={10000}
                      value={addMissions}
                      onChange={(e) => setAddMissions(e.target.value)}
                      className={ADD_PILOT_MODAL_FIELD_CLASS}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="add-pilot-cert-level" className={ADD_PILOT_MODAL_LABEL_CLASS}>
                      Certification level
                    </label>
                    <Input
                      id="add-pilot-cert-level"
                      type="number"
                      min={1}
                      max={10}
                      value={addCertLevel}
                      onChange={(e) => setAddCertLevel(e.target.value)}
                      className={ADD_PILOT_MODAL_FIELD_CLASS}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="add-pilot-duty" className={ADD_PILOT_MODAL_LABEL_CLASS}>
                    Duty status
                  </label>
                  <select
                    id="add-pilot-duty"
                    value={addDutyStatus}
                    onChange={(e) =>
                      setAddDutyStatus(
                        e.target.value === "INACTIVE" ? "INACTIVE" : "ACTIVE"
                      )
                    }
                    className={ADD_PILOT_MODAL_SELECT_CLASS}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                <Button
                  type="submit"
                  variant="outline"
                  className={`${ADD_PILOT_MODAL_BTN_CLASS} border-[#008080] bg-transparent text-foreground hover:bg-[#008080]/10`}
                  disabled={savingAdd}
                >
                  {savingAdd ? "Saving…" : "Save Pilot Details"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeAddPilotModal}
                  className={ADD_PILOT_MODAL_BTN_CLASS}
                  disabled={savingAdd}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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
            className="relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-white text-card-foreground shadow-xl dark:bg-black"
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
