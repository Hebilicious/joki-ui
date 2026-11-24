import {
  createComponent,
  createIf,
  defineVaporComponent,
  insert,
  template,
  type VaporComponent,
} from "@vue/runtime-vapor";
import { onMounted, shallowRef } from "vue";
import { asVaporComponent, type Renderable } from "./vapor-component.ts";

/* Props pass through one function source, whose values Vapor reads as-is: a callback prop stays a
   callback instead of being read as a getter. */

/* BOUNDARY: The props a stage or harness passes are its component's own props, which the component validates. */
type Props = Readonly<Record<string, unknown>>;

export type { Renderable };

const vapor = asVaporComponent;

/* BOUNDARY: Props arrive fixed or as a reactive getter, told apart by whether they are a function. */
export function withProps(
  component: Renderable,
  props: Props | (() => Props) = {},
  name = "WithProps",
): VaporComponent {
  const source = typeof props === "function" ? props : () => props;
  return defineVaporComponent({ name, setup: () => createComponent(vapor(component), { $: [source] }) });
}

/* BOUNDARY: A child\'s props are its component\'s own props, which the component validates. */
export type HarnessChild = readonly [component: Renderable, props: () => Props | null];

/**
 * `setup` runs in the harness's own component setup, so composables, `provide` and lifecycle hooks work there.
 */
export function harness(
  setup: () => readonly HarnessChild[],
  options: { readonly tag?: string; readonly name?: string } = {},
): VaporComponent {
  return defineVaporComponent({
    name: options.name ?? "Harness",
    setup() {
      const blocks = setup().map(([component, props]) =>
        createIf(
          () => props() !== null,
          () => createComponent(vapor(component), { $: [() => props() ?? {}] }),
        ),
      );
      if (options.tag === undefined) return blocks;
      const element = document.createElement(options.tag);
      for (const block of blocks) insert(block, element);
      return element;
    },
  });
}

export function withSetup(component: Renderable, setup: () => () => Props | null, name = "WithSetup"): VaporComponent {
  return harness(() => [[component, setup()]], { name });
}

/* BOUNDARY: The two-way value is whatever the component emits for its model, which it validates. */
export function withModel(component: Renderable, props: Props, model: string, name = "WithModel"): VaporComponent {
  return defineVaporComponent({
    name,
    setup() {
      const value = shallowRef(props[model]);
      const update = (next: unknown): void => {
        value.value = next;
      };
      return createComponent(vapor(component), {
        $: [() => ({ ...props, [model]: value.value, [`onUpdate:${model}`]: update })],
      });
    },
  });
}

export function inFrame(
  className: string,
  children: Renderable | readonly Renderable[],
  style: Partial<CSSStyleDeclaration> = {},
  name = "InFrame",
): VaporComponent {
  return defineVaporComponent({
    name,
    setup() {
      const frame = document.createElement("div");
      frame.className = className;
      Object.assign(frame.style, style);
      for (const child of [children].flat()) insert(createComponent(vapor(child)), frame);
      return frame;
    },
  });
}

export function inOrder(children: readonly Renderable[], name = "InOrder"): VaporComponent {
  return defineVaporComponent({ name, setup: () => children.map((child) => createComponent(vapor(child))) });
}

/** A props factory runs once per mount. */
/* BOUNDARY: Scope props arrive fixed or as a factory, told apart by whether they are a function. */
export function inScope(
  scope: Renderable,
  scopeProps: Props | (() => Props),
  content: Renderable,
  name = "InScope",
): VaporComponent {
  return defineVaporComponent({
    name,
    setup() {
      const props = typeof scopeProps === "function" ? scopeProps() : scopeProps;
      return createComponent(vapor(scope), { $: [() => props] }, { default: () => createComponent(vapor(content)) });
    },
  });
}

export function afterMount(
  component: Renderable,
  mounted: (root: Element) => void | Promise<void>,
  name = "AfterMount",
): VaporComponent {
  return defineVaporComponent({
    name,
    setup() {
      const instance = createComponent(vapor(component));
      onMounted(() => {
        if (!(instance.block instanceof Element)) throw new Error("afterMount needs a single-root component");
        void mounted(instance.block);
      });
      return instance;
    },
  });
}

export function markup(html: string, onSetup?: () => void, name = "Markup"): VaporComponent {
  const create = template(html, 1);
  return defineVaporComponent({
    name,
    setup() {
      onSetup?.();
      return create();
    },
  });
}
