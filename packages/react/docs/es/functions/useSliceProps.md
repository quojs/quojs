[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSliceProps

# Función: useSliceProps()

> **useSliceProps**<`R`, `S`, `T`>(`specs`, `selector`, `isEqual`): `T`

Definida en: [hooks/hooks.ts:306](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/hooks.ts#L306)

Selector **de múltiples rutas** de grano fino.

Se suscribe a varias rutas `reducer.property` (soporta rutas profundas y comodines)
y vuelve a calcular `selector(state)` cuando cualquiera de ellas cambia.

## Parámetros de tipo

### R

`R` *extiende* `string`

Unión de nombres de slices.

### S

`S` *extiende* `Record`<`R`, `any`>

Registro de estado indexado por `R`.

### T

`T`

Tipo de valor derivado.

## Parámetros

### specs

`object`[]

Arreglo de `{ reducer, property }`, donde `property` puede ser un string o un arreglo de strings. Soporta `*`/`**`.

### selector

(`state`) => `T`

Función `(state) => T` que se ejecuta sobre el estado completo.

### isEqual

(`a`, `b`) => `boolean`

Comparador de igualdad para el valor derivado (por defecto `Object.is`).

## Retorna

`T`

## Ejemplo

```tsx
const total = useSliceProps<'todos' | 'filter', AppState, number>(
  [
    { reducer: 'todos',  property: ['items.**'] },
    { reducer: 'filter', property: 'q' }
  ],
  (s) => s.todos.items.filter(x => x.title.includes(s.filter.q)).length
);
```
