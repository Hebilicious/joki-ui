import type { PlacementStrategy } from "./placement-machine.js";

export type Side = "top" | "bottom" | "left" | "right";

export interface PlacementOptions {
  readonly side?: Side;
  readonly align?: "start" | "center" | "end";
  readonly offset?: number;
  readonly padding?: number;
  readonly strategy?: PlacementStrategy;
}

export type ResolvedPlacementOptions = Required<PlacementOptions>;

export function resolvePlacementOptions(options: PlacementOptions = {}): ResolvedPlacementOptions {
  return {
    side: options.side ?? "bottom",
    align: options.align ?? "center",
    offset: options.offset ?? 0,
    padding: options.padding ?? 0,
    strategy: options.strategy ?? "script",
  };
}

export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Placement {
  readonly left: number;
  readonly top: number;
  readonly side: Side;
  readonly height: number;
}

const OPPOSITE: Readonly<Record<Side, Side>> = { top: "bottom", bottom: "top", left: "right", right: "left" };

export function availableSpace(anchor: Rect, viewport: Size, options: PlacementOptions = {}): Record<Side, number> {
  const { offset, padding } = resolvePlacementOptions(options);
  return {
    bottom: Math.max(0, viewport.height - (anchor.top + anchor.height) - offset - padding),
    top: Math.max(0, anchor.top - offset - padding),
    right: Math.max(0, viewport.width - (anchor.left + anchor.width) - offset - padding),
    left: Math.max(0, anchor.left - offset - padding),
  };
}

export function placePanel(anchor: Rect, panel: Size, viewport: Size, options: PlacementOptions = {}): Placement {
  const { side: preferred, align, offset, padding } = resolvePlacementOptions(options);
  const space = availableSpace(anchor, viewport, options);
  const vertical = preferred === "top" || preferred === "bottom";
  const extent = vertical ? panel.height : panel.width;
  const fits = (side: Side) => space[side] >= extent;
  const opposite = OPPOSITE[preferred];
  if (!vertical && !fits(preferred) && !fits(opposite)) {
    return placePanel(anchor, panel, viewport, { ...options, side: "bottom", align: "end" });
  }
  const side = !fits(preferred) && fits(opposite) ? opposite : preferred;
  const height = vertical ? Math.min(panel.height, space[side]) : panel.height;
  const aligned = (start: number, length: number, size: number) =>
    align === "start" ? start : align === "end" ? start + length - size : start + (length - size) / 2;
  const left =
    side === "right"
      ? anchor.left + anchor.width + offset
      : side === "left"
        ? anchor.left - offset - panel.width
        : aligned(anchor.left, anchor.width, panel.width);
  const top =
    side === "bottom"
      ? anchor.top + anchor.height + offset
      : side === "top"
        ? anchor.top - offset - height
        : aligned(anchor.top, anchor.height, height);
  return {
    left: clamp(left, padding, viewport.width - padding - panel.width),
    top: clamp(top, padding, viewport.height - padding - height),
    side,
    height,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}
