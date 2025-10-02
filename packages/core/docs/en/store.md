# Quo.js Store — Developer Guide (API & Patterns)

> [Version en español](../es/store.md)

This document explains how to **use the `Store`** in Quo.js: how state flows, how to wire your
reducers, middleware, and effects, and how to subscribe to changes (coarse and fine‑grained). It
also covers DevTools, HMR, and dynamic composition.

If you're debugging why a subscription didn't fire, see **[Troubleshooting](#troubleshooting)**.

## Mental model

A `Store` coordinates four things:

1. **Middleware (async by default)** — run **before** reducers. Each middleware sees
   `(state, action, dispatch)` and returns `true` to continue or `false` to veto.

2. **Reducers** — one per _slice_ (namespaced). Reducers receive `{ channel, event, payload }`
   and return a new slice state.

3. **Effects (async)** — run **after** reducers have updated state. Used for workflows,
   side‑effects, or dispatching additional actions.

4. **Subscriptions** — both coarse (`subscribe()` on any state change) and fine‑grained via
   `connect({ reducer, property }, handler)`, which can target **deep dotted paths** inside a
   slice (e.g. `data.123.title`). Under the hood, the store emits **every changed leaf path and
   its ancestors** for the affected slice, so `data.123.title` will also emit `data.123` and
   `data` once each.

**Dispatch is serialized.** Actions are put on a queue; middleware, reducers, effects, and
DevTools notifications happen in order. `dispatch()` returns `Promise<void>` and **never
rejects**; errors are printed to the console.

**Node & SSR:** The store works in **Node** (no DOM assumptions). DevTools integration is
enabled only if the Redux DevTools extension is available in the environment (i.e., browser).

## Dispatch & middleware

```ts
await store.dispatch(channel, event, payload);
```

- Middleware are called in order: `mw(state, action, dispatch) -> boolean | Promise<boolean>`.
- If any middleware returns falsy or throws, **propagation stops** for reducers & effects.
- Errors are logged; `dispatch()` **does not reject**.

**Example middleware (veto logout):**

```ts
const gate = async (getState, action): Promise<boolean> => {
  if (action.channel === "user" && action.event === "logout") return false;
  
  return true;
};

const unreg = store.registerMiddleware(gate);
// later: unreg();
```

Replace the full middleware set (useful for HMR):

```ts
store.replaceMiddleware([gate, other]);
```

## Reducers (dynamic)

Add a new slice at runtime:

```ts
const dispose = store.registerReducer("prefs", prefsSpec);
// later: dispose()  // unmounts reducer and deletes slice state
```

Hot‑replace the entire reducer set (default **preserves existing slice state**):

```ts
store.replaceReducers({ todo: todoSpec, prefs: prefsSpec }, { preserveState: true });
```

Or replace any combination in one shot:

```ts
store.hotReplace({
  reducer: { todo: nextTodoSpec },
  middleware: [gate],
  effects: [audit],
  preserveState: true,
});
```

## Subscriptions

### Coarse

```ts
const unsub = store.subscribe(() => {
  // fires once per successful dispatch that changed any slice
});
```

### Fine‑grained (deep paths)

```ts
// Fires for leaf changes in `todo.data` and **also** for ancestor paths
const off = store.connect({ reducer: "todo", property: "data" }, (chg) => {
  // chg: { oldValue, newValue, path: "data" | "data.<id>" | "data.<id>.title" }
});
```

**How paths are detected:** After each slice update, the store diffs **previous vs next** and
emits every changed **leaf path** relative to the slice. For each leaf, it also emits all
**ancestor paths** once. If the reducer returns the same reference or there are **no leaf
changes**, **nothing is emitted** (avoids noisy no‑ops).

## DevTools

If the Redux DevTools extension is present, the store will:

- `init(state)` at startup.
- `send({ type, payload }, state)` on each successful dispatch.
- React to **time travel** / **rollback** / **reset** by applying external state and emitting
  deep‑path changes so your fine‑grained subscribers stay in sync.

Supported messages include `JUMP_TO_STATE`, `JUMP_TO_ACTION`, `ROLLBACK`, `RESET`,
`IMPORT_STATE`, and `COMMIT` (which re‑baselines history via `init`). In Node/SSR, DevTools is
simply disabled.

## API reference

### `createStore({
    name: "test", reducer, middleware?, effects? }) => Store`

Creates a store from a map of `ReducerSpec`s. See [Quick Start](#quick-start).

### `store.dispatch(channel, event, payload) => Promise<void>`

Serializes actions through an internal queue. Middleware -> reducers -> effects -> DevTools.
Never rejects; logs errors.

### `store.subscribe(listener) => () => void`

Coarse subscription. Fires after a dispatch that resulted in any real state change.

### `store.connect({ reducer, property }, handler) => () => void`

Fine‑grained subscription to a slice property. `property` can be a **deep dotted path**. The
handler receives `{ oldValue, newValue, path }`. Emits leaf and ancestor paths **once each** per
dispatch.

### `store.getState() => DeepReadonly<S>`

Returns the current state snapshot (frozen). Don’t mutate it.

### `store.registerMiddleware(mw) => () => void`

Dynamically add middleware. Returns an unregister function. See
[Dispatch & middleware](#dispatch--middleware).

### `store.replaceMiddleware(next: Middleware[])`

Replace the full middleware set (HMR‑friendly).

### `store.registerEffect(handler) => () => void`

Add a post‑reducer effect. Returns an unregister function.

### `store.onEffect(channel, event, handler) => () => void`

Sugar for a filtered effect tied to a specific action pair; gives you typed `payload`.

### `store.replaceEffects(next: Effect[])`

Replace the entire set of effects.

### `store.registerReducer(name, spec) => () => void`

Mount a new slice at runtime. Returns a disposer that **unmounts** the slice and **deletes** its
state.

### `store.replaceReducers(next, { preserveState = true })`

Replace the full reducer set. Removes missing slices; adds/updates existing ones. By default,
preserves current slice states.

### `store.hotReplace({ reducer?, middleware?, effects?, preserveState? })`

Convenience to replace any combination in one call. Useful for HMR.

## Best practices

- **Pure reducers:** Always return a **new** object when anything changes. If nothing changed,
  return the **same reference** to avoid spurious emissions.
- **Keep effects idempotent:** They may re‑run on DevTools time travel imports.
- **Guard middleware:** Returning `false` is the canonical way to veto an action.
- **Use deep paths intentionally:** `connect({ reducer: "todo", property: "data.123.title" })`
  is more selective than listening to `data`.
- **Node/SSR:** Works headless; DevTools is browser‑only.
- **Don’t mutate `getState()`:** It’s a frozen snapshot.

## Troubleshooting

- **“My fine‑grained listener didn’t fire.”**  
  Either your reducer returned the same reference or no **leaf** path actually changed. Return a
  new object for changed branches and ensure you’re updating the intended field.

- **“Dispatch threw?”**  
  It shouldn’t. If a middleware/effect throws, the store logs to console and keeps going.

- **“DevTools doesn’t show up.”**  
  You probably are in Node/SSR or you don’t have the Redux DevTools extension.

## Advanced: example with effects & veto middleware

```ts
const audit: EffectFunction<Readonly<AppState>, AppAM> = async (action, getState) => {
  if (action.channel === "todo" && action.event === "add") {
    console.log("added:", action.payload.id);
  }
};

const gate: MiddlewareFunction<Readonly<AppState>, AppAM> = async (_state, action) => {
  if (action.channel === "todo" && action.event === "remove") return false; // veto deletes
  return true;
};

const store = createStore({
    name: "test",
  reducer: { todo: todoSpec },
  middleware: [gate],
  effects: [audit],
});
```

## Glossary

- **ActionMap** — your typed contract for `{ channel, event } → payload`.
- **ReducerSpec** — `{ state, actions, reducer }` per slice.
- **Effect** — post‑reducer async handler.
- **Middleware** — pre‑reducer gate/transform/logger (async capable).
- **Leaf path** — the deepest changed path (e.g. `data.123.title`).

> see the [Store.ts](../../src/store/Store.ts) class.

<- Back to [Quo.js core docs](./core.md)
