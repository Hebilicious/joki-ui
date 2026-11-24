import { computed, nextTick, onBeforeUnmount, toValue, useId, watch, type MaybeRefOrGetter, type Ref } from "vue";
import type { PlacementOptions } from "./placement.js";
import { useAnchoredPlacement, type PlacementAnchor } from "./use-anchored-placement.js";

export interface JokiPopoverOptions {
  readonly open: Ref<boolean>;
  readonly trigger: MaybeRefOrGetter<HTMLElement | null>;
  readonly panel: MaybeRefOrGetter<HTMLElement | null>;
  readonly anchor?: MaybeRefOrGetter<PlacementAnchor>;
  readonly placement?: MaybeRefOrGetter<PlacementOptions>;
  readonly focusOnOpen?: () => boolean;
  readonly triggerTogglesOpen?: () => boolean;
  readonly role?: MaybeRefOrGetter<"dialog" | "region" | "menu" | "listbox">;
  readonly panelId?: string;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function useJokiPopover(options: JokiPopoverOptions) {
  const panelId = options.panelId ?? `joki-popover-${useId()}`;
  const role = () => toValue(options.role) ?? "dialog";
  const state = computed(() => (options.open.value ? "open" : "closed"));

  useAnchoredPlacement(
    () => (options.anchor === undefined ? toValue(options.trigger) : toValue(options.anchor)),
    () => toValue(options.panel),
    () => options.open.value,
    () => toValue(options.placement) ?? {},
    `--${panelId.replace(/[^\w-]/g, "-")}-anchor`,
  );

  function dismissFromOutside(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (toValue(options.panel)?.contains(target) || toValue(options.trigger)?.contains(target)) return;
    options.open.value = false;
  }

  watch(
    () => options.open.value,
    async (open, wasOpen) => {
      if (open) {
        document.addEventListener("pointerdown", dismissFromOutside, true);
        if (options.focusOnOpen?.() === false) return;
        await nextTick();
        const panel = toValue(options.panel);
        (panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus({ preventScroll: true });
        return;
      }
      document.removeEventListener("pointerdown", dismissFromOutside, true);
      const panel = toValue(options.panel);
      if (wasOpen && panel !== null && panel.contains(document.activeElement)) {
        toValue(options.trigger)?.focus({ preventScroll: true });
      }
    },
  );
  onBeforeUnmount(() => document.removeEventListener("pointerdown", dismissFromOutside, true));

  const trigger = computed(() => ({
    // No `aria-haspopup` value describes a region; `aria-expanded` and `aria-controls` still connect them.
    "aria-haspopup": role() === "region" ? undefined : role(),
    "aria-expanded": options.open.value,
    "aria-controls": panelId,
    "data-state": state.value,
    onClick: () => {
      if (options.triggerTogglesOpen?.() === false) return;
      options.open.value = !options.open.value;
    },
  }));
  const panel = computed(() => ({ id: panelId, role: role(), tabindex: -1, "data-state": state.value }));

  return {
    panelId,
    get trigger() {
      return trigger.value;
    },
    get panel() {
      return panel.value;
    },
  };
}
