[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / invalidateSlicePropsByReducer

# Function: invalidateSlicePropsByReducer()

> **invalidateSlicePropsByReducer**(`reducer`): `void`

Defined in: [hooks/suspense.ts:387](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/suspense.ts#L387)

Invalidates **all** cache entries under a given reducer (slice).

## Parameters

### reducer

`string`

## Returns

`void`

## Example

```ts
invalidateSlicePropsByReducer('todos');
```
