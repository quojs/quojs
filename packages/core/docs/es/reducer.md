# Reducer

Un **Reducer** en **Quo.js** es una función **pura** que actualiza el estado en función de un _canal_ y un
_evento_ (no una acción de cadena sin tipar).

## ¿Por qué?

- Evita colisiones de acciones entre dominios
- Hace que los *reducers* sean más enfocados
- Permite que los *reducers* sintonicen acciones de otros *reducers**
- Con tipos (type‑safe) y fácil de componer

## Ejemplo

```ts
import { Reducer } from "quojs";

const counterReducer = new Reducer((cuenta, action) => {
  switch (action.event) {
    case "sumar":
      return { value: cuenta.value + action.payload  };
    case "restar":
      return { value: cuenta.value - action.payload  };
    case "definir":
      return { value: action.payload };
      
    default:
      return cuenta;
  }
});
```

> **¡No tienes que hacer esto!* Tú solo provees funciones puras y sencillas. Los reducers se
> envuelven **automágicamente** en esa clase para mantener consistentes el tipado y la API.

## API de Reducer

- `reduce(state, action)`: aplica la acción y devuelve el siguiente estado.

> ve la clase [Reducer.ts](../../src/reducer/Reducer.ts).

<- Volver a [Quo.js core docs](./core.md)
