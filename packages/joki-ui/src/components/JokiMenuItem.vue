<script setup lang="ts">
import { useId } from "vue";
import { MENU } from "./menu-context.js";
import { useFamily } from "./context.js";

const props = withDefaults(defineProps<{ readonly disabled?: boolean }>(), { disabled: false });
const emit = defineEmits<{ select: [] }>();
const menu = useFamily(MENU, "JokiMenuItem", "JokiMenu");
const key = useId();
</script>

<template>
  <button type="button" v-bind="menu.item(key, { disabled: props.disabled, onSelect: () => emit('select') })">
    <slot />
  </button>
</template>
