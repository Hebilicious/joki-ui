<script setup lang="ts">
import { SELECT } from "./select-context.js";
import { useFamily } from "../shared/context.js";

const props = withDefaults(defineProps<{ readonly as?: string }>(), { as: "div" });
const select = useFamily(SELECT, "JokiSelectList", "JokiSelect");
</script>

<template>
  <component :is="props.as" v-bind="select.list">
    <slot />
  </component>
</template>
