<script setup lang="ts" generic="Item extends JokiSelectItem">
import { watch } from "vue";
import type { PlacementOptions } from "../shared/placement.js";
import { useJokiListbox } from "./use-joki-listbox.js";
import { partElements, provideFamily } from "../shared/context.js";
import { SELECT, type JokiSelectItem } from "./select-context.js";

const props = withDefaults(
  defineProps<{
    /** The chosen value; every choice is reported through `update:modelValue`, even of the value already chosen. */
    readonly modelValue?: Item["value"];
    readonly options: readonly Item[];
    readonly searchable?: boolean;
    readonly disabled?: boolean;
    readonly placement?: PlacementOptions;
  }>(),
  { searchable: false, disabled: false, placement: () => ({}) },
);
const emit = defineEmits<{ "update:modelValue": [value: Item["value"]]; openChange: [open: boolean] }>();

const elements = partElements();
const isChosen = (option: Item | undefined) => option !== undefined && option.value === props.modelValue;
const listbox = useJokiListbox({
  trigger: elements.trigger,
  panel: elements.panel,
  options: () => props.options,
  selected: () => props.options.findIndex(isChosen),
  onCommit: (index) => {
    const option = props.options[index];
    if (option !== undefined) emit("update:modelValue", option.value);
  },
  searchable: () => props.searchable,
  disabled: () => props.disabled,
  placement: () => props.placement,
});
watch(
  () => listbox.isOpen,
  (open) => emit("openChange", open),
);
provideFamily(SELECT, {
  elements,
  isOpen: () => listbox.isOpen,
  close: () => listbox.close(),
  get trigger() {
    return { ...listbox.trigger, id: elements.triggerId };
  },
  get panel() {
    return { ...listbox.panel, id: elements.panelId };
  },
  get list() {
    return listbox.listbox;
  },
  get search() {
    return listbox.search;
  },
  option: (index) => listbox.option(index, isChosen(props.options[index])),
});
</script>

<template>
  <slot :open="listbox.isOpen" />
</template>
