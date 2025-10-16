[**@quojs/core**](../../../README.md)

***

[@quojs/core](../../../README.md) / [store/Store](../README.md) / typedActions

# Function: typedActions()

> **typedActions**\<`AM`\>(`_`): \<`C`, `Evt`\>(`channel`, `events`) => readonly [`ActionPair`](../../../types/type-aliases/ActionPair.md)\<`AM`\>[]

Defined in: [store/Store.ts:920](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/core/src/store/Store.ts#L920)

Utility to define **typed** `(channel, events[])` definitions for reducer specs.

## Type Parameters

### AM

`AM` *extends* [`ActionMapBase`](../../../types/type-aliases/ActionMapBase.md)

Action map for the store.

## Parameters

### \_

`string`[][]

Internal marker parameter (usually `actions` array placeholder). Not used at runtime.

## Returns

A helper that, given a `channel` and a readonly `events` array, returns typed action pairs.

> \<`C`, `Evt`\>(`channel`, `events`): readonly [`ActionPair`](../../../types/type-aliases/ActionPair.md)\<`AM`\>[]

### Type Parameters

#### C

`C` *extends* `string`

#### Evt

`Evt` *extends* readonly keyof `AM`\[`C`\] & `string`[]

### Parameters

#### channel

`C`

#### events

`Evt`

### Returns

readonly [`ActionPair`](../../../types/type-aliases/ActionPair.md)\<`AM`\>[]

## Example

```ts
// In a ReducerSpec:
const actions = typedActions<AM>([])('ui', ['increment', 'decrement'] as const);
// actions: ReadonlyArray<[channel, event]>
```
