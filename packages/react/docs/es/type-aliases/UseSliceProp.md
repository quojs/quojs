[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / UseSliceProp

# Alias de tipo: UseSliceProp()\<R, S\>

> **UseSliceProp**\<`R`, `S`\> = \{\<`R1`, `P`\>(`spec`): `PathValue`\<`S`\[`R1`\], `P`\>; \<`R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`; \<`R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`; \}

Definida en: [hooks/createQuoHooks.ts:24](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/createQuoHooks.ts#L24)

Forma de sobrecarga para el hook `useSliceProp` retornado por [createQuoHooks](../functions/createQuoHooks.md).
Exportado para que TypeDoc pueda incluirlo y enlazarlo desde la documentación de la fábrica.

## Parámetros de tipo

### R

`R` *extiende* `string`

Unión de nombres de slices.

### S

`S` *extiende* `Record`<`R`, `any`>

Registro de estado indexado por `R`.

## Firma de llamada

> \<`R1`, `P`\>(`spec`): `PathValue`\<`S`\[`R1`\], `P`\>

### Parámetros de tipo

#### R1

`R1` *extiende* `string`

#### P

`P` *extiende* `string`

### Parámetros

#### spec

##### property

`P`

##### reducer

`R1`

### Retorna

`PathValue`\<`S`\[`R1`\], `P`\>

## Firma de llamada

> \<`R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`

### Parámetros de tipo

#### R1

`R1` *extiende* `string`

#### P

`P` *extiende* `string`

#### T

`T`

### Parámetros

#### spec

##### property

`P`

##### reducer

`R1`

#### map

(`value`) => `T`

#### isEqual?

(`a`, `b`) => `boolean`

### Retorna

`T`

## Firma de llamada

> \<`R1`, `P`, `T`\>(`spec`, `map`, `isEqual?`): `T`

### Parámetros de tipo

#### R1

`R1` *extiende* `string`

#### P

`P` *extiende* `string`

#### T

`T`

### Parámetros

#### spec

##### property

`P`

##### reducer

`R1`

#### map

(`value`) => `T`

#### isEqual?

(`a`, `b`) => `boolean`

### Retorna

`T`
