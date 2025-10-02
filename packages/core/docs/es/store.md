# Quo.js Store — Guía para desarrolladores (API y Patrones)

Este documento explica **cómo usar el `Store`** en **Quo.js**: cómo fluye el estado, cómo "cablear"
tus _reducers_, _middleware_ y _effects_, y cómo suscribirse a cambios (gruesos y de **grano
fino**). También cubre DevTools, HMR y composición dinámica.

Si estas depurando por qué una suscripción no se disparó, revisa
**[Solución de problemas](#solución-de-problemas)**.

## Modelo mental

Un `Store` coordina cuatro cosas:

1. **Middleware (asíncronos por defecto)** — se ejecutan **antes** que los _reducers_. Cada _middleware_ recibe `(state, action, dispatch)` y devuelve `true` para continuar o `false` para vetar.

2. **Reducers** — uno por _slice_ (con _namespace_). Los _reducers_ reciben
   `{ channel, event, payload }` y devuelven un nuevo estado del _slice_.

3. **Effects (asíncronos)** — se ejecutan **después** de que los _reducers_ han actualizado el estado. Se usan para _workflows_, _side‑effects_ o despachar acciones adicionales.

4. **Suscripciones** — tanto gruesas (`subscribe()` ante cualquier cambio de estado) como de **grano fino** vía `connect({ reducer, property }, handler)`, que puede apuntar a **rutas profundas con puntos** dentro de un _slice_ (p. ej., `data.123.titulo`).

Bajo el capó, el _store_ emite **cada ruta actualizada y sus ancestros** para el _slice_
afectado, así que `data.123.titulo` también emitirá `data.123` y `data` una vez cada una.

**El dispatch está serializado.** Las acciones se colocan en una cola; _middleware_, _reducers_, _effects_ y notificaciones de DevTools ocurren en orden `dispatch()` devuelve `Promise<void>` y **nunca falla al ocurrir algún error**; los errores se imprimen en consola.

**Node & SSR:** **Quo.js** funciona **Node** (no se asume que existe el DOM). La integracion con DevTools solo se habilita si la extension de Redux DevTools esta presente en el ambiente, (p. ej. en el Navegador).

## Dispatch y middleware

```ts
await store.dispatch(channel, event, payload);
```

- Los _middleware_ se llaman en orden:
  `mw(state, action, dispatch) -> boolean | Promise<boolean>`.
- Si algún _middleware_ devuelve un valor falsy o lanza, **se detiene la propagación** para
  _reducers_ y _effects_.
- Los errores se registran; `dispatch()` **no nunca falla**.

**Ejemplo de middleware (vetar desloguear):**

```ts
const bouncer: MiddlewareFunction<any, AppAM> = async (state, action) => {
  if (action.channel === "usuario" && action.event === "desloguear") return false;

  return true;
};

const unreg = store.registerMiddleware(bouncer);
// luego: unreg()
```

Reemplaza el conjunto completo de _middleware_ (útil para HMR):

```ts
store.replaceMiddleware([bouncer, other]);
```

## Reducers (dinámicos)

Agrega un nuevo _slice_ en tiempo de ejecución:

```ts
const dispose = store.registerReducer("prefs", prefsSpec);
// luego: dispose()  // desmonta el reducer y elimina el estado del slice
```

Reemplaza todo el conjunto de _reducers_ (por defecto **preserva el estado existente del
slice**):

```ts
store.replaceReducers({ usuario: usuarioSpec, prefs: prefsSpec }, { preserveState: true });
```

O reemplaza cualquier combinación en una sola llamada:

```ts
store.hotReplace({
  reducer: { usuario: nextUsuarioSpec },
  middleware: [bouncer],
  effects: [auditor],
  preserveState: true,
});
```

## Suscripciones

### Gruesa

```ts
const unsub = store.subscribe(() => {
  // se dispara una vez por cada dispatch exitoso que cambió algún slice
});
```

### De grano fino (rutas profundas)

```ts
// Se dispara por cambios de hoja en `todo.data` y **también** por rutas ancestras
const off = store.connect({ reducer: "todo", property: "data" }, (chg) => {
  // chg: { oldValue, newValue, path: "data" | "data.<id>" | "data.<id>.title" }
});
```

**Cómo se detectan las rutas:** Tras cada actualización de _slice_, el _store_ difiere **previo vs siguiente** y emite cada **ruta** actualizada relativa al _slice_. Para cada propiedad, también emite todas las **rutas ancestras** una sola vez. Si el reducer devuelve la misma referencia o **no hay cambios**, **no se emite nada** (evita _no-ops_ ruidosas).

## DevTools

Si la extensión Redux DevTools está presente, el _store_ hará:

- `init(state)` al inicio.
- `send({ type, payload }, state)` en cada dispatch exitoso.
- Reaccionará a **time travel** / **rollback** / **reset** aplicando estado externo y emitiendo
  cambios de rutas profundas para mantener sincronizadas tus suscripciones atómicas.

Mensajes soportados: `JUMP_TO_STATE`, `JUMP_TO_ACTION`, `ROLLBACK`, `RESET`, `IMPORT_STATE` y
`COMMIT` (que re‑baselínea el historial vía `init`). En Node/SSR, DevTools simplemente se
deshabilita.

## Referencia de API

### `createStore({
    name: "test", reducer, middleware?, effects? }) => Store`

Crea un _store_ a partir de un mapa de `ReducerSpec`. Ver [Inicio rápido](#inicio-rápido).

### `store.dispatch(channel, event, payload) => Promise<void>`

Serializa acciones mediante una cola interna. Middleware -> reducers -> effects -> DevTools. No
rechaza; registra errores.

### `store.subscribe(listener) => () => void`

Suscripción gruesa. Se dispara tras un dispatch que produjo un cambio real en el estado.

### `store.connect({ reducer, property }, handler) => () => void`

Suscripción de **grano fino** a una propiedad del _slice_. `property` puede ser una **ruta
profunda con puntos**. El _handler_ recibe `{ oldValue, newValue, path }`. Emite rutas de hoja y
ancestras **una vez cada una** por dispatch.

### `store.getState() => DeepReadonly<S>`

Devuelve el _snapshot_ actual del estado (congelado). No lo mutes.

### `store.registerMiddleware(mw) => () => void`

Agrega _middleware_ dinámicamente. Devuelve una función para desregistrar. Ver
[Dispatch y middleware](#dispatch-y-middleware).

### `store.replaceMiddleware(next: Middleware[])`

Reemplaza el conjunto completo de _middleware_ (amigable con HMR).

### `store.registerEffect(handler) => () => void`

Agrega un _effect_ post‑reducer. Devuelve una función para desregistrar.

### `store.onEffect(channel, event, handler) => () => void`

Azúcar para un _effect_ filtrado a un par de acción específico; te da `payload` tipado.

### `store.replaceEffects(next: Effect[])`

Reemplaza el conjunto completo de _effects_.

### `store.registerReducer(name, spec) => () => void`

Monta un nuevo _slice_ en tiempo de ejecución. Devuelve un _disposer_ que **desmonta** el
_slice_ y **elimina** su estado.

### `store.replaceReducers(next, { preserveState = true })`

Reemplaza el conjunto completo de _reducers_. Quita _slices_ ausentes; agrega/actualiza los
existentes. Por defecto, preserva los estados actuales.

### `store.hotReplace({ reducer?, middleware?, effects?, preserveState? })`

Comodín para reemplazar cualquier combinación en una sola llamada. Útil para HMR.

## Mejores prácticas

- **Reducers puros:** Devuelve siempre un **nuevo** objeto cuando algo cambie. Si nada cambió,
  devuelve la **misma referencia** para evitar emisiones espurias.
- **Mantén _effects_ idempotentes:** Pueden re‑ejecutarse al importar historial desde DevTools.
- **Protege _middleware_:** Devolver `false` es la forma canónica de vetar una acción.
- **Usa rutas profundas con intención:**
  `connect({ reducer: "todo", property: "data.123.title" })` es más selectivo que escuchar
  `data`.
- **Node/SSR:** Funciona sin UI; DevTools es solo navegador.
- **No mutes `getState()`:** Es un _snapshot_ congelado.

## Solución de problemas

- **«Mi suscripción de grano fino no se disparó.»**  
  O bien tu reducer devolvió la misma referencia o no cambió ninguna ruta **de hoja**. Devuelve
  un nuevo objeto para las ramas modificadas y asegúrate de actualizar el campo correcto.

- **«¿Dispatch lanzó?»**  
  No debería. Si un _middleware_/_effect_ lanza, el _store_ registra en consola y continúa.

- **«DevTools no aparece.»**  
  Probablemente estás en Node/SSR o no tienes la extensión Redux DevTools.

## Avanzado: ejemplo con _effects_ y _middleware_ de veto

```ts
const auditor: EffectFunction<Readonly<AppState>, AppAM> = async (action, getState) => {
  if (action.channel === "todo" && action.event === "add") {
    console.log("agregado:", action.payload.id);
  }
};

const bouncer: MiddlewareFunction<Readonly<AppState>, AppAM> = async (_state, action) => {
  if (action.channel === "todo" && action.event === "remove") return false; // veto elimina
  
  return true;
};

const store = createStore({
    name: "test",
  reducer: { todo: todoSpec },
  middleware: [bouncer],
  effects: [auditor],
});
```

## Glosario

- **ActionMap** — tu contrato tipado para `{ channel, event } → payload`.
- **ReducerSpec** — `{ state, actions, reducer }` por _slice_.
- **Effect** — manejador asíncrono post‑reducer.
- **Middleware** — _bouncer/transform/logger_ pre‑reducer (async).
- **Ruta de hoja** — la ruta más profunda cambiada (p. ej., `data.123.titulo`).

> ve la clase [Store.ts](../../src/store/Store.ts).

<- Volver a [Quo.js core docs](./core.md)
