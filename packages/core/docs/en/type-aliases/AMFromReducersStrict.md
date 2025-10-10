[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / AMFromReducersStrict

# Type Alias: AMFromReducersStrict\<RM\>

> **AMFromReducersStrict**\<`RM`\> = `RM`\[keyof `RM`\] *extends* [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, infer AM\> ? `RM`\[keyof `RM`\] *extends* [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, `AM`\> ? `AM` : `never` : `never`

Defined in: [types.ts:181](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L181)

## Type Parameters

### RM

`RM` *extends* [`ReducersMapAny`](ReducersMapAny.md)
