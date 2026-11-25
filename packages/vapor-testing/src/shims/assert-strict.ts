import { expect } from "vite-plus/test";

/* Vitest's `toStrictEqual`, like Node's deep-strict comparison, compares prototypes, `undefined` properties and sparse
   arrays. */

type Message = string | Error | undefined;

export class AssertionError extends Error {
  override readonly name = "AssertionError";
}

/* BOUNDARY: Node's `node:assert/strict` contract, whose checks take any value. */
function failWith(message: Message, cause: unknown): never {
  if (message instanceof Error) throw message;
  if (message === undefined) throw cause;
  throw new AssertionError(message, { cause });
}

/* BOUNDARY: Node's `node:assert/strict` contract, whose checks take any value. */
function check(message: Message, assertion: () => void): void {
  try {
    assertion();
  } catch (error) {
    failWith(message, error);
  }
}

/* BOUNDARY: Node's `node:assert/strict` contract, whose checks take any value. */
function ok(value: unknown, message?: Message): asserts value {
  check(message, () => expect(value).toBeTruthy());
}

/* BOUNDARY: Node's `node:assert/strict` contract, whose checks take any value. */
function equal<T>(actual: unknown, expected: T, message?: Message): asserts actual is T {
  check(message, () => expect(actual).toBe(expected));
}

/* BOUNDARY: Node's `node:assert/strict` contract, whose checks take any value. */
function notEqual(actual: unknown, expected: unknown, message?: Message): void {
  check(message, () => expect(actual).not.toBe(expected));
}

/* BOUNDARY: Node's `node:assert/strict` contract, whose checks take any value. */
function deepEqual<T>(actual: unknown, expected: T, message?: Message): asserts actual is T {
  check(message, () => expect(actual).toStrictEqual(expected));
}

/* BOUNDARY: Node's `node:assert/strict` contract, whose checks take any value. */
function notDeepEqual(actual: unknown, expected: unknown, message?: Message): void {
  check(message, () => expect(actual).not.toStrictEqual(expected));
}

/* BOUNDARY: Node's `node:assert/strict` contract, whose checks take any value. */
function partialDeepStrictEqual(actual: unknown, expected: unknown, message?: Message): void {
  // SAFETY: Node compares a partial expectation against the actual value's properties, which takes an object.
  check(message, () => expect(actual).toMatchObject(expected as object));
}

/* BOUNDARY: Node's `node:assert/strict` contract, whose checks take any value. */
function match(actual: string, pattern: RegExp, message?: Message): void {
  check(message, () => expect(actual).toMatch(pattern));
}

/* BOUNDARY: Node's `node:assert/strict` contract, whose checks take any value. */
function doesNotMatch(actual: string, pattern: RegExp, message?: Message): void {
  check(message, () => expect(actual).not.toMatch(pattern));
}

/* BOUNDARY: Node's error expectations, including a validation function that receives whatever was thrown. */
type ErrorExpectation = RegExp | (new (...args: never[]) => Error) | ((error: unknown) => boolean) | object;

/* BOUNDARY: Node's `node:assert/strict` contract, whose checks take any value. */
function verifyError(error: unknown, expected: ErrorExpectation | undefined, message: Message): void {
  if (expected === undefined) return;
  if (expected instanceof RegExp) return check(message, () => expect(String(error)).toMatch(expected));
  if (typeof expected === "function") {
    if (expected.prototype instanceof Error || expected === Error) {
      return check(message, () => expect(error).toBeInstanceOf(expected));
    }
    // SAFETY: A function that is not an Error constructor is Node's validation-function form.
    if ((expected as (error: unknown) => boolean)(error) !== true) failWith(message, error);
    return;
  }
  check(message, () => expect(error).toMatchObject(expected));
}

/* BOUNDARY: Node's `node:assert/strict` contract, whose checks take any value. */
function throws(block: () => unknown, expected?: ErrorExpectation | string, message?: Message): void {
  if (typeof expected === "string") return throws(block, undefined, expected);
  let thrown: { readonly error: unknown } | undefined;
  try {
    block();
  } catch (error) {
    thrown = { error };
  }
  if (thrown === undefined) failWith(message, new AssertionError("Missing expected exception."));
  verifyError(thrown.error, expected, message);
}

/* BOUNDARY: Node's `node:assert/strict` contract, whose checks take any value. */
async function rejects(
  promiseOrBlock: Promise<unknown> | (() => Promise<unknown>),
  expected?: ErrorExpectation | string,
  message?: Message,
): Promise<void> {
  if (typeof expected === "string") return rejects(promiseOrBlock, undefined, expected);
  let rejected: { readonly error: unknown } | undefined;
  try {
    await (typeof promiseOrBlock === "function" ? promiseOrBlock() : promiseOrBlock);
  } catch (error) {
    rejected = { error };
  }
  if (rejected === undefined) failWith(message, new AssertionError("Missing expected rejection."));
  verifyError(rejected.error, expected, message);
}

/* BOUNDARY: Node's `node:assert/strict` contract, whose checks take any value. */
function fail(message: Message = "Failed"): never {
  failWith(message, undefined);
}

const assert = Object.assign((value: unknown, message?: Message): asserts value => ok(value, message), {
  AssertionError,
  deepEqual,
  deepStrictEqual: deepEqual,
  doesNotMatch,
  equal,
  fail,
  match,
  notDeepEqual,
  notDeepStrictEqual: notDeepEqual,
  notEqual,
  notStrictEqual: notEqual,
  ok,
  partialDeepStrictEqual,
  rejects,
  strictEqual: equal,
  throws,
});

export {
  deepEqual,
  deepEqual as deepStrictEqual,
  doesNotMatch,
  equal,
  fail,
  match,
  notDeepEqual,
  notEqual,
  ok,
  rejects,
  equal as strictEqual,
  throws,
};
export { assert as strict };
export default assert;
