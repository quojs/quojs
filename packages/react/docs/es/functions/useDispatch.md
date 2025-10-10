[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useDispatch

# Función: useDispatch()

> **useDispatch**\<`AM`\>(): `Dispatch`\<`AM`\>

Definida en: [hooks/hooks.ts:119](https://github.com/quojs/quojs/blob/77e60321cd9a639207281caa83e9258935b2bfc1/packages/react/src/hooks/hooks.ts#L119)

Devuelve la función `dispatch` de la tienda (referencia estable).

## Parámetros de tipo

### AM

`AM` *extiende* `ActionMapBase`

Mapa de Topos de acción.

## Regresa

`Dispatch`\<`AM`\>

## Ejemplo

```tsx
const dispatch = useDispatch<MyAM>();
dispatch('ui', 'toggle', true);
```
