import { describe, it, expect } from "vitest";
import { detectChangedProps } from "../../src/utils/detectChangedProps";

describe("detectChangedProps", () => {
  it("returns [] for referentially equal values", () => {
    const o = { a: 1 };
    expect(detectChangedProps(o, o)).toEqual([]);
  });

  it("reports primitive change at root", () => {
    expect(detectChangedProps(1 as any, 2 as any, "root")).toEqual(["root"]);
  });

  it("reports object primitive leaf change with proper dotted path", () => {
    const a = { x: { y: 1 } };
    const b = { x: { y: 2 } };

    expect(detectChangedProps(a, b)).toEqual(["x.y"]);
  });

  it("reports added and removed keys", () => {
    const a = { a: 1 };
    const b = { b: 1 };
    const res = detectChangedProps(a, b);

    // Order doesn't matter; set compare
    expect(new Set(res)).toEqual(new Set(["a", "b"]));
  });

  it("handles arrays: element change yields index path", () => {
    const a = { arr: [1, 2, 3] };
    const b = { arr: [1, 9, 3] };

    expect(detectChangedProps(a, b)).toEqual(["arr.1"]);
  });

  it("handles arrays: length change marks the array path", () => {
    const a = { arr: [1, 2, 3] };
    const b = { arr: [1, 2, 3, 4] };

    expect(detectChangedProps(a, b)).toEqual(["arr"]);
  });

  it("does not emit leading dot for top-level array index", () => {
    const a = [1, 2];
    const b = [1, 3];

    expect(detectChangedProps(a, b)).toEqual(["1"]);
  });

  it("treats object vs array mismatch as change on the parent path", () => {
    const a = { v: [1] };
    const b = { v: { "0": 1 } };

    expect(detectChangedProps(a, b)).toEqual(["v"]);
  });

  it("Date values: same time -> no change; different -> change", () => {
    const t = new Date("2024-01-01T00:00:00Z");
    const a = { d: new Date(t) };
    const b = { d: new Date(t) };
    const c = { d: new Date("2024-01-02T00:00:00Z") };

    expect(detectChangedProps(a, b)).toEqual([]);
    expect(detectChangedProps(a, c)).toEqual(["d"]);
  });

  it("RegExp values: same src+flags -> no change; else -> change", () => {
    const a = { r: /ab/i };
    const b = { r: /ab/i };
    const c = { r: /ab/ };
    const d = { r: /abc/i };

    expect(detectChangedProps(a, b)).toEqual([]);
    expect(detectChangedProps(a, c)).toEqual(["r"]);
    expect(detectChangedProps(a, d)).toEqual(["r"]);
  });

  it("circular references do not blow up", () => {
    const a: any = { x: 1 };
    a.self = a;
    const b: any = { x: 2 };
    b.self = b;

    expect(detectChangedProps(a, b)).toEqual(["x"]);
  });

  it("mixed types on a key appear as that key changed", () => {
    const a = { k: 1 as any };
    const b = { k: { n: 1 } as any };

    expect(detectChangedProps(a, b)).toEqual(["k"]);
  });

  it("returns empty for referentially equal", () => {
    const a = { x: 1 };

    expect(detectChangedProps(a, a)).toEqual([]);
  });

  it("flags primitives and null transitions", () => {
    expect(detectChangedProps(1 as any, 2 as any, "a")).toEqual(["a"]);
    expect(detectChangedProps(null as any, {} as any, "b")).toEqual(["b"]);
  });

  it("handles Date and RegExp", () => {
    expect(detectChangedProps(new Date(1) as any, new Date(1) as any, "d")).toEqual([]);
    expect(detectChangedProps(new Date(1) as any, new Date(2) as any, "d")).toEqual(["d"]);
    expect(detectChangedProps(/a/g as any, /a/g as any, "r")).toEqual([]);
    expect(detectChangedProps(/a/g as any, /a/i as any, "r")).toEqual(["r"]);
  });

  it("walks arrays and objects producing dotted leaf paths", () => {
    const a = {
      items: [
        { id: 1, name: "A" },
        { id: 2, name: "B" },
      ],
    };
    const b = {
      items: [
        { id: 1, name: "A1" },
        { id: 2, name: "B" },
      ],
    };
    const paths = detectChangedProps(a, b);

    expect(paths).toContain("items.0.name");
    expect(paths.some((p) => p.startsWith("items"))).toBe(true);
  });

  it("pair-aware cycle guard doesn't recurse infinitely and doesn't false-skip", () => {
    const a: any = { n: 1 };
    a.self = a;
    
    const b: any = { n: 2 };
    b.self = b;

    const paths = detectChangedProps(a, b);

    expect(paths).toContain("n");
  });
});

describe("detectChangedProps extra branches", () => {
  it("array vs non-array mismatch marks the path", () => {
    const a = { x: [1, 2, 3] } as any;
    const b = { x: { 0: 1 } } as any;

    expect(detectChangedProps(a, b)).toContain("x");
  });

  it("added and removed keys are reported", () => {
    const a = { x: 1, y: 2 } as any;
    const b = { y: 2 } as any;
    const paths = detectChangedProps(a, b);

    expect(paths).toContain("x"); // removed

    const c = {} as any;
    const d = { z: 3 } as any;
    
    expect(detectChangedProps(c, d)).toContain("z"); // added
  });
});
