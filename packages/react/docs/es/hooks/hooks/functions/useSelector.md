[**@quojs/react**](../../../README.md)

***

[@quojs/react](../../../README.md) / [hooks/hooks](../README.md) / useSelector

# Function: useSelector()

> **useSelector**\<`S`, `T`\>(`selector`, `isEqual`): `T`

Defined in: [hooks/hooks.ts:164](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/react/src/hooks/hooks.ts#L164)

Selects a derived value from the store using an external-store subscription.
Re-renders when the selected value changes per `isEqual`.

## Type Parameters

### S

`S` *extends* `Record`\<`any`, `any`\>

State type returned by `getState()`.

### T

`T`

Selected value type.

## Parameters

### selector

(`state`) => `T`

`(state) => value` derived from the current state.

### isEqual

(`a`, `b`) => `boolean`

Optional equality comparator (defaults to `Object.is`).

## Returns

`T`

## Example

```tsx
const total = useSelector((s: AppState) => s.todos.items.length);
```
