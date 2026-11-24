<script setup lang="ts">
import { inject } from "vue";
import GreetingButton from "./GreetingButton.vue";

const tone = inject<string>("tone", "plain");
</script>

<template>
  <section aria-label="Card" :data-tone="tone">
    <GreetingButton name="Ada" />
    <slot />
  </section>
</template>
