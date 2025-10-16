[**@quojs/react**](../../../README.md)

***

[@quojs/react](../../../README.md) / [hooks/hooks](../README.md) / useDispatch

# Function: useDispatch()

> **useDispatch**\<`AM`\>(): `Dispatch`\<`AM`\>

Defined in: [hooks/hooks.ts:119](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/react/src/hooks/hooks.ts#L119)

Returns the store’s `dispatch` function (stable reference).

## Type Parameters

### AM

`AM` *extends* `ActionMapBase`

Action map type.

## Returns

`Dispatch`\<`AM`\>

## Example

```tsx
const dispatch = useDispatch<MyAM>();
dispatch('ui', 'toggle', true);
```
