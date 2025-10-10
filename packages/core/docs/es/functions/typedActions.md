[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / typedActions

# Función: typedActions()

> **typedActions**<`AM`>(`_`): <`C`, `Evt`>(`channel`, `events`) => readonly [`ActionPair`](../type-aliases/ActionPair.md)<`AM`>[]

Definido en: [store/Store.ts:920](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/core/src/store/Store.ts#L920)

Utilidad para declarar definiciones **tipadas** de `(channel, events[])` para especificaciones de reductores (reducer specs).

## Parámetros de tipo

### AM

`AM` *extiende* [`ActionMapBase`](../type-aliases/ActionMapBase.md)

Mapa de acciones del store.

## Parámetros

### _

`string`[][]

Parámetro marcador interno (generalmente un marcador de posición para el arreglo `actions`). No se utiliza en tiempo de ejecución.

## Retorna

Un helper que, dado un `channel` y un arreglo `events` de solo lectura, devuelve pares de acciones tipadas.

> <`C`, `Evt`>(`channel`, `events`): readonly [`ActionPair`](../type-aliases/ActionPair.md)<`AM`>[]

### Parámetros de tipo

#### C

`C` *extiende* `string`

#### Evt

`Evt` *extiende* readonly keyof `AM`[`C`] & `string`[]

### Parámetros

#### channel

`C`

#### events

`Evt`

### Regresa

readonly [`ActionPair`](../type-aliases/ActionPair.md)<`AM`>[]

## Ejemplo

```ts
// En una ReducerSpec:
const actions = typedActions<AM>([])('ui', ['increment', 'decrement'] as const);
// actions: ReadonlyArray<[channel, event]>
```
