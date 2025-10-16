[**@quojs/react**](../../../README.md)

***

[@quojs/react](../../../README.md) / [hooks/suspense](../README.md) / invalidateSlicePropsByReducer

# Function: invalidateSlicePropsByReducer()

> **invalidateSlicePropsByReducer**(`reducer`): `void`

Defined in: [hooks/suspense.ts:387](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/react/src/hooks/suspense.ts#L387)

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
