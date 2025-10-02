import { expect, vi, describe, it, beforeEach } from "vitest";
import { createStore, Store } from "../../src";

/**
 * helper reducers used across tests */
const counterInitial = { value: 0 };
const counterReducer = (state = counterInitial, action: any) => {
  switch (action.event) {
    case "inc":
      return { value: state.value + 1 };
    case "dec":
      return { value: state.value - 1 };
    case "add":
      return { value: state.value + action.payload.value };
    default:
      return state;
  }
};

const auditInitial = { logs: [] as string[] };
const auditReducer = (state = auditInitial, action: any) => {
  if (action.event === "log") {
    return { logs: [...state.logs, action.payload.msg] };
  }
  return state;
};

describe("Store", () => {
  let store: any;

  beforeEach(() => {
    store = createStore({
      name: "test",
      reducer: {
        counter: {
          actions: [
            ["counter", "inc"],
            ["counter", "dec"],
            ["counter", "add"],
          ],
          state: counterInitial,
          reducer: counterReducer,
        },
        audit: {
          actions: [["audit", "log"]],
          state: auditInitial,
          reducer: auditReducer,
        },
      },
      middleware: [],
    });
  });

  it("initializes state correctly", () => {
    expect(store.getState()).toEqual({ counter: { value: 0 }, audit: { logs: [] } });
  });

  it("dispatches actions and updates state", async () => {
    await store.dispatch("counter", "inc", undefined);
    expect(store.getState().counter.value).toBe(1);

    await store.dispatch("counter", "add", { value: 2 });
    expect(store.getState().counter.value).toBe(3);

    await store.dispatch("counter", "dec", undefined);
    expect(store.getState().counter.value).toBe(2);
  });

  it("ignores unknown events", async () => {
    await store.dispatch("counter", "unknown", {});
    expect(store.getState().counter.value).toBe(0);
  });

  it("subscribes and unsubscribes to global changes", async () => {
    const cb = vi.fn();
    const unsub = store.subscribe(cb);

    await store.dispatch("counter", "inc", undefined);
    expect(cb).toHaveBeenCalled();

    unsub();
    await store.dispatch("counter", "inc", undefined);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("connect() receives atomic property changes", async () => {
    const spy = vi.fn();
    const unsub = store.connect({ reducer: "counter", property: "value" }, spy);

    await store.dispatch("counter", "inc", undefined);
    // change object now includes a `path` field; allow extras via objectContaining
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ oldValue: 0, newValue: 1, path: "value" }),
    );

    unsub();
    await store.dispatch("counter", "inc", undefined);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("middleware can block or modify actions", async () => {
    let called = false;
    const blockInc = async (_s: any, a: any) => {
      if (a.event === "inc") {
        called = true;
        return false;
      }
      return true;
    };
    const storeWithMw = createStore({
      name: "test",
      reducer: {
        counter: {
          actions: [
            ["counter", "inc"],
            ["counter", "add"],
          ],
          state: { value: 0 },
          reducer: counterReducer,
        },
      },
      middleware: [blockInc],
    });

    await storeWithMw.dispatch("counter", "inc", undefined);
    expect(called).toBe(true);
    expect(storeWithMw.getState().counter.value).toBe(0);

    await storeWithMw.dispatch("counter", "add", { value: 10 });
    expect(storeWithMw.getState().counter.value).toBe(10);
  });

  it("handles async middleware/queue", async () => {
    const calls: string[] = [];
    const asyncMw = async (_: any, action: any) => {
      calls.push(action.event);
      await new Promise((res) => setTimeout(res, 10));
      return true;
    };
    const storeWithAsync = createStore({
      name: "test",
      reducer: {
        counter: {
          actions: [
            ["counter", "inc"],
            ["counter", "add"],
          ],
          state: { value: 0 },
          reducer: counterReducer,
        },
      },
      middleware: [asyncMw],
    });

    await Promise.all([
      storeWithAsync.dispatch("counter", "inc", undefined),
      storeWithAsync.dispatch("counter", "add", { value: 10 }),
    ]);

    expect(storeWithAsync.getState().counter.value).toBe(11);
    expect(calls).toContain("inc");
    expect(calls).toContain("add");
  });

  describe("Effects", () => {
    it("effect runs after reducers and sees updated state", async () => {
      const effectSpy = vi.fn();

      store.registerEffect((action: { channel: string; event: string }, getState: any) => {
        if (action.channel === "counter" && action.event === "inc") {
          effectSpy(getState().counter.value);
        }
      });

      await store.dispatch("counter", "inc", undefined);
      expect(effectSpy).toHaveBeenCalledWith(1); // state updated
    });

    it("onEffect helper filters channel/event", async () => {
      const spy = vi.fn();

      store.onEffect(
        "counter",
        "add",
        (payload: any, _get: any, _dispatch: any, a: { event: string }) => {
          spy(payload, a.event);
        },
      );

      await store.dispatch("counter", "inc", undefined); // should NOT trigger
      await store.dispatch("counter", "add", { value: 5 }); // should trigger
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ value: 5 }, "add");
    });

    it("runs effects even when reducers do not change state", async () => {
      const spy = vi.fn();

      // 'noop' is not handled by any reducer; state won't change, effect still fires
      store.onEffect(
        "counter",
        "noop" as any,
        (_payload: any, _get: any, _dispatch: any, a: { event: string }) => {
          spy(a.event);
        },
      );

      await store.dispatch("counter", "noop" as any, { foo: 1 });
      expect(spy).toHaveBeenCalledWith("noop");
      expect(store.getState().counter.value).toBe(0);
    });

    it("effect does not run when middleware blocks propagation", async () => {
      const spy = vi.fn();
      const blockInc = async () => false;
      const storeWithMw = createStore({
        name: "test",
        reducer: {
          counter: {
            actions: [["counter", "inc"]],
            state: { value: 0 },
            reducer: (s: any) => s,
          },
        },
        middleware: [blockInc],
      });

      storeWithMw.onEffect("counter", "inc", () => spy());
      await storeWithMw.dispatch("counter", "inc", undefined);

      expect(spy).not.toHaveBeenCalled();
      expect(storeWithMw.getState().counter.value).toBe(0);
    });

    it("registerEffect disposer stops further invocations", async () => {
      const spy = vi.fn();
      const off = store.onEffect("counter", "inc", () => spy());

      await store.dispatch("counter", "inc", undefined);
      expect(spy).toHaveBeenCalledTimes(1);
      off(); // dispose

      await store.dispatch("counter", "inc", undefined);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("effect can dispatch follow-up actions; queue remains serialized", async () => {
      // On inc, add +5
      const off = store.onEffect("counter", "inc", (_p: any, _g: any, dispatch: any) => {
        return dispatch("counter", "add", { value: 5 });
      });

      await store.dispatch("counter", "inc", undefined);

      expect(store.getState().counter.value).toBe(6); // 1 from reducer + 5 from effect
      off();
    });

    it("multiple effects run in registration order", async () => {
      const order: string[] = [];
      const offA = store.registerEffect((a: any) => {
        if (a.channel === "counter" && a.event === "inc") order.push("A");
      });
      const offB = store.registerEffect((a: any) => {
        if (a.channel === "counter" && a.event === "inc") order.push("B");
      });

      await store.dispatch("counter", "inc", undefined);
      expect(order).toEqual(["A", "B"]);
      offA();
      offB();
    });

    it("effect sees updated state across multiple reducers (if supported)", async () => {
      // This test requires dynamic reducer registration
      if (typeof store.registerReducer !== "function") {
        return; // Skip if Store hasn't enabled dynamic reducers yet
      }
      const mirrorReducer = (state = { mirror: 0 }, action: any) => {
        if (action.channel === "counter" && action.event === "inc") {
          return { mirror: state.mirror + 1 };
        }

        return state;
      };

      const offReducer = store.registerReducer("mirror:state", {
        actions: [["counter", "inc"]],
        state: { mirror: 0 },
        reducer: mirrorReducer as any,
      });

      const seen: Array<{ c: number; m: number }> = [];
      const offFx = store.onEffect("counter", "inc", (_p: any, get: any) => {
        const s = get();

        seen.push({ c: s.counter.value, m: s["mirror:state"].mirror });
      });

      await store.dispatch("counter", "inc", undefined);
      expect(seen[0]).toEqual({ c: 1, m: 1 });

      offFx();
      offReducer();
    });

    it("errors inside effect do not reject dispatch", async () => {
      store.registerEffect(() => {
        throw new Error("boom");
      });
      await expect(store.dispatch("counter", "inc", undefined)).resolves.toBeUndefined();
    });
  });

  describe("Redux Devtools integration", () => {
    it("attaches Redux DevTools in browser", () => {
      const mockConnect = vi.fn(() => ({ init: vi.fn(), subscribe: vi.fn() }));
      (globalThis as any).window = { __REDUX_DEVTOOLS_EXTENSION__: { connect: mockConnect } };

      createStore({
        name: "test",
        reducer: {
          counter: {
            actions: [["counter", "inc"]],
            state: { value: 0 },
            reducer: (s: any) => s,
          },
        },
        middleware: [],
      });

      expect(mockConnect).toHaveBeenCalled();
      delete (globalThis as any).window;
    });

    it("catches errors during dispatch queue processing", async () => {
      const erroringMw = async () => {
        throw new Error("middleware error");
      };
      const s2 = createStore({
        name: "test",
        reducer: {
          counter: {
            actions: [["counter", "inc"]],
            state: { value: 0 },
            reducer: (s: any) => s,
          },
        },
        middleware: [erroringMw],
      });

      await expect(s2.dispatch("counter", "inc", undefined)).resolves.toBeUndefined();
    });
  });
});

describe("Store.unmountSlice catch branch", () => {
  it("swallows errors thrown by slice unsubscribe functions during unmount", () => {
    const s = createStore({
      name: "test",
      reducer: {
        a: {
          actions: [["a", "x"]],
          state: { n: 0 },
          reducer: (st = { n: 0 }, _a: any) => st,
        },
      },
      middleware: [],
    });

    // Force the slice's stored unsub to throw when invoked
    (s as any).sliceUnsubs.set("a", [
      () => {
        throw new Error("boom");
      },
    ]);

    // Removing the slice should *not* throw (covers try/catch in unmountSlice)
    s.replaceReducers({} as any, { preserveState: false });

    // Still reachable; state no longer has the slice
    expect((s.getState() as any).a).toBeUndefined();
  });
});

describe("Store helper methods", () => {
  const s = createStore({
    name: "test",
    reducer: {
      r: {
        actions: [["r", "noop"]],
        state: { a: { b: 1 }, arr: [{ z: 9 }] },
        reducer: (st = { a: { b: 1 }, arr: [{ z: 9 }] }, _a: any) => st,
      },
    },
    middleware: [],
  });

  it("getAtPath handles empty path, leading dot, unknown path, and array indices", () => {
    const slice = (s.getState() as any).r;
    const getAtPath = (s as any).getAtPath.bind(s);

    // empty path returns the whole object
    expect(getAtPath(slice, "")).toBe(slice);

    // leading dot is normalized
    expect(getAtPath(slice, ".a.b")).toBe(1);

    // arrays by numeric string
    expect(getAtPath(slice, "arr.0.z")).toBe(9);

    // unknown returns undefined without throwing
    expect(getAtPath(slice, "a.missing.key")).toBeUndefined();
  });

  it("buildAncestorPaths trims leading dot and returns progressive ancestors", () => {
    const paths = Store.buildAncestorPaths(".x.y");
    expect(paths).toEqual(["x", "x.y"]);

    const empty = Store.buildAncestorPaths("");
    expect(empty).toEqual([]);
  });
});
