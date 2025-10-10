[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Path

# Alias de Tipo: Path\<T\>

> **Path**\<`T`\> = `T` *extiende* [`Primitive`](Primitive.md) ? `never` : `T` *extiende* readonly infer U[] ? `` `${number}` `` \| `Path`\<`U`\> *extiende* `never` ? `never` : `` `${number}.${Path<U>}` `` : \{ \[K in keyof T & string\]: T\[K\] extends Primitive ? K : K \| (Path\<T\[K\]\> extends never ? never : \`$\{K\}.$\{Path\<(...)\[(...)\]\>\}\`) \}\[keyof `T` & `string`\]

Definida en: [types.ts:223](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L223)

Calcular rutas de puntos de **T**, incluidos objetos anidados y matrices.

## Parámetros de Tipo

### T

`T`
