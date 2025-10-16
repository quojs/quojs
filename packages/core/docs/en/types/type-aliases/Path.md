[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / Path

# Type Alias: Path\<T\>

> **Path**\<`T`\> = `T` *extends* [`Primitive`](Primitive.md) ? `never` : `T` *extends* readonly infer U[] ? `` `${number}` `` \| `Path`\<`U`\> *extends* `never` ? `never` : `` `${number}.${Path<U>}` `` : \{ \[K in keyof T & string\]: T\[K\] extends Primitive ? K : K \| (Path\<T\[K\]\> extends never ? never : \`$\{K\}.$\{Path\<(...)\[(...)\]\>\}\`) \}\[keyof `T` & `string`\]

Defined in: [types.ts:223](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/core/src/types.ts#L223)

Compute dotted paths of T, including nested objects and arrays

## Type Parameters

### T

`T`
