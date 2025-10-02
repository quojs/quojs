# Cheat Sheet — Explicit Generics

[Versión en español](../../es/gist/genericos.md)

Use this when you are calling hooks directly from `@quojs/react` **without** `createQuoHooks`, or when you want to be extra explicit in shared/library code.

We’ll reuse the same store shape from [examples/store.ts](../../examples/store.ts):

```ts
import type { AppState } from "../examples/store";
type R = keyof AppState; // "count" | "ui"
```

## 1) `useSliceProp` — exact path

```tsx
import { useSliceProp } from "@quojs/react";

const value = useSliceProp<
  "count",      // reducer key
  AppState,     // full app state
  "value"       // dotted path
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

## 3) `useSliceProps` — multi-path with selector result typing

```tsx
import { useSliceProps } from "@quojs/react";

const vm = useSliceProps<
  keyof AppState,                   // reducers union
  AppState,                         // state
  { value: number; step: number }   // selector return type
>(
  [
    { reducer: "count", property: ["value", "step"] },
  ],
  (s) => ({ value: s.count.value, step: s.count.step })
);
```

## 4) `useSliceProps` — cross-slice + custom equality

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
  (a, b) => a.themedValue === b.themedValue // custom isEqual
);
```
