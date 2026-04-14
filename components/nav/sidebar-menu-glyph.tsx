import { cn } from "@/lib/utils";

/** Three short lines — menu control (matches admin Command Center sidebar). */
export function SidebarMenuGlyph({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex w-[1.125rem] flex-col justify-center gap-[5px]",
        className
      )}
      aria-hidden
    >
      <span className="h-0.5 w-full rounded-full bg-current" />
      <span className="h-0.5 w-full rounded-full bg-current" />
      <span className="h-0.5 w-full rounded-full bg-current" />
    </span>
  );
}
