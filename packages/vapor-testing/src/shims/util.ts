import { expect } from "vite-plus/test";

/* BOUNDARY: Node's `isDeepStrictEqual`, which compares any two values. */
export function isDeepStrictEqual(actual: unknown, expected: unknown): boolean {
  try {
    expect(actual).toStrictEqual(expected);
    return true;
  } catch {
    return false;
  }
}
