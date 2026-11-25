import { setup, types } from "xstate";
import type { Side } from "./placement.js";

export type PlacementStrategy = "script" | "css";

export interface Attachment {
  readonly anchor: HTMLElement | SVGElement;
  readonly anchorName: string;
  readonly panel: HTMLElement;
  readonly declarations: Readonly<Record<string, string>>;
  readonly side: Side;
}

export interface PlacementMachineInput {
  readonly place: () => void;
  readonly follow: () => void;
  readonly unfollow: () => void;
  readonly attach: (attachment: Attachment) => void;
  readonly detach: (attachment: Attachment) => void;
}

interface PlacementMachineContext {
  readonly input: PlacementMachineInput;
  readonly attached: Attachment | null;
}

type PlacementMachineEvent =
  | { readonly type: "OPEN" }
  | { readonly type: "CLOSE" }
  | {
      readonly type: "RENDERED";
      readonly requested: PlacementStrategy;
      readonly attachment: Attachment | null;
      readonly cssSupported: boolean;
    }
  | { readonly type: "REPOSITION" };

type Payload<Type extends PlacementMachineEvent["type"]> = Omit<Extract<PlacementMachineEvent, { type: Type }>, "type">;

function requireAttached(context: PlacementMachineContext): Attachment {
  if (context.attached === null) throw new Error("An anchored panel has no attachment");
  return context.attached;
}

export const placementMachine = setup({
  schemas: {
    context: types<PlacementMachineContext>(),
    input: types<PlacementMachineInput>(),
    events: {
      OPEN: types<Payload<"OPEN">>(),
      CLOSE: types<Payload<"CLOSE">>(),
      RENDERED: types<Payload<"RENDERED">>(),
      REPOSITION: types<Payload<"REPOSITION">>(),
    },
  },
  actions: {
    place: ({ context }: { context: PlacementMachineContext }) => context.input.place(),
    follow: ({ context }: { context: PlacementMachineContext }) => context.input.follow(),
    unfollow: ({ context }: { context: PlacementMachineContext }) => context.input.unfollow(),
    attach: ({ context }: { context: PlacementMachineContext }) => context.input.attach(requireAttached(context)),
    detach: ({ context }: { context: PlacementMachineContext }) => context.input.detach(requireAttached(context)),
  },
}).createMachine({
  id: "placement" as const,
  initial: "closed",
  context: ({ input }) => ({ input, attached: null }),
  on: { CLOSE: () => ({ target: ".closed" }) },
  states: {
    closed: {
      on: { OPEN: () => ({ target: "rendering" }), RENDERED: () => ({}) },
    },
    rendering: {
      on: {
        RENDERED: ({ context, event }) =>
          event.requested === "css" && event.attachment !== null && event.cssSupported
            ? { target: "anchored", context: { ...context, attached: event.attachment } }
            : { target: "following" },
      },
    },
    following: {
      entry: (args, enq) => {
        enq(args.actions.place, args);
        enq(args.actions.follow, args);
      },
      exit: (args, enq) => {
        enq(args.actions.unfollow, args);
      },
      on: {
        REPOSITION: (args, enq) => {
          enq(args.actions.place, args);
          return {};
        },
      },
    },
    anchored: {
      entry: (args, enq) => {
        enq(args.actions.attach, args);
      },
      exit: (args, enq) => {
        enq(args.actions.detach, args);
        return { context: { ...args.context, attached: null } };
      },
    },
  },
});
