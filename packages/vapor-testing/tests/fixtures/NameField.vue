<script setup lang="ts">
const name = defineModel<string>({ required: true });
</script>

<template>
  <label>
    Name
    <input v-model="name" />
  </label>
  <output>{{ name }}</output>
</template>
