[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / StateFromReducers

# Type Alias: StateFromReducers\<R\>

> **StateFromReducers**\<`R`\> = `{ [K in keyof R]: R[K] extends ReducerSpec<infer S, any> ? S : never }`

Defined in: [types.ts:177](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/core/src/types.ts#L177)

## Type Parameters

### R

`R`
