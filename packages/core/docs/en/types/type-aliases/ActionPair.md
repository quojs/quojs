[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / ActionPair

# Type Alias: ActionPair\<AM\>

> **ActionPair**\<`AM`\> = `{ [C in keyof AM & string]: [C, keyof AM[C] & string] }`\[keyof `AM` & `string`\]

Defined in: [types.ts:7](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/core/src/types.ts#L7)

## Type Parameters

### AM

`AM` *extends* [`ActionMapBase`](ActionMapBase.md)
