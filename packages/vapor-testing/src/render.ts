import { createComponent, createVaporApp, defineVaporComponent } from "@vue/runtime-vapor";
import { fireEvent as domFireEvent, getQueriesForElement, prettyDOM, waitFor } from "@testing-library/dom";
import { shallowReactive, type AppConfig, type InjectionKey } from "vue";
import { realComponent, useComponentStubs, type ComponentStubs } from "./stubs.ts";
import { asVaporComponent, type Renderable } from "./vapor-component.ts";

export { configure, prettyDOM, screen, waitFor, within } from "@testing-library/dom";

/* BOUNDARY: A scenario supplies the mounted component's own props, provides and slots, which the component validates at mount. */
export interface RenderOptions {
  readonly props?: object;
  readonly attrs?: object;
  readonly slots?: Readonly<Record<string, string>>;
  readonly global?: {
    readonly provide?: Readonly<Record<string | symbol, unknown>>;
    readonly stubs?: ComponentStubs;
    readonly config?: Partial<Pick<AppConfig, "errorHandler" | "warnHandler">>;
  };
  readonly container?: HTMLElement;
  readonly setup?: () => void;
}

interface EmittedFunction {
  <T = unknown>(): Record<string, T[]>;
  <T = unknown>(name?: string): T[] | undefined;
}

const pendingUnmounts = new Set<() => void>();

const defaultProvides = new Map<string | symbol, (app: ReturnType<typeof createVaporApp>) => void>();

/**
 * Provides a value to every component `render` mounts, as an application's root does, unless the scenario provides its
 * own under the same key. The factory runs once per mount.
 */
export function provideToEveryRender<Value>(key: InjectionKey<Value>, create: () => Value): void {
  defaultProvides.set(key, (app) => app.provide(key, create()));
}

/* BOUNDARY: Mounts any component with the props a scenario supplies; the component validates them, as Vue does at mount. */
export function render(component: Renderable, options: RenderOptions = {}) {
  const container = options.container ?? document.body.appendChild(document.createElement("div"));
  // Vapor reads a dynamic props source on every access, so `rerender` reaches the mounted component, including keys
  // absent at mount.
  const props = shallowReactive<Record<string, unknown>>({ ...options.attrs, ...options.props });
  const emitted: Record<string, unknown[][]> = {};
  const listeners = Object.fromEntries(
    // A stand-in declares no emits, so its listeners reach the real component as attrs; the events
    // a mount records are the real component's.
    declaredEmits(realComponent(component)).map((event) => {
      const key = `on${event[0]!.toUpperCase()}${event.slice(1)}`;
      return [
        key,
        (...values: unknown[]) => {
          (emitted[event] ??= []).push(values);
          const supplied = props[key];
          if (typeof supplied === "function") supplied(...values);
        },
      ];
    }),
  );
  useComponentStubs(options.global?.stubs ?? {});
  const slots = Object.fromEntries(
    Object.entries(options.slots ?? {}).map(([name, html]) => [name, () => htmlNodes(html)]),
  );
  // An app passes its root component no slots, so a host creates the component with them.
  const host = defineVaporComponent({
    setup: () => {
      options.setup?.();
      return createComponent(asVaporComponent(component), { $: [() => Object.assign({}, props, listeners)] }, slots);
    },
  });
  const app = createVaporApp(host);
  Object.assign(app.config, options.global?.config);
  const provided = options.global?.provide ?? {};
  for (const [key, provide] of defaultProvides) {
    if (!Object.hasOwn(provided, key)) provide(app);
  }
  for (const key of Reflect.ownKeys(provided)) {
    // SAFETY: `key` came from `Reflect.ownKeys(provided)`, so it is one of `provided`'s own keys.
    app.provide(key, provided[key as keyof typeof provided]);
  }
  let mounted = false;
  const unmount = (): void => {
    if (!pendingUnmounts.delete(unmount)) return;
    if (mounted) app.unmount();
    if (options.container === undefined) container.remove();
  };
  pendingUnmounts.add(unmount);
  app.mount(container);
  mounted = true;
  return {
    container,
    baseElement: document.body,
    debug: (element: Element = document.body, maxLength?: number) => console.log(prettyDOM(element, maxLength)),
    unmount,
    // SAFETY: The recorded arguments are whatever the component emitted; a scenario names their type per event.
    emitted: ((name?: string) => (name === undefined ? { ...emitted } : emitted[name])) as EmittedFunction,
    rerender: async (next: object): Promise<void> => {
      Object.assign(props, next);
      await waitFor(() => {});
    },
    ...getQueriesForElement(document.body),
  };
}

export type RenderResult = ReturnType<typeof render>;

function htmlNodes(html: string): Node[] {
  const template = document.createElement("template");
  template.innerHTML = html;
  return [...template.content.childNodes];
}

/* BOUNDARY: Reads a component's options object, whose `emits` Vue accepts as an array or an object. */
function declaredEmits(component: object): readonly string[] {
  const emits = typeof component === "object" && "emits" in component ? component.emits : undefined;
  if (Array.isArray(emits)) return emits.filter((event): event is string => typeof event === "string");
  return emits && typeof emits === "object" ? Object.keys(emits) : [];
}

export function cleanup(): void {
  // Deleting the entry being visited is safe while iterating a Set.
  for (const unmount of pendingUnmounts) unmount();
}

type DomTarget = Document | Element | Window | Node;
/* BOUNDARY: The event helpers mirror Testing Library's `fireEvent`, whose init dictionaries are per-event DOM types. */
type FireEventKey = Exclude<keyof typeof domFireEvent, keyof ((...args: never[]) => unknown)>;
interface AsyncFireEventUpdate {
  (element: HTMLOptionElement): Promise<void>;
  (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string): Promise<void>;
  (element: Element, value?: string): Promise<void>;
}
/* BOUNDARY: Each helper takes the init dictionary of its own DOM event, as Testing Library's `fireEvent` does. */
type AsyncFireEvent = ((element: DomTarget, event: Event) => Promise<void>) & {
  readonly [K in FireEventKey]: (element: DomTarget, options?: object) => Promise<void>;
} & {
  readonly update: AsyncFireEventUpdate;
};

async function fireAndFlush(element: DomTarget, event: Event): Promise<void> {
  domFireEvent(element, event);
  // Vue flushes DOM updates on the microtask queue (https://vuejs.org/guide/extras/reactivity-in-depth#async-updates);
  // an empty `waitFor` yields one tick so the DOM reflects the event before the caller continues.
  await waitFor(() => {});
}

// SAFETY: Every event helper is defined on `fireEvent` just below, before any caller can reach it.
const fireEvent = fireAndFlush as AsyncFireEvent;
// SAFETY: Testing Library's `fireEvent` exposes exactly one helper per event name as its own enumerable keys.
for (const key of Object.keys(domFireEvent) as readonly FireEventKey[]) {
  Object.defineProperty(fireEvent, key, {
    enumerable: true,
    /* BOUNDARY: The init dictionary of the helper's own DOM event, passed through to Testing Library. */
    value: async (element: DomTarget, options?: object) => {
      domFireEvent[key](element, options);
      await waitFor(() => {});
    },
  });
}
// A small utility for a better experience with `v-model`, ported from
// @testing-library/vue's `fireEvent.update` (see vuejs/vue-test-utils#345).
const update: AsyncFireEventUpdate = (element: Element, value?: string): Promise<void> => {
  if (element instanceof HTMLOptionElement) {
    element.selected = true;
    const parent = element.parentElement;
    const select = parent instanceof HTMLOptGroupElement ? parent.parentElement : parent;
    // SAFETY: An option element always sits in a select or in an optgroup inside one.
    return fireEvent.change(select as Element);
  }
  if (element instanceof HTMLInputElement) {
    if (element.type === "checkbox" || element.type === "radio") {
      element.checked = true;
      return fireEvent.change(element);
    }
    if (element.type === "file") return fireEvent.change(element);
    element.value = value ?? "";
    return fireEvent.input(element);
  }
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    element.value = value ?? "";
    return element instanceof HTMLSelectElement ? fireEvent.change(element) : fireEvent.input(element);
  }
  return Promise.resolve();
};
Object.defineProperty(fireEvent, "update", { enumerable: true, value: update });

export { fireEvent };
