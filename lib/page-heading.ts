/**
 * Primary page `<h1>` typography aligned with Admin Dashboard
 * (`components/dashboard/command-center-view.tsx`, `user-dashboard-shell`).
 */
export const ADMIN_PAGE_TITLE_CLASS =
  "text-2xl font-bold tracking-tight text-foreground sm:text-3xl";

/** Space between the fixed site header and the page title on admin dashboard pages. */
export const ADMIN_PAGE_TOP_PADDING_CLASS = "pt-6 sm:pt-8";

/** Typeface + tracking shared with admin page `<h1>` titles (no size/weight). */
export const ADMIN_PAGE_TYPE_CLASS = "font-sans tracking-tight";

/** KPI / table labels — same font and tracking as page titles, smaller scale. */
export const ADMIN_PAGE_SECTION_LABEL_CLASS =
  "font-sans text-sm font-bold tracking-tight text-muted-foreground sm:text-base";

/** Same scale/weight on dark hero imagery (keep light foreground). */
export const ADMIN_PAGE_TITLE_ON_DARK_CLASS =
  "text-2xl font-bold tracking-tight text-white sm:text-3xl";
