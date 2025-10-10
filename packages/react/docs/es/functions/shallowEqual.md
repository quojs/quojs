[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / shallowEqual

# Función: shallowEqual()

> **shallowEqual**\<`T`\>(`a`, `b`): `boolean`

Definida en: [hooks/hooks.ts:134](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/hooks.ts#L134)

Igualdad de objetos superficiales utilizando `Object.is` por clave.

## Parámetros de tipo

### T

`T` *extiende* `Record`\<`string`, `any`\>

## Parámetros

### a

`T`

### b

`T`

## Regresa

`boolean`

## Ejemplo

```ts
shallowEqual({ a: 1 }, { a: 1 }) // true
shallowEqual({ a: 1 }, { a: 2 }) // false
```
