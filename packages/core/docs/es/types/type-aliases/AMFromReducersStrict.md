[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / AMFromReducersStrict

# Type Alias: AMFromReducersStrict\<RM\>

> **AMFromReducersStrict**\<`RM`\> = `RM`\[keyof `RM`\] *extends* [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, infer AM\> ? `RM`\[keyof `RM`\] *extends* [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, `AM`\> ? `AM` : `never` : `never`

Defined in: [types.ts:181](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/core/src/types.ts#L181)

## Type Parameters

### RM

`RM` *extends* [`ReducersMapAny`](ReducersMapAny.md)
