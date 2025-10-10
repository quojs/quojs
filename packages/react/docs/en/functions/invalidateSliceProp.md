[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / invalidateSliceProp

# Function: invalidateSliceProp()

> **invalidateSliceProp**(`reducer`, `property`, `extraKey?`): `void`

Defined in: [hooks/suspense.ts:373](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/suspense.ts#L373)

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
