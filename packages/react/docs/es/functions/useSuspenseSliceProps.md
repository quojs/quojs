[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSuspenseSliceProps

# Función: useSuspenseSliceProps()

> **useSuspenseSliceProps**<`R`, `S`, `T`>(`specs`, `options`): `T`

Definida en: [hooks/suspense.ts:319](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/suspense.ts#L319)

Versión con Suspense de un selector de múltiples rutas (similar a `useSliceProps`).

Se suscribe a **múltiples** rutas `reducer.property` (soporta globs),
invalida la caché cuando **cualquiera** de las rutas suscritas cambia, y retorna un valor
cargado a través de la caché de Suspense.

## Parámetros de tipo

### R

`R` *extiende* `string`

Unión de nombres de slices.

### S

`S` *extiende* `Record`<`R`, `any`>

Registro de estado indexado por `R`.

### T

`T`

Tipo de valor retornado por `options.load`.

## Parámetros

### specs

`object`[]

Arreglo de `{ reducer, property }`, donde `property` puede ser una cadena con puntos,
un glob (`*`/`**`), o un arreglo de globs.

### options

[`SuspenseSlicePropsOptions`](../interfaces/SuspenseSlicePropsOptions.md)<`T`, `S`>

Opciones del cargador, `staleTime` y `key`.

## Retorna

`T`

## Ejemplo

```tsx
import { Suspense } from 'react';

function VisibleTodos() {
  const items = useSuspenseSliceProps<
    'todos' | 'filter',
    AppState,
    { id: string; title: string }[]
  >(
    [
      { reducer: 'todos',  property: 'items.**' },
      { reducer: 'filter', property: 'q' }
    ],
    {
      load: (s) => s.todos.items.filter(x => x.title.includes(s.filter.q)),
      staleTime: null // mantener en caché hasta que alguna de las rutas suscritas cambie
    }
  );
  return <ul>{items.map(i => <li key={i.id}>{i.title}</li>)}</ul>;
}

export function Page() {
  return (
    <Suspense fallback="cargando...">
      <VisibleTodos />
    </Suspense>
  );
}
```