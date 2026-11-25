import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { isDeepStrictEqual } from "node:util";
import { describe, expect, test } from "vite-plus/test";

describe("Node built-in shims", () => {
  test("assert/strict compares deeply and reports a mismatch", async () => {
    assert.deepEqual({ a: [1, 2] }, { a: [1, 2] });
    expect(() => assert.deepEqual({ a: 1 }, { a: 2 })).toThrow();
    expect(() => assert.equal(1, 2, "one is not two")).toThrow("one is not two");
    await assert.rejects(Promise.reject(new TypeError("no")), TypeError);
  });

  test("util.isDeepStrictEqual tells equal from unequal values", () => {
    expect(isDeepStrictEqual({ a: [1] }, { a: [1] })).toBe(true);
    expect(isDeepStrictEqual({ a: [1] }, { a: [2] })).toBe(false);
  });

  test("timers/promises setImmediate resolves with its value after the current task", async () => {
    const order: string[] = [];
    const settled = setImmediate("later").then((value) => order.push(value));
    order.push("now");
    await settled;
    expect(order).toEqual(["now", "later"]);
  });
});
