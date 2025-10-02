// file: packages\quojs\src\store\Store.runtime.test.ts
import { describe, it, expect, vi } from "vitest";
import { createStore, typedActions } from "../../src";

describe("Store runtime features", () => {
  it("registerReducer emits change on add/remove and wires actions", async () => {
    const base = createStore({
    name: "test",
      reducer: {
        counter: {
          actions: [["counter", "inc"]],
          state: { value: 0 },
          reducer: (s = { value: 0 }, a: any) =>
            a.event === "inc" ? { value: s.value + 1 } : s,
        },
      },
      middleware: [],
    });

    const coarse = vi.fn();
    const offCoarse = base.subscribe(coarse);

    // add mirror reducer that listens to 'counter/inc'
    const offReducer = base.registerReducer("mirror", {
      actions: [["counter", "inc"]],
      state: { seen: 0 },
      reducer: (s = { seen: 0 }, a: any) => (a.event === "inc" ? { seen: s.seen + 1 } : s),
    });

    // adding the slice broadcasts a coarse change
    expect(coarse).toHaveBeenCalled();

    await base.dispatch("counter", "inc", undefined);
    const st = base.getState() as any;
    expect(st.counter.value).toBe(1);
    expect(st.mirror.seen).toBe(1);

    // remove the slice and expect another coarse change
    offReducer();
    expect(coarse.mock.calls.length).toBeGreaterThanOrEqual(2);

    offCoarse();
  });

  it("registerMiddleware disposer removes middleware", async () => {
    const s = createStore({
    name: "test",
      reducer: {
        counter: {
          actions: [["counter", "add"]],
          state: { value: 0 },
          reducer: (st = { value: 0 }, a: any) =>
            a.event === "add" ? { value: st.value + a.payload.value } : st,
        },
      },
      middleware: [],
    });

    const blocker = vi.fn(() => false);
    const off = s.registerMiddleware(async (__, _) => blocker());

    await s.dispatch("counter", "add", { value: 5 });
    expect(s.getState().counter.value).toBe(0);
    expect(blocker).toHaveBeenCalled();

    off(); // remove middleware
    await s.dispatch("counter", "add", { value: 5 });
    expect(s.getState().counter.value).toBe(5);
  });

  it("__applyExternalState emits deep-path changes (time travel)", async () => {
    const s = createStore({
    name: "test",
      reducer: {
        todo: {
          actions: [["todo", "set"]],
          state: { data: { a: { title: "x" } } as any },
          reducer: (st = { data: { a: { title: "x" } } }, _: any) => st, // noop
        },
      },
      middleware: [],
    });

    const deepSpy = vi.fn();
    const off = s.connect({ reducer: "todo", property: "data.a.title" }, deepSpy);

    // simulate DevTools time travel by invoking the private method
    const nextState = { todo: { data: { a: { title: "y" } } } };
    (s as any).__applyExternalState(nextState);

    expect(deepSpy).toHaveBeenCalledTimes(1);
    expect(deepSpy.mock.calls[0][0]).toMatchObject({
      path: "data.a.title",
      oldValue: "x",
      newValue: "y",
    });

    off();
  });
});
