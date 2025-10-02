# Quick Start (React)

[Versión en español](../es/inicio-rapido.md)

**TL;DR:** Use `createQuoHooks` to bind app‑specific, generics‑free hooks once.  
If want zero setup, `StoreProvider` exposes pre‑bound hooks as a convenience.

Your Quo store is created in `@quojs/core` (see its
[Quick Start](../../../core/docs/en/core.md#quick-start)). This page covers React wiring.

## Option A — `createQuoHooks` (recommended for teams)

Bind your own React context to typed hooks once, then import those hooks everywhere with no
generics.

```tsx
// context/QuoStoreContext.ts
import { createContext } from "react";
import type { StoreInstance } from "@quojs/core";
import type { AppAM, AppState } from "./types";

export const QuoStoreContext = createContext<StoreInstance<
  keyof AppState & string,
  AppState,
  AppAM
> | null>(null);
```

```tsx
// hooks.ts
import { createQuoHooks } from "@quojs/react";
import { QuoStoreContext } from "./context/QuoStoreContext";

export const { useStore, useDispatch, useSelector, useSliceProp, useSliceProps, shallowEqual } =
  createQuoHooks(QuoStoreContext);
```

Provide the context once near the root:

```tsx
// providers.tsx
import { QuoStoreContext } from "./context/QuoStoreContext";
import { store } from "./store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <QuoStoreContext.Provider value={store}>{children}</QuoStoreContext.Provider>;
}
```

Use your hooks — no generics in components:

```tsx
import { useSliceProp, useDispatch } from "./hooks";

export function Counter() {
  const dispatch = useDispatch();
  const value = useSliceProp({ reducer: "counter", property: "value" });

  return <button onClick={() => dispatch("counter", "increment", 1)}>+1 ({value})</button>;
}
```

## Option B — `StoreProvider`

If you don’t mind using generics, use the built‑in provider + package hooks.

```tsx
import { StoreProvider, useDispatch, useSliceProp } from "@quojs/react";
import { store } from "./store";

export default function App() {
  return (
    <StoreProvider store={store}>
      <Counter />
    </StoreProvider>
  );
}

function Counter() {
  const dispatch = useDispatch();
  const value = useSliceProp<
    "counter",  // reducer key
    AppState,   // full app state
    "value"     // dotted path inside the reducer
  >({ reducer: "counter", property: "value" });

  return <button onClick={() => dispatch("counter", "increment", 1)}>+1 ({value})</button>;
}
```
