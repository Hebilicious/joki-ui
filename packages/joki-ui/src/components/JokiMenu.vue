<script setup lang="ts">
import type { PlacementAnchor } from "../use-anchored-placement.js";
import type { PlacementOptions } from "../placement.js";
import { useJokiMenu } from "../use-joki-menu.js";
import { partElements, provideFamily } from "./context.js";
import { MENU } from "./menu-context.js";

const open = defineModel<boolean>("open", { default: false });
const props = withDefaults(
  defineProps<{
    readonly placement?: PlacementOptions;
    readonly anchor?: PlacementAnchor;
    readonly returnFocus?: HTMLElement | null;
  }>(),
  { placement: () => ({}), returnFocus: null },
);

const elements = partElements();
const menu = useJokiMenu({
  open,
  trigger: () => elements.trigger() ?? props.returnFocus,
  panel: elements.panel,
  panelId: elements.panelId,
  anchor: () => props.anchor ?? elements.trigger() ?? props.returnFocus,
  placement: () => props.placement,
});
provideFamily(MENU, {
  elements,
  open,
  get trigger() {
    return { ...menu.trigger, id: elements.triggerId };
  },
  get panel() {
    return menu.panel;
  },
  item: (key, options) => menu.item(key, options),
});
</script>

<template>
  <slot :open="open" />
</template>
