<script setup lang="ts">
import { useFloatingLayer } from "../floating-layer.js";
import "../panel.css";
import { POPOVER } from "./popover-context.js";
import { trackPanel, useFamily } from "./context.js";

const props = withDefaults(defineProps<{ readonly as?: string }>(), { as: "div" });
const popover = useFamily(POPOVER, "JokiPopoverContent", "JokiPopover");
trackPanel(popover.elements, () => popover.open.value);
const layer = useFloatingLayer({
  panel: popover.elements.panel,
  active: () => popover.open.value,
  dismiss: () => {
    popover.open.value = false;
  },
  bindings: () => popover.panel,
});
</script>

<template>
  <component :is="props.as" v-if="popover.open.value" v-bind="layer.bindings()">
    <slot />
  </component>
</template>
