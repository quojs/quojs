[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / invalidateSliceProp

# Función: invalidateSliceProp()

> **invalidateSliceProp**(`reducer`, `property`, `extraKey?`): `void`

Definida en: [hooks/suspense.ts:373](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/suspense.ts#L373)

Invalida la entrada de caché para una clave `(reductor, propiedad)` particular.

## Parámetros

### reducer

`string`

Nombre del **Slice**

### property

`string`

Cadena de ruta de puntos (o glob).

### extraKey?

`string`

Llave adicional opcional que se utiliza durante la carga.

## Regresa

`void`

## Ejemplo

```ts
invalidateSliceProp('todos', 'items.**');// forza la recuperación de esa clave
```
