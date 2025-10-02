# Inicio Rápido (React)

**Resumen:** Usa `createQuoHooks` para vincular _hooks_ tipados a tu contexto **una sola vez** y olvidarte de genéricos en componentes.  
Si tienes una sola _store_ y quieres cero configuración, `StoreProvider` ofrece _hooks_ pre‑vinculados como conveniencia.

La creación del _store_ está en `@quojs/core`. Aquí cubrimos la integración con React.

## Opción A — `createQuoHooks` (recomendada para equipos)
Vincula tu contexto a _hooks_ tipados una vez y reutilízalos en toda la app.

```tsx
// context/QuoStoreContext.ts
import { createContext } from "react";
import type { StoreInstance } from "@quojs/core";
import type { AppAM, AppState } from "./types";

export const QuoStoreContext = createContext<StoreInstance<keyof AppState & string, AppState, AppAM> | null>(null);
```

```tsx
// hooks.ts
import { createQuoHooks } from "@quojs/react";
import { QuoStoreContext } from "./context/QuoStoreContext";

export const {
  useStore, useDispatch, useSelector, useSliceProp, useSliceProps, shallowEqual
} = createQuoHooks(QuoStoreContext);
```

Provee el contexto en la raíz:

```tsx
// providers.tsx
import { QuoStoreContext } from "./context/QuoStoreContext";
import { store } from "./store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <QuoStoreContext.Provider value={store}>{children}</QuoStoreContext.Provider>;
}
```

Usa tus _hooks_ — sin genéricos en componentes:

```tsx
import { useSliceProp, useDispatch } from "./hooks";

function Counter() {
  const value = useSliceProp({ reducer: "counter", property: "value" });
  const dispatch = useDispatch();
  
  return <button onClick={() => dispatch("counter", "increment", 1)}>+1 ({value})</button>;
}
```

## Opción B — `StoreProvider` (conveniencia para una sola store)
Si no necesitas un contexto propio, usa el _provider_ integrado + _hooks_ del paquete.

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
  const value = useSliceProp({ reducer: "counter", property: "value" });
  const dispatch = useDispatch();

  return <button onClick={() => dispatch("counter", "increment", 1)}>+1 ({value})</button>;
}
```
