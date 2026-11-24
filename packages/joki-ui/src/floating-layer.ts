import { mergeProps, watch, type ShallowRef } from "vue";
import { promoteToTopLayer } from "./top-layer.js";

type ElementBindings = Parameters<typeof mergeProps>[number];

/**
 * The panel is a manual popover that stays in its owner's DOM, so a modal `<dialog>` keeps it interactive and its
 * owner's scoped styles apply, while no clipping ancestor or open dialog covers it. Escape inside it closes only this
 * panel: the enclosing dialog must not also cancel.
 */
export function useFloatingLayer(options: {
  readonly panel: ShallowRef<HTMLElement | null>;
  readonly active: () => boolean;
  readonly dismiss: () => void;
  readonly bindings: () => ElementBindings;
}) {
  watch(
    options.panel,
    (element) => {
      if (element !== null && options.active()) promoteToTopLayer(element);
    },
    { flush: "post" },
  );
  function dismissOnEscape(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    options.dismiss();
  }
  return {
    bindings: () =>
      mergeProps(options.bindings(), {
        popover: "manual",
        "data-joki-panel": "",
        onKeydown: dismissOnEscape,
      }),
  };
}
