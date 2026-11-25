import { useActorRef, useSelector } from "@xstate/vue";
import { computed, nextTick, toValue, watch, type MaybeRefOrGetter } from "vue";
import { isInputMethodKeydown } from "./input-method.js";
import { listboxMachine } from "./listbox-machine.js";
import type { PlacementOptions } from "./placement.js";
import { useJokiPopover } from "./use-joki-popover.js";

export interface JokiListboxOption {
  readonly label: string;
  readonly disabled?: boolean;
}

export interface JokiListboxOptions {
  readonly trigger: MaybeRefOrGetter<HTMLElement | null>;
  readonly panel: MaybeRefOrGetter<HTMLElement | null>;
  readonly options: () => readonly JokiListboxOption[];
  readonly selected: () => number;
  readonly onCommit: (index: number) => void;
  readonly searchable?: MaybeRefOrGetter<boolean>;
  readonly disabled?: MaybeRefOrGetter<boolean>;
  readonly placement?: MaybeRefOrGetter<PlacementOptions>;
}

type NavigationStep = 1 | -1 | "first" | "last";
const NAVIGATION_STEPS: ReadonlyMap<string, NavigationStep> = new Map<string, NavigationStep>([
  ["ArrowDown", 1],
  ["ArrowUp", -1],
  ["Home", "first"],
  ["End", "last"],
]);

function keepFocusInPlace(event: PointerEvent): void {
  event.preventDefault();
}

export function useJokiListbox(options: JokiListboxOptions) {
  const actor = useActorRef(listboxMachine, { input: { commit: (index) => options.onCommit(index) } });
  const isOpen = useSelector(actor, (snapshot) => snapshot.matches("open"));
  const active = useSelector(actor, (snapshot) => snapshot.context.active);
  const searchable = () => toValue(options.searchable) === true;

  function enabledIndexes(): number[] {
    return options.options().flatMap((option, index) => (option.disabled ? [] : [index]));
  }

  function openAt(index: number): void {
    if (toValue(options.disabled)) return;
    const enabled = enabledIndexes();
    actor.send({ type: "OPEN", index: enabled.includes(index) ? index : (enabled[0] ?? -1) });
  }

  const popover = useJokiPopover({
    open: computed({
      get: () => isOpen.value,
      set: (open) => (open ? openAt(options.selected()) : actor.send({ type: "CLOSE" })),
    }),
    trigger: options.trigger,
    panel: options.panel,
    placement: () => toValue(options.placement) ?? {},
    role: "listbox",
    focusOnOpen: searchable,
  });

  const optionId = (index: number) => `${popover.panelId}-option-${index}`;

  function move(step: 1 | -1 | "first" | "last"): void {
    const enabled = enabledIndexes();
    if (enabled.length === 0) return;
    const position = enabled.indexOf(active.value);
    const next =
      step === "first"
        ? enabled[0]
        : step === "last"
          ? enabled.at(-1)
          : enabled[
              position === -1
                ? step === 1
                  ? 0
                  : enabled.length - 1
                : Math.min(Math.max(position + step, 0), enabled.length - 1)
            ];
    if (next !== undefined) actor.send({ type: "MOVE", index: next });
  }

  let typed = "";
  let typedAt = 0;
  function findTyped(key: string): void {
    const now = Date.now();
    typed = now - typedAt > 500 ? key : typed + key;
    typedAt = now;
    const list = options.options();
    const start = isOpen.value ? active.value : options.selected();
    const order = [...list.keys()].map(
      (offset) => (start + (typed.length === 1 ? 1 : 0) + offset + list.length) % list.length,
    );
    const match = order.find(
      (index) => !list[index]?.disabled && list[index]?.label.toLowerCase().startsWith(typed.toLowerCase()),
    );
    if (match === undefined) return;
    if (isOpen.value) actor.send({ type: "MOVE", index: match });
    else openAt(match);
  }

  function navigate(event: KeyboardEvent): boolean {
    const step = NAVIGATION_STEPS.get(event.key);
    if (step !== undefined) {
      event.preventDefault();
      move(step);
      return true;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (!isInputMethodKeydown(event)) actor.send({ type: "COMMIT" });
      return true;
    }
    if (event.key === "Tab") {
      actor.send({ type: "CLOSE" });
      return true;
    }
    return false;
  }

  function isTypeahead(event: KeyboardEvent): boolean {
    return event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey;
  }

  function handleTriggerKeydown(event: KeyboardEvent): void {
    if (isOpen.value) {
      if (event.key === "Escape") {
        event.preventDefault();
        actor.send({ type: "CLOSE" });
      }
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAt(options.selected());
      if (event.key === "ArrowUp" && options.selected() < 0) move("last");
      return;
    }
    if (!searchable() && isTypeahead(event)) findTyped(event.key);
  }

  function handleListKeydown(event: KeyboardEvent): void {
    if (searchable()) return;
    if (event.key === " ") {
      event.preventDefault();
      actor.send({ type: "COMMIT" });
      return;
    }
    if (navigate(event)) return;
    if (isTypeahead(event)) findTyped(event.key);
  }

  watch(
    () => enabledIndexes().join(),
    () => actor.send({ type: "OPTIONS_CHANGED", enabled: enabledIndexes() }),
  );
  watch([active, isOpen], async ([index, open]) => {
    if (!open || index < 0) return;
    await nextTick();
    const option = document.getElementById(optionId(index));
    if (!searchable()) option?.focus({ preventScroll: true });
    option?.scrollIntoView({ block: "nearest" });
  });

  const activeDescendant = () => (isOpen.value && active.value >= 0 ? optionId(active.value) : undefined);

  return {
    panelId: popover.panelId,
    get isOpen() {
      return isOpen.value;
    },
    close: () => actor.send({ type: "CLOSE" }),
    get trigger() {
      return {
        ...popover.trigger,
        role: searchable() ? undefined : "combobox",
        "aria-haspopup": "listbox",
        "aria-disabled": toValue(options.disabled) ? "true" : undefined,
        "data-disabled": toValue(options.disabled) ? "" : undefined,
        onKeydown: handleTriggerKeydown,
      };
    },
    get panel() {
      return { "data-state": popover.panel["data-state"], tabindex: -1, onKeydown: handleListKeydown };
    },
    get listbox() {
      return { id: popover.panelId, role: "listbox" };
    },
    get search() {
      return {
        role: "combobox",
        "aria-expanded": isOpen.value,
        "aria-controls": popover.panelId,
        "aria-autocomplete": "list",
        "aria-activedescendant": activeDescendant(),
        onKeydown: (event: KeyboardEvent) => void navigate(event),
      };
    },
    option(index: number, chosen: boolean) {
      const option = options.options()[index];
      return {
        id: optionId(index),
        role: "option",
        tabindex: -1,
        "aria-selected": chosen,
        "aria-disabled": option?.disabled ? "true" : undefined,
        "data-state": chosen ? "checked" : "unchecked",
        "data-highlighted": active.value === index ? "" : undefined,
        "data-disabled": option?.disabled ? "" : undefined,
        onPointerdown: keepFocusInPlace,
        onPointermove: () => {
          if (!option?.disabled && active.value !== index) actor.send({ type: "MOVE", index });
        },
        onClick: () => {
          if (option?.disabled) return;
          actor.send({ type: "MOVE", index });
          actor.send({ type: "COMMIT" });
        },
      };
    },
  };
}
