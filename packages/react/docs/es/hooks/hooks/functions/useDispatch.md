[**@quojs/react**](../../../README.md)

***

[@quojs/react](../../../README.md) / [hooks/hooks](../README.md) / useDispatch

# Function: useDispatch()

> **useDispatch**\<`AM`\>(): `Dispatch`\<`AM`\>

Defined in: [hooks/hooks.ts:119](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/react/src/hooks/hooks.ts#L119)

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
