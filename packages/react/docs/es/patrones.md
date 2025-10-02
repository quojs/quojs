# Patrones y Buenas Prácticas

- Prefiere hooks de **grano fino** (`useSliceProp`, `useSliceProps`) para menos re-renders.
- Despacha eventos de dominio: `dispatch("carrito", "checkout", payload)`.
- Usa **effects** para reacciones post‑commit (red, analytics, encadenamientos).
- **Wildcards**: `*` coincide con un segmento; `**` con el resto.
- Inmutabilidad profunda: Quo congela los slices. Sin cambios en hojas → sin re-render.
- Valores derivados que abarcan varias claves → `useSliceProps` + selector.
- Derivados costosos/async → variantes de **Suspense** con `staleTime`.

### Ejemplo: Todo List (corregido)
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
