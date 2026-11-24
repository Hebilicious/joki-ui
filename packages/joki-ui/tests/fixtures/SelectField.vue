<script setup lang="ts">
import { computed, shallowRef } from "vue";
import JokiSelect from "../../src/components/JokiSelect.vue";
import JokiSelectContent from "../../src/components/JokiSelectContent.vue";
import JokiSelectList from "../../src/components/JokiSelectList.vue";
import JokiSelectOption from "../../src/components/JokiSelectOption.vue";
import JokiSelectSearch from "../../src/components/JokiSelectSearch.vue";
import JokiSelectTrigger from "../../src/components/JokiSelectTrigger.vue";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

const props = withDefaults(
  defineProps<{ readonly options: readonly SelectOption[]; readonly label: string; readonly searchable?: boolean }>(),
  { searchable: false },
);
const model = defineModel<string>({ required: true });
const emit = defineEmits<{ choose: [value: string] }>();

function choose(value: string): void {
  model.value = value;
  emit("choose", value);
}
const query = shallowRef("");
const visible = computed(() =>
  props.options.filter((option) => option.label.toLowerCase().includes(query.value.trim().toLowerCase())),
);
const chosen = computed(() => props.options.find((option) => option.value === model.value));
</script>

<template>
  <JokiSelect
    :model-value="model"
    :options="visible"
    :searchable="searchable"
    :placement="{ align: 'start', offset: 6, padding: 8 }"
    @update:model-value="choose"
    @open-change="query = ''"
  >
    <JokiSelectTrigger class="select-trigger" :aria-label="label">
      {{ chosen?.label }}
    </JokiSelectTrigger>
    <JokiSelectContent class="select-panel">
      <JokiSelectSearch v-if="searchable" v-model="query" :aria-label="`Search ${label}`" />
      <JokiSelectList class="select-options" :aria-label="label">
        <JokiSelectOption v-for="(option, index) in visible" :key="option.value" :index="index">
          {{ option.label }}
        </JokiSelectOption>
      </JokiSelectList>
    </JokiSelectContent>
  </JokiSelect>
</template>

<style scoped>
.select-trigger {
  width: 240px;
  height: 40px;
}

.select-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: var(--joki-anchor-width);
  max-height: min(286px, var(--joki-available-height));
  overflow: hidden;
  padding: 4px;
  border: 1px solid;
  background: white;
}

.select-options {
  display: grid;
  overflow-y: auto;
}

.select-options > button {
  height: 40px;
}
</style>
