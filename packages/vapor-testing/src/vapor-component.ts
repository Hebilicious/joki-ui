import type { VaporComponent } from "@vue/runtime-vapor";
import type { Component } from "vue";

export type Renderable = Component | VaporComponent;

/**
 * A project that compiles its single-file components in Vapor mode still types each one as a virtual-DOM `Component`.
 */
export function asVaporComponent(component: Renderable): VaporComponent {
  // SAFETY: Every component this library mounts is compiled in Vapor mode, so it is a VaporComponent at runtime.
  return component as VaporComponent;
}
