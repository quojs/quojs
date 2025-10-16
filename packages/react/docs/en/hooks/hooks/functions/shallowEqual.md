[**@quojs/react**](../../../README.md)

***

[@quojs/react](../../../README.md) / [hooks/hooks](../README.md) / shallowEqual

# Function: shallowEqual()

> **shallowEqual**\<`T`\>(`a`, `b`): `boolean`

Defined in: [hooks/hooks.ts:134](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/react/src/hooks/hooks.ts#L134)

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
