# Suspense

`@quojs/react` incluye una pequeña **caché de Suspense**. Cuando los datos no están listos, los hooks lanzan una promesa y React muestra tu fallback.

## Helpers de caché
- `invalidateSliceProp(reducer, path, extraKey?)`
- `invalidateSlicePropsByReducer(reducer)`
- `clearSuspenseCache()`

## `useSuspenseSliceProp({ reducer, property }, { load, staleTime?, key? })`
Se suscribe a una ruta exacta y la invalida al cambiar.

```tsx
function UserCard({ userId }: { userId: string }) {
  const user = useSuspenseSliceProp(
    { reducer: "users", property: `byId.${userId}` },
    {
      staleTime: 5_000,
      async load(valueAtPath) {
        if (!valueAtPath) {
          await new Promise((r) => setTimeout(r, 300));
          return { id: userId, name: "Usuario " + userId };
        }
        return valueAtPath;
      },
    }
  );
  return <div>{user.name}</div>;
}
```

## `useSuspenseSliceProps(specs[], { load, staleTime?, key? })`
Varias rutas; cualquier cambio invalida la caché y recalcula.

```tsx
const resumen = useSuspenseSliceProps(
  [{ reducer: "todos", property: ["items.**", "filter"] }],
  {
    staleTime: 1_000,
    load(state) {
      const items = Object.values(state.todos.items);
      return {
        total: items.length,
        done: items.filter((t) => t.done).length,
      };
    },
  }
);
```
