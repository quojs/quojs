import { useMemo, useSyncExternalStore } from "react";
import type { ActionMapBase, StoreInstance, Dotted, WithGlob } from "@quojs/core";
import { useStore } from "./hooks";

function hasWildcard(p: string): boolean { return p.includes("*"); }
function normalizePath(p: string): string { return p.replace(/^\./, ""); }
function splitPath(p: string): string[] { return normalizePath(p).split(".").filter(Boolean); }
function getAtPath(obj: any, path: string): any {
  if (!path) return obj;
  let cur = obj;
  for (const seg of splitPath(path)) {
    if (cur == null) return undefined;
    cur = cur[seg as any];
  }
  return cur;
}

type CacheKey = string;

type CacheEntry<T> =
  | { status: "ready"; value: T; expiresAt: number | null }
  | { status: "pending"; promise: Promise<void>; expiresAt: number | null }
  | { status: "error"; error: any; expiresAt: number | null };

class SuspenseCache {
  private store = new Map<CacheKey, CacheEntry<any>>();

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

  invalidate(key: CacheKey) { this.store.delete(key); }
  invalidatePrefix(prefix: string) { for (const k of this.store.keys()) { if (k.startsWith(prefix)) this.store.delete(k); } }
  clear() { this.store.clear(); }
}

export const suspenseCache = new SuspenseCache();

function buildKey(reducer: string, props: string[] | string, extraKey?: string): string {
  const p = Array.isArray(props) ? props.map(normalizePath).sort().join("|") : normalizePath(props);
  return extraKey ? `${reducer}::${p}::${extraKey}` : `${reducer}::${p}`;
}

export interface SuspenseSlicePropOptions<T, S> {
  /**
   * Loader that can be sync or async. You get the value at the path and the full state slice. */
  load: (valueAtPath: any, slice: S[keyof S]) => Promise<T> | T;

  /**
   * Optional cache `staleTime` (ms). Default: 0 (cache until invalidated by path changes). */
  staleTime?: number;

  /**
   * Optional extra key to distinguish different usages over the same path. */
  key?: string;
}

/**
 * Suspense version of useSliceProp.
 *
 * Subscribes to EXACT reducer.path, invalidates cache on changes,
 * and reads through Suspense cache (throwing promise during load). */
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

export interface SuspenseSlicePropsOptions<T, S> {
  /**
   * Loader given the full state (or state slice) to produce T (sync or async). */
  load: (state: S) => Promise<T> | T;
  staleTime?: number;
  key?: string; // extra cache key to distinguish variants
}

/**
 * Suspense version of useSliceProps.
 *
 * Subscribes to multiple reducer.paths (can include globs), invalidates cache on any hit,
 * and reads T through Suspense cache. */
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

export function invalidateSliceProp(reducer: string, property: string, extraKey?: string) {
  suspenseCache.invalidate(buildKey(reducer, property, extraKey));
}
export function invalidateSlicePropsByReducer(reducer: string) { suspenseCache.invalidatePrefix(`${reducer}::`); }
export function clearSuspenseCache() { suspenseCache.clear(); }

