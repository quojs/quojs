[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EffectFunction

# Alias de Tipo: EffectFunction()\<S, AM\>

> **EffectFunction**\<`S`, `AM`\> = \<`C`, `E`\>(`action`, `getState`, `dispatch`) => `void` \| `Promise`\<`void`\>

Definida en: [types.ts:168](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L168)

Controlador de efectos secundarios: se ejecuta DESPUÉS de los reductores, ve el estado final

## Parámetros de Tipo

### S

`S` = `any`

### AM

`AM` *extiende* [`ActionMapBase`](ActionMapBase.md) = [`ActionMapBase`](ActionMapBase.md)

## Parámetros de Tipo

### C

`C` *extiende* keyof `AM`

### E

`E` *extiende* keyof `AM`\[`C`\]

## Parameters

### action

[`Action`](../interfaces/Action.md)\<`AM`, `C`, `E`\>

### getState

() => `S`

### dispatch

[`Dispatch`](Dispatch.md)\<`AM`\>

## Regresa

`void` \| `Promise`\<`void`\>
