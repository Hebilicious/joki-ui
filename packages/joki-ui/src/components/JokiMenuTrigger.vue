<script setup lang="ts">
import { MENU } from "./menu-context.js";
import { useFamily } from "./context.js";

const props = withDefaults(defineProps<{ readonly as?: string }>(), { as: "button" });
const menu = useFamily(MENU, "JokiMenuTrigger", "JokiMenu");

defineExpose({ focus: () => menu.elements.trigger()?.focus() });
</script>

<template>
  <component :is="props.as" :type="props.as === 'button' ? 'button' : undefined" v-bind="menu.trigger">
    <slot :open="menu.open.value" />
  </component>
</template>
