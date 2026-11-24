<script setup lang="ts">
import { SELECT } from "./select-context.js";
import { useFamily } from "../shared/context.js";

const props = defineProps<{ readonly index: number }>();
const select = useFamily(SELECT, "JokiSelectOption", "JokiSelect");
</script>

<template>
  <button type="button" v-bind="select.option(props.index)">
    <slot />
  </button>
</template>
