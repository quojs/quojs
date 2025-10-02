import { describe, it, expect, vi, afterEach } from "vitest";

import { createStore } from "../../src";

function mockDevtools(send = vi.fn()) {
  const api = {
    init: vi.fn(),
    send,
    subscribe: vi.fn(() => undefined),
  };
  const connect = vi.fn(() => api);
  (globalThis as any).window = { __REDUX_DEVTOOLS_EXTENSION__: { connect } };
  return { api, connect };
}

describe("Store DevTools paths", () => {
  const orig = (globalThis as any).window;
  afterEach(() => {
    (globalThis as any).window = orig;
  });

  it("calls devtools.send on dispatch", async () => {
    const { api } = mockDevtools();
    const init = vi.fn();
    // Accept the callback so other tests that call it don't explode.
    const subscribe = vi.fn((_: (msg: any) => void) => {
      // no-op; we don't need to trigger messages in this test
      return undefined;
    });

    const connect = vi.fn(() => ({ init, subscribe, send: api.send }));
    (globalThis as any).window = { __REDUX_DEVTOOLS_EXTENSION__: { connect } };

    const store = createStore({
    name: "test",
      reducer: {
        counter: {
          actions: [["counter", "inc"]],
          state: { value: 0 },
          reducer: (s: any, a: any) => (a.event === "inc" ? { value: s.value + 1 } : s),
        },
      },
      middleware: [],
    });

    await store.dispatch("counter", "inc", undefined);

    expect(connect).toHaveBeenCalled();
    expect(init).toHaveBeenCalledWith({ counter: { value: 1 } });
    expect(api.send).toHaveBeenCalled();
  });

  it("handles JUMP_TO_STATE / JUMP_TO_ACTION / ROLLBACK / RESET", async () => {
    let cb: any;
    const init = vi.fn();
    const subscribe = vi.fn((fn: any) => {
      cb = fn;
    });
    const connect = vi.fn(() => ({ init, subscribe, send: vi.fn() }));
    (globalThis as any).window = { __REDUX_DEVTOOLS_EXTENSION__: { connect } };

    const store = createStore({
    name: "test",
      reducer: {
        counter: {
          actions: [["counter", "inc"]],
          state: { value: 0 },
          reducer: (s: any, a: any) => (a.event === "inc" ? { value: s.value + 1 } : s),
        },
      },
      middleware: [],
    });

    cb({
      type: "DISPATCH",
      payload: { type: "JUMP_TO_STATE" },
      state: JSON.stringify({ counter: { value: 7 } }),
    });
    expect(store.getState().counter.value).toBe(7);

    cb({
      type: "DISPATCH",
      payload: { type: "ROLLBACK" },
      state: JSON.stringify({ counter: { value: 1 } }),
    });
    expect(store.getState().counter.value).toBe(1);

    cb({
      type: "DISPATCH",
      payload: { type: "RESET" },
      state: JSON.stringify({ counter: { value: 0 } }),
    });
    expect(store.getState().counter.value).toBe(0);

    cb({
      type: "DISPATCH",
      payload: { type: "JUMP_TO_ACTION" },
      state: JSON.stringify({ counter: { value: 2 } }),
    });
    expect(store.getState().counter.value).toBe(2);
  });

  it("handles IMPORT_STATE and COMMIT", async () => {
    let cb: any;
    const init = vi.fn();
    const subscribe = vi.fn((fn: any) => {
      cb = fn;
    });
    const connect = vi.fn(() => ({ init, subscribe, send: vi.fn() }));
    (globalThis as any).window = { __REDUX_DEVTOOLS_EXTENSION__: { connect } };

    const store = createStore({
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

    cb({
      type: "DISPATCH",
      payload: { type: "IMPORT_STATE" },
      nextLiftedState: {
        computedStates: [
          { state: { counter: { value: 1 } } },
          { state: { counter: { value: 9 } } },
        ],
      },
    });
    expect(store.getState().counter.value).toBe(9);

    cb({ type: "DISPATCH", payload: { type: "COMMIT" } });
    expect(init).toHaveBeenCalled();
  });
});

describe("Store DevTools additional DISPATCH kinds", () => {
  it("handles COMMIT, IMPORT_STATE, JUMP_TO_STATE and fallback state string", async () => {
    const init = vi.fn();
    let cb: any;
    const subscribe = vi.fn((fn: any) => {
      cb = fn;
    });
    const send = vi.fn();
    (globalThis as any).window = {
      __REDUX_DEVTOOLS_EXTENSION__: { connect: vi.fn(() => ({ init, subscribe, send })) },
    };

    const store = createStore({
    name: "test",
      reducer: {
        counter: {
          actions: [["counter", "inc"]],
          state: { value: 0 },
          reducer: (s: any, a: any) => (a.event === "inc" ? { value: s.value + 1 } : s),
        },
      },
      middleware: [],
    });

    // COMMIT re-inits
    cb({ type: "DISPATCH", payload: { type: "COMMIT" } });
    expect(init).toHaveBeenCalledTimes(3);

    // IMPORT_STATE takes the latest computed state
    cb({
      type: "DISPATCH",
      payload: { type: "IMPORT_STATE" },
      nextLiftedState: {
        computedStates: [
          { state: { counter: { value: 2 } } },
          { state: { counter: { value: 9 } } },
        ],
      },
    });
    expect(store.getState().counter.value).toBe(9);

    // JUMP_TO_STATE with explicit state string
    cb({
      type: "DISPATCH",
      payload: { type: "JUMP_TO_STATE" },
      state: JSON.stringify({ counter: { value: 123 } }),
    });
    expect(store.getState().counter.value).toBe(123);

    // Fallback: unknown type but state string present -> apply
    cb({
      type: "DISPATCH",
      payload: { type: "SOME_UNKNOWN" },
      state: JSON.stringify({ counter: { value: 7 } }),
    });
    expect(store.getState().counter.value).toBe(7);

    // ROLLBACK/JUMP_TO_ACTION same path as JUMP_TO_STATE
    cb({
      type: "DISPATCH",
      payload: { type: "ROLLBACK" },
      state: JSON.stringify({ counter: { value: 42 } }),
    });
    expect(store.getState().counter.value).toBe(42);
  });
});

describe("Store effects async error handling", () => {
  it("logs and swallows rejected effect promises", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const store = createStore({
    name: "test",
      reducer: {
        counter: {
          actions: [["counter", "inc"]],
          state: { value: 0 },
          reducer: (s: any, a: any) => (a.event === "inc" ? { value: s.value + 1 } : s),
        },
      },
      middleware: [],
    });

    store.registerEffect(async (a: any) => {
      if (a.event === "inc") throw new Error("async boom");
    });

    await expect(store.dispatch("counter", "inc", undefined)).resolves.toBeUndefined();
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});

describe("Store __applyExternalState same-ref branch", () => {
  it("skips deep emits when next slice reference equals prev, but still notifies coarse", () => {
    const s = createStore({
    name: "test",
      reducer: {
        todo: {
          actions: [["todo", "set"]],
          state: { data: { a: { title: "x" } } },
          reducer: (st: any) => st,
        },
      },
      middleware: [],
    });

    const deep = vi.fn();
    const coarse = vi.fn();
    const offDeep = s.connect({ reducer: "todo", property: "data.a.title" }, deep);
    const offCoarse = s.subscribe(coarse);

    const sameRef = (s.getState() as any).todo; // exact same frozen object
    (s as any).__applyExternalState({ todo: sameRef });

    expect(deep).not.toHaveBeenCalled();
    expect(coarse).toHaveBeenCalledTimes(1);

    offDeep();
    offCoarse();
  });
});
