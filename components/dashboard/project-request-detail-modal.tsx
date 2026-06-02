"use client";

import {
  ArrowRight,
  FolderKanban,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
  X,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { DetailField } from "@/components/dashboard/user-request-detail-modal";
import {
  userMissionAdminStatusLabel,
  type UserRequestAdminRow,
} from "@/lib/user-requests";
import { cn } from "@/lib/utils";

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Urgent",
  express: "Express",
  standard: "Standard",
  critical: "Critical",
  normal: "Normal",
  routine: "Routine",
};

function priorityLabel(raw: string): string {
  const key = raw.trim().toLowerCase();
  return PRIORITY_LABEL[key] ?? (raw.trim() || "—");
}

const innerBoxClass =
  "rounded-lg border border-border/80 bg-muted/25 px-2.5 py-2 dark:border-white/10 dark:bg-white/5";

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#008B8B] dark:text-[#5eead4]">
      {children}
    </h3>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof User;
  label: string;
  value: string;
  href?: string;
}) {
  const display = value.trim() || "—";
  return (
    <div className={cn("flex gap-2", innerBoxClass)}>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#008B8B]/10 text-[#008B8B] dark:bg-[#008B8B]/20 dark:text-[#5eead4]">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {href && display !== "—" ? (
          <a
            href={href}
            className="mt-px block truncate text-xs font-medium text-foreground underline-offset-2 hover:text-[#008B8B] hover:underline dark:hover:text-[#5eead4]"
          >
            {display}
          </a>
        ) : (
          <p className="mt-px break-words text-xs font-medium text-foreground">
            {display}
          </p>
        )}
      </div>
    </div>
  );
}

export type ProjectRequestDetailContact = {
  title: string;
  phone: string | null;
  name: string;
  email: string;
};

export function ProjectRequestDetailModal({
  row,
  contact,
  onClose,
}: {
  row: UserRequestAdminRow;
  contact: ProjectRequestDetailContact;
  onClose: () => void;
}) {
  const requestId = row.queueDisplayId ?? row.key;
  const backend = row.backendRequest;
  const urgencyRaw = backend?.missionUrgency ?? "";
  const cargoType = backend?.cargoType?.trim() || "—";
  const payloadWeight = backend?.payloadWeight?.trim();
  const pickup = backend?.pickupLocation?.trim() || "—";
  const drop = backend?.dropLocation?.trim() || "—";
  const adminStatus = backend?.adminStatus;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#191c1d]/50 backdrop-blur-[2px]"
        aria-label="Close project request details"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-request-detail-title"
        className="relative z-10 flex max-h-[min(90dvh,38rem)] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-border bg-white text-foreground shadow-2xl sm:rounded-2xl dark:border-white/20 dark:bg-black dark:text-white"
      >
        <div className="shrink-0 border-b border-border bg-gradient-to-r from-[#008B8B]/8 via-transparent to-transparent px-5 py-4 sm:px-6 dark:border-white/10 dark:from-[#008B8B]/15">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#008B8B] text-white shadow-sm">
                <FolderKanban className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2
                  id="project-request-detail-title"
                  className="text-base font-bold leading-tight sm:text-lg"
                >
                  Project request details
                </h2>
                <p
                  className="mt-1 font-mono text-xs text-muted-foreground"
                  title={requestId}
                >
                  {requestId}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      row.badgeClass
                    )}
                  >
                    {row.badge}
                  </span>
                  {urgencyRaw ? (
                    <span className="inline-flex items-center rounded-full border border-border bg-white px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground dark:border-white/15 dark:bg-white/5">
                      {priorityLabel(urgencyRaw)}
                    </span>
                  ) : null}
                  {adminStatus ? (
                    <span className="inline-flex items-center rounded-full border border-[#008B8B]/25 bg-[#008B8B]/8 px-2.5 py-0.5 text-[10px] font-semibold text-[#0a3030] dark:border-[#5eead4]/30 dark:bg-[#008B8B]/20 dark:text-[#5eead4]">
                      {userMissionAdminStatusLabel(adminStatus)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted dark:text-white/80 dark:hover:bg-white/10"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="rounded-lg border border-[#008B8B]/20 bg-[#008B8B]/5 px-2.5 py-2 dark:border-[#5eead4]/25 dark:bg-[#008B8B]/10">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#006a6e] dark:text-[#5eead4]">
              Requirement
            </p>
            <p className="mt-0.5 text-xs font-semibold leading-snug text-foreground">
              {contact.title || "—"}
            </p>
          </div>

          <section className="mt-4 space-y-2" aria-label="Contact information">
            <SectionHeading>Contact</SectionHeading>
            <div className="grid gap-1.5 sm:grid-cols-2">
              <ContactRow icon={User} label="Name" value={contact.name} />
              <ContactRow
                icon={Mail}
                label="Email"
                value={contact.email}
                href={
                  contact.email.includes("@")
                    ? `mailto:${contact.email}`
                    : undefined
                }
              />
              {contact.phone ? (
                <div className="sm:col-span-2">
                  <ContactRow
                    icon={Phone}
                    label="Phone"
                    value={contact.phone}
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  />
                </div>
              ) : null}
            </div>
          </section>

          {backend ? (
            <>
              <section className="mt-4 space-y-2" aria-label="Route">
                <SectionHeading>Route</SectionHeading>
                <div className="grid gap-1.5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div className={innerBoxClass}>
                    <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                      <MapPin className="size-2.5 shrink-0" aria-hidden />
                      Pickup
                    </p>
                    <p className="mt-0.5 text-xs font-medium leading-snug">
                      {pickup}
                    </p>
                  </div>
                  <div className="hidden items-center justify-center sm:flex">
                    <span className="flex size-6 items-center justify-center rounded-full bg-[#008B8B]/10 text-[#008B8B] dark:bg-[#008B8B]/25 dark:text-[#5eead4]">
                      <ArrowRight className="size-3.5" aria-hidden />
                    </span>
                  </div>
                  <div className={innerBoxClass}>
                    <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                      <MapPin className="size-2.5 shrink-0" aria-hidden />
                      Drop
                    </p>
                    <p className="mt-0.5 text-xs font-medium leading-snug">
                      {drop}
                    </p>
                  </div>
                  <p className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground sm:hidden">
                    <ArrowRight className="size-3.5" aria-hidden />
                    Delivery route
                  </p>
                </div>
              </section>

              <section className="mt-4 space-y-2" aria-label="Mission details">
                <SectionHeading>Mission details</SectionHeading>
                <dl className="grid gap-1.5 sm:grid-cols-3">
                  <div className={innerBoxClass}>
                    <dt className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                      <Package className="size-2.5" aria-hidden />
                      Payload
                    </dt>
                    <dd className="mt-0.5 text-xs font-semibold tabular-nums">
                      {payloadWeight ? `${payloadWeight} kg` : "—"}
                    </dd>
                  </div>
                  <div className={innerBoxClass}>
                    <dt className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                      Type
                    </dt>
                    <dd className="mt-0.5 text-xs font-semibold">{cargoType}</dd>
                  </div>
                  <div className={innerBoxClass}>
                    <dt className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                      Priority
                    </dt>
                    <dd className="mt-0.5 text-xs font-semibold">
                      {priorityLabel(urgencyRaw)}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="mt-4">
                <dl className={innerBoxClass}>
                  <DetailField label="Summary">
                    <span className="text-[11px] leading-snug text-muted-foreground">
                      {row.desc}
                    </span>
                  </DetailField>
                </dl>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
