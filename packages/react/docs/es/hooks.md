# Hooks

Todos los hooks son seguros para **Concurrent Mode** gracias a `useSyncExternalStore` y solo re-renderizan cuando cambian las claves suscritas.

> **¿Por qué `createQuoHooks`?** Vincula un contexto React a _hooks_ fuertemente tipados **una sola vez**. Elimina genéricos por‑hook en componentes, te da exports locales a tu app (mejor DX/pruebas) y soporta múltiples _stores_ o límites de _providers_. Si no necesitas contexto propio, puedes usar los _hooks_ pre‑vinculados con `StoreProvider`.

---

## `useStore()`
Devuelve la instancia del store.

```tsx
const store = useStore();
console.log(store.getState());
```

## `useDispatch()`
Devuelve el `dispatch` tipado a partir de tu Action Map.

```tsx
const dispatch = useDispatch();
dispatch("cart", "addItem", { id: "42", qty: 1 });
```

## `useSelector(selector, isEqual?)`
Selección de grano grueso sobre **todo el estado**.

```tsx
const total = useSelector((s) => s.cart.total);
```

## `useSliceProp({ reducer, property }, map?, isEqual?)`
Suscripción de grano fino a **una sola** ruta del _reducer_.

- **Rutas exactas** (sin `*`) devuelven el valor concreto:      `"value"`, `"items.0.title"`, `"users.byId.123.name"`
- **Wildcards** (`*`, `**`) requieren `map` y reciben el **slice completo**.

```tsx
// Ruta exacta → valor concreto
const title = useSliceProp({ reducer: "post", property: "current.title" });

// Wildcard → debes pasar map(slice)
const itemCount = useSliceProp(
  { reducer: "todos", property: "items.*" },
  (slice) => Object.keys(slice?.items ?? {}).length
);
```

## `useSliceProps(specs[], selector, isEqual?)`
Suscríbete a **varias** rutas (exactas o wildcard). Ocurre un solo re-render por ráfaga de cambios.  
**Siempre** pasa un `selector(state)`; define el valor derivado.

```tsx
const vm = useSliceProps(
  [
    { reducer: "todo", property: ["items.**", "filter"] },
    { reducer: "ui", property: "theme" },
  ],
  (state) => {
    const items = Object.values(state.todo.items);
    const visible = state.todo.filter === "all"
      ? items
      : items.filter((t) => t.status === state.todo.filter);

    return {
      total: items.length,
      visibleCount: visible.length,
      theme: state.ui.theme,
    };
  }
);
```