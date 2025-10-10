[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / StoreSpec

# Alias de Tipo: StoreSpec\<R, S, AM\>

> **StoreSpec**\<`R`, `S`, `AM`\> = `object`

Definida en: [types.ts:46](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L46)

Especificación de la tienda: lo que se introduce en el constructor/fábrica

## Parámetros de Tipo

### R

`R` *extiende* `string`

### S

`S` *extiende* `Record`\<`R`, `any`\>

### AM

`AM` *extiende* [`ActionMapBase`](ActionMapBase.md)

## Propiedades

### effects?

> `optional` **effects**: [`EffectFunction`](EffectFunction.md)\<[`DeepReadonly`](DeepReadonly.md)\<`S`\>, `AM`\>[]

Definida en: [types.ts:68](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L68)

Controladores de efectos secundarios opcionales registrados durante la construcción (se ejecutan después de los reductores para cada acción propagada). Equivalente a llamar a store.registerEffect para cada elemento.

***

### middleware?

> `optional` **middleware**: [`MiddlewareFunction`](MiddlewareFunction.md)\<[`DeepReadonly`](DeepReadonly.md)\<`S`\>, `AM`\>[]

Definida en: [types.ts:62](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L62)

Cadena de middleware ejecutada antes de los reductores/efectos. Si algún middleware devuelve falso (o se resuelve como falso), la acción no se propagará a los reductores/efectos.

***

### name

> **name**: `string`

Definida en: [types.ts:51](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L51)

Nombre del Store.

DevTools lo utiliza principalmente para identificar la instancia.

***

### reducer

> **reducer**: `Record`\<`R`, [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`S`\[`R`\], `AM`\>\>

Definida en: [types.ts:56](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L56)

Mapa del nombre de la porción -> especificación del reductor. Cada entrada declara el estado inicial, la función del reductor y la lista de pares (canal, evento) a los que responde esta porción.
