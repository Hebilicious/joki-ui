import { describe, expect, test } from "vite-plus/test";
import { createActor } from "xstate";

import { placementMachine, type Attachment, type PlacementStrategy } from "../../src/shared/placement-machine.js";

const attachment: Attachment = {
  anchor: document.createElement("button"),
  anchorName: "--joki-anchor-test",
  panel: document.createElement("div"),
  declarations: { "position-anchor": "--joki-anchor-test" },
  side: "bottom",
};

function placement() {
  const calls: string[] = [];
  const record = (name: string) => () => void calls.push(name);
  const attachments: { readonly call: string; readonly attachment: Attachment }[] = [];
  const recordAttachment = (call: string) => (attached: Attachment) => {
    calls.push(call);
    attachments.push({ call, attachment: attached });
  };
  const actor = createActor(placementMachine, {
    input: {
      place: record("place"),
      follow: record("follow"),
      unfollow: record("unfollow"),
      attach: recordAttachment("attach"),
      detach: recordAttachment("detach"),
    },
  });
  actor.start();
  const rendered = (requested: PlacementStrategy, attachable: Attachment | null, cssSupported: boolean) =>
    actor.send({ type: "RENDERED", requested, attachment: attachable, cssSupported });
  return { actor, calls, attachments, rendered, state: () => actor.getSnapshot().value };
}

describe("placementMachine", () => {
  test("css placement attaches once, follows nothing, and detaches exactly what it attached on close", () => {
    const { actor, calls, attachments, rendered, state } = placement();
    actor.send({ type: "OPEN" });
    rendered("css", attachment, true);
    expect(state()).toBe("anchored");
    actor.send({ type: "REPOSITION" });
    actor.send({ type: "CLOSE" });
    expect(calls).toEqual(["attach", "detach"]);
    expect(attachments).toEqual([
      { call: "attach", attachment },
      { call: "detach", attachment },
    ]);
    expect(state()).toBe("closed");
    expect(actor.getSnapshot().context.attached).toBeNull();
  });

  test("script placement places, follows, places again on each reposition, and stops following on close", () => {
    const { actor, calls, rendered, state } = placement();
    actor.send({ type: "OPEN" });
    rendered("script", attachment, true);
    expect(state()).toBe("following");
    actor.send({ type: "REPOSITION" });
    actor.send({ type: "CLOSE" });
    expect(calls).toEqual(["place", "follow", "place", "unfollow"]);
  });

  test("closing a closed panel, as an unmount does, detaches nothing again", () => {
    const { actor, calls, rendered, state } = placement();
    actor.send({ type: "CLOSE" });
    actor.send({ type: "OPEN" });
    rendered("css", attachment, true);
    actor.send({ type: "CLOSE" });
    actor.send({ type: "CLOSE" });
    expect(state()).toBe("closed");
    expect(calls).toEqual(["attach", "detach"]);
  });

  test("a render that lands after the panel closed places nothing", () => {
    const { actor, calls, rendered, state } = placement();
    actor.send({ type: "OPEN" });
    actor.send({ type: "CLOSE" });
    rendered("css", attachment, true);
    expect(state()).toBe("closed");
    expect(calls).toEqual([]);
  });
});
