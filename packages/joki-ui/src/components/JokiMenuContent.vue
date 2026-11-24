<script setup lang="ts">
import { useFloatingLayer } from "../floating-layer.js";
import "../panel.css";
import { MENU } from "./menu-context.js";
import { trackPanel, useFamily } from "./context.js";

const props = withDefaults(defineProps<{ readonly as?: string }>(), { as: "div" });
const menu = useFamily(MENU, "JokiMenuContent", "JokiMenu");
trackPanel(menu.elements, () => menu.open.value);
const layer = useFloatingLayer({
  panel: menu.elements.panel,
  active: () => menu.open.value,
  dismiss: () => {
    menu.open.value = false;
  },
  bindings: () => menu.panel,
});
</script>

<template>
  <component :is="props.as" v-if="menu.open.value" v-bind="layer.bindings()">
    <slot />
  </component>
</template>
