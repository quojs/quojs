[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / createStore

# Función: createStore()

> **createStore**\<`RM`\>(`cfg`): [`StoreInstance`](../interfaces/StoreInstance.md)\<keyof `RM` & `string`, [`StateFromReducers`](../type-aliases/StateFromReducers.md)\<`RM`\>, [`AMFromReducersStrict`](../type-aliases/AMFromReducersStrict.md)\<`RM`\>\>

Definida en: [store/Store.ts:874](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L874)

Helper de fábrica para crear un [Store](../classes/Store.md) tipado desde un mapa de reducers.

## Parámetros de Tipo

### RM

`RM` *extends* [`ReducersMapAny`](../type-aliases/ReducersMapAny.md)

Objeto de mapa de reducers con el `ReducerSpec` de cada slice.

## Parámetros

### cfg

Configuración con `name`, `reducer`, `middleware` opcional, `effects` opcional.

#### effects?

[`EffectFunction`](../type-aliases/EffectFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<[`StateFromReducers`](../type-aliases/StateFromReducers.md)\<`RM`\>\>, [`AMFromReducersStrict`](../type-aliases/AMFromReducersStrict.md)\<`RM`\>\>[]

#### middleware?

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<[`StateFromReducers`](../type-aliases/StateFromReducers.md)\<`RM`\>\>, [`AMFromReducersStrict`](../type-aliases/AMFromReducersStrict.md)\<`RM`\>\>[]

#### name

`string`

#### reducer

`RM`

## Retorna

[`StoreInstance`](../interfaces/StoreInstance.md)\<keyof `RM` & `string`, [`StateFromReducers`](../type-aliases/StateFromReducers.md)\<`RM`\>, [`AMFromReducersStrict`](../type-aliases/AMFromReducersStrict.md)\<`RM`\>\>

Una [`StoreInstance`](../interfaces/StoreInstance.md) tipada.

## Ejemplo

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
