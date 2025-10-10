[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSuspenseSliceProp

# Función: useSuspenseSliceProp()

> **useSuspenseSliceProp**<`R`, `S`, `P`, `T`>(`storeSpec`, `options`): `T`

Definida en: [hooks/suspense.ts:216](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/suspense.ts#L216)

Versión con Suspense de un selector de ruta única (similar a `useSliceProp`).

Se suscribe a una ruta **exacta** `reducer.property`, invalida la caché cuando hay cambios,
y lee a través de una caché de Suspense—**lanzando una promesa** mientras la función `load` se resuelve.

## Parámetros de tipo

### R

`R` *extiende* `string`

Unión de nombres de slices.

### S

`S` *extiende* `Record`<`R`, `any`>

Registro de estado indexado por `R`.

### P

`P` *extiende* `string`

Ruta con puntos dentro de `S[R]` (ruta exacta).

### T

`T`

Tipo de valor retornado por `options.load`.

## Parámetros

### storeSpec

`{ reducer, property }` apuntando a una única ruta.

#### property

`P`

#### reducer

`R`

### options

[`SuspenseSlicePropOptions`](../interfaces/SuspenseSlicePropOptions.md)<`T`, `S`>

Opciones de carga, tiempo de vida (`staleTime`) y clave (`key`).

## Retorna

`T`

El valor cargado `T`. **Suspende** mientras carga y relanza errores en el error boundary.

## Notas

- Si pasas una ruta **glob** (con `*`/`**`), la ruta se trata como “coincide con todo” y el cargador
  recibe el **slice completo** como `valueAtPath`. (TypeScript no aplica verificación de tipos para globs aquí.)
- Para “mantener en caché hasta que la ruta cambie”, usa `staleTime: null`. Pasar `0` expira inmediatamente.

## Ejemplo

```tsx
import { Suspense } from 'react';

function UserPanel({ id }: { id: string }) {
  const user = useSuspenseSliceProp<'users', AppState, 'entities.${string}', User>(
    { reducer: 'users', property: `entities.${id}` as any },
    {
      load: (entity, slice) => entity ?? fetch(`/api/users/${id}`).then(r => r.json()),
      staleTime: 60_000 // 1 minuto de frescura
    }
  );
  return <div>{user.name}</div>;
}

export function Page() {
  return (
    <Suspense fallback="cargando...">
      <UserPanel id="42" />
    </Suspense>
  );
}
```