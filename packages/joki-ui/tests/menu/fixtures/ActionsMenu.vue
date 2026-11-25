<script setup lang="ts">
import JokiMenu from "../../../src/menu/JokiMenu.vue";
import JokiMenuContent from "../../../src/menu/JokiMenuContent.vue";
import JokiMenuItem from "../../../src/menu/JokiMenuItem.vue";
import JokiMenuTrigger from "../../../src/menu/JokiMenuTrigger.vue";

const emit = defineEmits<{ choose: [action: string] }>();
const actions = [
  { key: "rename", label: "Rename", disabled: false },
  { key: "duplicate", label: "Duplicate", disabled: true },
  { key: "archive", label: "Archive", disabled: false },
  { key: "delete", label: "Delete", disabled: false },
] as const;
</script>

<template>
  <JokiMenu :placement="{ offset: 6, padding: 8 }">
    <JokiMenuTrigger>Actions </JokiMenuTrigger>
    <JokiMenuContent aria-label="Actions">
      <JokiMenuItem
        v-for="action in actions"
        :key="action.key"
        :disabled="action.disabled"
        @select="emit('choose', action.key)"
      >
        {{ action.label }}
      </JokiMenuItem>
    </JokiMenuContent>
  </JokiMenu>
</template>
