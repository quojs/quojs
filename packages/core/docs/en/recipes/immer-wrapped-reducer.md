# Recipe: Using **Immer** with Quo.js Reducers

This recipe shows how to integrate **Immer** with the core Quo.js reducer API, so you can write
reducers in a concise, mutable style while keeping immutable state updates under the hood.

> TL;DR: Wrap your reducer with a small `withImmer` helper and keep your public action types
> unchanged.

## Why Immer here?

- **Ergonomics:** Write `draft.x = y` instead of spreading deeply nested objects.
- **Correctness:** Immer ensures immutable updates.
- **Zero API change:** You keep Quo.js’s `ReducerSpec`/`typedActions` as-is.

## Prerequisites

```bash
npm i immer
```

## Defining an Action Map

The ActionMap drives type safety across reducers, middleware, and effects. Basically, these
tells Quo.js the shape of the actions and payloads for every reducer.

```ts
// Define the shape of your reducer (slice)
type CountState = {
  value: number;
};

/**
 * Define the shape of your app state, we recommend this approach as it allows more flexibility. */
type AppState = {
  count: CountState;
};

// reducer-level ActionMap
type CounterAM = { add: number; subtract: number; set: number };

// application-level ActionMap
type AppAM = { count: CounterAM };
```

## The `withImmer` Helper

A tiny wrapper that converts a draft-based “recipe reducer” into a standard
`(state, action) => state` reducer.

```ts
// withImmer.ts
import { produce, type Draft } from "immer";

export type RecipeReducer<S, A = any> = (draft: Draft<S>, action: A) => void | undefined;

/**
 * Wrap a draft-based reducer into a standard immutable reducer */
export function withImmer<S, A = any>(recipe: RecipeReducer<S, A>) {
  return (state: S, action: A): S =>
    produce(state, (draft) => {
      // Important: do NOT return the draft; just mutate it or do nothing.
      recipe(draft, action);
    });
}
```

> **Avoid common pitfall:** Do **not** `return draft` from the recipe returning a value in an
> Immer recipe replaces the entire state. Just `return;` or fall through when you don’t change
> anything.

## Reducer

```ts
// Define the channel-event pairs that will trigger your Reducer
const COUNT_ACTIONS = [
  ["count", "add"],
  ["count", "subtract"],
  ["count", "set"],
] as const satisfies readonly ActionPair<AppAM>[];

// Type the reducer to match Quo.js’s ReducerSpec signature
const reducer: ReducerSpec<CountState, AppAM>["reducer"] = withImmer<CountState, any>(
  (draft, action) => {
    switch (action.event) {
      case "add":
        draft.value += action.payload;
      case "subtract":
        draft.value -= action.payload;
      case "set":
        draft.value = action.payload;

      default:
        return;
    }
  },
);

const countReducer: ReducerSpec<CountState, AppAM> = {
  actions: [
    ...COUNT_ACTIONS,
  ],
  state: { value: 0 },
  reducer,
};

export default countReducer;
```

## Store Wiring

```ts
export const store = createStore({
    name: "test",
  reducer: { count: countReducer },
});
```

## Quick Smoke Test

```ts
store.dispatch("count", "add", 1);

const { value } = Object.values(store.getState().count);
console.assert(value === 1);
```

## Takeaways

- Immer keeps your reducers clean without changing Quo.js APIs.
- Don’t return from the recipe except to stop execution; never `return draft`.
