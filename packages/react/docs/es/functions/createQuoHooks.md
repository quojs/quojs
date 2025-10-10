[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / createQuoHooks

# Función: createQuoHooks()

> **createQuoHooks**<`R`, `S`, `AM`>(`StoreContext`): `object`

Definida en: [hooks/createQuoHooks.ts:146](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/createQuoHooks.ts#L146)

Fábrica que vincula **hooks tipados de React** a una instancia específica de [StoreInstance](#) mediante un contexto.

Debe llamarse **una vez por aplicación** (o por tipo de instancia de store) y exportar los hooks resultantes.

## Parámetros de tipo

### R

`R` *extiende* `string`

Unión de nombres de slice (unión literal de strings).

### S

`S` *extiende* `Record`<`R`, `any`>

Registro de estado indexado por `R`.

### AM

`AM` *extiende* `ActionMapBase`

Mapa de acciones para `(canal → evento → payload)`.

## Parámetros

### StoreContext

`Context`<`null` \| [`StoreInstance`](#)<`R`, `S`, `AM`>>

Un contexto de React que transporta `StoreInstance<R,S,AM> | null`.

## Regresa

Un objeto con hooks pre-vinculados:
- `useStore()` – accede al store desde el contexto (lanza error si no existe).
- `useDispatch()` – referencia estable al dispatch.
- `useSelector(selector, isEqual?)` – selector de store externo con igualdad memorizada.
- `useSliceProp(spec, map?, isEqual?)` – suscríbete a una **única** ruta punteada (o glob).
- `useSliceProps(specs, selector, isEqual?)` – suscríbete a **múltiples** rutas/globs y calcula un valor derivado.
- `shallowEqual` – helper de igualdad superficial para objetos.

### shallowEqual()

> **shallowEqual**: <`T`>(`a`, `b`) => `boolean`

Igualdad superficial para registros planos usando `Object.is` por clave.

#### Parámetros de tipo

##### T

`T` *extiende* `Record`<`string`, `unknown`>

#### Parámetros

##### a

`T`

##### b

`T`

#### Regresa

`boolean`

#### Ejemplo

```ts
shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 }) // true
shallowEqual({ a: 1 }, { a: 1, b: 2 })       // false (diferentes claves)
```

### useDispatch()

> **useDispatch**: () => `Dispatch`<`AM`>

Retorna la función `dispatch` del store (referencia estable).

#### Regresa

`Dispatch`<`AM`>

#### Ejemplo

```tsx
const dispatch = useDispatch();
dispatch('ui','toggle',true);
```

### useSelector()

> **useSelector**: <`T`>(`selector`, `isEqual`) => `T`

Selecciona un valor derivado del store usando una suscripción de store externo.

#### Parámetros de tipo

##### T

`T`

#### Parámetros

##### selector

(`state`) => `T`

`(state) => valor` derivado del estado inmutable actual.

##### isEqual

(`a`, `b`) => `boolean`

Chequeo de igualdad opcional (por defecto `Object.is`) para evitar re-renderizados.

#### Regresa

`T`

El valor seleccionado, memorizado por `isEqual`.

#### Ejemplo

```tsx
const total = useSelector(s => s.todos.items.length);
```

### useSliceProp

> **useSliceProp**: [`UseSliceProp`](../type-aliases/UseSliceProp.md)<`R`, `S`>

Suscríbete a una **única** ruta/glob dentro de un slice y retorna el valor seleccionado.
Ver las firmas de sobrecarga arriba.

### useSliceProps

> **useSliceProps**: [`UseSliceProps`](../type-aliases/UseSliceProps.md)<`R`, `S`>

Suscríbete a **múltiples** rutas/globs y retorna un valor derivado memorizado.
Ver las firmas de sobrecarga arriba.

### useStore()

> **useStore**: () => [`StoreInstance`](#)<`R`, `S`, `AM`>

Retorna la [StoreInstance](#) actual desde el contexto.
Lanza error si se usa fuera de un [StoreProvider](../variables/StoreProvider.md).

#### Regresa

[`StoreInstance`](#)<`R`, `S`, `AM`>

#### Ejemplo

```tsx
const store = useStore();
const state = store.getState();
```

## Ejemplo

```tsx
// hooks.ts
import { StoreContext } from '../context/StoreContext';
export const { useStore, useDispatch, useSelector, useSliceProp, useSliceProps } =
  createQuoHooks<'counter' | 'todos', AppState, AM>(StoreContext);

// component.tsx
function Counter() {
  const value = useSliceProp({ reducer: 'counter', property: 'value' });
  const dispatch = useDispatch();
  return <button onClick={() => dispatch('ui','increment',1)}>{value}</button>;
}
```