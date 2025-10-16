[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / ActionUnion

# Type Alias: ActionUnion\<AM\>

> **ActionUnion**\<`AM`\> = `{ [C in keyof AM]: { [E in keyof AM[C]]: Action<AM, C, E> }[keyof AM[C]] }`\[keyof `AM`\]

Defined in: [types.ts:153](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/core/src/types.ts#L153)

Every legal `{channel,event,payload}` as a *distinct* object type

## Type Parameters

### AM

`AM` *extends* [`ActionMapBase`](ActionMapBase.md)
