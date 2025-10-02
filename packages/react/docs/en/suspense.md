# Suspense Helpers

[Versión en español](../es/suspense.md)

`@quojs/react` includes a tiny **Suspense cache**. When data isn’t ready, hooks throw a promise—React shows your fallback.

## Cache helpers
- `invalidateSliceProp(reducer, path, extraKey?)`
- `invalidateSlicePropsByReducer(reducer)`
- `clearSuspenseCache()`

## `useSuspenseSliceProp({ reducer, property }, { load, staleTime?, key? })`
Subscribes to a single exact path. Invalidates cache when that path changes.

```tsx
function UserCard({ userId }: { userId: string }) {
  const user = useSuspenseSliceProp(
    { reducer: "users", property: `byId.${userId}` },
    {
      staleTime: 5_000,
      async load(valueAtPath) {
        if (!valueAtPath) {
          await new Promise((r) => setTimeout(r, 300));
          return { id: userId, name: "Fetched User " + userId };
        }
        return valueAtPath;
      },
    }
  );
  return <div>{user.name}</div>;
}
```

## `useSuspenseSliceProps(specs[], { load, staleTime?, key? })`
Subscribes to multiple paths. Any hit invalidates the cache and recomputes.

```tsx
const summary = useSuspenseSliceProps(
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
