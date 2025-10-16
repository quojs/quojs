[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / Change

# Interface: Change\<V\>

Defined in: [types.ts:26](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/core/src/types.ts#L26)

Generic “old > new” wrapper (now carries the dotted `path` that changed)

## Type Parameters

### V

`V` = `any`

## Properties

### newValue

> **newValue**: `V`

Defined in: [types.ts:28](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/core/src/types.ts#L28)

***

### oldValue

> **oldValue**: `V`

Defined in: [types.ts:27](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/core/src/types.ts#L27)

***

### path?

> `optional` **path**: `string`

Defined in: [types.ts:30](https://github.com/quojs/quojs/blob/bb0aab212261db76d8cdd24be568e1eb39570c11/packages/core/src/types.ts#L30)

dotted path for fine-grained listeners; top-level emits like "data"
