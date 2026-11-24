import { describe, expect, test } from "vite-plus/test";
import { createActor } from "xstate";

import { listboxMachine } from "../../src/select/listbox-machine.js";

function listbox() {
  const committed: number[] = [];
  const actor = createActor(listboxMachine, { input: { commit: (index) => committed.push(index) } });
  actor.start();
  return { actor, committed, active: () => actor.getSnapshot().context.active };
}

describe("listboxMachine", () => {
  test("committing the active option reports it and closes", () => {
    const { actor, committed } = listbox();
    actor.send({ type: "OPEN", index: 1 });
    actor.send({ type: "MOVE", index: 3 });
    actor.send({ type: "COMMIT" });
    expect(committed).toEqual([3]);
    expect(actor.getSnapshot().matches("closed")).toBe(true);
  });

  test("committing with no active option closes without a choice", () => {
    const { actor, committed } = listbox();
    actor.send({ type: "OPEN", index: -1 });
    actor.send({ type: "COMMIT" });
    expect(committed).toEqual([]);
    expect(actor.getSnapshot().matches("closed")).toBe(true);
  });

  test("filtering keeps an active option that is still enabled", () => {
    const { actor, active } = listbox();
    actor.send({ type: "OPEN", index: 2 });
    actor.send({ type: "OPTIONS_CHANGED", enabled: [0, 2] });
    expect(active()).toBe(2);
  });

  test("filtering that leaves a disabled or missing option at the active index moves to the first enabled one", () => {
    const { actor, active } = listbox();
    actor.send({ type: "OPEN", index: 2 });
    actor.send({ type: "OPTIONS_CHANGED", enabled: [1] });
    expect(active()).toBe(1);
    actor.send({ type: "OPTIONS_CHANGED", enabled: [] });
    expect(active()).toBe(-1);
  });

  test("a closed listbox ignores moves and commits", () => {
    const { actor, committed, active } = listbox();
    actor.send({ type: "MOVE", index: 2 });
    actor.send({ type: "COMMIT" });
    expect(committed).toEqual([]);
    expect(active()).toBe(-1);
  });
});
