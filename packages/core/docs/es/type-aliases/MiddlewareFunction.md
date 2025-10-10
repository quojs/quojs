[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / MiddlewareFunction

# Alias de Tipo: MiddlewareFunction()\<S, AM\>

> **MiddlewareFunction**\<`S`, `AM`\> = (`state`, `action`, `dispatch`) => `boolean` \| `Promise`\<`boolean`\>

Definida en: [types.ts:160](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L160)

El middleware puede mutar, registrar, generar efectos secundarios o vetar una acción.
Devuelve "true" para continuar; "false" para procesar/cancelar la propagación.

## Parámetros de Tipo

### S

`S` = `any`

### AM

`AM` *extiende* [`ActionMapBase`](ActionMapBase.md) = [`ActionMapBase`](ActionMapBase.md)

## Parameters

### state

`S`

### action

[`ActionUnion`](ActionUnion.md)\<`AM`\>

### dispatch

[`Dispatch`](Dispatch.md)\<`AM`\>

## Regresa

`boolean` \| `Promise`\<`boolean`\>
