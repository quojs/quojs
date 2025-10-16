[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / Dispatch

# Type Alias: Dispatch()\<AM\>

> **Dispatch**\<`AM`\> = \<`C`, `E`\>(`channel`, `event`, `payload`) => `void`

Defined in: [types.ts:35](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/core/src/types.ts#L35)

Dispatch narrowed to the developer’s ActionMap

## Type Parameters

### AM

`AM` *extends* [`ActionMapBase`](ActionMapBase.md)

## Type Parameters

### C

`C` *extends* keyof `AM`

### E

`E` *extends* keyof `AM`\[`C`\]

## Parameters

### channel

`C`

### event

`E`

### payload

`AM`\[`C`\]\[`E`\]

## Returns

`void`
