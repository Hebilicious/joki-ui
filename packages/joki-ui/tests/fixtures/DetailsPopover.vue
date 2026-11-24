<script setup lang="ts">
import JokiPopover from "../../src/components/JokiPopover.vue";
import JokiPopoverContent from "../../src/components/JokiPopoverContent.vue";
import JokiPopoverTrigger from "../../src/components/JokiPopoverTrigger.vue";
</script>

<template>
  <JokiPopover :placement="{ offset: 6, padding: 8 }">
    <JokiPopoverTrigger>Details </JokiPopoverTrigger>
    <button type="button">Elsewhere</button>
    <JokiPopoverContent aria-label="Details">
      <button type="button">Copy link</button>
    </JokiPopoverContent>
  </JokiPopover>
</template>
