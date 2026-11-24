<script setup lang="ts">
import { POPOVER } from "./popover-context.js";
import { useFamily } from "./context.js";

const props = withDefaults(defineProps<{ readonly as?: string }>(), { as: "button" });
const popover = useFamily(POPOVER, "JokiPopoverTrigger", "JokiPopover");

defineExpose({ focus: () => popover.elements.trigger()?.focus() });
</script>

<template>
  <component :is="props.as" :type="props.as === 'button' ? 'button' : undefined" v-bind="popover.trigger">
    <slot :open="popover.open.value" />
  </component>
</template>
