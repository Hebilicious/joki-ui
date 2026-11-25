import type { InjectionKey, Ref } from "vue";
import type { useJokiPopover } from "./use-joki-popover.js";
import type { PartElements } from "../shared/context.js";

type Popover = ReturnType<typeof useJokiPopover>;

export interface PopoverFamily {
  readonly elements: PartElements;
  readonly open: Ref<boolean>;
  readonly trigger: Popover["trigger"] & { readonly id: string };
  readonly panel: Popover["panel"];
}

export const POPOVER: InjectionKey<PopoverFamily> = Symbol("joki-popover");
