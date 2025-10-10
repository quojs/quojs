[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / StoreInstance

# Interfaz: StoreInstance<R, S, AM>

Definido en: [types.ts:76](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L76)

Superficie pública del Store.

**NOTA:** `S` es el tipo de estado *expuesto* (ya de solo lectura en el punto de llamada).  
Tu Store concreto implementa esto como `StoreInstance<R, DeepReadonly<S>, AM>`.

## Parámetros de tipo

### R

`R` *extiende* `string` = `string`

### S

`S` *extiende* `Record`<`R`, `any`> = `Record`<`string`, `any`>

### AM

`AM` *extiende* [`ActionMapBase`](../type-aliases/ActionMapBase.md) = [`ActionMapBase`](../type-aliases/ActionMapBase.md)

## Propiedades

### dispatch

> **dispatch**: [`Dispatch`](../type-aliases/Dispatch.md)<`AM`>

Definido en: [types.ts:93](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L93)

Despacha una acción tipada (canal, evento, payload).

***

### name

> **name**: `string`

Definido en: [types.ts:85](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L85)

Nombre del Store.

Principalmente usado por DevTools para identificar la instancia.

## Métodos

### connect()

> **connect**(`spec`, `handler`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Definido en: [types.ts:103](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L103)

Suscripción de grano fino: escucha rutas específicas de `reducer.property`.  
Acepta un `string` o `string[]` de rutas con puntos (por ejemplo, `"data.123.title"`).  
Se activa solo cuando esas rutas realmente cambian.

#### Parámetros

##### spec

[`Connect`](../type-aliases/Connect.md)<`R`, `S`>

##### handler

(`change`) => `void`

#### Regresa

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### getState()

> **getState**(): [`DeepReadonly`](../type-aliases/DeepReadonly.md)<`S`>

Definido en: [types.ts:89](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L89)

Lee el estado completo (ya es de solo lectura al proveer `S`).

#### Regresa

[`DeepReadonly`](../type-aliases/DeepReadonly.md)<`S`>

***

### onEffect()

> **onEffect**<`C`, `E`>(`channel`, `event`, `handler`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Definido en: [types.ts:115](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L115)

Filtro de efecto por canal y evento. Regresa una función de desuscripción.

#### Parámetros de tipo

##### C

`C` *extiende* `string`

##### E

`E` *extiende* `string`

#### Parámetros

##### channel

`C`

##### event

`E`

##### handler

(`payload`, `getState`, `dispatch`, `action`) => `void` | `Promise`<`void`>

#### Regresa

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### registerEffect()

> **registerEffect**(`handler`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Definido en: [types.ts:111](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L111)

Registra un efecto post-reducer (ve el estado final). Regresa una función de desuscripción.  
`S` aquí es el mismo tipo expuesto devuelto por `getState()`.

#### Parámetros

##### handler

[`EffectFunction`](../type-aliases/EffectFunction.md)<[`DeepReadonly`](../type-aliases/DeepReadonly.md)<`S`>, `AM`>

#### Regresa

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### registerMiddleware()

> **registerMiddleware**(`mw`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Definido en: [types.ts:128](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L128)

Agrega middleware dinámicamente.

#### Parámetros

##### mw

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)<[`DeepReadonly`](../type-aliases/DeepReadonly.md)<`S`>, `AM`>

#### Regresa

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### registerReducer()

> **registerReducer**(`name`, `spec`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Definido en: [types.ts:132](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L132)

Agrega o elimina dinámicamente un reducer con espacio de nombres en tiempo de ejecución.

#### Parámetros

##### name

`string`

##### spec

[`ReducerSpec`](ReducerSpec.md)<`any`, `AM`>

#### Regresa

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### subscribe()

> **subscribe**(`listener`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Definido en: [types.ts:97](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L97)

Suscripción de grano grueso: se ejecuta después de cualquier cambio de estado.

#### Parámetros

##### listener

() => `void`

#### Regresa

[`Unsubscribe`](../type-aliases/Unsubscribe.md)
