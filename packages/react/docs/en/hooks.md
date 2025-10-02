# Hooks

[Versión en español](../es/hooks.md)

All hooks are **Concurrent Mode safe** via `useSyncExternalStore` and only re-render when their subscribed keys change.

> **Why `createQuoHooks`?** It binds a React context to strongly‑typed hooks **once**. That eliminates per‑hook generics in components, gives you app‑local exports (great DX/testing), and supports multi‑store/provider boundaries. If you don’t need custom contexts, you can use the package’s pre‑bound hooks with `StoreProvider`.

## `useStore()`
Returns the store instance.

```tsx
const store = useStore();
console.log(store.getState());
```

## `useDispatch()`
Returns the typed dispatch function inferred from your Action Map.

```tsx
const dispatch = useDispatch();
dispatch("cart", "addItem", { id: "42", qty: 1 });
```

## `useSelector(selector, isEqual?)`
Coarse-grained selection over the **entire state**.

```tsx
const total = useSelector((s) => s.cart.total);
```

## `useSliceProp({ reducer, property }, map?, isEqual?)`
Fine‑grained subscription to a **single** reducer path.

- **Exact paths** (no `*`) return the concrete value:      `"value"`, `"items.0.title"`, `"users.byId.123.name"`
- **Wildcards** (`*`, `**`) require a `map` function and receive the **whole slice**.

```tsx
// Exact path → concrete value
const title = useSliceProp({ reducer: "post", property: "current.title" });

// Wildcard path → you must supply map(slice)
const itemCount = useSliceProp(
  { reducer: "todos", property: "items.*" },
  (slice) => Object.keys(slice?.items ?? {}).length
);
```

## `useSliceProps(specs[], selector, isEqual?)`
Subscribe to **multiple** paths (exact or wildcard). A single re-render occurs per change burst.  
**Always** supply a `selector(state)`; it decides the derived value.

```tsx
const vm = useSliceProps(
  [
    { reducer: "todo", property: ["items.**", "filter"] },
    { reducer: "ui", property: "theme" },
  ],
  (state) => {
    const items = Object.values(state.todo.items);
    const visible = state.todo.filter === "all"
      ? items
      : items.filter((t) => t.status === state.todo.filter);

    return {
      total: items.length,
      visibleCount: visible.length,
      theme: state.ui.theme,
    };
  }
);
```