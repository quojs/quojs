[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / StoreContext

# Variable: StoreContext

> `const` **StoreContext**: `Context`\<`null` \| [`StoreInstance`](#)\<`any`, `any`, `any`\>\>

Definida en: [context/StoreContext.ts:28](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/context/StoreContext.ts#L28)

Contexto de React que transporta una [StoreInstance](#) para las integraciones de React con Quo.js.

## Notas

- El valor por defecto es `null`. Los consumidores deben:
  1) Estar envueltos con [StoreProvider](StoreProvider.md), o
  2) Usar un hook auxiliar que lance un error amigable cuando el contexto sea `null`.
- Puedes crear múltiples stores independientes anidando varios providers.

## Ejemplo

```tsx
import { useContext } from "react";
import { StoreContext } from "@quojs/react";

export function Counter() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Falta StoreProvider");
  const state = store.getState();
  return <span>{state.counter.value}</span>;
}
```
