[**@quojs/react**](../../../README.md)

***

[@quojs/react](../../../README.md) / [hooks/suspense](../README.md) / invalidateSliceProp

# Function: invalidateSliceProp()

> **invalidateSliceProp**(`reducer`, `property`, `extraKey?`): `void`

Defined in: [hooks/suspense.ts:373](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/react/src/hooks/suspense.ts#L373)

Invalidates the cache entry for a particular `(reducer, property)` key.

## Parameters

### reducer

`string`

Slice name.

### property

`string`

Dotted path (or glob) string.

### extraKey?

`string`

Optional extra key used when loading.

## Returns

`void`

## Example

```ts
invalidateSliceProp('todos', 'items.**'); // force refetch for that key
```
