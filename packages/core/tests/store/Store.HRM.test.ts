import { describe, it, expect, vi } from "vitest";

import type { ReducerSpec, StoreSpec } from "../../src/types";
import { createStore, Store, typedActions } from "../../src";

type AM = { a: { set: number }; b: { inc: number } };

interface AState {
  x: number;
}
interface BState {
  c: number;
}

const aSpec: ReducerSpec<AState, AM> = {
  state: { x: 1 },
  actions: [["a", "set"]] as any,
  reducer: (s, a) => (a.channel === "a" && a.event === "set" ? { x: a.payload as any } : s),
};
const bSpec: ReducerSpec<BState, AM> = {
  state: { c: 0 },
  actions: [["b", "inc"]] as any,
  reducer: (s, a) =>
    a.channel === "b" && a.event === "inc" ? { c: s.c + (a.payload as any) } : s,
};

function mk(spec?: Partial<StoreSpec<"a" | "b", { a: AState; b: BState }, AM>>) {
  const base: StoreSpec<"a" | "b", { a: AState; b: BState }, AM> = {
    reducer: { a: aSpec, b: bSpec } as any,
    middleware: [],
  };
  return new Store<AM, "a" | "b", { a: AState; b: BState }>({ ...base, ...(spec as any) });
}

describe("Store HMR", () => {
  it("replaceReducers preserves state by default and rewires listeners", async () => {
    const s = mk();
    await s.dispatch("a" as any, "set" as any, 10 as any);
    expect(s.getState().a.x).toBe(10);

    const a2: ReducerSpec<AState, AM> = { ...aSpec, reducer: () => ({ x: 999 }) };
    s.replaceReducers({ a: a2, b: bSpec } as any);

    // wiring still works
    await s.dispatch("a" as any, "set" as any, 0 as any);
    expect(s.getState().a.x).toBe(999);
  });

  it("registerReducer adds and disposer removes slice", async () => {
    const s = mk({ reducer: { a: aSpec } as any });
    expect((s.getState() as any).b).toBeUndefined();

    const dispose = s.registerReducer("b", bSpec as any);
    expect((s.getState() as any).b).toBeDefined();

    dispose();
    expect((s.getState() as any).b).toBeUndefined();
  });

  it("replaceEffects and replaceMiddleware swap live", async () => {
    const calls: any[] = [];
    const s = mk({
      effects: [(a) => calls.push(["e1", a.event])] as any,
      middleware: [() => true as any],
    });

    await s.dispatch("a" as any, "set" as any, 1 as any);
    expect(calls.map((c) => c[0])).toContain("e1");

    s.replaceEffects([(a) => calls.push(["e2", a.event])] as any);
    s.replaceMiddleware([() => true as any]);

    await s.dispatch("a" as any, "set" as any, 2 as any);
    expect(calls.map((c) => c[0])).toContain("e2");
  });
});

describe("Store.replaceReducers HMR paths", () => {
  const origWin: any = (globalThis as any).window;
  let initSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    initSpy = vi.fn();
    (globalThis as any).window = {
      __REDUX_DEVTOOLS_EXTENSION__: {
        connect: () => ({ init: initSpy, subscribe: vi.fn(), send: vi.fn() }),
      },
    } as any;
  });

  afterEach(() => {
    (globalThis as any).window = origWin;
  });

  it("removes missing slices, adds new ones, updates existing, and calls devtools.init", async () => {
    const base = createStore({
    name: "test",
      reducer: {
        counter: {
          actions: [["counter", "inc"]] as any,
          state: { value: 1 },
          reducer: (s = { value: 1 }, a: any) =>
            a.event === "inc" ? { value: s.value + 1 } : s,
        },
        audit: {
          actions: [["audit", "log"]] as any,
          state: { logs: [] as string[] },
          reducer: (s = { logs: [] as string[] }, a: any) =>
            a.event === "log" ? { logs: [...s.logs, a.payload] } : s,
        },
      },
      middleware: [],
    });

    // 1) Replace with only an updated 'counter' (no 'audit'), preserveState default (true)
    base.replaceReducers({
      counter: {
        actions: [["counter", "inc"]],
        state: { value: 100 }, // won't be used because we preserve
        reducer: (s = { value: 0 }, a: any) =>
          a.event === "inc" ? { value: s.value + 10 } : s,
      },
    } as any);

    // 'audit' should be removed; 'counter' preserved and updated implementation should apply
    expect((base.getState() as any).audit).toBeUndefined();
    await base.dispatch("counter", "inc", undefined as any);
    expect((base.getState() as any).counter.value).toBe(11); // 1 + 10

    // devtools baseline re-initialized
    expect(initSpy).toHaveBeenCalled();

    // 2) Replace again but with preserveState=false (explicit) so initial state is taken
    base.replaceReducers(
      {
        counter: {
          actions: [["counter", "inc"]],
          state: { value: 5 }, // will be used now
          reducer: (s = { value: 0 }, a: any) =>
            a.event === "inc" ? { value: s.value + 1 } : s,
        },
        extra: {
          actions: [["counter", "inc"]], // listen to same channel for simplicity
          state: { seen: 0 },
          reducer: (s = { seen: 0 }, a: any) => (a.event === "inc" ? { seen: s.seen + 1 } : s),
        },
      } as any,
      { preserveState: false },
    );

    const s1 = base.getState() as any;
    expect(s1.counter.value).toBe(5); // reset from new initial state
    expect(s1.extra.seen).toBe(0); // new slice mounted
  });
});
