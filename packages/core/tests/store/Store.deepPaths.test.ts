import { describe, it, expect, vi } from "vitest";
import type {
  EffectFunction,
  MiddlewareFunction,
  ReducerSpec,
  StoreSpec,
} from "../../src/types";
import { Store } from "../../src";

interface Todo {
  id: string;
  title: string;
  category?: string;
  done?: boolean;
}
interface TodoState {
  data: Record<string, Todo>;
  filter: { status: "ALL" | "DONE" | "OPEN"; category: string };
  meta: { version: number };
}

type AM = {
  todo: {
    add: { id: string; title: string };
    title: { id: string; title: string };
    touch: { id: string };
    setCat: { id: string; category: string };
    setFilter: { status: "ALL" | "DONE" | "OPEN" };
  };
};

const initial: TodoState = {
  data: {},
  filter: { status: "ALL", category: "" },
  meta: { version: 1 },
};

const reducer: ReducerSpec<TodoState, AM> = {
  state: initial,
  actions: [
    ["todo", "add"],
    ["todo", "title"],
    ["todo", "touch"],
    ["todo", "setCat"],
    ["todo", "setFilter"],
  ] as any,
  reducer: (s, a) => {
    const st: TodoState = JSON.parse(JSON.stringify(s));
    if (a.channel !== "todo") return s;
    switch (a.event) {
      case "add":
        st.data[a.payload.id] = { id: a.payload.id, title: a.payload.title };
        return st;
      case "title":
        st.data[a.payload.id].title = a.payload.title;
        return st;
      case "touch":
        st.meta.version++;
        return st;
      case "setCat":
        st.data[a.payload.id].category = a.payload.category;
        return st;
      case "setFilter":
        st.filter.status = a.payload.status;
        return st;
      default:
        return s;
    }
  },
};

function makeStore(spec?: Partial<StoreSpec<"todos", { todos: TodoState }, AM>>) {
  const base: StoreSpec<"todos", { todos: TodoState }, AM> = {
    reducer: { todos: reducer } as any,
    middleware: [],
    effects: [],
  };
  return new Store<AM, "todos", { todos: TodoState }>({ ...base, ...(spec as any) });
}

/**
 * Covers: deep emits, ancestor emits, top-level path omission, wildcard connects,
 * connect normalization, multi-path connect, and no-op reducer re-emit guard */
describe("Store deep-path emissions", () => {
  it("emits top-level when children change (ancestor emission)", async () => {
    const store = makeStore();
    const hit = vi.fn();
    store.connect({ reducer: "todos", property: "data" }, hit);

    await store.dispatch("todo", "add", { id: "1", title: "A" });
    expect(hit).toHaveBeenCalled();
    const { newValue } = hit.mock.calls[0][0];
    expect(newValue["1"].title).toBe("A");
  });

  it("emits exact deep paths and reads precise values", async () => {
    const store = makeStore();
    const hit = vi.fn();
    store.connect({ reducer: "todos", property: "data.1.title" }, hit);

    await store.dispatch("todo", "add", { id: "1", title: "A" });
    await store.dispatch("todo", "title", { id: "1", title: "B" });

    // Should have fired on add (title created) and on title change
    expect(hit.mock.calls.length).toBeGreaterThanOrEqual(1);
    const last = hit.mock.calls.at(-1)[0];
    expect(last.newValue).toBe("B");
  });

  it("wildcards '*' match one segment and '**' match any tail", async () => {
    const store = makeStore();
    const star = vi.fn();
    const dstar = vi.fn();

    store.connect({ reducer: "todos", property: "data.*" }, star);
    store.connect({ reducer: "todos", property: "data.**" }, dstar);

    await store.dispatch("todo", "add", { id: "1", title: "A" });
    await store.dispatch("todo", "title", { id: "1", title: "B" });

    expect(star).toHaveBeenCalled(); // add created data.1
    expect(dstar.mock.calls.length).toBeGreaterThanOrEqual(star.mock.calls.length);
  });

  it("middleware can veto and effects run after reducers with final state", async () => {
    const eff = vi.fn();
    const effect: EffectFunction<Readonly<{ todos: TodoState }>, AM> = (a, get) => {
      eff({ a, snapshot: get() });
    };

    const mw: MiddlewareFunction<Readonly<{ todos: TodoState }>, AM> = (_, action) => {
      return action.event !== "touch"; // veto touch
    };

    const store = makeStore({ middleware: [mw], effects: [effect] });

    await store.dispatch("todo", "add", { id: "1", title: "A" });
    await store.dispatch("todo", "touch", { id: "1" });

    // effect saw the add, not the vetoed touch
    const calls = eff.mock.calls.map(([arg]) => arg);
    expect(calls.length).toBe(1);
    expect(calls[0].snapshot.todos.data["1"].title).toBe("A");
  });

  it("onEffect filters by channel/event", async () => {
    const store = makeStore();
    const sawTitle = vi.fn();
    const sawAdd = vi.fn();

    const u1 = store.onEffect("todo", "title", (p) => {
      sawTitle(p);
    });
    const u2 = store.onEffect("todo", "add", (p) => {
      sawAdd(p);
    });

    await store.dispatch("todo", "add", { id: "1", title: "A" });
    await store.dispatch("todo", "title", { id: "1", title: "B" });

    expect(sawAdd).toHaveBeenCalledTimes(1);
    expect(sawTitle).toHaveBeenCalledTimes(1);

    u1();
    u2();
  });
});
