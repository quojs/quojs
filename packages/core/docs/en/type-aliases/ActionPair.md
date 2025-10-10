[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / ActionPair

# Type Alias: ActionPair\<AM\>

> **ActionPair**\<`AM`\> = `{ [C in keyof AM & string]: [C, keyof AM[C] & string] }`\[keyof `AM` & `string`\]

Defined in: [types.ts:7](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L7)

## Type Parameters

### AM

`AM` *extends* [`ActionMapBase`](ActionMapBase.md)
