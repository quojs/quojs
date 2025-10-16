[**@quojs/react**](../../../README.md)

***

[@quojs/react](../../../README.md) / [hooks/suspense](../README.md) / invalidateSlicePropsByReducer

# Function: invalidateSlicePropsByReducer()

> **invalidateSlicePropsByReducer**(`reducer`): `void`

Defined in: [hooks/suspense.ts:387](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/react/src/hooks/suspense.ts#L387)

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
