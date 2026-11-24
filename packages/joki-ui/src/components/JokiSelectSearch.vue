<script setup lang="ts">
import { SELECT } from "./select-context.js";
import { useFamily } from "./context.js";

const query = defineModel<string>({ default: "" });
const select = useFamily(SELECT, "JokiSelectSearch", "JokiSelect");

function update(event: Event): void {
  if (event.target instanceof HTMLInputElement) query.value = event.target.value;
}
</script>

<template>
  <input type="search" :value="query" v-bind="select.search" @input="update" />
</template>
