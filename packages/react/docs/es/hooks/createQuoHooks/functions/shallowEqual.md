[**@quojs/react**](../../../README.md)

***

[@quojs/react](../../../README.md) / [hooks/createQuoHooks](../README.md) / shallowEqual

# Function: shallowEqual()

> **shallowEqual**\<`T`\>(`a`, `b`): `boolean`

Defined in: [hooks/createQuoHooks.ts:96](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/react/src/hooks/createQuoHooks.ts#L96)

Shallow equality for plain records using `Object.is` per-key.

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `unknown`\>

## Parameters

### a

`T`

### b

`T`

## Returns

`boolean`

## Example

```ts
shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 }) // true
shallowEqual({ a: 1 }, { a: 1, b: 2 })       // false (different keys)
```
