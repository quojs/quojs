import { describe, it, expect, vi } from "vitest";

import { createStore } from "../../src";

describe("Store no-op change branch", () => {
  const origWin = (globalThis as any).window;
  afterEach(() => {
    (globalThis as any).window = origWin;
  });

  it("new object with same values triggers no notifications (coarse)", async () => {
    // Make sure Redux DevTools is not present for this test file
    (globalThis as any).window = undefined;

    const store = createStore({
    name: "test",
      reducer: {
        counter: {
          actions: [["counter", "same"]],
          state: { value: 1 },
          reducer: (s: any, a: any) => (a.event === "same" ? { value: 1 } : s), // equal content
        },
      },
      middleware: [],
    });

    const sub = vi.fn();
    const off = store.subscribe(sub);

    await store.dispatch("counter", "same", undefined);

    expect(store.getState().counter.value).toBe(1);
    expect(sub).not.toHaveBeenCalled();

    off();
  });

  it("deep path subscriber does not fire on semantic no-op", async () => {
    const store = createStore({
    name: "test",
      reducer: {
        counter: {
          actions: [["counter", "same"]],
          state: { value: 1 },
          reducer: (s: any, a: any) => (a.event === "same" ? { value: 1 } : s),
        },
      },
      middleware: [],
    });

    const spy = vi.fn();
    const off = store.connect({ reducer: "counter", property: "value" }, spy);

    await store.dispatch("counter", "same", undefined);

    expect(spy).not.toHaveBeenCalled();
    off();
  });
});
