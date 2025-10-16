[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / ActionUnion

# Type Alias: ActionUnion\<AM\>

> **ActionUnion**\<`AM`\> = `{ [C in keyof AM]: { [E in keyof AM[C]]: Action<AM, C, E> }[keyof AM[C]] }`\[keyof `AM`\]

Defined in: [types.ts:153](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/core/src/types.ts#L153)

Every legal `{channel,event,payload}` as a *distinct* object type

## Type Parameters

### AM

`AM` *extends* [`ActionMapBase`](ActionMapBase.md)
