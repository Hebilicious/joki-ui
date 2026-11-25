import { createComponent, defineVaporComponent, type VaporComponent } from "@vue/runtime-vapor";
import type { Component } from "vue";
import { asVaporComponent } from "./vapor-component.ts";

/* Vapor imports a `<script setup>` child directly and creates it with `createComponent`, so no application-level hook
   can swap it the way a virtual-DOM test library stubs a child. */

export type ComponentStubs<Name extends string = string> = Partial<
  Readonly<Record<Name, true | Component | VaporComponent>>
>;

let activeStubs: ComponentStubs = {};
const realComponents = new WeakMap<object, VaporComponent>();

export function realComponent<C extends object>(component: C): C | VaporComponent {
  return realComponents.get(component) ?? component;
}

export function useComponentStubs(stubs: ComponentStubs): void {
  activeStubs = stubs;
}

export function stubbable(name: string, real: VaporComponent): VaporComponent {
  const tag = `${name.replace(/(?<!^)([A-Z])/g, "-$1").toLowerCase()}-stub`;
  const standIn = defineVaporComponent({
    name,
    inheritAttrs: false,
    setup(_props, { attrs, slots, expose }) {
      const stub = activeStubs[name];
      if (stub === true) return document.createElement(tag);
      // Props and listeners all arrive as attrs, since the stand-in declares none; one dynamic
      // source forwards them reactively, so a parent's later prop change still reaches the child.
      const instance = createComponent(asVaporComponent(stub ?? real), { $: [() => attrs] }, slots);
      if (instance.exposed) expose(instance.exposed);
      return instance;
    },
  });
  realComponents.set(standIn, real);
  return standIn;
}
