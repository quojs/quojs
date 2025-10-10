[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / SuspenseSlicePropsOptions

# Interfaz: SuspenseSlicePropsOptions\<T, S\>

Definida en: [hooks/suspense.ts:254](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/suspense.ts#L254)

Opciones para [useSuspenseSliceProps](../functions/useSuspenseSliceProps.md).

## Parámetros de tipo

### T

`T`

Valor producido por `load`.

### S

`S`

Registro de estado indexado por los nombres de los reductores.

## Propiedades

### key?

> `opcional` **key**: `string`

Definida en: [hooks/suspense.ts:268](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/suspense.ts#L268)

Segmento de clave adicional para la caché, útil para distinguir diferentes cálculos derivados.

***

### load()

> **load**: (`state`) => `T` \| `Promise`\<`T`\>

Definida en: [hooks/suspense.ts:258](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/suspense.ts#L258)

Cargador que recibe el **estado completo** para producir `T` (puede ser asíncrono).

#### Parámetros

##### state

`S`

#### Retorna

`T` \| `Promise`\<`T`\>

***

### staleTime?

> `opcional` **staleTime**: `number`

Definida en: [hooks/suspense.ts:263](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/suspense.ts#L263)

Tiempo de caducidad en milisegundos (ver [SuspenseSlicePropOptions.staleTime](SuspenseSlicePropOptions.md#staletime) para más detalles sobre su semántica).