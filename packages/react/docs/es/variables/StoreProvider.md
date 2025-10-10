[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / StoreProvider

# Variable: StoreProvider

> `const` **StoreProvider**: `React.FC`\<\{ `children`: `ReactNode`; `store`: [`StoreInstance`](#)\<`any`, `any`, `any`\>; \}\>

Definida en: [context/StoreProvider.tsx:41](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/context/StoreProvider.tsx#L41)

Proveedor de React que inserta una [StoreInstance](#) dentro de [StoreContext](StoreContext.md).

## Parámetro

Instancia del store de Quo.js que se expondrá a los componentes descendientes.

## Parámetro

Subárbol de React que consumirá el store.

## Notas

- Envuelve tu aplicación (o un subárbol) para que el store esté disponible mediante `useContext(StoreContext)`
  o cualquier hook de nivel superior que expongas (por ejemplo, `useSlice`, `useDispatch`).
- Puedes anidar múltiples `StoreProvider`s para delimitar distintos stores en diferentes subárboles.
- En Next.js App Router, este componente debe usarse dentro de un límite de **cliente** (`'use client'`).

## Ejemplo

```tsx
'use client';
import { StoreProvider } from '@quojs/react';
import { createStore } from '@quojs/core';

const store = createStore({
  name: 'App',
  reducer: {
    counter: {
      state: { value: 0 },
      actions: [['ui','increment']],
      reducer(s, a) { return a.event === 'increment' ? { value: s.value + a.payload } : s; }
    }
  }
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <StoreProvider store={store}>{children}</StoreProvider>;
}
```
