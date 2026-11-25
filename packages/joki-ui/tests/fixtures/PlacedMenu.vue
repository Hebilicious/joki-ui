<script setup lang="ts">
import JokiMenu from "../../src/components/JokiMenu.vue";
import JokiMenuContent from "../../src/components/JokiMenuContent.vue";
import JokiMenuItem from "../../src/components/JokiMenuItem.vue";
import JokiMenuTrigger from "../../src/components/JokiMenuTrigger.vue";
import type { PlacementOptions } from "../../src/placement.js";
import type { PlacementAnchor } from "../../src/use-anchored-placement.js";

const props = withDefaults(
  defineProps<{
    readonly label: string;
    readonly placement: PlacementOptions;
    readonly anchor?: PlacementAnchor;
    readonly tall?: boolean;
  }>(),
  { anchor: null, tall: false },
);
const open = defineModel<boolean>("open", { default: false });
</script>

<template>
  <JokiMenu v-model:open="open" :placement="props.placement" :anchor="props.anchor">
    <JokiMenuTrigger class="placed-trigger">{{ props.label }}</JokiMenuTrigger>
    <JokiMenuContent class="placed-panel" :class="{ 'placed-panel--tall': props.tall }" :aria-label="props.label">
      <JokiMenuItem>Rename</JokiMenuItem>
    </JokiMenuContent>
  </JokiMenu>
</template>

<style>
.placed-trigger {
  box-sizing: border-box;
  width: 80px;
  height: 30px;
}

.placed-panel {
  box-sizing: border-box;
  width: 200px;
  height: 100px;
  background: white;
}

.placed-panel--tall {
  height: 2000px;
  max-height: var(--joki-available-height);
}
</style>
