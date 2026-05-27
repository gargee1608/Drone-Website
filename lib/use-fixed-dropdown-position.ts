"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

const PANEL_MAX_WIDTH_PX = 384;
const GAP_PX = 8;
const VIEWPORT_MARGIN_PX = 12;

export function useFixedDropdownPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>
): CSSProperties | undefined {
  const [style, setStyle] = useState<CSSProperties | undefined>();

  const update = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const width = Math.min(
      window.innerWidth - VIEWPORT_MARGIN_PX * 2,
      PANEL_MAX_WIDTH_PX
    );
    const left = Math.max(
      VIEWPORT_MARGIN_PX,
      Math.min(
        rect.right - width,
        window.innerWidth - width - VIEWPORT_MARGIN_PX
      )
    );

    setStyle({
      position: "fixed",
      top: rect.bottom + GAP_PX,
      left,
      width,
      zIndex: 70,
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(undefined);
      return;
    }
    update();
  }, [open, update]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);

  return open ? style : undefined;
}
