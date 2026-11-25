import { shallowRef, toValue } from "vue";
import { useJokiPopover, type JokiPopoverOptions } from "./use-joki-popover.js";

export interface JokiMenuItemOptions {
  readonly onSelect?: () => void;
  readonly disabled?: boolean;
}

const TYPEAHEAD_RESET_MS = 500;

export function useJokiMenu(options: Omit<JokiPopoverOptions, "role">) {
  const popover = useJokiPopover({ ...options, role: "menu" });
  const highlighted = shallowRef<string | null>(null);
  let typed = "";
  let typedAt = 0;

  function items(): HTMLElement[] {
    return [...(toValue(options.panel)?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
  }

  function enabled(): HTMLElement[] {
    return items().filter((item) => item.getAttribute("aria-disabled") !== "true");
  }

  function focusItem(item: HTMLElement | undefined): void {
    item?.focus({ preventScroll: true });
  }

  function moveFrom(current: Element | null, step: 1 | -1): void {
    const choices = enabled();
    if (choices.length === 0) return;
    const index = current instanceof HTMLElement ? choices.indexOf(current) : -1;
    const start = index === -1 ? (step === 1 ? -1 : choices.length) : index;
    focusItem(choices[(start + step + choices.length) % choices.length]);
  }

  function findTyped(key: string): void {
    const now = Date.now();
    typed = now - typedAt > TYPEAHEAD_RESET_MS ? key : typed + key;
    typedAt = now;
    const choices = enabled();
    const focused = document.activeElement;
    const start = focused instanceof HTMLElement ? Math.max(0, choices.indexOf(focused)) : 0;
    const ordered = [...choices.slice(start + (typed.length === 1 ? 1 : 0)), ...choices.slice(0, start + 1)];
    focusItem(ordered.find((item) => item.textContent?.trim().toLowerCase().startsWith(typed.toLowerCase())));
  }

  function handlePanelKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveFrom(document.activeElement, 1);
        return;
      case "ArrowUp":
        event.preventDefault();
        moveFrom(document.activeElement, -1);
        return;
      case "Home":
        event.preventDefault();
        focusItem(enabled()[0]);
        return;
      case "End":
        event.preventDefault();
        focusItem(enabled().at(-1));
        return;
      case "Tab":
        options.open.value = false;
        return;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) findTyped(event.key);
    }
  }

  function handleTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const fromEnd = event.key === "ArrowUp";
    options.open.value = true;
    requestAnimationFrame(() => focusItem(fromEnd ? enabled().at(-1) : enabled()[0]));
  }

  return {
    panelId: popover.panelId,
    get trigger() {
      return { ...popover.trigger, onKeydown: handleTriggerKeydown };
    },
    get panel() {
      return {
        ...popover.panel,
        onKeydown: handlePanelKeydown,
        onFocusin: (event: FocusEvent) => {
          const item = event.target instanceof HTMLElement ? event.target.closest('[role="menuitem"]') : null;
          highlighted.value = item instanceof HTMLElement ? (item.dataset.jokiItem ?? null) : null;
        },
        onFocusout: () => {
          highlighted.value = null;
        },
      };
    },
    item(key: string, item: JokiMenuItemOptions = {}) {
      return {
        role: "menuitem",
        tabindex: -1,
        "data-joki-item": key,
        "data-highlighted": highlighted.value === key ? "" : undefined,
        "data-disabled": item.disabled ? "" : undefined,
        "aria-disabled": item.disabled ? "true" : undefined,
        onPointermove: (event: PointerEvent) => {
          if (!item.disabled && event.currentTarget instanceof HTMLElement) focusItem(event.currentTarget);
        },
        onClick: () => {
          if (item.disabled) return;
          item.onSelect?.();
          options.open.value = false;
        },
      };
    },
  };
}
