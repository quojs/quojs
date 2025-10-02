# Gist — Inferencia con `createQuoHooks`

**Mejor DX.** Vincula tu contexto una vez con `createQuoHooks` y usa _hooks_ sin genéricos en componentes.

## 0) Store (compartida en ambas chuletas)

Consulta `examples/store.ts`. Define dos slices: `count` y `ui` con varias propiedades para mostrar ejemplos multi‑propiedad.

## 1) Vincula los hooks una sola vez

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

## 2) `useSliceProp` — ruta exacta (inferida)

```tsx
import { useSliceProp, useDispatch } from "./hooks";

export function CounterValue() {
  const value = useSliceProp({ reducer: "count", property: "value" }); // number
  const dispatch = useDispatch();
  return <button onClick={() => dispatch("count", "add", 1)}>+1 ({value})</button>;
}
```

## 3) `useSliceProp` — wildcard (map recibe el slice)

```tsx
export function HistoryLength() {
  const length = useSliceProp(
    { reducer: "count", property: "history.*" },
    (slice) => (slice?.history?.length ?? 0)
  );
  return <span>tamaño historial: {length}</span>;
}
```

## 4) `useSliceProps` — multi‑ruta (inferido + un re-render por ráfaga)

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

  return <div data-theme={vm.theme}><strong>{vm.value}</strong> (step: {vm.step})</div>;
}
```

## 5) `useSelector` — derivación gruesa

```tsx
export function DoneCount() {
  const derived = useSelector((s) => ({ busy: s.ui.busy, overNine: s.count.value > 9 }));
  return <pre>{JSON.stringify(derived)}</pre>;
}
```
