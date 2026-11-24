export function setImmediate<T = void>(value?: T): Promise<T> {
  return new Promise((resolve) => {
    // SAFETY: Like Node's, a call without a value resolves with `undefined`, which `T` defaults to.
    globalThis.setImmediate(() => resolve(value as T));
  });
}
