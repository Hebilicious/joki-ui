<script setup lang="ts">
import { useTemplateRef } from "vue";
import JokiMenu from "../../src/components/JokiMenu.vue";
import JokiMenuContent from "../../src/components/JokiMenuContent.vue";
import JokiMenuItem from "../../src/components/JokiMenuItem.vue";
import JokiMenuTrigger from "../../src/components/JokiMenuTrigger.vue";

const emit = defineEmits<{ triggerClick: []; panelKeydown: [key: string] }>();
const trigger = useTemplateRef<InstanceType<typeof JokiMenuTrigger>>("trigger");
</script>

<template>
  <JokiMenu>
    <JokiMenuTrigger ref="trigger" class="tools-button" title="Tools" @click="emit('triggerClick')"
    >Tools</JokiMenuTrigger>
    <JokiMenuContent
      as="section"
      class="tools-panel"
      aria-label="Tools"
      @keydown="(event: KeyboardEvent) => emit('panelKeydown', event.key)"
    >
      <JokiMenuItem>Rename</JokiMenuItem>
      <JokiMenuItem>Delete</JokiMenuItem>
    </JokiMenuContent>
  </JokiMenu>
  <button type="button" @click="trigger?.focus()">Focus tools</button>
</template>
