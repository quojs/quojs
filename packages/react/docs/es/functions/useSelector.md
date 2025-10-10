[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSelector

# Función: useSelector()

> **useSelector**\<`S`, `T`\>(`selector`, `isEqual`): `T`

Definida en: [hooks/hooks.ts:164](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/hooks.ts#L164)

Selecciona un valor derivado de la tienda mediante una suscripción a una tienda externa. Se vuelve a renderizar cuando el valor seleccionado cambia según `isEqual`.

## Parámetros de tipo

### S

`S` *extiende* `Record`\<`any`, `any`\>

Tipo de estado devuelto por `getState()`.

### T

`T`

Tipo de valor seleccionado.

## Parámetros

### selector

(`state`) => `T`

`(state) => valor` derivado del estado actual.

### isEqual

(`a`, `b`) => `boolean`

Comparador de igualdad opcional (predeterminado en `Object.is`).

## Regresa

`T`

## Ejemplo

```tsx
const total = useSelector((s: AppState) => s.todos.items.length);
```
