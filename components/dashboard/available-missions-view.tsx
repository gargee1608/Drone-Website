"use client";

import { Pencil, Plus, Radar, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/lib/api-url";
import {
  fetchMissionRequestsList,
  type MissionRequestRow,
} from "@/lib/mission-requests-api";
import { notifyMissionRequestsUpdated } from "@/lib/mission-requests-updated";
import { ADMIN_PAGE_TITLE_CLASS } from "@/lib/page-heading";
import { readResponseJson } from "@/lib/read-response-json";
import { cn } from "@/lib/utils";

type AvailableMissionRow = MissionRequestRow;

const EMPTY_FORM: AvailableMissionRow = {
  id: "",
  title: "",
  payout: "",
  description: "",
  payload: "",
  distance: "",
  posted: "",
  duration: "",
  aircraftClass: "",
  clearance: "",
  requirements: "",
};

function apiErrorMessage(
  body: Awaited<ReturnType<typeof readResponseJson>>,
  fallback: string
): string {
  if (
    body.okParse &&
    body.data &&
    typeof body.data === "object" &&
    "error" in body.data &&
    typeof (body.data as { error?: unknown }).error === "string"
  ) {
    return (body.data as { error: string }).error;
  }
  return fallback;
}

function MissionFormFields({
  idPrefix,
  form,
  onChange,
}: {
  idPrefix: string;
  form: AvailableMissionRow;
  onChange: <K extends keyof AvailableMissionRow>(
    key: K,
    value: AvailableMissionRow[K]
  ) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label
          htmlFor={`${idPrefix}-mission-code`}
          className="mb-1.5 block text-xs font-semibold text-foreground"
        >
          Mission code
        </label>
        <Input
          id={`${idPrefix}-mission-code`}
          value={form.id}
          onChange={(e) => onChange("id", e.target.value)}
          className="h-11 rounded-lg border-border font-mono"
          required
        />
      </div>
      <div>
        <label
          htmlFor={`${idPrefix}-mission-payout`}
          className="mb-1.5 block text-xs font-semibold text-foreground"
        >
          Payout
        </label>
        <Input
          id={`${idPrefix}-mission-payout`}
          value={form.payout}
          onChange={(e) => onChange("payout", e.target.value)}
          className="h-11 rounded-lg border-border"
          required
        />
      </div>
      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-mission-title`}
          className="mb-1.5 block text-xs font-semibold text-foreground"
        >
          Title
        </label>
        <Input
          id={`${idPrefix}-mission-title`}
          value={form.title}
          onChange={(e) => onChange("title", e.target.value)}
          className="h-11 rounded-lg border-border"
          required
        />
      </div>
      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-mission-description`}
          className="mb-1.5 block text-xs font-semibold text-foreground"
        >
          Description
        </label>
        <textarea
          id={`${idPrefix}-mission-description`}
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor={`${idPrefix}-mission-payload`}
          className="mb-1.5 block text-xs font-semibold text-foreground"
        >
          Payload
        </label>
        <Input
          id={`${idPrefix}-mission-payload`}
          value={form.payload}
          onChange={(e) => onChange("payload", e.target.value)}
          className="h-11 rounded-lg border-border"
        />
      </div>
      <div>
        <label
          htmlFor={`${idPrefix}-mission-distance`}
          className="mb-1.5 block text-xs font-semibold text-foreground"
        >
          Distance
        </label>
        <Input
          id={`${idPrefix}-mission-distance`}
          value={form.distance}
          onChange={(e) => onChange("distance", e.target.value)}
          className="h-11 rounded-lg border-border"
        />
      </div>
      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-mission-posted`}
          className="mb-1.5 block text-xs font-semibold text-foreground"
        >
          Posted
        </label>
        <Input
          id={`${idPrefix}-mission-posted`}
          value={form.posted}
          onChange={(e) => onChange("posted", e.target.value)}
          className="h-11 rounded-lg border-border"
        />
      </div>
      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-mission-duration`}
          className="mb-1.5 block text-xs font-semibold text-foreground"
        >
          Duration
        </label>
        <Input
          id={`${idPrefix}-mission-duration`}
          value={form.duration}
          onChange={(e) => onChange("duration", e.target.value)}
          className="h-11 rounded-lg border-border"
        />
      </div>
      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-mission-aircraft`}
          className="mb-1.5 block text-xs font-semibold text-foreground"
        >
          Aircraft class
        </label>
        <Input
          id={`${idPrefix}-mission-aircraft`}
          value={form.aircraftClass}
          onChange={(e) => onChange("aircraftClass", e.target.value)}
          className="h-11 rounded-lg border-border"
        />
      </div>
      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-mission-clearance`}
          className="mb-1.5 block text-xs font-semibold text-foreground"
        >
          Clearance
        </label>
        <Input
          id={`${idPrefix}-mission-clearance`}
          value={form.clearance}
          onChange={(e) => onChange("clearance", e.target.value)}
          className="h-11 rounded-lg border-border"
        />
      </div>
      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-mission-requirements`}
          className="mb-1.5 block text-xs font-semibold text-foreground"
        >
          Requirements
        </label>
        <textarea
          id={`${idPrefix}-mission-requirements`}
          value={form.requirements}
          onChange={(e) => onChange("requirements", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}

export function AvailableMissionsView() {
  const [rows, setRows] = useState<AvailableMissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formMode, setFormMode] = useState<"closed" | "edit">("closed");
  const [editOriginalId, setEditOriginalId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AvailableMissionRow>(EMPTY_FORM);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState<AvailableMissionRow>(EMPTY_FORM);
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);

  const loadMissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchMissionRequestsList();
    if (result.ok) {
      setRows(result.data);
    } else {
      setError(result.error ?? "Could not load available missions.");
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadMissions();
  }, [loadMissions, refreshKey]);

  const closeEditor = () => {
    setFormMode("closed");
    setEditOriginalId(null);
    setEditForm(EMPTY_FORM);
    setEditFormError(null);
  };

  const openEdit = (mission: AvailableMissionRow) => {
    setFormMode("edit");
    setEditOriginalId(mission.id);
    setEditForm({ ...mission });
    setEditFormError(null);
  };

  const openAddDialog = () => {
    setAddForm({ ...EMPTY_FORM });
    setAddFormError(null);
    setAddDialogOpen(true);
  };

  const closeAddDialog = () => {
    setAddDialogOpen(false);
    setAddForm(EMPTY_FORM);
    setAddFormError(null);
  };

  const updateEditField = <K extends keyof AvailableMissionRow>(
    key: K,
    value: AvailableMissionRow[K]
  ) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateAddField = <K extends keyof AvailableMissionRow>(
    key: K,
    value: AvailableMissionRow[K]
  ) => {
    setAddForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editOriginalId) return;
    if (!editForm.id.trim() || !editForm.title.trim() || !editForm.payout.trim()) {
      setEditFormError("Mission code, title, and payout are required.");
      return;
    }

    setEditSaving(true);
    setEditFormError(null);
    try {
      const res = await fetch(
        apiUrl(
          `/api/missions-requests/${encodeURIComponent(editOriginalId)}`
        ),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );
      const body = await readResponseJson(res);
      if (!res.ok) {
        setEditFormError(apiErrorMessage(body, "Could not update mission."));
        return;
      }
      closeEditor();
      setRefreshKey((n) => n + 1);
      notifyMissionRequestsUpdated();
    } catch {
      setEditFormError("Network error while updating mission.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreateMission = async (e: FormEvent) => {
    e.preventDefault();
    if (!addForm.id.trim() || !addForm.title.trim() || !addForm.payout.trim()) {
      setAddFormError("Mission code, title, and payout are required.");
      return;
    }

    setAddSaving(true);
    setAddFormError(null);
    try {
      const res = await fetch(apiUrl("/api/missions-requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const body = await readResponseJson(res);
      if (!res.ok) {
        setAddFormError(apiErrorMessage(body, "Could not create mission."));
        return;
      }
      closeAddDialog();
      setRefreshKey((n) => n + 1);
      notifyMissionRequestsUpdated();
    } catch {
      setAddFormError("Network error while creating mission.");
    } finally {
      setAddSaving(false);
    }
  };

  const deleteMission = async (mission: AvailableMissionRow) => {
    const ok = globalThis.confirm?.(
      `Delete mission "${mission.title}" (${mission.id})? This cannot be undone.`
    );
    if (!ok) return;

    try {
      const res = await fetch(
        apiUrl(`/api/missions-requests/${encodeURIComponent(mission.id)}`),
        { method: "DELETE" }
      );
      if (!res.ok) {
        const body = await readResponseJson(res);
        globalThis.alert?.(apiErrorMessage(body, "Could not delete mission."));
        return;
      }
      if (editOriginalId === mission.id) closeEditor();
      setRows((prev) => prev.filter((row) => row.id !== mission.id));
      setRefreshKey((n) => n + 1);
      notifyMissionRequestsUpdated();
    } catch {
      globalThis.alert?.("Network error while deleting mission.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl pb-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className={ADMIN_PAGE_TITLE_CLASS}>Available Mission</h1>
        <Button
          type="button"
          variant="outline"
          onClick={openAddDialog}
          className="shrink-0 rounded-full border-[#008B8B] bg-transparent font-bold text-[#008B8B] hover:bg-[#008B8B]/10 hover:text-[#007a7a]"
        >
          <Plus className="mr-2 size-4" aria-hidden />
          Add New Mission
        </Button>
      </div>

      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) {
            setAddForm(EMPTY_FORM);
            setAddFormError(null);
          }
        }}
      >
        <DialogContent className="max-h-[min(90dvh,720px)] max-w-2xl overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add new mission</DialogTitle>
            <DialogDescription>
              Create a mission for the matching hub catalog. Mission code must be
              unique.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMission} className="space-y-4">
            <MissionFormFields
              idPrefix="add"
              form={addForm}
              onChange={updateAddField}
            />
            {addFormError ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {addFormError}
              </p>
            ) : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={closeAddDialog}
                disabled={addSaving}
                className="rounded-full font-normal"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addSaving}
                className="rounded-full bg-[#008B8B] font-bold text-white hover:bg-[#007a7a]"
              >
                {addSaving ? "Saving…" : "Add mission"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {formMode === "edit" ? (
        <section className="mb-10 rounded-2xl border-2 border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">Edit mission</h2>
            <button
              type="button"
              onClick={closeEditor}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Close editor"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <MissionFormFields
              idPrefix="edit"
              form={editForm}
              onChange={updateEditField}
            />
            {editFormError ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {editFormError}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="submit"
                disabled={editSaving}
                variant="outline"
                className="rounded-full border-[#008B8B] bg-transparent font-bold text-[#008B8B] hover:bg-[#008B8B]/10 hover:text-[#007a7a]"
              >
                {editSaving ? "Saving…" : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeEditor}
                disabled={editSaving}
                className="rounded-full font-normal"
              >
                Cancel
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading missions…</p>
      ) : error ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-foreground">{error}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Ensure the backend is running and PostgreSQL is available.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-14 text-center">
          <Radar
            className="mx-auto mb-3 size-10 text-[#c1c6d7]"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="mb-4 text-sm font-semibold text-foreground">
            No Available Mission
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={openAddDialog}
            className="rounded-full border-[#008B8B] bg-transparent font-bold text-[#008B8B] hover:bg-[#008B8B]/10 hover:text-[#007a7a]"
          >
            <Plus className="mr-2 size-4" aria-hidden />
            Add New Mission
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((mission) => (
            <article
              key={mission.id}
              className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#008B8B]">
                    {mission.id}
                  </p>
                  <h2 className="mt-0.5 text-base font-semibold leading-snug">
                    {mission.title}
                  </h2>
                </div>
                <span className="shrink-0 rounded-full bg-[#008B8B] px-2 py-0.5 text-xs font-semibold text-white">
                  {mission.payout}
                </span>
              </div>
              <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
                {mission.description}
              </p>
              <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Payload
                  </dt>
                  <dd className="mt-0.5 font-medium">{mission.payload || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Distance
                  </dt>
                  <dd className="mt-0.5 font-medium">{mission.distance || "—"}</dd>
                </div>
              </dl>
              {mission.posted ? (
                <p className="mt-3 text-xs text-muted-foreground">{mission.posted}</p>
              ) : null}

              <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(mission)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#008B8B] bg-transparent px-3 py-2 text-xs font-semibold text-[#008B8B] transition hover:border-[#006f73] hover:text-[#006f73] min-[360px]:flex-none"
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void deleteMission(mission)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-600 bg-transparent px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-700 hover:text-red-800 min-[360px]:flex-none"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
