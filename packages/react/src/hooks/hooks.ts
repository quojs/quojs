import { useContext, useMemo, useRef, useSyncExternalStore } from "react";
import { StoreContext } from "../context/StoreContext";
import type {
  ActionMapBase,
  Dispatch,
  StoreInstance,
  Dotted,
  WithGlob,
  ConnectDeep,
} from "@quojs/core";

// Infer the value at a dotted path P in object T (supports numeric array segments)
export type PathValue<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
    ? K extends `${number}`
      ? T extends readonly (infer U)[]
        ? PathValue<U, Rest>
        : any
      : K extends keyof T
        ? PathValue<T[K], Rest>
        : any
    : P extends `${number}`
      ? T extends readonly (infer U)[]
        ? U
        : any
      : P extends keyof T
        ? T[P]
        : any;

type OneOrMany<T> = T | readonly T[];

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

export function useStore<AM extends ActionMapBase, R extends string, S extends Record<R, any>>(): StoreInstance<R, S, AM> {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");

  return ctx as StoreInstance<R, S, AM>;
}

export function useDispatch<AM extends ActionMapBase>(): Dispatch<AM> {
  return useStore<AM, any, any>().dispatch;
}

export function shallowEqual<T extends Record<string, any>>(a: T, b: T) {
  if (Object.is(a, b)) return true;
  if (!a || !b) return false;

  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;

  for (const k of ka) {
    if (!Object.is(a[k], (b as any)[k])) return false;
  }

  return true;
}

export function useSelector<S extends Record<any, any>, T>(
  selector: (state: S) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  const store = useStore<any, any, S>();

  const subscribe = useMemo(
    () => (notify: () => void) => store.subscribe(notify),
    [store]
  );

  const getSnapshot = useMemo(() => {
    let last = selector(store.getState() as S);
    return () => {
      const next = selector(store.getState() as S);

      return isEqual(last, next) ? last : (last = next);
    };
  }, [store, selector, isEqual]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Fine-grained single-prop selector
 * Re-renders only when the specified reducer.property/path actually changes.
 *
 * Supports:
 *   - Exact root prop:   { reducer: "todo", property: "data" }
 *   - Exact deep path:   { reducer: "todo", property: "data.123.title" }
 *   - Wildcards (pattern): { reducer: "todo", property: "data.*" } or "data.**"
 *
 * Overloads:
 *   - Exact path (no *): returns the precise PathValue when `map` is omitted
 *   - Glob path (with *): requires `map`; return type is whatever `map` produces */
export function useSliceProp<R extends string, S extends Record<R, any>, P extends Dotted<S[R]>>(
  spec: { reducer: R; property: P },
): PathValue<S[R], P>;
export function useSliceProp<R extends string, S extends Record<R, any>, P extends Dotted<S[R]>, T>(
  spec: { reducer: R; property: P },
  map: (value: PathValue<S[R], P>) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
export function useSliceProp<R extends string, S extends Record<R, any>, P extends WithGlob<Dotted<S[R]>>, T>(
  spec: { reducer: R; property: P },
  map: (value: any) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
export function useSliceProp<R extends string, S extends Record<R, any>, T = any>(
  spec: { reducer: R; property: string },
  map?: (value: any) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  const store = useStore<any, R, S>();

  const normalizedSpec = useMemo(() => {
    const prop = normalizePath(spec.property);
    return { reducer: spec.reducer, property: prop } as const;
  }, [spec.reducer, spec.property]);

  const subscribe = useMemo(
    () => (notify: () => void) => store.connect(normalizedSpec as unknown as ConnectDeep<R, S>, () => notify()),
    [store, normalizedSpec]
  );

  const getSnapshot = useMemo(() => {
    const isGlob = hasWildcard(normalizedSpec.property);
    const read = () => {
      const full = store.getState() as S;
      const slice = full[normalizedSpec.reducer];
      const source = isGlob ? slice : getAtPath(slice, normalizedSpec.property);

      return map ? map(source) : (source as unknown as T);
    };

    let last = read();
    return () => {
      const next = read();

      return isEqual(last, next) ? last : (last = next);
    };
  }, [store, normalizedSpec, map, isEqual]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as any;
}

/**
 * Multi-prop fine-grained selector
 * Subscribes to several reducer.paths (supports deep & wildcard).
 * Notifies once per hit; selector runs against the full state */
export function useSliceProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{ reducer: R; property: OneOrMany<WithGlob<Dotted<S[R]>>> }>,
  selector: (state: S) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  const store = useStore<ActionMapBase, R, S>();

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
  
      // Connect once per property (handles array or single string)
      const unsubs = normalizedSpecs.flatMap((sp) => {
        const props = Array.isArray(sp.property) ? sp.property : [sp.property];

        return props.map((p) =>
          store.connect({ reducer: sp.reducer, property: p } as unknown as ConnectDeep<R, S>, tick)
        );
      });
  
      return () => { for (const u of unsubs) u(); };
    },
    [store, normalizedSpecs]
  );

  const getSnapshot = useMemo(() => {
    return () => {
      if (lastVerRef.current !== versionRef.current) {
        const next = selector(store.getState() as S);
        const prev = lastSelRef.current as T | undefined;
        
        if (prev === undefined || !isEqual(prev, next)) {
          lastSelRef.current = next;
        }

        lastVerRef.current = versionRef.current;
      }

      return lastSelRef.current as T;
    };
  }, [store, selector, isEqual]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}