[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / AMFromReducersStrict

# Type Alias: AMFromReducersStrict\<RM\>

> **AMFromReducersStrict**\<`RM`\> = `RM`\[keyof `RM`\] *extends* [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, infer AM\> ? `RM`\[keyof `RM`\] *extends* [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, `AM`\> ? `AM` : `never` : `never`

Defined in: [types.ts:181](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/core/src/types.ts#L181)

## Type Parameters

### RM

`RM` *extends* [`ReducersMapAny`](ReducersMapAny.md)
