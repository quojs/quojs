import { PropsWithChildren } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";

import { StoreContext } from "../../src/context/StoreContext";
import {
  createStore,
  type ActionPair,
  type ReducerFunction,
  type ReducerSpec,
  type ActionUnion,
} from "@quojs/core";
import { useSelector } from "../../src/hooks/hooks";

// ---------------- Minimal Counter slice (strictly typed) ----------------
type CounterState = { value: number };
const initial: CounterState = { value: 0 };

/** ActionMap forclea this test */
type CounterAM = {
  counter: {
    inc: {}; // explicit empty object payload
  };
};

/** Strictly typed reducer */
const reducer: ReducerFunction<CounterState, CounterAM> = (
  s = initial,
  a: ActionUnion<CounterAM>
) => (a.channel === "counter" && a.event === "inc" ? { value: s.value + 1 } : s);

/** Validated [channel,event] pairs */
const COUNTER_ACTIONS = [
  ["counter", "inc"],
] as const satisfies readonly ActionPair<CounterAM>[];

/** Minimal store factory (keeps tests fully typed) */
function makeStore() {
  return createStore({
    name: "test",
    reducer: {
      counter: {
        actions: [...COUNTER_ACTIONS],
        state: initial,
        reducer,
      } satisfies ReducerSpec<CounterState, CounterAM>,
    },
    middleware: [],
  });
}

// ---------------- React wiring ----------------
function Provider({
  children,
  store,
}: PropsWithChildren<{ store: ReturnType<typeof makeStore> }>) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

// ---------------- Tests ----------------
describe("useSelector", () => {
  afterEach(() => cleanup());

  it("re-renders when selected value changes (default isEqual)", async () => {
    const store = makeStore();
    let renders = 0;

    const Comp = () => {
      const v = useSelector<{ counter: CounterState }, number>((s) => s.counter.value);
      renders++;
      return <div data-testid="v">{String(v)}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);
    expect(rr.getByTestId("v").textContent).toBe("0");

    await act(async () => {
      store.dispatch("counter", "inc", {});
    });

    expect(rr.getByTestId("v").textContent).toBe("1");
    expect(renders).toBeGreaterThanOrEqual(2);
  });

  it("avoids re-render when custom isEqual reports equality", async () => {
    const store = makeStore();
    let renders = 0;

    const Comp = () => {
      const v = useSelector<{ counter: CounterState }, number>(
        (s) => s.counter.value,
        () => true // always equal => snapshot stays stable
      );
      renders++;
      return <div data-testid="v">{String(v)}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);
    const before = renders;

    await act(async () => {
      store.dispatch("counter", "inc", {});
    });

    expect(rr.getByTestId("v").textContent).toBe("0");
    expect(renders).toBe(before);
  });
});
