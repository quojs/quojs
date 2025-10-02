import React, { PropsWithChildren } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";

import { StoreContext } from "../../src/context/StoreContext";
import {
  createStore,
  type ActionPair,
  type ReducerSpec,
  type ReducerFunction,
  type ActionUnion,
  type StoreInstance,
} from "@quojs/core";
import { useSliceProps } from "../../src/hooks/hooks";

type Filter = { status: "ALL" | "OPEN" | "DONE"; category: string };
type SliceState = { filter: Filter };
type AppState = { todo: SliceState };

type AM = {
  todo: {
    status: Filter["status"];
    category: string;
  };
};

const initial: SliceState = { filter: { status: "ALL", category: "" } };

const reducer: ReducerFunction<SliceState, AM> = (s = initial, a: ActionUnion<AM>) => {
  if (a.channel !== "todo") return s;
  switch (a.event) {
    case "status": return s.filter.status === a.payload ? s : { ...s, filter: { ...s.filter, status: a.payload } };
    case "category": return s.filter.category === a.payload ? s : { ...s, filter: { ...s.filter, category: a.payload } };
    default: return s;
  }
};

const ACTIONS = [
  ["todo", "status"],
  ["todo", "category"],
] as const satisfies readonly ActionPair<AM>[];

function makeStore() {
  const store = createStore({
    name: "test",
    reducer: {
      todo: {
        actions: [...ACTIONS],
        state: initial,
        reducer,
      } satisfies ReducerSpec<SliceState, AM>,
    },
    middleware: [],
  });
  const typed: StoreInstance<"todo", AppState, AM> = store;
  return typed;
}

function Provider({ children, store }: PropsWithChildren<{ store: StoreInstance<"todo", AppState, AM> }>) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

describe("useSliceProps (array paths)", () => {
  afterEach(() => cleanup());

  it("subscribes to both paths and recomputes selector", async () => {
    const store = makeStore();

    const Comp = () => {
      const sel = useSliceProps<"todo", AppState, string>(
        [{ reducer: "todo", property: ["filter.status", "filter.category"] }],
        (s) => `${s.todo.filter.status}:${s.todo.filter.category}`
      );
      return <div data-testid="sel">{sel}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);
    expect(rr.getByTestId("sel").textContent).toBe("ALL:");

    await act(async () => { store.dispatch("todo", "status", "DONE"); });
    expect(rr.getByTestId("sel").textContent).toBe("DONE:");

    await act(async () => { store.dispatch("todo", "category", "work"); });
    expect(rr.getByTestId("sel").textContent).toBe("DONE:work");
  });

  it("respects custom isEqual to suppress updates", async () => {
    const store = makeStore();
    let renders = 0;

    const Comp = () => {
      const sel = useSliceProps<"todo", AppState, string>(
        [{ reducer: "todo", property: ["filter.status", "filter.category"] }],
        (s) => `${s.todo.filter.status}:${s.todo.filter.category}`,
        () => true // always equal -> no rerenders
      );
      renders++;
      return <div data-testid="sel">{sel}</div>;
    };

    render(<Provider store={store}><Comp /></Provider>);
    const before = renders;
    await act(async () => { store.dispatch("todo", "status", "DONE"); });
    await act(async () => { store.dispatch("todo", "category", "work"); });
    expect(renders).toBe(before);
  });
});
