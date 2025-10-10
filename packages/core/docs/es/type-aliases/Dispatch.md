[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Dispatch

# Alias de Tipo: Dispatch()\<AM\>

> **Dispatch**\<`AM`\> = \<`C`, `E`\>(`channel`, `event`, `payload`) => `void`

Definida en: [types.ts:35](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L35)

Despacho restringido al ActionMap del desarrollador.

## Parámetros de Tipo

### AM

`AM` *extiende* [`ActionMapBase`](ActionMapBase.md)

## Parámetros de Tipo

### C

`C` *extiende* keyof `AM`

### E

`E` *extiende* keyof `AM`\[`C`\]

## Parameters

### channel

`C`

### event

`E`

### payload

`AM`\[`C`\]\[`E`\]

## Regresa

`void`
