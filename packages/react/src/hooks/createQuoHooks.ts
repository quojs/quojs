// file: quojs/packages/react/src/hooks/createQuoHooks.ts
import * as React from "react";
import { useContext, useMemo, useRef, useSyncExternalStore } from "react";

import type {
  ActionMapBase,
  StoreInstance,
  Dispatch,
  DeepReadonly,
  WithGlob,
  Dotted,
  ConnectDeep,
} from "@quojs/core";
import { PathValue } from "./hooks";

/**
 * Overload shape for the `useSliceProp` hook returned by {@link createQuoHooks}.
 * Exported so TypeDoc can include and cross-link it from factory docs.
 *
 * @typeParam R - Slice name union.
 * @typeParam S - State record keyed by `R`.
 * @public
 */
export type UseSliceProp<R extends string, S extends Record<R, any>> = {
  // Exact path, no map -> PathValue<S[R1], P>
  <R1 extends R, P extends Dotted<S[R1]>>(
    spec: { reducer: R1; property: P },
  ): PathValue<S[R1], P>;

  // Exact path + map -> T
  <R1 extends R, P extends Dotted<S[R1]>, T>(
    spec: { reducer: R1; property: P },
    map: (value: PathValue<S[R1], P>) => T,
    isEqual?: (a: T, b: T) => boolean,
  ): T;

  // Glob path + map -> T (map receives the whole slice)
  <R1 extends R, P extends WithGlob<Dotted<S[R1]>>, T>(
    spec: { reducer: R1; property: P },
    map: (value: unknown) => T,
    isEqual?: (a: T, b: T) => boolean,
  ): T;
};

/**
 * Overload shape for the `useSliceProps` hook returned by {@link createQuoHooks}.
 * Exported so TypeDoc can include and cross-link it from factory docs.
 *
 * @typeParam R - Slice name union.
 * @typeParam S - State record keyed by `R`.
 * @public
 */
export type UseSliceProps<R extends string, S extends Record<R, any>> = {
  <R1 extends R, T>(
    specs: Array<{
      reducer: R1;
      property: WithGlob<Dotted<S[R1]>> | readonly WithGlob<Dotted<S[R1]>>[];
    }>,
    selector: (state: DeepReadonly<S>) => T,
    isEqual?: (a: T, b: T) => boolean
  ): T;
};

/** @internal */
const hasWildcard = (p: string) => p.includes("*");
/** @internal */
const normalizePath = (p: string) => p.replace(/^\./, "");
/** @internal */
const splitPath = (p: string) => normalizePath(p).split(".").filter(Boolean);
/** @internal */
const getAtPath = (obj: unknown, path: string): unknown => {
  if (!path) return obj;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = obj;
  for (const seg of splitPath(path)) {
    if (cur == null) return undefined;

    cur = cur[seg as any];
  }

  return cur;
};

/**
 * Shallow equality for plain records using `Object.is` per-key.
 *
 * @example
 * ```ts
 * shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 }) // true
 * shallowEqual({ a: 1 }, { a: 1, b: 2 })       // false (different keys)
 * ```
 *
 * @public
 */
export function shallowEqual<T extends Record<string, unknown>>(a: T, b: T) {
  if (Object.is(a, b)) return true;
  if (!a || !b) return false;

  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;

  for (const k of ka) {
    if (!Object.is(a[k], (b as Record<string, unknown>)[k])) return false;
  }
  
  return true;
}

/**
 * Factory that binds **typed React hooks** to a specific {@link StoreInstance} via context.
 *
 * Call this **once per app** (or per store instance type) and export the returned hooks.
 *
 * @typeParam R  - Slice name union (string literal union).
 * @typeParam S  - State record keyed by `R`.
 * @typeParam AM - Action map for `(channel → event → payload)`.
 *
 * @param StoreContext - A React context that carries `StoreInstance<R,S,AM> | null`.
 *
 * @returns An object with pre-bound hooks:
 * - `useStore()` – access the store from context (throws if missing).
 * - `useDispatch()` – stable dispatch reference.
 * - `useSelector(selector, isEqual?)` – external-store selector with memoized equality.
 * - `useSliceProp(spec, map?, isEqual?)` – subscribe to a **single** dotted path (or glob).
 * - `useSliceProps(specs, selector, isEqual?)` – subscribe to **many** paths/globs and compute a derived value.
 * - `shallowEqual` – helper equality for objects.
 *
 * @example
 * ```tsx
 * // hooks.ts
 * import { StoreContext } from '../context/StoreContext';
 * export const { useStore, useDispatch, useSelector, useSliceProp, useSliceProps } =
 *   createQuoHooks<'counter' | 'todos', AppState, AM>(StoreContext);
 *
 * // component.tsx
 * function Counter() {
 *   const value = useSliceProp({ reducer: 'counter', property: 'value' });
 *   const dispatch = useDispatch();
 *   return <button onClick={() => dispatch('ui','increment',1)}>{value}</button>;
 * }
 * ```
 *
 * @public
 */
export function createQuoHooks<
  R extends string,
  S extends Record<R, any>,
  AM extends ActionMapBase
>(StoreContext: React.Context<StoreInstance<R, S, AM> | null>) {
  /**
   * Returns the current {@link StoreInstance} from context.
   * Throws if used outside of a {@link StoreProvider}.
   *
   * @example
   * ```tsx
   * const store = useStore();
   * const state = store.getState();
   * ```
   *
   * @public
   */
  function useStore(): StoreInstance<R, S, AM> {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
    
    return ctx;
  }

  /**
   * Returns the store’s `dispatch` function (stable reference).
   *
   * @example
   * ```tsx
   * const dispatch = useDispatch();
   * dispatch('ui','toggle',true);
   * ```
   *
   * @public
   */
  function useDispatch(): Dispatch<AM> {
    return useStore().dispatch;
  }

  /**
   * Selects a derived value from the store using an external-store subscription.
   *
   * @param selector - `(state) => value` derived from the current immutable state.
   * @param isEqual  - Optional equality check (defaults to `Object.is`) to suppress re-renders.
   * @returns The selected value, memoized by `isEqual`.
   *
   * @example
   * ```tsx
   * const total = useSelector(s => s.todos.items.length);
   * ```
   *
   * @public
   */
  function useSelector<T>(
    selector: (state: DeepReadonly<S>) => T,
    isEqual: (a: T, b: T) => boolean = Object.is
  ): T {
    const store = useStore();
    const subscribe = useMemo(
      () => (notify: () => void) => store.subscribe(notify),
      [store]
    );
    const getSnapshot = useMemo(() => {
      let last = selector(store.getState());

      return () => {
        const next = selector(store.getState());

        return isEqual(last, next) ? last : (last = next);
      };
    }, [store, selector, isEqual]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  /**
   * Hook overloads for subscribing to a **single** property path (or glob) inside a slice.
   *
   * - Exact path returns the **typed value** at that path.
   * - Exact path + `map` returns `T`.
   * - Glob path (with `*`/`**`) requires `map`, which receives the **whole slice**.
   *
   * @example Exact path
   * ```tsx
   * const title = useSliceProp({ reducer: 'todos', property: 'items.0.title' });
   * ```
   *
   * @example Exact path with map
   * ```tsx
   * const len = useSliceProp({ reducer: 'todos', property: 'items' }, items => items.length);
   * ```
   *
   * @example Glob pattern
   * ```tsx
   * // Recompute when any title changes anywhere under items
   * const titles = useSliceProp(
   *   { reducer: 'todos', property: 'items.**' },
   *   slice => slice.items.map(x => x.title),
   *   shallowEqual
   * );
   * ```
   *
   * @public
   */
  /** @internal */
  type UseSlicePropOverloads = {
    // Exact path, no map -> PathValue<S[R1], P>
    <R1 extends R, P extends Dotted<S[R1]>>(
      spec: { reducer: R1; property: P },
    ): PathValue<S[R1], P>;

    // Exact path + map -> T
    <R1 extends R, P extends Dotted<S[R1]>, T>(
      spec: { reducer: R1; property: P },
      map: (value: PathValue<S[R1], P>) => T,
      isEqual?: (a: T, b: T) => boolean,
    ): T;

    // Glob path + map -> T (map receives the whole slice)
    <R1 extends R, P extends WithGlob<Dotted<S[R1]>>, T>(
      spec: { reducer: R1; property: P },
      map: (value: unknown) => T,
      isEqual?: (a: T, b: T) => boolean,
    ): T;
  };

  /** @internal */
  const useSlicePropImpl = (
    spec: { reducer: R; property: string },
    map?: (value: unknown) => unknown,
    isEqual?: (a: unknown, b: unknown) => boolean
  ): unknown => {
    const store = useStore();

    const normalizedSpec = useMemo(() => {
      const prop = normalizePath(spec.property);
      return { reducer: spec.reducer, property: prop } as const;
    }, [spec.reducer, spec.property]);

    const subscribe = useMemo(
      () => (notify: () => void) =>
        store.connect(
          normalizedSpec as unknown as ConnectDeep<R, S>,
          () => notify()
        ),
      [store, normalizedSpec]
    );

    const getSnapshot = useMemo(() => {
      const isGlob = hasWildcard(normalizedSpec.property);
      const read = () => {
        const full = store.getState() as DeepReadonly<S>;
        // @ts-expect-error This is a standard for TS overloads so we must bail-out TS
        const slice = full[normalizedSpec.reducer];
        const source = isGlob ? slice : getAtPath(slice, normalizedSpec.property);
        return map ? map(source) : source;
      };

      const eq = isEqual ?? Object.is;
      let last = read();
      return () => {
        const next = read();
        return eq(last, next) ? last : (last = next);
      };
    }, [store, normalizedSpec, map, isEqual]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  };

  /**
   * Subscribe to a **single** path/glob within a slice and return the selected value.
   * See overload signatures above.
   *
   * @public
   */
  const useSliceProp = useSlicePropImpl as unknown as UseSliceProp<R, S>;

  /**
   * Subscribe to **multiple** paths/globs and compute a derived value from the whole state.
   *
   * Re-runs `selector(state)` only when any of the specified paths/globs emit a change.
   *
   * @example
   * ```tsx
   * const total = useSliceProps(
   *   [
   *     { reducer: 'todos',  property: ['items.**'] },
   *     { reducer: 'filter', property: 'q' }
   *   ],
   *   (s) => s.todos.items.filter(x => x.title.includes(s.filter.q)).length
   * );
   * ```
   *
   * @public
   */
  /** @internal */
  type OneOrMany<T> = T | readonly T[];
  /** @internal */
  type UseSlicePropsOverloads = {
    <R1 extends R, T>(
      specs: Array<{ reducer: R1; property: OneOrMany<WithGlob<Dotted<S[R1]>>> }>,
      selector: (state: DeepReadonly<S>) => T,
      isEqual?: (a: T, b: T) => boolean
    ): T;
  };

  /** @internal */
  const useSlicePropsImpl = <T,>(
    specs: Array<{ reducer: R; property: OneOrMany<string> }>,
    selector: (state: DeepReadonly<S>) => T,
    isEqual: (a: T, b: T) => boolean = Object.is
  ): T => {
    const store = useStore();

    const versionRef = useRef(0);
    const lastSelRef = useRef<T | undefined>(undefined);
    const lastVerRef = useRef<number>(-1);

    const normalizedSpecs = useMemo(() => {
      return specs.map((sp) => ({
        reducer: sp.reducer,
        property: Array.isArray(sp.property)
          ? (sp.property as readonly string[]).map((p) => normalizePath(p))
          : normalizePath(sp.property as string),
      }));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(specs)]);

    const subscribe = useMemo(
      () => (notify: () => void) => {
        const tick = () => { versionRef.current++; notify(); };

        const unsubs = normalizedSpecs.flatMap((sp) => {
          const props = Array.isArray(sp.property) ? sp.property : [sp.property];
          return props.map((p) =>
            store.connect(
              { reducer: sp.reducer, property: p } as unknown as ConnectDeep<R, S>,
              tick
            )
          );
        });

        return () => { for (const u of unsubs) u(); };
      },
      [store, normalizedSpecs]
    );

    const getSnapshot = useMemo(() => {
      return () => {
        if (lastVerRef.current !== versionRef.current) {
          const next = selector(store.getState());
          const prev = lastSelRef.current;
          if (prev === undefined || !isEqual(prev, next)) lastSelRef.current = next;
          lastVerRef.current = versionRef.current;
        }
        return lastSelRef.current as T;
      };
    }, [store, selector, isEqual]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  };

  /**
   * Subscribe to **many** paths/globs and return a memoized derived value.
   * See overload signatures above.
   *
   * @public
   */
  const useSliceProps = useSlicePropsImpl as unknown as UseSliceProps<R, S>;

  return {
    useStore,
    useDispatch,
    useSelector,
    useSliceProp,
    useSliceProps,
    shallowEqual,
  };
}
