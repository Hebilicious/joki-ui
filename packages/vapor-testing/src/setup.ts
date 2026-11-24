import { afterEach } from "vite-plus/test";

import { cleanup, configure } from "./render.ts";

// Node runs timers on two queues: `setTimeout` and `setImmediate`. Effect's scheduler and Node-minded code yield
// through `setImmediate` when the global has one, so the page gets the same second queue: a real macrotask, which a
// test fakes only by naming `setImmediate`.
// SAFETY: The page's global object, read for two optional members the browser may not define.
installImmediateQueue(globalThis as { setImmediate?: unknown; clearImmediate?: unknown });

// Vue's development build waits three seconds for Vue Devtools on every app it creates, so under a fake clock each
// mount would leave that wait pending among the component's own timers. Tests run without devtools, so a no-op hook
// answers the wait up front.
// SAFETY: The page's global object, read for the one optional member Vue looks up there.
const devtoolsHost = globalThis as { __VUE_DEVTOOLS_GLOBAL_HOOK__?: object };
devtoolsHost.__VUE_DEVTOOLS_GLOBAL_HOOK__ ??= { enabled: false, emit() {}, on() {}, once() {}, off() {} };

afterEach(() => cleanup());

configure({
  // The default pretty-prints the whole mounted DOM into every failed query's error, and `findBy*` retries a failing
  // query until its timeout, paying that serialization on every retry.
  getElementError: (message) => {
    const error = new Error(message ?? "Unable to find element");
    error.name = "TestingLibraryElementError";
    return error;
  },
});

/* BOUNDARY: Reads the page's globals, which the browser defines rather than this code. */
function installImmediateQueue(host: { setImmediate?: unknown; clearImmediate?: unknown }): void {
  if (typeof host.setImmediate === "function") return;
  const pending = new Map<number, () => void>();
  const channel = new MessageChannel();
  let nextId = 0;
  channel.port1.onmessage = ({ data }: MessageEvent<number>) => {
    const task = pending.get(data);
    pending.delete(data);
    task?.();
  };
  host.setImmediate = (task: (...args: unknown[]) => void, ...args: unknown[]): number => {
    nextId += 1;
    pending.set(nextId, () => task(...args));
    channel.port2.postMessage(nextId);
    return nextId;
  };
  host.clearImmediate = (id: number): void => {
    pending.delete(id);
  };
}
