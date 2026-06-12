/** Cards and panels — soft elevation, no visible border. */
export const ADMIN_DASH_PANEL_BORDER =
  "border-0 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:shadow-none dark:ring-1 dark:ring-white/[0.06]";

/** Avatar / icon circles — hairline ring instead of a hard border. */
export const ADMIN_DASH_AVATAR_RING =
  "border-0 ring-1 ring-neutral-100/90 dark:ring-white/[0.08]";

/** Section dividers inside panels — barely visible. */
export const ADMIN_DASH_DIVIDER_BORDER =
  "border-b border-neutral-100/80 dark:border-white/[0.06]";

/** Box, card, and field borders on admin content panels. */
export const ADMIN_DASH_LIGHT_BOX_BORDER =
  "border-slate-200 dark:border-white/20";

/** Summary stat cards — light border with elevated shadow (admin, user, pilot dashboards). */
export const ADMIN_DASH_STAT_CARD_SURFACE =
  "border border-neutral-200/90 shadow-[0_8px_24px_rgba(15,23,42,0.14),0_4px_10px_rgba(15,23,42,0.08)] dark:border-white/10 dark:shadow-[0_8px_28px_rgba(0,0,0,0.45),0_4px_12px_rgba(0,0,0,0.28)]";

/** @alias ADMIN_DASH_STAT_CARD_SURFACE */
export const DASH_STAT_CARD_SURFACE = ADMIN_DASH_STAT_CARD_SURFACE;

/** Admin data table shell — white in light mode, black in dark. */
export const ADMIN_DASH_TABLE_SHELL =
  "overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:bg-black";

/** Admin table column heading row. */
export const ADMIN_DASH_TABLE_HEAD_ROW =
  "border-b border-border bg-white dark:bg-black";

/** Admin table body row. */
export const ADMIN_DASH_TABLE_BODY_ROW =
  "border-b border-border transition-colors last:border-b-0 hover:bg-muted/40 dark:hover:bg-white/5";

/** Urgency badges in admin tables — white label text in dark mode. */
export const ADMIN_URGENCY_BADGE_CRITICAL =
  "bg-[#ffdad6] text-[#93000a] dark:bg-red-950/50 dark:text-white";

export const ADMIN_URGENCY_BADGE_NORMAL =
  "bg-[#cde5ff] text-[#001d32] dark:bg-blue-950/50 dark:text-white";

export const ADMIN_URGENCY_BADGE_ROUTINE =
  "bg-[#008B8B]/14 text-[#0a3030] dark:bg-[#008B8B]/25 dark:text-white";
