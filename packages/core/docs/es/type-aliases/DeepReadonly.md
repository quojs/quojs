[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / DeepReadonly

# Alias de Tipo: DeepReadonly\<T\>

> **DeepReadonly**\<`T`\> = `T` *extiende* infer A[] ? `ReadonlyArray`\<`DeepReadonly`\<`A`\>\> : `T` *extiende* `object` ? `{ readonly [K in keyof T]: DeepReadonly<T[K]> }` : `T`

Definida en: [types.ts:254](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L254)

## Parámetros de Tipo

### T

`T`
