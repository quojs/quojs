[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / Change

# Interface: Change\<V\>

Defined in: [types.ts:26](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/core/src/types.ts#L26)

Generic “old > new” wrapper (now carries the dotted `path` that changed)

## Type Parameters

### V

`V` = `any`

## Properties

### newValue

> **newValue**: `V`

Defined in: [types.ts:28](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/core/src/types.ts#L28)

***

### oldValue

> **oldValue**: `V`

Defined in: [types.ts:27](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/core/src/types.ts#L27)

***

### path?

> `optional` **path**: `string`

Defined in: [types.ts:30](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/core/src/types.ts#L30)

dotted path for fine-grained listeners; top-level emits like "data"
