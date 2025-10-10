[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / shallowEqual

# Function: shallowEqual()

> **shallowEqual**\<`T`\>(`a`, `b`): `boolean`

Defined in: [hooks/hooks.ts:134](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/hooks.ts#L134)

Shallow object equality using `Object.is` per-key.

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `any`\>

## Parameters

### a

`T`

### b

`T`

## Returns

`boolean`

## Example

```ts
shallowEqual({ a: 1 }, { a: 1 }) // true
shallowEqual({ a: 1 }, { a: 2 }) // false
```
