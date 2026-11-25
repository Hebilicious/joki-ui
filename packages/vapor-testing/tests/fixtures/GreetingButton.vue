<script setup lang="ts">
const props = defineProps<{ name: string }>();
const emit = defineEmits<{ greet: [name: string] }>();
</script>

<template>
  <button type="button" @click="emit('greet', props.name)">Hello {{ props.name }}</button>
</template>
