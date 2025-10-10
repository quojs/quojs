[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Store

# Clase: Store\<AM, R, S\>

Definida en: [store/Store.ts:93](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L93)

**Store** fuertemente tipado, impulsado por canales/eventos con:
- **Reducers de slice** (con namespace bajo `R`)
- **Middleware** (pre-reducer, puede cancelar la propagación)
- **Efectos** (post-reducer, seguros para async)
- **Suscripciones granulares** mediante **rutas de propiedades** con puntos (por ejemplo, `"todos.3.title"`)
- Integración opcional con **Redux DevTools** (dev)

## Observaciones

- `dispatch()` se **serializa** internamente: las acciones se ponen en cola y se procesan una por una.
- Los reducers se conectan a través de un EventBus interno mediante `(channel, event)`.
- Los eventos de cambio de grano fino se emiten a través de un LooseEventBus mediante **rutas con puntos**.
- El estado se **congela** (superficialmente, por snapshot de slice) antes de hacer commit para desalentar mutaciones.

## Ejemplo

```ts
// Definir slices
type Counter = { value: number };
type Todos = { items: Array<{ id: string; title: string }> };

type S = { counter: Counter; todos: Todos };
type AM = {
  ui: { increment: number; setTitle: { id: string; title: string } };
};

const store = createStore({
  name: 'Demo',
  reducer: {
    counter: {
      state: { value: 0 },
      actions: [['ui', 'increment']],
      reducer(s, a) {
        if (a.event === 'increment') return { value: s.value + a.payload };
        return s;
      }
    },
    todos: {
      state: { items: [] },
      actions: [['ui', 'setTitle']],
      reducer(s, a) {
        if (a.event === 'setTitle') {
          const next = structuredClone(s);
          const t = next.items.find(x => x.id === a.payload.id);
          if (t) t.title = a.payload.title;
          return next;
        }
        return s;
      }
    }
  }
});

// Suscribirse a una ruta con puntos
const unsub = store.connect({ reducer: 'todos', property: 'items.0.title' }, (chg) => {
  console.log('el título cambió de', chg.oldValue, 'a', chg.newValue);
});

// Despachar
store.dispatch('ui', 'increment', 1);
```

## Parámetros de Tipo

### AM

`AM` *extends* [`ActionMapBase`](../type-aliases/ActionMapBase.md)

Mapa de acciones que describe los tipos `(channel → event → payload)`.

### R

`R` *extends* `string`

Unión de nombres de slice (unión de literales string).

### S

`S` *extends* `Record`\<`R`, `any`\>

Mapa de objetos de estados de slice indexados por `R`.

## Implementa

- [`StoreInstance`](../interfaces/StoreInstance.md)\<`R`, `S`, `AM`\>

## Constructores

### Constructor

> **new Store**\<`AM`, `R`, `S`\>(`spec`): `Store`\<`AM`, `R`, `S`\>

Definido en: [store/Store.ts:174](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L174)

Crea un store a partir de un [StoreSpec](../type-aliases/StoreSpec.md).

#### Parámetros

##### spec

[`StoreSpec`](../type-aliases/StoreSpec.md)\<`R`, `S`, `AM`\> & `object`

Configuración del Store (nombre, reducers, middleware, efectos opcionales).

#### Retorna

`Store`\<`AM`, `R`, `S`\>

## Propiedades

### name

> **name**: `string`

Definida en: [store/Store.ts:99](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L99)

Nombre del Store (usado por DevTools y diagnósticos).

#### Implementación de

[`StoreInstance`](../interfaces/StoreInstance.md).[`name`](../interfaces/StoreInstance.md#name)

## Métodos

### connect()

> **connect**(`spec`, `h`): () => `void`

Definido en: [store/Store.ts:530](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L530)

Conecta un listener **de grano fino** a una ruta con puntos bajo un slice.

#### Parámetros

##### spec

`{ reducer, property }` donde `property` es una ruta con puntos (por ejemplo, `"items.0.title"`).

###### property

`string`

###### reducer

`R`

##### h

(`chg`) => `void`

Manejador que recibe un [Change](../interfaces/Change.md) con `{ oldValue, newValue, path }`.

#### Retorna

Función para cancelar suscripción.

> (): `void`

##### Retorna

`void`

#### Ejemplo

```ts
const off = store.connect({ reducer: 'todos', property: 'items.0.title' }, (chg) => {
  console.log('cambio de título:', chg);
});
off();
```

#### Implementación de

[`StoreInstance`](../interfaces/StoreInstance.md).[`connect`](../interfaces/StoreInstance.md#connect)

***

### dispatch()

> **dispatch**\<`C`, `E`\>(`channel`, `event`, `payload`): `Promise`\<`void`\>

Definido en: [store/Store.ts:446](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L446)

Despacha una acción tipada `(channel, event, payload)`.
Las acciones se ponen en cola y se procesan **secuencialmente**.

Pipeline por acción:
1) **Middleware** (puede cancelar retornando `false`)
2) **Reducers** (mediante bus de reducer interno)
3) **Efectos** (async, errores absorbidos)
4) **DevTools** (dev)

#### Parámetros de Tipo

##### C

`C` *extends* `string` \| `number` \| `symbol`

Clave de canal en `AM`.

##### E

`E` *extends* `string` \| `number` \| `symbol`

Clave de evento dentro del canal `C`.

#### Parámetros

##### channel

`C`

Nombre del canal.

##### event

`E`

Nombre del evento.

##### payload

`AM`\[`C`\]\[`E`\]

Payload tipado como `AM[C][E]`.

#### Retorna

`Promise`\<`void`\>

Una promesa que se resuelve cuando la acción ha terminado de procesarse.

#### Ejemplo

```ts
await store.dispatch('ui', 'increment', 1);
```

#### Implementación de

`StoreInstance.dispatch`

***

### getState()

> **getState**(): [`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>

Definido en: [store/Store.ts:557](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L557)

Retorna el snapshot del estado inmutable actual.

#### Retorna

[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>

#### Implementación de

[`StoreInstance`](../interfaces/StoreInstance.md).[`getState`](../interfaces/StoreInstance.md#getstate)

***

### hotReplace()

> **hotReplace**(`partial`): `void`

Definido en: [store/Store.ts:717](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L717)

API de conveniencia para reemplazar **cualquier subconjunto** de partes del store (patrones de HMR).

#### Parámetros

##### partial

Conjunto de reemplazo parcial.

###### effects?

[`EffectFunction`](../type-aliases/EffectFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `AM`\>[]

###### middleware?

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `AM`\>[]

###### preserveState?

`boolean`

###### reducer?

`Record`\<`R`, [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`S`\[`R`\], `AM`\>\>

#### Retorna

`void`

***

### onEffect()

> **onEffect**\<`C`, `E`\>(`channel`, `event`, `handler`): () => `void`

Definido en: [store/Store.ts:293](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L293)

Helper de conveniencia para registrar un **efecto** filtrado por `(channel, event)`.

#### Parámetros de Tipo

##### C

`C` *extends* `string`

Clave de canal dentro de `AM`.

##### E

`E` *extends* `string`

Clave de evento dentro del canal `C`.

#### Parámetros

##### channel

`C`

Canal a filtrar.

##### event

`E`

Evento a filtrar.

##### handler

(`payload`, `getState`, `dispatch`, `action`) => `void` \| `Promise`\<`void`\>

Manejador de efecto `(payload, getState, dispatch, action)`.

#### Retorna

Función para cancelar suscripción/desmontar.

> (): `void`

##### Retorna

`void`

#### Ejemplo

```ts
const off = store.onEffect('ui', 'increment', async (n, get, dispatch) => {
  if (n > 10) await dispatch('ui', 'increment', -10);
});
// más tarde
off();
```

#### Implementación de

[`StoreInstance`](../interfaces/StoreInstance.md).[`onEffect`](../interfaces/StoreInstance.md#oneffect)

***

### registerEffect()

> **registerEffect**(`handler`): () => `void`

Definido en: [store/Store.ts:640](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L640)

Registra un **efecto** que se ejecuta después de que los reducers han actualizado el estado.

#### Parámetros

##### handler

[`EffectFunction`](../type-aliases/EffectFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `AM`\>

`(action, getState, dispatch) => void|Promise<void>`.

#### Retorna

Función para cancelar suscripción.

> (): `void`

##### Retorna

`void`

#### Ejemplo

```ts
const off = store.registerEffect(async (a, get, dispatch) => {
  if (a.channel === 'ui' && a.event === 'increment') {
    await dispatch('ui', 'increment', -1);
  }
});
off();
```

#### Implementación de

[`StoreInstance`](../interfaces/StoreInstance.md).[`registerEffect`](../interfaces/StoreInstance.md#registereffect)

***

### registerMiddleware()

> **registerMiddleware**(`mw`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Definido en: [store/Store.ts:578](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L578)

Registra un middleware (se ejecuta **antes** que los reducers).

#### Parámetros

##### mw

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `AM`\>

Middleware `(state, action, dispatch) => boolean|Promise<boolean>`.

#### Retorna

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Función para cancelar suscripción que elimina este middleware.

#### Ejemplo

```ts
const off = store.registerMiddleware(async (state, action) => {
  console.log('action', action);
  return true; // permitir
});
off();
```

#### Implementación de

[`StoreInstance`](../interfaces/StoreInstance.md).[`registerMiddleware`](../interfaces/StoreInstance.md#registermiddleware)

***

### registerReducer()

> **registerReducer**(`name`, `spec`): () => `void`

Definido en: [store/Store.ts:606](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L606)

Dinámicamente **agrega** un reducer de slice con nombre en tiempo de ejecución.

#### Parámetros

##### name

`string`

Nombre del nuevo slice (no debe existir ya).

##### spec

[`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, `AM`\>

Especificación del reducer (state, actions, reducer).

#### Retorna

Función de disposición que **elimina** el slice (y su estado).

> (): `void`

##### Retorna

`void`

#### Ejemplo

```ts
const dispose = store.registerReducer('filters', {
  state: { q: '' },
  actions: [['ui', 'setQuery']],
  reducer(s, a) { return a.event === 'setQuery' ? { q: a.payload } : s; }
});
// Más tarde:
dispose();
```

#### Implementación de

[`StoreInstance`](../interfaces/StoreInstance.md).[`registerReducer`](../interfaces/StoreInstance.md#registerreducer)

***

### replaceEffects()

> **replaceEffects**(`next`): `void`

Definido en: [store/Store.ts:660](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L660)

Reemplaza todos los **efectos** registrados (compatible con HMR).

#### Parámetros

##### next

[`EffectFunction`](../type-aliases/EffectFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `AM`\>[]

Nuevo conjunto de efectos.

#### Retorna

`void`

***

### replaceMiddleware()

> **replaceMiddleware**(`next`): `void`

Definido en: [store/Store.ts:650](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L650)

Reemplaza **todo** el pipeline de middleware (compatible con HMR).

#### Parámetros

##### next

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `AM`\>[]

Nuevo array de middleware.

#### Retorna

`void`

***

### replaceReducers()

> **replaceReducers**(`next`, `opts`): `void`

Definido en: [store/Store.ts:680](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L680)

Reemplaza todo el **conjunto de reducers** (compatible con HMR).

#### Parámetros

##### next

`Record`\<`R`, [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`S`\[`R`\], `AM`\>\>

Mapa de especificaciones de slice indexadas por nombre de slice.

##### opts

`{ preserveState?: boolean }` (por defecto `true`).

###### preserveState?

`boolean`

#### Retorna

`void`

#### Ejemplo

```ts
store.replaceReducers({
  counter: { state: { value: 0 }, actions: [['ui','increment']], reducer: rfn }
}, { preserveState: true });
```

***

### subscribe()

> **subscribe**(`fn`): () => `void`

Definido en: [store/Store.ts:548](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L548)

Se suscribe a commits **de grano grueso** (llamado una vez por acción exitosa).

#### Parámetros

##### fn

() => `void`

Listener invocado después de que los reducers/efectos han ejecutado.

#### Retorna

Función para cancelar suscripción.

> (): `void`

##### Retorna

`void`

#### Ejemplo

```ts
const off = store.subscribe(() => console.log('estado confirmado'));
off();
```

#### Implementación de

[`StoreInstance`](../interfaces/StoreInstance.md).[`subscribe`](../interfaces/StoreInstance.md#subscribe)

***

### buildAncestorPaths()

> `static` **buildAncestorPaths**(`path`): `string`[]

Definido en: [store/Store.ts:838](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L838)

Construye las rutas ancestro para una ruta con puntos.

Para `"a.b.c"`, retorna `["a", "a.b", "a.b.c"]`. Los puntos iniciales se recortan.

#### Parámetros

##### path

`string`

Cadena de ruta con puntos.

#### Retorna

`string`[]

Array de rutas ancestro.

#### Ejemplo

```ts
Store.buildAncestorPaths('x.y.z'); // ['x','x.y','x.y.z']
```
