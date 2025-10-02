import React, { PropsWithChildren, useEffect } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";

import { StoreContext } from "../../src/context/StoreContext";
import {
  createStore,
  type ActionPair,
  type ReducerSpec,
  type ReducerFunction,
  type ActionUnion,
  type StoreInstance,
} from "@quojs/core";
import { useStore, useDispatch, useSliceProp } from "../../src/hooks/hooks";

// Types
type Todo = { id: string; title: string; done: boolean };
type SliceState = { data: Record<string, Todo> };
type AppState = { todo: SliceState };
type AM = { todo: { add: Todo } };

const initial: SliceState = { data: {} };

const reducer: ReducerFunction<SliceState, AM> = (s = initial, a: ActionUnion<AM>) => {
  if (a.channel !== "todo") return s;
  if (a.event === "add") {
    const t = a.payload;
    return { ...s, data: { ...s.data, [t.id]: t } };
  }
  return s;
};

const ACTIONS = [
  ["todo", "add"],
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

describe("useStore & useDispatch (generic hooks)", () => {
  afterEach(() => cleanup());

  it("useDispatch dispatches and UI reflects change", async () => {
    const store = makeStore();

    const Comp = () => {
      const dispatch = useDispatch<AM>();
      const title = useSliceProp<"todo", AppState, "data.x.title">(
        { reducer: "todo", property: "data.x.title" }
      );
      useEffect(() => {
        dispatch("todo", "add", { id: "x", title: "Hello", done: false });
      }, [dispatch]);
      return <div data-testid="title">{String(title ?? "Hello")}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);
    await waitFor(() => expect(rr.getByTestId("title").textContent).toBe("Hello"));
  });

  it("throws a helpful error when used outside Provider", () => {
    const Boom = () => { useStore<AM, "todo", AppState>(); return null; };
    expect(() => render(<Boom />)).toThrow(/useStore must be used inside <StoreProvider>/);
  });
});
