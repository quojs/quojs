import { describe, it, expect } from "vitest";
import { freezeState } from "../../src/utils/immutability";

describe("freezeState", () => {
  it("deep-freezes plain objects and arrays", () => {
    const o = { a: { b: [1, { c: 2 }] } };
    const f = freezeState(o);

    expect(Object.isFrozen(f)).toBe(true);
    expect(Object.isFrozen(f.a)).toBe(true);
    expect(Object.isFrozen(f.a.b)).toBe(true);
    expect(Object.isFrozen(f.a.b[1])).toBe(true);

    // Mutation attempts should throw in strict mode or no-op; we check non-writability
    expect(() => ((f as any).a = 1)).toThrow();
  });

  it("handles symbol keys", () => {
    const S = Symbol("s");
    const o: any = { a: 1 };
    o[S] = { deep: { n: 1 } };

    const f: any = freezeState(o);
    expect(Object.isFrozen(f[S])).toBe(true);
    expect(Object.isFrozen(f[S].deep)).toBe(true);
  });

  it("returns input if already frozen (idempotent)", () => {
    const o = Object.freeze({ a: Object.freeze({ b: 1 }) });
    const f = freezeState(o);

    expect(f).toBe(o);
  });

  it("does not infinite-loop on circular refs", () => {
    const a: any = { x: 1 };
    a.self = a;

    const f: any = freezeState(a);
    expect(Object.isFrozen(f)).toBe(true);
    expect(f.self).toBe(f);
  });

  it("deep-freezes plain objects and arrays", () => {
    const obj = { a: { b: [1, 2, { c: 3 }] } };
    const frozen = freezeState(obj);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.a)).toBe(true);
    expect(Object.isFrozen(frozen.a.b)).toBe(true);
  });

  it("preserves symbols and doesn't break getters/setters", () => {
    const sym = Symbol("k");
    const obj: any = {};
    Object.defineProperty(obj, "g", {
      get() {
        return 1;
      },
    });
    obj[sym] = { x: 1 };
    const frozen = freezeState(obj);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen[sym])).toBe(true);
    // getter still works
    expect(frozen.g).toBe(1);
  });
});

describe("freezeState extra branches", () => {
  it("returns the same object if already frozen", () => {
    const obj = Object.freeze({ a: 1 });
    const out = freezeState(obj);

    expect(out).toBe(obj);
  });

  it("handles cyclic structures via seen guard", () => {
    const a: any = { n: 1 };
    a.self = a;
    const out = freezeState(a);
    
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(out.self)).toBe(true);
  });
});
