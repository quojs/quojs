[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / StateFromReducers

# Type Alias: StateFromReducers\<R\>

> **StateFromReducers**\<`R`\> = `{ [K in keyof R]: R[K] extends ReducerSpec<infer S, any> ? S : never }`

Defined in: [types.ts:177](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/core/src/types.ts#L177)

## Type Parameters

### R

`R`
