<script setup lang="ts">
import { SELECT } from "./select-context.js";
import { useFamily } from "./context.js";

const props = withDefaults(defineProps<{ readonly as?: string }>(), { as: "button" });
const select = useFamily(SELECT, "JokiSelectTrigger", "JokiSelect");

defineExpose({ focus: () => select.elements.trigger()?.focus() });
</script>

<template>
  <component :is="props.as" :type="props.as === 'button' ? 'button' : undefined" v-bind="select.trigger">
    <slot :open="select.isOpen()" />
  </component>
</template>
