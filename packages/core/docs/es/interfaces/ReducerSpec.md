[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / ReducerSpec

# Interfaz: ReducerSpec\<S, AM\>

Definida en: [types.ts:137](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L137)

El objeto que define un **Reducer**

## Parámetros de Tipo

### S

`S` = `any`

### AM

`AM` *extends* [`ActionMapBase`](../type-aliases/ActionMapBase.md) = [`ActionMapBase`](../type-aliases/ActionMapBase.md)

## Propiedades

### actions

> **actions**: solo-lectura [`ActionPair`](../type-aliases/ActionPair.md)\<`AM`\>[]

Definida en: [types.ts:139](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L139)

Lista de pares `[channel, event]` que le interesan a este reductor

***

### reducer

> **reducer**: [`ReducerFunction`](../type-aliases/ReducerFunction.md)\<`S`, `AM`\>

Definida en: [types.ts:140](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L140)

***

### state

> **state**: `S`

Definida en: [types.ts:141](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L141)
