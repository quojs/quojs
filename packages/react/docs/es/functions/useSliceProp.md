[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSliceProp

# Función: useSliceProp()

## Firma de llamada

> **useSliceProp**<`R`, `S`, `P`>(`spec`): `PathValue`<`S`[`R`], `P`>

Definida en: [hooks/hooks.ts:228](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/hooks.ts#L228)

Selector **de ruta única** de grano fino para un slice.

Solo vuelve a renderizar cuando la propiedad `reducer.property` (ruta con puntos) realmente cambia.

**Soporta**
- Propiedad raíz exacta: `{ reducer: "todo", property: "data" }`
- Ruta profunda exacta: `{ reducer: "todo", property: "data.123.title" }`
- Comodines (patrones): `{ reducer: "todo", property: "data.*" }` o `"data.**"`

**Sobrecargas**
- Ruta exacta (sin `*`): retorna el `PathValue` preciso cuando `map` se omite
- Ruta exacta + `map`: retorna `T` desde `map(value)`
- Ruta con glob (con `*`/`**`): requiere `map` y retorna `T` desde `map(slice)`

### Parámetros de tipo

#### R

`R` *extiende* `string`

#### S

`S` *extiende* `Record`<`R`, `any`>

#### P

`P` *extiende* `string`

### Parámetros

#### spec

##### property

`P`

##### reducer

`R`

### Retorna

`PathValue`<`S`[`R`], `P`>

### Ejemplos

```tsx
const title = useSliceProp<'todos', AppState, 'items.0.title'>(
  { reducer: 'todos', property: 'items.0.title' }
);
```

```tsx
const len = useSliceProp(
  { reducer: 'todos', property: 'items' },
  items => items.length
);
```

```tsx
const titles = useSliceProp(
  { reducer: 'todos', property: 'items.**' },
  slice => slice.items.map(x => x.title),
  shallowEqual
);
```

## Firma de llamada

> **useSliceProp**<`R`, `S`, `P`, `T`>(`spec`, `map`, `isEqual?`): `T`

Definida en: [hooks/hooks.ts:231](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/hooks.ts#L231)

Selector **de ruta única** de grano fino para un slice.

Solo vuelve a renderizar cuando la propiedad `reducer.property` (ruta con puntos) realmente cambia.

**Soporta**
- Propiedad raíz exacta: `{ reducer: "todo", property: "data" }`
- Ruta profunda exacta: `{ reducer: "todo", property: "data.123.title" }`
- Comodines (patrones): `{ reducer: "todo", property: "data.*" }` o `"data.**"`

**Sobrecargas**
- Ruta exacta (sin `*`): retorna el `PathValue` preciso cuando `map` se omite
- Ruta exacta + `map`: retorna `T` desde `map(value)`
- Ruta con glob (con `*`/`**`): requiere `map` y retorna `T` desde `map(slice)`

### Parámetros de tipo

#### R

`R` *extiende* `string`

#### S

`S` *extiende* `Record`<`R`, `any`>

#### P

`P` *extiende* `string`

#### T

`T`

### Parámetros

#### spec

##### property

`P`

##### reducer

`R`

#### map

(`value`) => `T`

#### isEqual?

(`a`, `b`) => `boolean`

### Retorna

`T`

### Ejemplos

```tsx
const title = useSliceProp<'todos', AppState, 'items.0.title'>(
  { reducer: 'todos', property: 'items.0.title' }
);
```

```tsx
const len = useSliceProp(
  { reducer: 'todos', property: 'items' },
  items => items.length
);
```

```tsx
const titles = useSliceProp(
  { reducer: 'todos', property: 'items.**' },
  slice => slice.items.map(x => x.title),
  shallowEqual
);
```

## Firma de llamada

> **useSliceProp**<`R`, `S`, `P`, `T`>(`spec`, `map`, `isEqual?`): `T`

Definida en: [hooks/hooks.ts:236](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/hooks.ts#L236)

Selector **de ruta única** de grano fino para un slice.

Solo vuelve a renderizar cuando la propiedad `reducer.property` (ruta con puntos) realmente cambia.

**Soporta**
- Propiedad raíz exacta: `{ reducer: "todo", property: "data" }`
- Ruta profunda exacta: `{ reducer: "todo", property: "data.123.title" }`
- Comodines (patrones): `{ reducer: "todo", property: "data.*" }` o `"data.**"`

**Sobrecargas**
- Ruta exacta (sin `*`): retorna el `PathValue` preciso cuando `map` se omite
- Ruta exacta + `map`: retorna `T` desde `map(value)`
- Ruta con glob (con `*`/`**`): requiere `map` y retorna `T` desde `map(slice)`

### Parámetros de tipo

#### R

`R` *extiende* `string`

#### S

`S` *extiende* `Record`<`R`, `any`>

#### P

`P` *extiende* `string`

#### T

`T`

### Parámetros

#### spec

##### property

`P`

##### reducer

`R`

#### map

(`value`) => `T`

#### isEqual?

(`a`, `b`) => `boolean`

### Retorna

`T`

### Ejemplos

```tsx
const title = useSliceProp<'todos', AppState, 'items.0.title'>(
  { reducer: 'todos', property: 'items.0.title' }
);
```

```tsx
const len = useSliceProp(
  { reducer: 'todos', property: 'items' },
  items => items.length
);
```

```tsx
const titles = useSliceProp(
  { reducer: 'todos', property: 'items.**' },
  slice => slice.items.map(x => x.title),
  shallowEqual
);
```