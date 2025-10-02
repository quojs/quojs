import React, { PropsWithChildren } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

// --- tiny reducer used for the test ---
type TodoState = {
  data: Record<string, { id: string; title: string; done: boolean }>;
  filter: { status: "ALL" | "OPEN" | "DONE"; category: string };
};
type AppState = { todo: TodoState };
type AM = { todo: { status: TodoState["filter"]["status"]; category: string } };

const initial: TodoState = { data: {}, filter: { status: "ALL", category: "" } };

const reducer: ReducerFunction<TodoState, AM> = (state = initial, action: ActionUnion<AM>) => {
  if (action.channel !== "todo") return state;
  switch (action.event) {
    case "status": {
      const status = action.payload;
      if (state.filter.status === status) return state;
      return { ...state, filter: { ...state.filter, status } };
    }
    case "category": {
      const category = action.payload;
      if (state.filter.category === category) return state;
      return { ...state, filter: { ...state.filter, category } };
    }
    default:
      return state;
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
      } satisfies ReducerSpec<TodoState, AM>,
    },
    middleware: [],
  });
  const typed: StoreInstance<"todo", AppState, AM> = store;
  return typed;
}

function Provider({ children, store }: PropsWithChildren<{ store: StoreInstance<"todo", AppState, AM> }>) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

describe("useSliceProps (single string property branch)", () => {
  let store: StoreInstance<"todo", AppState, AM>;
  beforeEach(() => { store = makeStore(); });
  afterEach(() => cleanup());

  it("hits the non-array branch and updates when that single path changes", async () => {
    const Comp = () => {
      const status = useSliceProps<"todo", AppState, string>(
        [{ reducer: "todo", property: "filter.status" }],
        (state) => state.todo.filter.status
      );
      return <div data-testid="status">{status}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);
    expect(rr.getByTestId("status").textContent).toBe("ALL");

    await act(async () => { store.dispatch("todo", "status", "DONE"); });
    expect(rr.getByTestId("status").textContent).toBe("DONE");

    await act(async () => { store.dispatch("todo", "category", "work"); });
    expect(rr.getByTestId("status").textContent).toBe("DONE");
  });

  it("still unsubscribes correctly when the property was a single string", async () => {
    const renders = vi.fn();

    const Comp = () => {
      const status = useSliceProps<"todo", AppState, string>(
        [{ reducer: "todo", property: "filter.status" }],
        (state) => state.todo.filter.status
      );
      renders(status);
      return <div>{status}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);
    await act(async () => { store.dispatch("todo", "status", "OPEN"); });

    const before = renders.mock.calls.length;
    rr.unmount();

    await act(async () => { store.dispatch("todo", "status", "DONE"); });

    expect(renders.mock.calls.length).toBe(before);
  });
});
