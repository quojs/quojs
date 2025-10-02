# Cheat Sheet — Inferred Hooks (createQuoHooks)

[Versión en español](../../es/gist/inferencia-de-topos.md)

**Use this when you want the cleanest DX.** Bind your context once with `createQuoHooks`, then enjoy fully inferred types in components.

## 0) Store (shared in both cheat-sheets)

See [examples/store.ts](../../examples/store.ts): (included). It defines two slices: `count` and `ui`, with multiple properties so we can show multi‑property hooks.

## 1) Bind hooks once

```tsx
// context/QuoStoreContext.ts
import { createContext } from "react";
import type { StoreInstance } from "@quojs/core";
import type { AppState, AppAM } from "../examples/store";

export const QuoStoreContext = createContext<StoreInstance<keyof AppState & string, AppState, AppAM> | null>(null);
```

```tsx
// hooks.ts
import { createQuoHooks } from "@quojs/react";
import { QuoStoreContext } from "./context/QuoStoreContext";

export const { useStore, useDispatch, useSelector, useSliceProp, useSliceProps, shallowEqual } =
  createQuoHooks(QuoStoreContext);
```

```tsx
// providers.tsx
import { QuoStoreContext } from "./context/QuoStoreContext";
import { store } from "../examples/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <QuoStoreContext.Provider value={store}>{children}</QuoStoreContext.Provider>;
}
```

## 2) `useSliceProp` — exact path (inferred)

```tsx
import { useSliceProp, useDispatch } from "./hooks";

export function CounterValue() {
  const value = useSliceProp({ reducer: "count", property: "value" }); // number
  const dispatch = useDispatch();

  return (
    <div>
      Value: {value}{" "}
      <button onClick={() => dispatch("count", "add", 1)}>+1</button>
    </div>
  );
}
```

## 3) `useSliceProp` — wildcard (map receives the slice)

```tsx
export function HistoryLength() {
  const length = useSliceProp(
    { reducer: "count", property: "history.*" }, // wildcard → map gets the whole slice
    (slice) => (slice?.history?.length ?? 0)
  );
  
  return <span>history size: {length}</span>;
}
```

## 4) `useSliceProps` — multi-path (inferred + single rerender per burst)

```tsx
export function CounterPanel() {
  const vm = useSliceProps(
    [
      { reducer: "count", property: ["value", "step"] },
      { reducer: "ui", property: "theme" },
    ],
    (s) => ({
      value: s.count.value,
      step: s.count.step,
      theme: s.ui.theme,
    })
  );

  return (
    <div data-theme={vm.theme}>
      <strong>{vm.value}</strong> (step: {vm.step})
    </div>
  );
}
```

## 5) `useSelector` — coarse derivation (whole state)

```tsx
export function DoneCount() {
  const derived = useSelector((s) => ({
    busy: s.ui.busy,
    overNine: s.count.value > 9,
  }));

  return <pre>{JSON.stringify(derived)}</pre>;
}
```
