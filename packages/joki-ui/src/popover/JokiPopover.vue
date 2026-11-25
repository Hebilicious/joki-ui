<script setup lang="ts">
import type { PlacementOptions } from "../shared/placement.js";
import { useJokiPopover } from "./use-joki-popover.js";
import { partElements, provideFamily } from "../shared/context.js";
import { POPOVER } from "./popover-context.js";

const open = defineModel<boolean>("open", { default: false });
const props = withDefaults(
  defineProps<{
    readonly placement?: PlacementOptions;
    readonly role?: "dialog" | "region";
    readonly focusOnOpen?: () => boolean;
    readonly triggerTogglesOpen?: boolean;
  }>(),
  { placement: () => ({}), role: "dialog", focusOnOpen: () => true, triggerTogglesOpen: true },
);

const elements = partElements();
const popover = useJokiPopover({
  open,
  trigger: elements.trigger,
  panel: elements.panel,
  panelId: elements.panelId,
  placement: () => props.placement,
  role: () => props.role,
  focusOnOpen: () => props.focusOnOpen(),
  triggerTogglesOpen: () => props.triggerTogglesOpen,
});
provideFamily(POPOVER, {
  elements,
  open,
  get trigger() {
    return { ...popover.trigger, id: elements.triggerId };
  },
  get panel() {
    return popover.panel;
  },
});
</script>

<template>
  <slot :open="open" />
</template>
