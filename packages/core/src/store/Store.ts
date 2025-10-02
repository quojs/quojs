import { Reducer } from "../reducer/Reducer";
import { detectChangedProps } from "../utils/detectChangedProps";

import { EventBus } from "../eventBus/EventBus";
import { LooseEventBus } from "../eventBus/LooseEventBus";
import type {
  Action,
  ActionMapBase,
  ActionPair,
  ActionUnion,
  AMFromReducersStrict,
  Change,
  DeepReadonly,
  Dispatch,
  EffectFunction,
  MiddlewareFunction,
  ReducersMapAny,
  ReducerSpec,
  StateFromReducers,
  StoreInstance,
  StoreSpec,
  Unsubscribe,
} from "../types";
import { freezeState } from "../utils/immutability";

export class Store<AM extends ActionMapBase, R extends string, S extends Record<R, any>>
  implements StoreInstance<R, S, AM> {
  /**
   * Store name.
   * 
   * This is mostly used by DevTools to identify the instance. */
  name: string;

  /**
   * runtime plugs */
  private readonly middleware: MiddlewareFunction<DeepReadonly<S>, AM>[];
  private readonly reducers: Record<R, Reducer<S[R], AM>>;
  private state: DeepReadonly<S>;

  /**
   * buses & listeners */
  private readonly reducerBus: EventBus<AM>;
  private readonly connectorBus: LooseEventBus<R, string, Change>;
  private readonly listeners: Set<() => void> = new Set();

  /**
   * effect handlers */
  private readonly effects: Set<EffectFunction<DeepReadonly<S>, AM>> = new Set();

  /**
   * Track reducerBus unsubs per slice for HMR / register / unregister */
  private readonly sliceUnsubs = new Map<string, Array<() => void>>();

  /**
   * DevTools */
  private devtools;

  /**
   * Action queue for serialized dispatching */
  private readonly actionQueue: Array<{ channel: string; event: string; payload: any }> = [];
  private isProcessingQueue = false;

  constructor(
    spec: StoreSpec<R, S, AM> & { effects?: Array<EffectFunction<DeepReadonly<S>, AM>> },
  ) {
    this.name = spec.name ?? "Quo.js Store";
    this.reducerBus = new EventBus<AM>();
    this.connectorBus = new LooseEventBus();
    this.middleware = [...spec.middleware] as any;
    this.reducers = {} as Record<R, Reducer<S[R], AM>>;
    this.state = {} as any;

    /**
     * Reducer wiring */
    Object.entries(spec.reducer).forEach(([name, rSpec]) => {
      this.mountSlice(name as R, rSpec as ReducerSpec<S[R], AM>, { preserveState: false });
    });

    /**
     * Effects from spec (optional) */
    if (spec.effects?.length) {
      for (const eff of spec.effects) this.effects.add(eff);
    }

    const ext = (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) as
      | { connect: (opts: any) => { init: (state: any) => void; send: (action: any, state: any) => void } }
      | undefined;

    if (process.env.NODE_ENV !== 'production' && ext) {
      const instanceId = spec.name ?? "Quo.js Store";

      this.devtools = ext.connect({
        name: instanceId,
        instanceId,
        serialize: true,
        features: { pause: true, export: true, test: true, jump: true, skip: true, lock: true },
        trace: true,
      });

      this.devtools.init(this.getState());
    }

    /**
     * DevTools wiring */
    this.devtools?.init(this.state);
    this.devtools?.subscribe((msg: any) => {
      if (msg.type !== "DISPATCH") return;
      const kind = msg.payload?.type as string | undefined;

      // Standard jump / rollback / reset carry state as a JSON string
      if (
        kind === "JUMP_TO_STATE" ||
        kind === "JUMP_TO_ACTION" ||
        kind === "ROLLBACK" ||
        kind === "RESET"
      ) {
        if (msg.state) {
          const parsed = JSON.parse(msg.state);
          this.__applyExternalState(parsed);
        }
        return;
      }

      // Import a lifted history: take the latest computed state
      if (kind === "IMPORT_STATE" && msg.nextLiftedState?.computedStates?.length) {
        const latest = msg.nextLiftedState.computedStates.at(-1)!.state;
        this.__applyExternalState(latest);
        return;
      }

      // Commit re-baselines the history; re-init with current state
      if (kind === "COMMIT") {
        this.devtools?.init(this.state);
        return;
      }

      // Fallback: if DevTools provided a state string anyway, apply it
      if (msg.state) {
        const parsed = JSON.parse(msg.state);

        this.__applyExternalState(parsed);
      }
    });

    /**
     * method bindings */
    this.dispatch = this.dispatch.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.connect = this.connect.bind(this);
    this.getState = this.getState.bind(this);
    this.registerEffect = this.registerEffect.bind(this);
    this.onEffect = this.onEffect.bind(this);

    // HMR note: callers can later use this.hotReplace(...) with new reducers / middleware / effects
  }

  /**
   * Sugar: effect filtered by channel & event */
  public onEffect<C extends keyof AM & string, E extends keyof AM[C] & string>(
    channel: C,
    event: E,
    handler: (
      payload: AM[C][E],
      getState: () => DeepReadonly<S>,
      dispatch: Dispatch<AM>,
      action: Action<AM, C, E>,
    ) => void | Promise<void>,
  ): () => void {
    const wrapped: EffectFunction<DeepReadonly<S>, AM> = (a, getState, dispatch) => {
      // @ts-expect-error do we need some sugar or not?
      if (a.channel !== channel || a.event !== event) return;
      // @ts-expect-error do we need some sugar or not?
      return handler(a.payload, getState, dispatch, a);
    };
    return this.registerEffect(wrapped);
  }

  private async notifyEffects(action: ActionUnion<AM>) {
    for (const h of [...this.effects]) {
      try {
        await h(action, this.getState, this.dispatch);
      } catch (e) {
        console.error("Effect error:", e);
      }
    }
  }

  /**
   * Forward a reduced action into the slice and emit precise connector events.
   * Emits every changed leaf path and all its ancestors (e.g., data, data.123, data.123.title) */
  private forwardAction<C extends keyof AM, E extends keyof AM[C]>(
    rName: R,
    action: Action<AM, C, E>,
  ): void {
    // @ts-expect-error sometimes TS is a bitch
    const prev = this.state[rName] as S[R];
    // @ts-expect-error sometimes TS is a bitch
    const next = this.reducers[rName].reduce(prev, action);

    // If reducer returned same ref, definitely no change
    if (prev === next) return;

    // Compute precise leaf paths that changed (relative to slice root)
    const leafPaths = detectChangedProps(prev, next).filter(Boolean);

    /**If nothing actually changed at the leaves, treat as a no-op:
     * - do NOT commit a new slice
     * - do NOT notify fine-grained or coarse listeners  */
    if (leafPaths.length === 0) return;

    // Freeze & commit new slice
    const frozen = freezeState(structuredClone(next)) as DeepReadonly<S[R]>;
    (this.state as any)[rName] = frozen;

    // Emit deep + ancestor paths once each
    const toEmit = new Set<string>();
    for (const p of leafPaths) {
      for (const a of Store.buildAncestorPaths(p)) toEmit.add(a);
    }

    for (const prop of toEmit) {
      const oldValue = this.getAtPath(prev, prop);
      const newValue = this.getAtPath(frozen, prop);
      this.connectorBus.emit(rName, prop, { oldValue, newValue, path: prop });
    }

    // Notify coarse subscribers after all fine-grained emits
    this.listeners.forEach((l) => l());
  }

  /**
   * Apply an external whole-state (e.g. DevTools time travel) with deep-path emissions */
  private __applyExternalState(nextPlain: any) {
    const prev = this.state as any;
    const next = nextPlain;

    (Object.keys(this.reducers) as Array<R>).forEach((rName) => {
      const prevSlice = prev?.[rName];
      const nextSlice = next?.[rName];

      // Freeze the incoming slice before storing
      const frozenNextSlice = freezeState(structuredClone(nextSlice)) as DeepReadonly<
        S[typeof rName]
      >;
      (this.state as any)[rName] = frozenNextSlice;

      // If reference equal, nothing to emit
      if (prevSlice === nextSlice) return;

      // Full dotted leaf paths relative to the slice
      const leafPaths = detectChangedProps(prevSlice, nextSlice).filter(Boolean);
      if (leafPaths.length === 0) return;

      // Emit every leaf AND its ancestors once
      const toEmit = new Set<string>();
      for (const p of leafPaths) for (const a of Store.buildAncestorPaths(p)) toEmit.add(a);

      for (const path of toEmit) {
        const oldValue = this.getAtPath(prevSlice, path);
        const newValue = this.getAtPath(frozenNextSlice, path);
        this.connectorBus.emit(rName, path as any, { oldValue, newValue, path });
      }
    });

    // Coarse subscribers after all fine-grained emits
    this.listeners.forEach((l) => l());
  }

  public async dispatch<C extends keyof AM, E extends keyof AM[C]>(
    channel: C,
    event: E,
    payload: AM[C][E],
  ): Promise<void> {
    /**
     * enqueue always */
    this.actionQueue.push({ channel: channel as string, event: event as string, payload });
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;
    try {
      while (this.actionQueue.length) {
        const { channel, event, payload } = this.actionQueue.shift();
        const action = { channel, event, payload } as Action<AM, C, E>;
        let propagate = true;

        /**
         * middleware */
        for (const mw of this.middleware) {
          try {
            // @ts-expect-error this is just an inference issue, not important
            const ok = await mw(this.state, action, this.dispatch);
            if (!ok) {
              propagate = false;
              break;
            }
          } catch (err) {
            /**
             * swallow – devtools / caller should not explode */
            console.error("middleware error:", err);
            propagate = false;
            break;
          }
        }

        /**
         * reducers */
        // @ts-expect-error this is just an inference issue, not important
        if (propagate) this.reducerBus.emit(channel as C, event as E, payload);

        /**
         * effects */
        if (propagate) await this.notifyEffects(action as any);

        /**
         * devtools */
        this.devtools?.send(
          { type: `Channel: ${channel} - Event: ${event}`, payload },
          this.state,
        );
      }
    } catch (err) {
      // capture any unanticipated errors so .dispatch() never rejects
      console.error("dispatch queue error:", err);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Overloads:
   * 1) accept dotted deep paths as plain string */
  public connect(spec: { reducer: R; property: string }, h: (chg: Change) => void): () => void;
  public connect(spec: any, h: (chg: Change) => void): () => void {
    return this.connectorBus.on(spec.reducer, spec.property, h);
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public getState(): DeepReadonly<S> {
    return this.state;
  }

  /**
   * Dynamically add / remove middleware */
  public registerMiddleware(mw: MiddlewareFunction<DeepReadonly<S>, AM>): Unsubscribe {
    this.middleware.push(mw as any);
    return () => {
      const i = this.middleware.indexOf(mw as any);
      if (i !== -1) this.middleware.splice(i, 1);
    };
  }

  /**
   * Dynamically add a reducer at runtime (namespaced) */
  public registerReducer(name: string, spec: ReducerSpec<any, AM>): () => void {
    if (name in this.reducers) throw new Error(`Reducer ${name} already exists`);

    this.mountSlice(name as R, spec as ReducerSpec<S[Extract<R, string>], AM>, {
      preserveState: false,
    });

    this.listeners.forEach((l) => l()); // broadcast new slice

    return () => {
      // disposer
      this.unmountSlice(name as R, { deleteState: true });
      this.listeners.forEach((l) => l());
    };
  }

  /**
   * Register a handler that runs AFTER reducers have updated state */
  public registerEffect(handler: EffectFunction<DeepReadonly<S>, AM>): () => void {
    this.effects.add(handler);
    return () => this.effects.delete(handler);
  }

  /**
   * Replace middleware wholesale (HMR-friendly) */
  public replaceMiddleware(next: MiddlewareFunction<DeepReadonly<S>, AM>[]): void {
    (this.middleware as any).length = 0;
    for (const mw of next) this.middleware.push(mw as any);
  }

  /**
   * Replace all effects wholesale (HMR-friendly) */
  public replaceEffects(next: Array<EffectFunction<DeepReadonly<S>, AM>>): void {
    this.effects.clear();
    for (const eff of next) this.effects.add(eff);
  }

  /**
   * Replace reducer set wholesale (HMR-friendly).
   * Preserves existing slice state by default. */
  public replaceReducers(
    next: Record<R, ReducerSpec<S[R], AM>>,
    opts: { preserveState?: boolean } = {},
  ): void {
    const preserveState = opts.preserveState !== false; // default true

    const currentKeys = new Set(Object.keys(this.reducers as any));
    const nextEntries = Object.entries(next);
    const nextKeys = new Set(nextEntries.map(([k]) => k));

    // Remove slices that no longer exist
    for (const k of currentKeys) {
      if (!nextKeys.has(k)) this.unmountSlice(k as R, { deleteState: true });
    }

    // Add or update slices
    for (const [k, rSpec] of nextEntries) {
      if (currentKeys.has(k)) {
        // Update reducer impl + action wiring; preserve current state
        this.unmountSlice(k as R, { deleteState: false });
        this.mountSlice(k as R, rSpec as any, { preserveState });
      } else {
        // New slice
        this.mountSlice(k as R, rSpec as any, { preserveState: false });
      }
    }

    // Re-init devtools baseline
    this.devtools?.init(this.state);
  }

  /**
   * Convenience: replace any subset of store parts (like Redux HMR patterns). */
  public hotReplace(partial: {
    reducer?: Record<R, ReducerSpec<S[R], AM>>;
    middleware?: MiddlewareFunction<DeepReadonly<S>, AM>[];
    effects?: Array<EffectFunction<DeepReadonly<S>, AM>>;
    preserveState?: boolean;
  }): void {
    if (partial.middleware) this.replaceMiddleware(partial.middleware);
    if (partial.effects) this.replaceEffects(partial.effects);
    if (partial.reducer)
      this.replaceReducers(partial.reducer, { preserveState: partial.preserveState });
  }

  private mountSlice(
    name: R,
    rSpec: ReducerSpec<S[R], AM>,
    opts: { preserveState: boolean },
  ): void {
    const rName = name as unknown as string;
    const { actions = [], reducer, state } = rSpec;

    // Install reducer instance
    // @ts-expect-error this is just a wrapped, nothing to care about
    this.reducers[name] = new Reducer(reducer, state);

    // Initialize state unless preserving an existing value
    if (!opts.preserveState || (this.state as any)[rName] === undefined) {
      (this.state as any)[rName] = freezeState(structuredClone(state));
    }

    // Wire reducerBus listeners and save disposers for HMR
    const unsubs: Array<() => void> = [];
    actions?.forEach(([ch, ev]) => {
      const u = this.reducerBus.on(ch, ev, (payload) =>
        this.forwardAction(name, { channel: ch, event: ev, payload } as ActionUnion<AM>),
      );

      unsubs.push(u);
    });

    this.sliceUnsubs.set(rName, unsubs);
  }

  private unmountSlice(name: R, opts: { deleteState: boolean }): void {
    const rName = name as unknown as string;

    // Dispose reducerBus listeners
    const unsubs = this.sliceUnsubs.get(rName);
    if (unsubs) {
      for (const u of unsubs)
        try {
          u();
        } catch (e) {
          console.error(`[DUX error]: ${e}`);
        }

      this.sliceUnsubs.delete(rName);
    }

    // Remove reducer instance
    delete this.reducers[name];

    // Optionally drop state
    if (opts.deleteState) delete (this.state as any)[rName];
  }

  /**
   * Read a dotted path from obj (supports numeric array indices via string keys) */
  private getAtPath(obj: any, path: string): any {
    if (!path) return obj;

    // Normalize any accidental leading dots
    const clean = path[0] === "." ? path.slice(1) : path;
    const parts = clean.split(".");

    let cur = obj;
    for (const seg of parts) {
      if (cur == null) return undefined;

      // Works for arrays too (seg like "0")
      cur = cur[seg as any];
    }
    return cur;
  }

  /**
   * For a path like "a.b.c", returns ["a", "a.b", "a.b.c"].
   * Trims leading dots if present (edge case when diffing root arrays) */
  static buildAncestorPaths(path: string): string[] {
    if (!path) return [];

    const clean = path[0] === "." ? path.slice(1) : path;
    const parts = clean.split(".");
    const out: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      out.push(parts.slice(0, i + 1).join("."));
    }

    return out;
  }
}

export function createStore<RM extends ReducersMapAny>(cfg: {
  name: string,
  reducer: RM;
  middleware?: MiddlewareFunction<
    DeepReadonly<StateFromReducers<RM>>,
    AMFromReducersStrict<RM>
  >[];
  effects?: Array<
    EffectFunction<DeepReadonly<StateFromReducers<RM>>, AMFromReducersStrict<RM>>
  >;
}): StoreInstance<
  keyof RM & string,
  StateFromReducers<RM>,
  AMFromReducersStrict<RM>
>;

export function createStore(cfg: any) {
  type RM = typeof cfg.reducer;
  type S = StateFromReducers<RM>;
  type AM = AMFromReducersStrict<RM>;
  type RN = keyof RM & string;

  return new Store<AM, RN, S>({
    name: cfg.name,
    reducer: cfg.reducer as unknown as Record<RN, ReducerSpec<S[RN], AM>>,
    middleware: (cfg.middleware ?? []) as any,
    effects: (cfg.effects ?? []) as any,
  });
}

export const typedActions = <AM extends ActionMapBase>(_: string[][]) =>
  <C extends keyof AM & string, Evt extends readonly (keyof AM[C] & string)[]>(
    channel: C,
    events: Evt
  ): ReadonlyArray<ActionPair<AM>> =>
    events.map(e => [channel, e] as const);