[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / ActionPair

# Type Alias: ActionPair\<AM\>

> **ActionPair**\<`AM`\> = `{ [C in keyof AM & string]: [C, keyof AM[C] & string] }`\[keyof `AM` & `string`\]

Defined in: [types.ts:7](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/core/src/types.ts#L7)

## Type Parameters

### AM

`AM` *extends* [`ActionMapBase`](ActionMapBase.md)
