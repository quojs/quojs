[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Action

# Interface: Action\<AM, C, E, P\>

Definida en: [types.ts:13](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L13)

Una acción de Bus

## Type Parameters

### AM

`AM` *extiende* [`ActionMapBase`](../type-aliases/ActionMapBase.md) = [`ActionMapBase`](../type-aliases/ActionMapBase.md)

### C

`C` *extiende* keyof `AM` = keyof `AM`

### E

`E` *extiende* keyof `AM`\[`C`\] = keyof `AM`\[`C`\]

### P

`P` = `AM`\[`C`\]\[`E`\]

## Propiedades

### channel

> **channel**: `C`

Definida en: [types.ts:19](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L19)

***

### event

> **event**: `E`

Definida en: [types.ts:20](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L20)

***

### payload

> **payload**: `P`

Definida en: [types.ts:21](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L21)
