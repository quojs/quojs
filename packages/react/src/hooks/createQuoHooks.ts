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

export type PathValue<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
    ? K extends `${number}`
      ? T extends readonly (infer U)[]
        ? PathValue<U, Rest>
        : never
      : K extends keyof T
        ? PathValue<T[K], Rest>
        : never
    : P extends `${number}`
      ? T extends readonly (infer U)[]
        ? U
        : never
      : P extends keyof T
        ? T[P]
        : never;

const hasWildcard = (p: string) => p.includes("*");
const normalizePath = (p: string) => p.replace(/^\./, "");
const splitPath = (p: string) => normalizePath(p).split(".").filter(Boolean);
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
 * Factory that binds all hooks to a typed Store Context.
 * Consumers call this once per app to get DX-perfect hooks. */
export function createQuoHooks<
  R extends string,
  S extends Record<R, any>,
  AM extends ActionMapBase
>(StoreContext: React.Context<StoreInstance<R, S, AM> | null>) {
  function useStore(): StoreInstance<R, S, AM> {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
    
    return ctx;
  }

  function useDispatch(): Dispatch<AM> {
    return useStore().dispatch;
  }

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

  type UseSliceProp = {
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

  const useSliceProp = useSlicePropImpl as unknown as UseSliceProp;

  type OneOrMany<T> = T | readonly T[];
  type UseSliceProps = {
    <R1 extends R, T>(
      specs: Array<{ reducer: R1; property: OneOrMany<WithGlob<Dotted<S[R1]>>> }>,
      selector: (state: DeepReadonly<S>) => T,
      isEqual?: (a: T, b: T) => boolean
    ): T;
  };

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

  const useSliceProps = useSlicePropsImpl as unknown as UseSliceProps;

  return {
    useStore,
    useDispatch,
    useSelector,
    useSliceProp,
    useSliceProps,
    shallowEqual,
  };
}
