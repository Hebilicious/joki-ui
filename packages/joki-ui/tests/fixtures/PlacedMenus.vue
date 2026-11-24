<script setup lang="ts">
import { reactive } from "vue";
import type { PlacementOptions } from "../../src/placement.js";
import PlacedMenu from "./PlacedMenu.vue";

export interface PlacedMenuAt {
  readonly label: string;
  readonly left: number;
  readonly top: number;
  readonly placement: PlacementOptions;
  readonly tall?: boolean;
}

const props = defineProps<{ readonly menus: readonly PlacedMenuAt[] }>();
const open = reactive<Record<string, boolean>>({});
</script>

<template>
  <div
    v-for="menu in props.menus"
    :key="menu.label"
    :style="{ position: 'absolute', left: `${menu.left}px`, top: `${menu.top}px` }"
  >
    <PlacedMenu
      :label="menu.label"
      :placement="menu.placement"
      :tall="menu.tall === true"
      :open="open[menu.label] === true"
      @update:open="(value: boolean) => (open[menu.label] = value)"
    />
  </div>
</template>
