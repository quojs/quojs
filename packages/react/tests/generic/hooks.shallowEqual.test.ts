import { describe, it, expect } from "vitest";
import { shallowEqual } from "../../src";

describe("shallowEqual", () => {
  it("returns true for same reference", () => {
    const a = { x: 1 };
    expect(shallowEqual(a, a)).toBe(true);
  });

  it("handles nulls and different key counts", () => {
    expect(shallowEqual(null as unknown as Record<string, unknown>, {})).toBe(false);
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 } as unknown as Record<string, unknown>)).toBe(false);
  });

  it("detects differing values with same keys", () => {
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("true when all keys and values match (by Object.is)", () => {
    expect(shallowEqual({ a: 0, b: Number.NaN }, { a: 0, b: Number.NaN })).toBe(true);
  });
});
