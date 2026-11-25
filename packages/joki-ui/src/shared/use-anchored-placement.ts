import { useActorRef } from "@xstate/vue";
import { nextTick, onBeforeUnmount, toValue, watch, type MaybeRefOrGetter } from "vue";
import { anchoredDeclarations, TRANSFORM_ORIGIN } from "./css-placement.js";
import {
  availableSpace,
  placePanel,
  resolvePlacementOptions,
  type PlacementOptions,
  type ResolvedPlacementOptions,
  type Side,
} from "./placement.js";
import { placementMachine, type Attachment } from "./placement-machine.js";

function measureUnanimated(element: HTMLElement): DOMRect {
  const running = element
    .getAnimations()
    .filter((animation) => animation.playState === "running")
    .map((animation) => ({ animation, time: animation.currentTime }));
  for (const { animation } of running) animation.cancel();
  const box = element.getBoundingClientRect();
  for (const { animation, time } of running) {
    animation.play();
    animation.currentTime = time;
  }
  return box;
}

export type PlacementAnchor = Element | { getBoundingClientRect(): DOMRect } | null;

type StyledElement = HTMLElement | SVGElement;

function isStyledElement(anchor: PlacementAnchor): anchor is StyledElement {
  return anchor instanceof HTMLElement || anchor instanceof SVGElement;
}

function inlineAnchorNames(element: StyledElement): string[] {
  const value = element.style.getPropertyValue("anchor-name").trim();
  return value === "" || value === "none" ? [] : value.split(",").map((name) => name.trim());
}

function setInlineAnchorNames(element: StyledElement, names: readonly string[]): void {
  if (names.length === 0) element.style.removeProperty("anchor-name");
  else element.style.setProperty("anchor-name", names.join(", "));
}

export function useAnchoredPlacement(
  anchor: MaybeRefOrGetter<PlacementAnchor>,
  panel: MaybeRefOrGetter<HTMLElement | null>,
  active: MaybeRefOrGetter<boolean>,
  options: MaybeRefOrGetter<PlacementOptions>,
  anchorName: string,
): void {
  function place(): void {
    const target = toValue(anchor);
    const element = toValue(panel);
    if (!toValue(active) || target === null || element === null) return;
    const settings = resolvePlacementOptions(toValue(options));
    // A reserved scrollbar gutter moves the top layer's origin off the viewport's, while `getBoundingClientRect` and the
    // viewport's width both start at the viewport: placement reckons there, and the origin is taken off the style alone.
    element.style.position = "fixed";
    element.style.left = "0px";
    element.style.top = "0px";
    const origin = measureUnanimated(element);
    const anchorBox = target.getBoundingClientRect();
    const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
    const space = availableSpace(anchorBox, viewport, settings);
    const viewportHeight = viewport.height - 2 * settings.padding;
    const availableHeight = (side: Side) => (side === "top" || side === "bottom" ? space[side] : viewportHeight);
    element.style.setProperty("--joki-anchor-width", `${anchorBox.width}px`);
    element.style.setProperty("--joki-available-height", `${viewportHeight}px`);
    const box = measureUnanimated(element);
    const placement = placePanel(anchorBox, { width: box.width, height: box.height }, viewport, settings);
    element.style.setProperty("--joki-available-height", `${availableHeight(placement.side)}px`);
    element.style.setProperty("--joki-transform-origin", TRANSFORM_ORIGIN[placement.side]);
    const snap = (value: number) => Math.round(value * window.devicePixelRatio) / window.devicePixelRatio;
    element.style.left = `${snap(placement.left - origin.left)}px`;
    element.style.top = `${snap(placement.top - origin.top)}px`;
    element.dataset.side = placement.side;
  }

  function placeAfterScroll(event: Event): void {
    const element = toValue(panel);
    if (element !== null && event.target instanceof Node && element.contains(event.target)) return;
    actor.send({ type: "REPOSITION" });
  }

  function placeAfterResize(): void {
    actor.send({ type: "REPOSITION" });
  }

  function follow(): void {
    window.addEventListener("scroll", placeAfterScroll, { capture: true, passive: true });
    window.addEventListener("resize", placeAfterResize, { passive: true });
  }

  function unfollow(): void {
    window.removeEventListener("scroll", placeAfterScroll, { capture: true });
    window.removeEventListener("resize", placeAfterResize);
  }

  function attachment(settings: ResolvedPlacementOptions): Attachment | null {
    const target = toValue(anchor);
    const element = toValue(panel);
    if (!isStyledElement(target) || element === null) return null;
    return {
      anchor: target,
      anchorName,
      panel: element,
      declarations: anchoredDeclarations(settings, anchorName),
      side: settings.side,
    };
  }

  function attach({ anchor: target, anchorName: name, panel: element, declarations, side }: Attachment): void {
    setInlineAnchorNames(target, [...inlineAnchorNames(target).filter((other) => other !== name), name]);
    for (const [property, value] of Object.entries(declarations)) element.style.setProperty(property, value);
    // The requested side: the browser does not report which fallback it chose.
    element.dataset.side = side;
  }

  function detach({ anchor: target, anchorName: name, panel: element, declarations }: Attachment): void {
    setInlineAnchorNames(
      target,
      inlineAnchorNames(target).filter((other) => other !== name),
    );
    for (const property of Object.keys(declarations)) element.style.removeProperty(property);
  }

  // Registered before `useActorRef` stops the actor on unmount, so an open panel leaves its state, and whatever that
  // state attached, first.
  onBeforeUnmount(() => actor.send({ type: "CLOSE" }));
  const actor = useActorRef(placementMachine, {
    input: { place, follow, unfollow, attach, detach },
  });

  watch(
    () => toValue(active) && toValue(panel) !== null,
    async (shown) => {
      if (!shown) {
        actor.send({ type: "CLOSE" });
        return;
      }
      actor.send({ type: "OPEN" });
      await nextTick();
      const settings = resolvePlacementOptions(toValue(options));
      actor.send({
        type: "RENDERED",
        requested: settings.strategy,
        attachment: attachment(settings),
        cssSupported: typeof CSS !== "undefined" && CSS.supports("position-area: block-end"),
      });
    },
    { immediate: true },
  );
}
