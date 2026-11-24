import type { InjectionKey, Ref } from "vue";
import type { JokiMenuItemOptions, useJokiMenu } from "./use-joki-menu.js";
import type { PartElements } from "../shared/context.js";

type Menu = ReturnType<typeof useJokiMenu>;

export interface MenuFamily {
  readonly elements: PartElements;
  readonly open: Ref<boolean>;
  readonly trigger: Menu["trigger"] & { readonly id: string };
  readonly panel: Menu["panel"];
  item(key: string, options: JokiMenuItemOptions): ReturnType<Menu["item"]>;
}

export const MENU: InjectionKey<MenuFamily> = Symbol("joki-menu");
