# Gist — Genéricos explícitos

Úsala si llamas a los hooks directamente desde `@quojs/react` **sin** `createQuoHooks`, o si quieres ser muy explícito en código compartido/bibliotecas.

Reusamos el estado de [examples/store.ts](../../examples/store.ts):

```ts
import type { AppState } from "../examples/store";
type R = keyof AppState; // "count" | "ui"
```

## 1) `useSliceProp` — ruta exacta

```tsx
import { useSliceProp } from "@quojs/react";

const value = useSliceProp<
  "count",     // reducer
  AppState,    // estado
  "value"      // ruta
>({ reducer: "count", property: "value" }); // number
```

## 2) `useSliceProp` — wildcard + map(slice) → number

```tsx
const histLen = useSliceProp<
  "count",
  AppState,
  "history.*"
>(
  { reducer: "count", property: "history.*" },
  (slice) => (slice?.history?.length ?? 0) as number
);
```

## 3) `useSliceProps` — multi‑ruta con tipo de retorno del selector

```tsx
import { useSliceProps } from "@quojs/react";

const vm = useSliceProps<
  keyof AppState,                   // reducers
  AppState,                         // estado
  { value: number; step: number }   // retorno del selector
>(
  [
    { reducer: "count", property: ["value", "step"] },
  ],
  (s) => ({ value: s.count.value, step: s.count.step })
);
```

## 4) `useSliceProps` — entre slices + igualdad personalizada

```tsx
const model = useSliceProps<
  keyof AppState,
  AppState,
  { themedValue: string }
>(
  [
    { reducer: "count", property: "value" },
    { reducer: "ui", property: "theme" },
  ],
  (s) => ({ themedValue: `${s.ui.theme}:${s.count.value}` }),
  (a, b) => a.themedValue === b.themedValue
);
```
