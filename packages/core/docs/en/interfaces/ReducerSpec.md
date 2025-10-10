[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / ReducerSpec

# Interface: ReducerSpec\<S, AM\>

Defined in: [types.ts:137](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L137)

One reducer’s definition blob

## Type Parameters

### S

`S` = `any`

### AM

`AM` *extends* [`ActionMapBase`](../type-aliases/ActionMapBase.md) = [`ActionMapBase`](../type-aliases/ActionMapBase.md)

## Properties

### actions

> **actions**: readonly [`ActionPair`](../type-aliases/ActionPair.md)\<`AM`\>[]

Defined in: [types.ts:139](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L139)

List of `[channel, event]` pairs this reducer cares about

***

### reducer

> **reducer**: [`ReducerFunction`](../type-aliases/ReducerFunction.md)\<`S`, `AM`\>

Defined in: [types.ts:140](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L140)

***

### state

> **state**: `S`

Defined in: [types.ts:141](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L141)
