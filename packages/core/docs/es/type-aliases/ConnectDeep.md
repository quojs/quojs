[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / ConnectDeep

# Alias de Tipo: ConnectDeep\<R, S\>

> **ConnectDeep**\<`R`, `S`\> = `object`

Definida en: [types.ts:246](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L246)

Tipo de conexión vinculado a un registro de estado específico **S**, codificado por nombres de reductor **R**.
- La propiedad acepta claves de nivel superior, rutas de puntos profundos o patrones comodín sobre ellas.

## Parámetros de Tipo

### R

`R` *extiende* `string`

### S

`S` *extiende* `Record`\<`R`, `any`\>

## Propiedades

### property

> **property**: [`WithGlob`](WithGlob.md)\<[`Dotted`](Dotted.md)\<`S`\[`R`\]\>\>

Definida en: [types.ts:251](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L251)

***

### reducer

> **reducer**: `R`

Definida en: [types.ts:250](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/types.ts#L250)
