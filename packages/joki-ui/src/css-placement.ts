import { resolvePlacementOptions, type PlacementOptions, type Side } from "./placement.js";

export const TRANSFORM_ORIGIN: Readonly<Record<Side, string>> = {
  bottom: "top",
  top: "bottom",
  right: "left",
  left: "right",
};

const AREA_EDGE: Readonly<Record<Side, string>> = {
  top: "block-start",
  bottom: "block-end",
  left: "inline-start",
  right: "inline-end",
};

/** Chromium tries only the first five fallbacks. */
const BLOCK_FALLBACKS: Readonly<Record<"top" | "bottom", string>> = {
  bottom: "flip-block, --joki-shrink, --joki-center-below, --joki-center-above, --joki-center-below-shrink",
  top: "flip-block, --joki-shrink, --joki-center-above, --joki-center-below, --joki-center-above-shrink",
};
const CENTERED_BLOCK_FALLBACKS = "flip-block, --joki-shrink";
const INLINE_FALLBACKS = "flip-inline, --joki-below-end, --joki-above-end, --joki-center-below, --joki-center-above";

const px = (value: number) => `${value}px`;

export function anchoredDeclarations(options: PlacementOptions, anchorName: string) {
  const { side, align, offset, padding } = resolvePlacementOptions(options);
  const vertical = side === "top" || side === "bottom";
  const cross = vertical ? "inline" : "block";
  const span = align === "start" ? `span-${cross}-end` : align === "end" ? `span-${cross}-start` : "span-all";
  const crossStart = align === "start" ? 0 : padding;
  const crossEnd = align === "end" ? 0 : padding;
  const towardStart = side === "bottom" || side === "right";
  const [nearSide, farSide] = towardStart ? [offset, padding] : [padding, offset];
  const [blockStart, blockEnd, inlineStart, inlineEnd] = vertical
    ? [nearSide, farSide, crossStart, crossEnd]
    : [crossStart, crossEnd, nearSide, farSide];
  const centered = align === "center";
  return {
    "position-anchor": anchorName,
    "position-area": `${AREA_EDGE[side]} ${span}`,
    "position-try-fallbacks": !vertical
      ? INLINE_FALLBACKS
      : centered
        ? CENTERED_BLOCK_FALLBACKS
        : BLOCK_FALLBACKS[side === "top" ? "top" : "bottom"],
    "justify-self": vertical && centered ? "anchor-center" : "normal",
    "align-self": !vertical && centered ? "anchor-center" : "normal",
    "margin-block-start": px(blockStart),
    "margin-block-end": px(blockEnd),
    "margin-inline-start": px(inlineStart),
    "margin-inline-end": px(inlineEnd),
    "--joki-offset": px(offset),
    "--joki-padding": px(padding),
    "--joki-anchor-width": "anchor-size(width)",
    "--joki-available-height": `calc(100dvh - ${px(2 * padding)})`,
    "--joki-transform-origin": TRANSFORM_ORIGIN[side],
  };
}
