"use client";

import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/** 0 = off-axis / barely visible, 1 = section center aligned with viewport focus band. */
function rawFocusStrength(el: HTMLElement, vh: number): number {
  const r = el.getBoundingClientRect();
  const visibleTop = Math.max(0, r.top);
  const visibleBottom = Math.min(vh, r.bottom);
  const visibleH = Math.max(0, visibleBottom - visibleTop);
  if (visibleH <= 0) return 0;

  const vis = visibleH / Math.max(r.height, 1);
  const cy = r.top + r.height / 2;
  const vmid = vh * 0.5;
  const d = Math.abs(cy - vmid);
  const sigma = vh * 0.36;
  const centerWeight = Math.exp(-(d * d) / (2 * sigma * sigma));

  return Math.max(0, Math.min(1, vis * centerWeight));
}

function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function zoomRange(vw: number): { zoomIn: number; zoomOut: number } {
  if (vw < 640) return { zoomIn: 1.09, zoomOut: 0.8 };
  if (vw < 1024) return { zoomIn: 1.12, zoomOut: 0.76 };
  return { zoomIn: 1.15, zoomOut: 0.72 };
}

function computeScales(
  refs: Array<HTMLDivElement | null>,
  count: number
): number[] {
  if (typeof window === "undefined") {
    return Array.from({ length: count }, (_, i) => (i === 0 ? 1.1 : 0.78));
  }
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const { zoomIn, zoomOut } = zoomRange(vw);

  const raw: number[] = [];
  for (let i = 0; i < count; i++) {
    const el = refs[i];
    raw.push(el ? rawFocusStrength(el, vh) : 0);
  }

  const maxRaw = Math.max(...raw, 0);
  if (maxRaw < 0.008) {
    return Array.from({ length: count }, (_, i) =>
      i === 0 ? zoomIn : zoomOut
    );
  }

  return raw.map((r) => {
    const t = r / maxRaw;
    const s = smoothstep(t);
    return zoomOut + (zoomIn - zoomOut) * s;
  });
}

type ScrollZoomRootProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollZoomRoot({ children, className }: ScrollZoomRootProps) {
  const sections = Children.toArray(children);
  const count = sections.length;
  const refs = useRef<Array<HTMLDivElement | null>>([]);
  /** Fixed initial snapshot so server + first client paint match (hydration-safe). */
  const [scales, setScales] = useState<number[]>(() =>
    Array.from({ length: count }, (_, i) => (i === 0 ? 1.12 : 0.76))
  );
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const listener = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const updateScales = useCallback(() => {
    setScales(computeScales(refs.current, count));
  }, [count]);

  useLayoutEffect(() => {
    updateScales();
  }, [updateScales]);

  useEffect(() => {
    if (reduceMotion) return;
    let raf = 0;
    const onScrollOrResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateScales);
    };
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [updateScales, reduceMotion]);

  return (
    <div className={className}>
      {sections.map((child, index) => (
        <div
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          className={cn(
            "origin-center transform-gpu will-change-transform",
            reduceMotion && "scale-100"
          )}
          style={
            reduceMotion
              ? undefined
              : {
                  transform: `scale(${scales[index] ?? 1})`,
                  transition:
                    "transform 0.65s cubic-bezier(0.2, 0.82, 0.22, 1)",
                }
          }
        >
          {child}
        </div>
      ))}
    </div>
  );
}
