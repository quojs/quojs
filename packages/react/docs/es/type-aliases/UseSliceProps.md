[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / UseSliceProps

# Alias de tipo: UseSliceProps()\<R, S\>

> **UseSliceProps**\<`R`, `S`\> = \<`R1`, `T`\>(`specs`, `selector`, `isEqual?`) => `T`

Definida en: [hooks/createQuoHooks.ts:53](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/createQuoHooks.ts#L53)

Forma de sobrecarga para el hook `useSliceProps` retornado por [createQuoHooks](../functions/createQuoHooks.md).
Exportado para que TypeDoc pueda incluirlo y enlazarlo desde la documentación de la fábrica.

## Parámetros de tipo

### R

`R` *extiende* `string`

Unión de nombres de slices.

### S

`S` *extiende* `Record`<`R`, `any`>

Registro de estado indexado por `R`.

## Parámetros de tipo

### R1

`R1` *extiende* `string`

### T

`T`

## Parámetros

### specs

`object`[]

### selector

(`state`) => `T`

### isEqual?

(`a`, `b`) => `boolean`

## Retorna

`T`
