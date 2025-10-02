import React, { PropsWithChildren } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";

import { StoreContext } from "../../src/context/StoreContext";
import {
  createStore,
  type ActionPair,
  type ReducerFunction,
  type ReducerSpec,
  type ActionUnion,
  type StoreInstance,
} from "@quojs/core";
import { useSliceProp, useSliceProps } from "../../src/hooks/hooks";

// ---------------- Types: Todo slice + ActionMap ----------------
type Todo = { id: string; title: string; done: boolean };
type TodoState = {
  data: Record<string, Todo>;
  filter: { status: "ALL" | "OPEN" | "DONE"; category: string };
};
type AppState = { todo: TodoState };

type TodoAM = {
  todo: {
    add: Todo;
    title: { id: string; title: string };
    status: TodoState["filter"]["status"];
    category: string;
  };
};

// ---------------- Strict reducer ----------------
const initial: TodoState = { data: {}, filter: { status: "ALL", category: "" } };

const reducer: ReducerFunction<TodoState, TodoAM> = (
  state = initial,
  action: ActionUnion<TodoAM>
): TodoState => {
  if (action.channel !== "todo") return state;
  switch (action.event) {
    case "add": {
      const t = action.payload;
      if (state.data[t.id]) return state;
      return { ...state, data: { ...state.data, [t.id]: t } };
    }
    case "title": {
      const { id, title } = action.payload;
      const cur = state.data[id];
      if (!cur || cur.title === title) return state;
      return { ...state, data: { ...state.data, [id]: { ...cur, title } } };
    }
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

// ---------------- Actions ----------------
const TODO_ACTIONS = [
  ["todo", "add"],
  ["todo", "title"],
  ["todo", "status"],
  ["todo", "category"],
] as const satisfies readonly ActionPair<TodoAM>[];

// ---------------- Store factory ----------------
function makeStore() {
  const store = createStore({
    name: "test",
    reducer: {
      todo: {
        actions: [...TODO_ACTIONS],
        state: initial,
        reducer,
      } satisfies ReducerSpec<TodoState, TodoAM>,
    },
    middleware: [],
  });
  const typed: StoreInstance<"todo", AppState, TodoAM> = store;
  return typed;
}

// ---------------- Provider ----------------
function Provider({ children, store }: PropsWithChildren<{ store: StoreInstance<"todo", AppState, TodoAM> }>) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

// ---------------- Tests ----------------
describe("useSliceProp / useSliceProps (strictly typed)", () => {
  let store: StoreInstance<"todo", AppState, TodoAM>;
  beforeEach(() => { store = makeStore(); });
  afterEach(() => cleanup());

  it("selects an exact deep path and updates on change", async () => {
    const renders = vi.fn();

    const Comp = () => {
      const title = useSliceProp<"todo", AppState, "data.a1.title">(
        { reducer: "todo", property: "data.a1.title" },
      );
      renders(title);
      return <div data-testid="title">{String(title ?? "")}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);

    expect(rr.getByTestId("title").textContent).toBe("");

    await act(async () => {
      store.dispatch("todo", "add", { id: "a1", title: "X", done: false });
    });
    await act(async () => {
      store.dispatch("todo", "title", { id: "a1", title: "Y" });
    });

    expect(rr.getByTestId("title").textContent).toBe("Y");
    expect(renders.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("normalizes leading dot in the path", async () => {
    const Comp = () => {
      const title = useSliceProp<"todo", AppState, "data.b2.title">(
      // @ts-expect-error This is just a warning
        { reducer: "todo", property: ".data.b2.title" }, // runtime can have leading dot
      );
      return <div data-testid="title">{String(title ?? "")}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);

    await act(async () => {
      store.dispatch("todo", "add", { id: "b2", title: "Z", done: false });
      store.dispatch("todo", "title", { id: "b2", title: "ZZ" });
    });

    expect(rr.getByTestId("title").textContent).toBe("ZZ");
  });

  it("supports wildcard subscription and uses map to derive a stable value", async () => {
    const Comp = () => {
      const count = useSliceProp<"todo", AppState, "data.**", number>(
        { reducer: "todo", property: "data.**" },
        (slice: TodoState) => Object.keys(slice.data).length
      );
      return <div data-testid="count">{String(count)}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);
    expect(rr.getByTestId("count").textContent).toBe("0");

    await act(async () => {
      store.dispatch("todo", "add", { id: "c3", title: "A", done: false });
    });
    expect(rr.getByTestId("count").textContent).toBe("1");

    await act(async () => {
      store.dispatch("todo", "add", { id: "d4", title: "B", done: false });
    });
    expect(rr.getByTestId("count").textContent).toBe("2");
  });

  it("accepts multiple properties (array) via useSliceProps and passes the full state to selector", async () => {
    const Comp = () => {
      const sel = useSliceProps<"todo", AppState, string>(
        [{ reducer: "todo", property: ["filter.status", "filter.category"] }],
        (state) => `${state.todo.filter.status}:${state.todo.filter.category}`
      );
      return <div data-testid="sel">{sel}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);
    expect(rr.getByTestId("sel").textContent).toBe("ALL:");

    await act(async () => {
      store.dispatch("todo", "status", "DONE");
    });
    expect(rr.getByTestId("sel").textContent).toBe("DONE:");

    await act(async () => {
      store.dispatch("todo", "category", "work");
    });
    expect(rr.getByTestId("sel").textContent).toBe("DONE:work");
  });

  it("unmount cleans up subscription (no extra renders after)", async () => {
    const renders = vi.fn();

    const Comp = () => {
      const title = useSliceProp<"todo", AppState, "data.u1.title">(
        { reducer: "todo", property: "data.u1.title" }
      );
      renders(title);
      return <div>{title}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);

    await act(async () => {
      store.dispatch("todo", "add", { id: "u1", title: "A", done: false });
    });

    const before = renders.mock.calls.length;
    rr.unmount();

    await act(async () => {
      store.dispatch("todo", "title", { id: "u1", title: "B" });
    });

    expect(renders.mock.calls.length).toBe(before);
  });
});
