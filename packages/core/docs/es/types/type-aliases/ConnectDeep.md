[**@quojs/core**](../../README.md)

***

[@quojs/core](../../README.md) / [types](../README.md) / ConnectDeep

# Type Alias: ConnectDeep\<R, S\>

> **ConnectDeep**\<`R`, `S`\> = `object`

Defined in: [types.ts:246](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/core/src/types.ts#L246)

Connect type tied to a specific state record S keyed by reducer names R.
- property accepts top-level keys, deep dotted paths, or wildcard patterns over them

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

## Properties

### property

> **property**: [`WithGlob`](WithGlob.md)\<[`Dotted`](Dotted.md)\<`S`\[`R`\]\>\>

Defined in: [types.ts:251](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/core/src/types.ts#L251)

***

### reducer

> **reducer**: `R`

Defined in: [types.ts:250](https://github.com/quojs/quojs/blob/9e23886b2a0ad7a76f8b24da404b10a06002a0ea/packages/core/src/types.ts#L250)
