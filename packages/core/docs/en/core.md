# Quo.js Core Documentation

> [Version en español](../es/core.md)

This document explains how to use the **core Quo.js library** (`@quojs/core`).  
It covers the fundamental primitives: _store_, _actions_, _middleware_, _reducers_, and
_effects_.

## Installation

```sh
npm install @quojs/core
```

## Core Concepts

- **[State](#define-your-state)**: A strongly-typed map of your state.
- **[ActionMap](#defining-an-action-map)**: A type-safe map of channels → events → payload
  types. Essentialy, your reducer / actions map.
- **Action**: Combination of `{ channel, event, payload }`.
- **[Reducer](#reducers)**: Pure function that updates a slice of state in response to actions.
- **[Middleware](#middleware)**: Async interceptors that can mutate, log, veto, or transform
  actions before they reach reducers.
- **[Effects](#effects)**: Post-reducer listeners that can react to actions and dispatch new
  ones.
- **[Store](#creating-the-store)**: Holds the state tree, wires reducers, runs middleware and
  effects, and manages subscriptions.

## Building blocks of Quo.js

- [Store](./store.md)

### Internal classes

- [Reducer](./reducer.md)
- [EventBus](./event-bus.md)
- [Lose EventBus](./lose-event-bus.md)

# Quick-start

## Define your State

```ts
import type {
  ActionPair,
  Readonly,
  EffectFunction,
  ReducerSpec,
  StoreInstance,
} from "@quojs/core";
import { createStore } from "@quojs/core";

// Define the shape of your reducer (slice)
type CountState = {
  value: number;
};

/**
 * Define the shape of your app state, we recommend this approach as it allows more flexibility. */
type AppState = {
  count: CountState;
};
```

## Defining an Action Map

The ActionMap drives type safety across reducers, middleware, and effects. Basically, these
tell **Quo.js** the shape of the actions and payloads for every reducer.

```ts
/**
 *  ActionMap (reducer level).
 * 
 *  In this example, "add", "subtract" and "set" will become "events" */
type CounterAM = { add: number; subtract: number; set: number };

/**
 * ActionMap (app level).
 * 
 * In this example, "count" will become a "channel" */
type AppAM = { count: CounterAM };
```

## Middleware

Middleware in **Quo.js** are **async by default**. No thunks, sagas, or extra wrappers are required.
You can simply await inside.

Middleware process actions before Reducers, you can use Middleware for async logic like fetching data or acting as bouncers for actions:

```ts
export const LogMiddleware = async (getState, action, dispatch): Promise<boolean> => {
  console.dir(action); // log the action

  // Audit only when addition is attempted
  if (action.channel === "count" && action.event === "add") {
    const { count: { value: currentValue } } = getState();
    
    // veto action only when currentValue exceeds 10
    if (currentValue > 10) {
      return false;
    }
  }

  // let the action continue
  return true;
};
```

## Reducers

A reducer describes how one slice of state changes in response to actions. Reducers subscribe to
specific `[channel, event]` pairs, where `channels` directly map to your reducers names.

```ts
// Define the channel-event pairs that will trigger your Reducer
const COUNT_ACTIONS = [
    ["count", "add"],
    ["count", "subtract"],
    ["count", "set"]
] as const satisfies readonly ActionPair<AppAM>[];

// Define your Reducer
export const countReducer: ReducerSpec<CounterState, AppAM> = {
    actions: [ ...COUNT_ACTIONS ],
    state: { value: 0 },
    reducer: (state, action) => {
        switch (action.event) {
            case "add":
               return { value: state.value + action.payload };
            case "subtract":
                return { value: state.value - action.payload };
            case "set":
                return { value: action.payload };

            default:
                return state;
        }
    },
};`;
```

> **Note**: This reducer only switches by `action.event`, but reducers can also listen events
> from other channels (switch by `action.channel`), this gives you full modularity in reducers.

## Effects

Effects process actions after Reducers, this means `getState()` always delivers the latest version of the
state.

You can dispatch actinos from Effects, but please, **do not cause loops!**

```tsx
// file: state/count/count.effects.ts
import type { Readonly, EffectFunction } from "@quojs/core";
import { createStore } from "@quojs/core";

/**
 * This example Effect will monitor the dispatched actions and:
 *
 * - only activate when the action's channel is "count" and event is "add"
 * - once activated, it will get a copy of the state (latest state) and if count is 10
 * - it will dispatch "count" + "set" action with a payload of 0 to reset the count */
export const countResetEffect: EffectFunction<Readonly<AppState>, AppAM> = (
  action,
  getState,
  dispatch,
) => {
  if (action.channel !== "count" || action.event !== "add") return;
  const state = getState();

  if (state.count.value > 9) {
    dispatch("count", "set", 0);
  }
};
```

Effects are delcared as part of the config object you pass to
**[createStore](#crear-el-store)**, but you can also dynamically-register effects:

```ts
store.registerEffect(resetMonitorEffect);
```

Or via `onEffect, scoped by channel + event:

```ts
store.onEffect("count", "set", async (payload, getState, dispatch) => {
  console.log("Count state has ben reset");
});
```

## Creating the Store

A store wires reducers, middleware, and effects together; and exposes multiple interaction
methods.

```ts
// The type of your store, considering your AppState and AppAM
export type AppStore = StoreInstance<keyof AppState & string, AppState, AppAM>;

// simply call createStore
export const store = createStore({
    name: "Quo.js Rocks!", // This name will be used to identify your store on Redux Devtools
    reducer: {
        count: countReducer,
    },
    middleware: [
        LogMiddleware
    ],
    effects: [
        countResetEffect,
    ],
});
```

## Subscriptions

The store supports coarse and atomic subscriptions.

- **Coarse:** run after any state change
- **Fine-grained:** subscribe to a reducer slice or deep property path

```ts
// Coarse
store.subscribe(() => {
  console.log("State changed:", store.getState());
});

// Fine-grained
store.connect({ reducer: "count", property: "value" }, (change) => {
  console.log("Count changed:", change);
});
```

## Summary

- **Async middleware** means no need for thunks or sagas.
- **Effects** provide a post-reducer workflow system.
- **Channels & Events** give semantic clarity to actions.
- **atomic subscriptions** avoid unnecessary re-renders.
- **Immutable state & DevTools support** built-in.
- **(React) Concurrent-ready**: built with `useSyncExternalStore` in mind.

**Quo.js** aims to be the Redux you wanted all along - lean, powerful, and Node / Browser ready.
