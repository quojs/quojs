# Receta: Usar **Immer** con reducers de Quo.js

Esta receta muestra cómo integrar **Immer** con la API de reducers del núcleo de Quo.js, para
que puedas escribir reducers con un estilo conciso y mutable mientras mantienes actualizaciones
inmutables bajo el capó.

> TL;DR: Envuelve tu reducer con el pequeño _helper_ `conImmer` y mantén tus tipos de acción
> públicos sin cambios.

## ¿Por qué Immer aquí?

- **Ergonomía:** Escribe `draft.x = y` en lugar de hacer _spread_ de objetos profundamente
  anidados.
- **Corrección:** Immer garantiza actualizaciones inmutables.
- **Cero cambios de API:** Mantienes `ReducerSpec`/`typedActions` de Quo.js tal cual.

## Prerrequisitos

```bash
npm i immer
```

## Action Map

```ts
import type {
  ActionPair,
  Readonly,
  EffectFunction,
  ReducerSpec,
  StoreInstance,
} from "@quojs/core";
import { createStore } from "@quojs/core";

type CuentaState = {
  valor: number;
};

/**
 * Define la forma (tipado) de tu estado, recomendamos usar esta tecnica ya * que procee mas versatilidad. */
type AppState = {
  cuenta: CuentaState;
};

// ActionMap (nivel reducer)
type CuentaAM = { sumar: number; restar: number; definir: number };

// ActionMap (nivel app)
type AppAM = { cuenta: CuentaAM };
```

## El _helper_ `conImmer`

Un pequeño _wrapper_ que convierte un reducer immer basado en _draft_ en un
`reducer estándar de Quo.js`, es decir `(state, action) => state`.

```ts
import { produce, type Draft } from "immer";

export type RecipeReducer<S, A = any> = (draft: Draft<S>, action: A) => void | undefined;

/**
 * Envuelve un reducer basado en draft en un reducer inmutable estándar */
export function conImmer<S, A = any>(recipe: RecipeReducer<S, A>) {
  return (state: S, action: A): S =>
    produce(state, (draft) => {
      // Importante: NO retornes el draft; solo muta o no hagas nada.
      recipe(draft, action);
    });
}
```

> **Error común evitado:** **No** hagas `return draft` desde el **reducer**; devolver un valor
> en un **reducer** de Immer reemplaza el estado completo. Simplemente `return;` o deja pasar
> cuando no cambies nada.

## Reductor

```ts
// Define los pares canal + evento (lo que en Redux es Action Type)
// Estos pares son los que activarán el reducer
const ACCIONES_PARA_CUENTA = [
  ["cuenta", "sumar"],
  ["cuenta", "restar"],
  ["cuenta", "definir"],
] as const satisfies readonly ActionPair<AppAM>[];

// Escribe tu reducer respetando el tipado de ReducerSpec en Quo.js
const reducer: ReducerSpec<CountState, AppAM>["reducer"] = conImmer<CountState, any>(
  (draft, action) => {
    switch (action.event) {
      case "add":
        draft.valor += action.payload;
      case "subtract":
        draft.valor -= action.payload;
      case "set":
        draft.valor = action.payload;

      default:
        return;
    }
  },
);

const cuentaReducer: ReducerSpec<CountState, AppAM> = {
  actions: [...ACCIONES_PARA_CUENTA],
  state: { valor: 0 },
  reducer,
};

export default cuentaReducer;
```

## Conexión del Store

```ts
// store.ts
import { createStore } from "@quojs/core";

import todoReducer from "./todo.reducer";

export const store = createStore({
    name: "test",
  reducer: { todo: todoReducer },
});
```

## Prueba rápida (_Smoke Test_)

```ts
store.dispatch("cuenta", "sumar", 1);

const { valor } = Object.values(store.getState().cuenta);
console.assert(valor === 1);
```

## Conclusiones

- Immer mantiene tus reducers limpios sin cambiar las APIs de Quo.js.
- No retornes desde el reducer salvo para detener la ejecución; nunca hagas `return draft`.
