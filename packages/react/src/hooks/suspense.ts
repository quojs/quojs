// file: quojs/packages/react/src/hooks/suspense.ts
import { useMemo, useSyncExternalStore } from "react";
import type { ActionMapBase, StoreInstance, Dotted, WithGlob } from "@quojs/core";
import { useStore } from "./hooks";

/** @internal */
function hasWildcard(p: string): boolean { return p.includes("*"); }
/** @internal */
function normalizePath(p: string): string { return p.replace(/^\./, ""); }
/** @internal */
function splitPath(p: string): string[] { return normalizePath(p).split(".").filter(Boolean); }
/**
 * Reads a dotted path from an object; returns `undefined` when a segment is missing.
 * @internal
 */
function getAtPath(obj: any, path: string): any {
  if (!path) return obj;
  let cur = obj;
  for (const seg of splitPath(path)) {
    if (cur == null) return undefined;
    cur = cur[seg as any];
  }
  return cur;
}

/** @internal */
type CacheKey = string;

/**
 * Discriminated union representing a Suspense cache entry.
 * @typeParam T - Stored value type.
 * @internal
 */
type CacheEntry<T> =
  | { status: "ready"; value: T; expiresAt: number | null }
  | { status: "pending"; promise: Promise<void>; expiresAt: number | null }
  | { status: "error"; error: any; expiresAt: number | null };

/**
 * Minimal in-memory cache to back React Suspense data flows.
 *
 * - Entries can be **ready**, **pending** (holding a promise), or **error**.
 * - Each entry can have an optional absolute `expiresAt` for time-based staleness.
 * - Callers typically use {@link suspenseCache} (a singleton) instead of creating new instances.
 *
 * @internal
 */
class SuspenseCache {
  private store = new Map<CacheKey, CacheEntry<any>>();

  /**
   * Read-through getter. Returns cached value, or:
   * - throws a **promise** (to trigger Suspense) while loading,
   * - throws an **error** if the last load failed and is still fresh.
   *
   * @typeParam T - Value type to return.
   * @param key - Cache key (stable across renders).
   * @param load - Lazy loader `( ) => T | Promise<T>`.
   * @param staleTime - Milliseconds until the entry expires; `null` means **no expiry**.
   * @returns The ready value `T`, or throws to integrate with Suspense.
   *
   * @remarks
   * - Passing `staleTime = 0` means the entry **expires immediately** (no time-based caching).
   *   Use `null` for “cache until invalidated”.
   * - Callers are responsible for invalidating keys on relevant state changes.
   *
   * @internal
   */
  read<T>(key: CacheKey, load: () => T | Promise<T>, staleTime: number | null): T {
    const now = Date.now();
    const entry = this.store.get(key);

    if (entry && entry.status === "ready" && (entry.expiresAt == null || entry.expiresAt > now)) {
      return entry.value as T;
    }
    if (entry && entry.status === "pending" && (entry.expiresAt == null || entry.expiresAt > now)) {
      throw entry.promise;
    }
    if (entry && entry.status === "error" && (entry.expiresAt == null || entry.expiresAt > now)) {
      throw entry.error;
    }

    const promise = Promise.resolve()
      .then(load)
      .then((value) => {
        this.store.set(key, { status: "ready", value, expiresAt: staleTime == null ? null : Date.now() + staleTime });
      })
      .catch((err) => {
        this.store.set(key, { status: "error", error: err, expiresAt: staleTime == null ? null : Date.now() + staleTime });
      });

    this.store.set(key, { status: "pending", promise, expiresAt: staleTime == null ? null : Date.now() + staleTime });
    throw promise;
  }

  /**
   * Removes a single cache entry.
   * @param key - Cache key to invalidate.
   * @internal
   */
  invalidate(key: CacheKey) { this.store.delete(key); }

  /**
   * Removes all entries whose keys start with `prefix`.
   * @param prefix - Key prefix to match.
   * @internal
   */
  invalidatePrefix(prefix: string) { for (const k of this.store.keys()) { if (k.startsWith(prefix)) this.store.delete(k); } }

  /**
   * Clears the entire cache.
   * @internal
   */
  clear() { this.store.clear(); }
}

/**
 * Default Suspense cache instance used by the hooks in this module.
 *
 * @example Manual invalidation
 * ```ts
 * import { suspenseCache } from '@quojs/react';
 * suspenseCache.clear();
 * ```
 *
 * @internal
 */
export const suspenseCache = new SuspenseCache();

/**
 * Builds a canonical cache key from reducer + property (supports arrays) + optional extra key.
 * @internal
 */
function buildKey(reducer: string, props: string[] | string, extraKey?: string): string {
  const p = Array.isArray(props) ? props.map(normalizePath).sort().join("|") : normalizePath(props);
  return extraKey ? `${reducer}::${p}::${extraKey}` : `${reducer}::${p}`;
}

/**
 * Options for {@link useSuspenseSliceProp}.
 *
 * @typeParam T - The value produced by `load`.
 * @typeParam S - The store state record keyed by reducer names.
 *
 * @public
 */
export interface SuspenseSlicePropOptions<T, S> {
  /**
   * Loader that can be sync or async.
   * Called with the **value at the path** (or the whole slice for glob paths) and the **slice** itself.
   */
  load: (valueAtPath: any, slice: S[keyof S]) => Promise<T> | T;

  /**
   * Optional cache **stale time** in milliseconds.
   *
   * - `null` → **no expiry** (cache until invalidated by path changes).
   * - `0`    → expires **immediately** (effectively no time-based caching).
   * - `>0`   → entry is fresh until `now + staleTime`.
   */
  staleTime?: number;

  /**
   * Optional extra key to distinguish different usages over the same path.
   * Useful when the same path has different `load` behaviors or parameters.
   */
  key?: string;
}

/**
 * Suspense version of a single-path selector (similar to `useSliceProp`).
 *
 * Subscribes to an **exact** `reducer.property` path, invalidates the cache on changes,
 * and reads through a Suspense cache—**throwing a promise** while the `load` function resolves.
 *
 * @typeParam R - Slice name union.
 * @typeParam S - State record keyed by `R`.
 * @typeParam P - Dotted path type inside `S[R]` (exact path).
 * @typeParam T - Value type returned by `options.load`.
 *
 * @param storeSpec - `{ reducer, property }` pointing at a single path.
 * @param options   - Loader/staleTime/key options.
 * @returns The loaded value `T`. Will **suspend** while loading and rethrow errors in the error boundary.
 *
 * @remarks
 * - If you pass a **glob** path (with `*`/`**`), the path is treated as “match anything” and the loader
 *   receives the **entire slice** as `valueAtPath`. (TypeScript will not enforce globs here.)
 * - For “cache until path changes”, use `staleTime: null`. Passing `0` expires immediately.
 *
 * @example Basic Suspense usage
 * ```tsx
 * import { Suspense } from 'react';
 * 
 * function UserPanel({ id }: { id: string }) {
 *   const user = useSuspenseSliceProp<'users', AppState, 'entities.${string}', User>(
 *     { reducer: 'users', property: `entities.${id}` as any },
 *     {
 *       load: (entity, slice) => entity ?? fetch(`/api/users/${id}`).then(r => r.json()),
 *       staleTime: 60_000 // 1 minute freshness
 *     }
 *   );
 *   return <div>{user.name}</div>;
 * }
 * 
 * export function Page() {
 *   return (
 *     <Suspense fallback="loading...">
 *       <UserPanel id="42" />
 *     </Suspense>
 *   );
 * }
 * ```
 *
 * @public
 */
export function useSuspenseSliceProp<R extends string, S extends Record<R, any>, P extends Dotted<S[R]>, T>(
  storeSpec: { reducer: R; property: P },
  options: SuspenseSlicePropOptions<T, S>
): T {
  const store = useStore<ActionMapBase, R, S>() as StoreInstance<R, S, ActionMapBase>;
  const reducer = storeSpec.reducer;
  const path = normalizePath(storeSpec.property as string);
  const key = buildKey(reducer, path, options.key);

  const subscribe = useMemo(() => {
    return (notify: () => void) =>
      store.connect({ reducer, property: path } as any, () => {
        suspenseCache.invalidate(key);
        notify();
      });
  }, [store, reducer, path, key]);

  const getSnapshot = useMemo(() => {
    const isGlob = hasWildcard(path);
    return () => {
      const state = store.getState() as S;
      const slice = state[reducer];
      const val = isGlob ? slice : getAtPath(slice, path);
      return suspenseCache.read<T>(key, () => options.load(val, slice), options.staleTime ?? 0);
    };
  }, [store, reducer, path, key, options]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Options for {@link useSuspenseSliceProps}.
 *
 * @typeParam T - Value produced by `load`.
 * @typeParam S - State record keyed by reducer names.
 *
 * @public
 */
export interface SuspenseSlicePropsOptions<T, S> {
  /**
   * Loader given the **full state** to produce `T` (may be async).
   */
  load: (state: S) => Promise<T> | T;

  /**
   * Stale time in ms (see {@link SuspenseSlicePropOptions.staleTime} for semantics).
   */
  staleTime?: number;

  /**
   * Extra cache key segment to distinguish different derived computations.
   */
  key?: string; // extra cache key to distinguish variants
}

/**
 * Suspense version of a multi-path selector (similar to `useSliceProps`).
 *
 * Subscribes to **multiple** `reducer.property` paths (supports globs),
 * invalidates the cache when **any** subscribed path changes, and returns a value
 * loaded through the Suspense cache.
 *
 * @typeParam R - Slice name union.
 * @typeParam S - State record keyed by `R`.
 * @typeParam T - Value type returned by `options.load`.
 *
 * @param specs   - Array of `{ reducer, property }`, where `property` can be a dotted string,
 *                  a glob (`*`/`**`), or an array of globs.
 * @param options - Loader/staleTime/key options.
 *
 * @example Derived list with Suspense
 * ```tsx
 * import { Suspense } from 'react';
 *
 * function VisibleTodos() {
 *   const items = useSuspenseSliceProps<
 *     'todos' | 'filter',
 *     AppState,
 *     { id: string; title: string }[]
 *   >(
 *     [
 *       { reducer: 'todos',  property: 'items.**' },
 *       { reducer: 'filter', property: 'q' }
 *     ],
 *     {
 *       load: (s) => s.todos.items.filter(x => x.title.includes(s.filter.q)),
 *       staleTime: null // cache until any of the subscribed paths change
 *     }
 *   );
 *   return <ul>{items.map(i => <li key={i.id}>{i.title}</li>)}</ul>;
 * }
 *
 * export function Page() {
 *   return (
 *     <Suspense fallback="loading...">
 *       <VisibleTodos />
 *     </Suspense>
 *   );
 * }
 * ```
 *
 * @public
 */
export function useSuspenseSliceProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{ reducer: R; property: Dotted<S[R]> | WithGlob<Dotted<S[R]>> | ReadonlyArray<WithGlob<Dotted<S[R]>>> }>,
  options: SuspenseSlicePropsOptions<T, S>
): T {
  const store = useStore<ActionMapBase, R, S>() as StoreInstance<R, S, ActionMapBase>;

  const normalized = useMemo(
    () => specs.map((sp) => ({
      reducer: sp.reducer,
      property: Array.isArray(sp.property)
        ? (sp.property as readonly string[]).map(normalizePath)
        : normalizePath(sp.property as string),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(specs)]
  );

  const key = useMemo(() => {
    const parts = normalized.map((sp) => buildKey(sp.reducer, sp.property)).sort().join("||");
    return options.key ? `${parts}::${options.key}` : parts;
  }, [normalized, options.key]);

  const subscribe = useMemo(() => {
    return (notify: () => void) => {
      const wrapped = () => { suspenseCache.invalidate(key); notify(); };
      const unsubs = normalized.map((sp) => store.connect(sp as any, wrapped));
      return () => { for (const u of unsubs) u(); };
    };
  }, [store, normalized, key]);

  const getSnapshot = useMemo(() => {
    return () => {
      const state = store.getState() as S;
      return suspenseCache.read<T>(key, () => options.load(state), options.staleTime ?? 0);
    };
  }, [store, key, options]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Invalidates the cache entry for a particular `(reducer, property)` key.
 *
 * @param reducer  - Slice name.
 * @param property - Dotted path (or glob) string.
 * @param extraKey - Optional extra key used when loading.
 *
 * @example
 * ```ts
 * invalidateSliceProp('todos', 'items.**'); // force refetch for that key
 * ```
 *
 * @public
 */
export function invalidateSliceProp(reducer: string, property: string, extraKey?: string) {
  suspenseCache.invalidate(buildKey(reducer, property, extraKey));
}

/**
 * Invalidates **all** cache entries under a given reducer (slice).
 *
 * @example
 * ```ts
 * invalidateSlicePropsByReducer('todos');
 * ```
 *
 * @public
 */
export function invalidateSlicePropsByReducer(reducer: string) { suspenseCache.invalidatePrefix(`${reducer}::`); }

/**
 * Clears the entire Suspense cache.
 *
 * @example
 * ```ts
 * clearSuspenseCache();
 * ```
 *
 * @public
 */
export function clearSuspenseCache() { suspenseCache.clear(); }
