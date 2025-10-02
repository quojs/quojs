# Documentación del Núcleo de Quo.js

Este documento explica cómo usar la **biblioteca núcleo de Quo.js** (`@quojs/core`).  
Cubre los primitivos fundamentales: _store_, _actions_, _reducers_, _middleware_ y _effects_.

## Instalación

```sh
npm i @quojs/core
```

## Conceptos clave

- **[Estado](#definir-estado)**: Un mapa con tipado fuerte de tu estado.
- **[ActionMap](#definir-un-action-map)**: Un mapa con tipado fuerte de canales → eventos →
  tipos de _payload_.
- **Action**: Combinación de `{ canal, evento, payload }`.
- **[Reducer](#reducers)**: Función pura que actualiza un _slice_ del estado en respuesta a
  acciones.
- **[Middleware](#middleware)**: Interceptores asíncronos que pueden mutar, registrar (_log_),
  vetar o transformar acciones antes de llegar a los _reducers_.
- **[Effectos](#effectos)**: Escuchas posteriores al _reducer_ que pueden reaccionar a acciones
  y despachar otras nuevas.
- **[Store](#crear-el-store)**: Mantiene el árbol de estado, conecta _reducers_, ejecuta
  _middleware_ y _effects_, y gestiona suscripciones.

## Bloques base de Quo.js

- [Store](./store.md)

### Classes internas

- [Reducer](./reducer.md)
- [EventBus](./event-bus.md)
- [Lose EventBus](./lose-event-bus.md)

# Comienza ya!

## Definir Estado

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
```

## Definir un Action Map

El ActionMap impulsa el tipado en _reducers_, _middleware_ y _effects_. Procura definir los
tipos por _reducer_ o _slice_, de esta forma obtienes más versatilidad.

```ts
/**
 *  ActionMap (nivel reducer).
 * 
 *  En este ejemplo, "sumar", "restar" y "definir" se convertirán en "eventos": */
type CuentaAM = { sumar: number; restar: number; definir: number };

/**
 * ActionMap (nivel app).
 * 
 * En este ejemplo, "cuenta" se convertirá en un "canal": */
type AppAM = { cuenta: CuentaAM };
```

## Middleware

Los _middleware_ en **Quo.js** son **asíncronos por defecto**. No se requieren _thunks_, _sagas_ ni
envoltorios extra. Simplemente puedes usar `await` dentro.

```tsx
export const LogMiddleware = async (getState, action, dispatch): Promise<boolean> => {
  console.dir(action); // loguear acción

  // Solo auditar cuando se intente sumar
  if (action.channel === "cuenta" && action.event === "sumar") {
    const { cuenta: { valor: valorActual } } = getState();
    
    // vetar acción cuando valorActual exceda 10
    if (valorActual > 10) {
      return false;
    }
  }

  // dejar que la vida fluya...
  return true;
};
```

## Reducers

Un _reducer_ describe cómo cambia un _slice_ de estado en respuesta a acciones. Los _reducers_
se suscriben a pares específicos `[canal, evento]`.

```ts
// Define los pares canal + evento (lo que en Redux es Action Type)
// Estos pares son los que activarán el reducer
const ACCIONES_PARA_CUENTA = [
  ["cuenta", "sumar"],
  ["cuenta", "restar"],
  ["cuenta", "definir"],
] as const satisfies readonly ActionPair<AppAM>[];

// Define tu reducer
export const cuentaReducer: ReducerSpec<CuentaState, AppAM> = {
  actions: [...ACCIONES_PARA_CUENTA],
  state: { valor: 0 };,
  reducer: (cuenta, action) => {
    switch (action.event) {
      case "sumar":
        return { valor: cuenta.valor + action.payload };
      case "restar":
        return { valor: cuenta.valor - action.payload };
      case "definir":
        return  { valor: action.payload };

      default:
        return cuenta;
    }
  },
};
```

**Nota**: Este _reducer_ solo conmuta por `action.event`, pero los _reducers_ también pueden
escuchar eventos de otros canales (conmutando por `action.channel`); esto brinda modularidad
total en los _reducers_.

## Effectos

Los _effects_ escuchan acciones igual que los _reducers_, pero se ejecutan **después** de que
los _reducers_ procesan la acción.  
Pueden usarse para disparar _workflows_, tareas en segundo plano o nuevos _dispatch_.

```ts
export const cuentaResetEffect: EffectFunction<Readonly<AppState>, AppAM> = (
  action,
  getState,
  dispatch,
) => {
  if (action.channel !== "cuenta" || action.event !== "sumar") return;
  const state = getState();

  if (state.cuenta.valor > 9) {
    dispatch("cuenta", "definir", 0);
  }
};
```

Normalmente los _Effects_ se declaran como parte de la configuración para el _Store_, pero
tambien puedes registrar _Effects_ dinámicamente:

```ts
store.registerEffect(cuentaResetEffect);
```

O vía `onEffect`, donde puedes especificar canal + evento:

```ts
store.onEffect("cuenta", "definir", async (payload, getState, dispatch) => {
  console.log("La cuenta se ha reiniciado");
});
```

## Crear el Store

Un _store_ conecta _reducers_, _middleware_ y _effects_; y expone múltiples métodos de
interacción.

```ts
// El tipod de tu *Store*, considerando tu AppState and AppAM
export type AppStore = StoreInstance<keyof AppState & string, AppState, AppAM>;

// simplemente invoca createStore
export const store = createStore({
    name: "test",
  reducer: {
    todo: todoReducer,
  },
  middleware: [
    logger,
  ],
  effects: [
    cuentaResetEffect,
  ],
});
```

## Suscripciones

El _store_ soporta suscripciones amplias y de grano fino.

- **Amplia:** se ejecuta tras cualquier cambio de estado
- **De grano fino:** suscríbete a un _slice_ de _reducer_ o a una ruta profunda de propiedad

```ts
// Amplia
store.subscribe(() => {
  console.log("El estado cambió:", store.getState());
});

// De grano fino
store.connect({ reducer: "cuenta", property: "valor" }, (cambio) => {
  console.log("Cambió la cuenta:", cambio.valor);
});
```

## Resumen

- **Middleware asíncrono**: no se necesitan _thunks_ ni _sagas_.
- **Effects**: proporcionan un sistema de _workflow_ posterior al _reducer_.
- **Canales y Eventos**: aportan claridad semántica a las acciones.
- **suscripciones atómicas**: evitan re-renderizados innecesarios.
- **Estado inmutable y compatibilidad con DevTools** incorporados.
- **(React) Preparado para Concurrent**: construido con `useSyncExternalStore` en mente.

**Quo.js** aspira a ser el Redux que siempre quisiste: ligero, potente y nativo para React 18+.
