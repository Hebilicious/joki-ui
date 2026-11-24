import type { InjectionKey } from "vue";
import type { useJokiListbox } from "./use-joki-listbox.js";
import type { PartElements } from "../shared/context.js";

type Listbox = ReturnType<typeof useJokiListbox>;

export interface JokiSelectItem<Value = unknown> {
  readonly value: Value;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectFamily {
  readonly elements: PartElements;
  readonly isOpen: () => boolean;
  close(): void;
  readonly trigger: Listbox["trigger"] & { readonly id: string };
  readonly panel: Listbox["panel"] & { readonly id: string };
  readonly list: Listbox["listbox"];
  readonly search: Listbox["search"];
  option(index: number): ReturnType<Listbox["option"]>;
}

export const SELECT: InjectionKey<SelectFamily> = Symbol("joki-select");
