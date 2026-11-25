import { setup, types } from "xstate";

export interface ListboxMachineInput {
  readonly commit: (index: number) => void;
}

interface ListboxMachineContext {
  readonly input: ListboxMachineInput;
  readonly active: number;
}

type ListboxMachineEvent =
  | { readonly type: "OPEN"; readonly index: number }
  | { readonly type: "CLOSE" }
  | { readonly type: "MOVE"; readonly index: number }
  | { readonly type: "COMMIT" }
  | { readonly type: "OPTIONS_CHANGED"; readonly enabled: readonly number[] };

type Payload<Type extends ListboxMachineEvent["type"]> = Omit<Extract<ListboxMachineEvent, { type: Type }>, "type">;

export const listboxMachine = setup({
  schemas: {
    context: types<ListboxMachineContext>(),
    input: types<ListboxMachineInput>(),
    events: {
      OPEN: types<Payload<"OPEN">>(),
      CLOSE: types<Payload<"CLOSE">>(),
      MOVE: types<Payload<"MOVE">>(),
      COMMIT: types<Payload<"COMMIT">>(),
      OPTIONS_CHANGED: types<Payload<"OPTIONS_CHANGED">>(),
    },
  },
  actions: {
    commit: ({ context }: { context: ListboxMachineContext }) => context.input.commit(context.active),
  },
}).createMachine({
  id: "listbox" as const,
  initial: "closed",
  context: ({ input }) => ({ input, active: -1 }),
  states: {
    closed: {
      on: {
        OPEN: ({ context, event }) => ({ target: "open", context: { ...context, active: event.index } }),
      },
    },
    open: {
      on: {
        CLOSE: ({ context }) => ({ target: "closed", context: { ...context, active: -1 } }),
        MOVE: ({ context, event }) => ({ context: { ...context, active: event.index } }),
        COMMIT: (args, enq) => {
          if (args.context.active >= 0) enq(args.actions.commit, args);
          return { target: "closed", context: { ...args.context, active: -1 } };
        },
        OPTIONS_CHANGED: ({ context, event }) =>
          event.enabled.includes(context.active)
            ? undefined
            : { context: { ...context, active: event.enabled[0] ?? -1 } },
      },
    },
  },
});
