[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / MiddlewareFunction

# Type Alias: MiddlewareFunction()\<S, AM\>

> **MiddlewareFunction**\<`S`, `AM`\> = (`state`, `action`, `dispatch`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [types.ts:160](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/core/src/types.ts#L160)

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
