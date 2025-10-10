[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / SuspenseSlicePropOptions

# Interfaz: SuspenseSlicePropOptions\<T, S\>

Definida en: [hooks/suspense.ts:147](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/suspense.ts#L147)

Opciones para [useSuspenseSliceProp](../functions/useSuspenseSliceProp.md).

## Parámetros de tipo

### T

`T`

El valor producido por `load`.

### S

`S`

El registro de estado del store indexado por los nombres de los reductores.

## Propiedades

### key?

> `opcional` **key**: `string`

Definida en: [hooks/suspense.ts:167](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/suspense.ts#L167)

Clave adicional opcional para distinguir diferentes usos sobre la misma ruta.
Útil cuando la misma ruta tiene diferentes comportamientos o parámetros de `load`.

***

### load()

> **load**: (`valueAtPath`, `slice`) => `T` \| `Promise`\<`T`\>

Definida en: [hooks/suspense.ts:152](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/suspense.ts#L152)

Cargador que puede ser síncrono o asíncrono.
Se llama con el **valor en la ruta** (o el slice completo en caso de rutas glob) y el **slice** mismo.

#### Parámetros

##### valueAtPath

`any`

##### slice

`S`\[keyof `S`\]

#### Retorna

`T` \| `Promise`\<`T`\>

***

### staleTime?

> `opcional` **staleTime**: `number`

Definida en: [hooks/suspense.ts:161](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/suspense.ts#L161)

Tiempo de caducidad (**stale time**) de la caché opcional en milisegundos.

- `null` → **sin caducidad** (la caché se mantiene hasta que cambie la ruta).
- `0`    → expira **inmediatamente** (efectivamente sin caché basada en tiempo).
- `>0`   → la entrada se considera fresca hasta `ahora + staleTime`.