<script setup lang="ts">
import { useFloatingLayer } from "../floating-layer.js";
import "../panel.css";
import { SELECT } from "./select-context.js";
import { trackPanel, useFamily } from "./context.js";

const props = withDefaults(defineProps<{ readonly as?: string }>(), { as: "div" });
const select = useFamily(SELECT, "JokiSelectContent", "JokiSelect");
trackPanel(select.elements, () => select.isOpen());
const layer = useFloatingLayer({
  panel: select.elements.panel,
  active: () => select.isOpen(),
  dismiss: () => {
    select.close();
  },
  bindings: () => select.panel,
});
</script>

<template>
  <component :is="props.as" v-if="select.isOpen()" v-bind="layer.bindings()">
    <slot />
  </component>
</template>
