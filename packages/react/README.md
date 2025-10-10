# React bindings for Quo.js

[Versión en español](./README.es.md)

Official React companion for **Quo.js**, a predictable state container that
revives the simplicity of classic Redux while adding:

- **Channels + events** instead of action types
- **Native async middleware** and **effects**, no thunks/sagas ceremony
- **Fine‑grained subscriptions** to exact dotted paths or wildcard patterns
- **Immutability guarantees** with deep‑freeze and precise change detection
- A small, explicit API surface you can actually reason about

This package provides:

- `<StoreProvider>` to put a **Quo.js** store in React context
- Hooks:
  - `useStore`, `useDispatch`, `useSelector`
  - `useSliceProp` and `useSliceProps` for **fine‑grained** re-renders
  - `useSuspenseSliceProp` and `useSuspenseSliceProps` for **Suspense** data flows
  - Cache helpers for Suspense: `invalidateSliceProp`, `invalidateSlicePropsByReducer`,
    `clearSuspenseCache`

## Installation

Install **Quo.js** and the React bindings:

```bash
npm i @quojs/core @quojs/react
# or
yarn add @quojs/core @quojs/react
# or
pnpm add @quojs/core @quojs/react
```

Peer deps you’re expected to have: `react` and `react-dom` (React 18+). TypeScript is recommended.

## Quick Start

### Store Setup

Follow the example on **Quo.js** on [how to create a Store](../../core/docs/en/core.md#quick-start).

### AppStore Context

Use `React Context` to expose the store to your App:

```tsx
// file: ./context/QuoStoreContext.ts
import { createContext } from "react";
import type { AppStore } from "store.ts";

export const QuoStoreContext = createContext<AppStore | null>(null);
```

### Hooks Setup

Create and export typed hooks for your App:

```tsx
import { createQuoHooks } from "@quojs/react";

import { QuoStoreContext } from "./context/QuoStoreContext.ts";
import type { AppAM, AppState } from "./types"; // <-- grab these from the Store creation stage

export const { useStore, useDispatch, useSelector, useSliceProp, useSliceProps, shallowEqual } =
  createQuoHooks<keyof AppState & string, AppState, AppAM>(QuoStoreContext);
```
Wrapp your App in the Quo provider.

```tsx
import React from "react";
import { createRoot } from "react-dom/client";

import { QuoStoreContext } from "./context/QuoStoreContext.ts";
import { store, type AppStore } from "store.ts";

import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QuoStoreContext.Provider value={store}>
      <App />
    </StoreProvider>
  </React.StrictMode>
);
```

Read & update state from React using the hooks:

```tsx
import React from "react";
import { useDispatch, useSliceProp } from "@quojs/react";

export function Atomic() {
  // Fine-grained: only re-renders when "counter.value" actually changes
  const value = useSliceProp({
    reducer: "count",
    property: "value",
  });

  return <h1>Counter: {value}</h1>;
}

export function App() {
  const dispatch = useDispatch<any>();

  return (
    <div>
      <Atomic />
      <button onClick={() => dispatch("count", "subtract", 1)}>-1</button>
      <button onClick={() => dispatch("count", "add", 1)}>+1</button>
      <button onClick={() => dispatch("count", "set", 0)}>Reset</button>
    </div>
  );
}
```

That’s it. No boilerplate actions, no selectors, no thunks. You model events directly and wire reducers against `(channel, event)`.

## Documentation

- [Developer Docs](https://docs.quojs.dev/en/v0/react): quick-start guide, tutorial, recipes, etc.
- [TypeDoc](./docs/en/README.md): a more technical documentation extracted using TypeDoc.