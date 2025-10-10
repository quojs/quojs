[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / StateFromReducers

# Alias de Tipo: StateFromReducers\<R\>

> **StateFromReducers**\<`R`\> = `{ [K in keyof R]: R[K] extends ReducerSpec<infer S, any> ? S : never }`

Definida en: [types.ts:177](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L177)

## Parámetros de Tipo

### R

`R`
