[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useStore

# Función: useStore()

> **useStore**\<`AM`, `R`, `S`\>(): [`StoreInstance`](#)\<`R`, `S`, `AM`\>

Definida en: [hooks/hooks.ts:99](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/hooks.ts#L99)

Devuelve la [StoreInstance](#) actual de [StoreContext](../variables/StoreContext.md).
Se genera una excepción si se usa fuera de un `<StoreProvider>`.

## Parámetros de tipo

### AM

`AM` *extiende* `ActionMapBase`

Tipo de mapa de acción.

### R

`R` *extiende* `string`

Unión de nombres de rebanadas.

### S

`S` *extiende* `Record`\<`R`, `any`\>

Registro estatal codificado con `R`.

## Regresa

[`StoreInstance`](#)\<`R`, `S`, `AM`\>

## Ejemplo

```tsx
const store = useStore<MyAM, 'counter' | 'todos', AppState>();
const state = store.getState();
```
