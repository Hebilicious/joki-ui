import { inject, onMounted, provide, shallowRef, useId, watch, type InjectionKey, type ShallowRef } from "vue";

export interface PartElements {
  readonly triggerId: string;
  readonly panelId: string;
  readonly trigger: () => HTMLElement | null;
  readonly panel: ShallowRef<HTMLElement | null>;
}

export function partElements(): PartElements {
  const id = useId();
  const triggerId = `joki-trigger-${id}`;
  return {
    triggerId,
    panelId: `joki-panel-${id}`,
    trigger: () => document.getElementById(triggerId),
    panel: shallowRef(null),
  };
}

export function provideFamily<T>(key: InjectionKey<T>, value: T): T {
  provide(key, value);
  return value;
}

export function useFamily<T>(key: InjectionKey<T>, part: string, root: string): T {
  const family = inject(key, null);
  if (family === null) throw new Error(`<${part}> must be used inside <${root}>`);
  return family;
}

/**
 * A post-flush watcher runs before the `nextTick` continuations that place the panel and move focus into it, so they
 * find it.
 */
export function trackPanel(elements: PartElements, open: () => boolean): void {
  let mounted = false;
  onMounted(() => {
    mounted = true;
  });
  watch(
    open,
    (shown) => {
      const panel = shown ? document.getElementById(elements.panelId) : null;
      if (mounted && shown && panel === null) {
        throw new Error(
          `The open panel #${elements.panelId} is not in the document; did a call site set the part's id?`,
        );
      }
      elements.panel.value = panel;
    },
    { immediate: true, flush: "post" },
  );
}
