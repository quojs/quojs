[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / MiddlewareFunction

# Type Alias: MiddlewareFunction()\<S, AM\>

> **MiddlewareFunction**\<`S`, `AM`\> = (`state`, `action`, `dispatch`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [types.ts:160](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/core/src/types.ts#L160)

Middleware may mutate, log, side-effect, or veto an action.
Return true to continue; false to swallow / cancel propagation

## Type Parameters

### S

`S` = `any`

### AM

`AM` *extends* [`ActionMapBase`](ActionMapBase.md) = [`ActionMapBase`](ActionMapBase.md)

## Parameters

### state

`S`

### action

[`ActionUnion`](ActionUnion.md)\<`AM`\>

### dispatch

[`Dispatch`](Dispatch.md)\<`AM`\>

## Returns

`boolean` \| `Promise`\<`boolean`\>
