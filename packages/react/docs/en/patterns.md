# Patterns & Best Practices

[Versión en español](../es/patrones.md)

- Prefer **fine-grained** hooks (`useSliceProp`, `useSliceProps`) over broad selectors for fewer re-renders.
- Dispatch mirrors your domain: `dispatch("cart", "checkout", payload)`—no action type string soup.
- Use **effects** for post-commit reactions (networking, analytics, chains).
- **Wildcards**: `*` matches one segment; `**` matches the rest.
- Deep immutability: Quo freezes slices. If leaves don’t change, no re-render happens.
- Derived values spanning several keys → `useSliceProps` + selector.
- Async/expensive derivations → Suspense variants with `staleTime`.

### Example: Todo List
```tsx
function TodoList() {
  const vm = useSliceProps(
    [
      { reducer: "todo", property: ["items.**", "filter"] },
    ],
    (s) => {
      const items = Object.values(s.todo.items);
      const filtered = s.todo.filter === "all" ? items : items.filter(/* ... */);
      
      return { items: filtered };
    }
  );

  return (
    <ul>
      {vm.items.map((t: any) => (
        <li key={t.id}>{t.title}</li>
      ))}
    </ul>
  );
}
```
