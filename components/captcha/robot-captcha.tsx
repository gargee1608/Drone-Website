"use client";

import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

type RobotCaptchaProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

export function RobotCaptcha({
  checked,
  onChange,
  className,
}: RobotCaptchaProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <span className="block text-xs font-semibold uppercase tracking-wide text-[#43484e]">
        Captcha verifications
      </span>

      <div
        className={cn(
          "rounded-lg border bg-slate-50 p-4 transition-colors",
          checked ? "border-emerald-300 bg-emerald-50/40" : "border-slate-300"
        )}
      >
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            className="size-5 shrink-0 rounded border-slate-300 text-[#006a6e] accent-[#006a6e] focus:ring-2 focus:ring-[#006a6e]/20"
            aria-describedby={checked ? "robot-captcha-success" : undefined}
          />
          <span className="text-sm font-medium text-[#1a2027]">
            I&apos;m not a robot
          </span>
        </label>
      </div>

      {checked ? (
        <p
          id="robot-captcha-success"
          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          role="status"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Verification successful! You can submit your inquiry.
        </p>
      ) : null}
    </div>
  );
}
