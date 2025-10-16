[**@quojs/core**](../../../README.md)

***

[@quojs/core](../../../README.md) / [store/Store](../README.md) / createStore

# Function: createStore()

> **createStore**\<`RM`\>(`cfg`): [`StoreInstance`](../../../types/interfaces/StoreInstance.md)\<keyof `RM` & `string`, [`StateFromReducers`](../../../types/type-aliases/StateFromReducers.md)\<`RM`\>, [`AMFromReducersStrict`](../../../types/type-aliases/AMFromReducersStrict.md)\<`RM`\>\>

Defined in: [store/Store.ts:874](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/core/src/store/Store.ts#L874)

Factory helper to create a typed [Store](../classes/Store.md) from a reducers map.

## Type Parameters

### RM

`RM` *extends* [`ReducersMapAny`](../../../types/type-aliases/ReducersMapAny.md)

Reducers map object with each slice's `ReducerSpec`.

## Parameters

### cfg

Configuration with `name`, `reducer`, optional `middleware`, optional `effects`.

#### effects?

[`EffectFunction`](../../../types/type-aliases/EffectFunction.md)\<[`DeepReadonly`](../../../types/type-aliases/DeepReadonly.md)\<[`StateFromReducers`](../../../types/type-aliases/StateFromReducers.md)\<`RM`\>\>, [`AMFromReducersStrict`](../../../types/type-aliases/AMFromReducersStrict.md)\<`RM`\>\>[]

#### middleware?

[`MiddlewareFunction`](../../../types/type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../../../types/type-aliases/DeepReadonly.md)\<[`StateFromReducers`](../../../types/type-aliases/StateFromReducers.md)\<`RM`\>\>, [`AMFromReducersStrict`](../../../types/type-aliases/AMFromReducersStrict.md)\<`RM`\>\>[]

#### name

`string`

#### reducer

`RM`

## Returns

[`StoreInstance`](../../../types/interfaces/StoreInstance.md)\<keyof `RM` & `string`, [`StateFromReducers`](../../../types/type-aliases/StateFromReducers.md)\<`RM`\>, [`AMFromReducersStrict`](../../../types/type-aliases/AMFromReducersStrict.md)\<`RM`\>\>

A typed [StoreInstance](../../../types/interfaces/StoreInstance.md).

## Example

```ts
const store = createStore({
  name: 'App',
  reducer: {
    counter: { state: { value: 0 }, actions: [['ui','increment']], reducer: counterFn }
  },
  middleware: [],
  effects: []
});
```
