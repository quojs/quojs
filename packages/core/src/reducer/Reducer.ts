import type { ActionMapBase, ActionUnion, ReducerFunction } from "../types";

/**
 * Thin wrapper around a pure reducer function:
 * given a state `S` and an action (from {@link ActionUnion | `ActionUnion<AM>`}),
 * returns the next state `S`.
 *
 * @typeParam S  - State shape handled by this reducer.
 * @typeParam AM - Action map describing the valid action keys and payload types.
 *
 * @remarks
 * - The reducer function is expected to be **pure** and **side-effect free**.
 * - Use this class when you want to pass a reducer around as a value, or to
 *   unify the reducer interface across the core API.
 *
 * @example Basic counter
 * ```ts
 * type State = { count: number };
 * type AM = { add: number; set: number };
 *
 * // A reducer function that responds to 'add' and 'set'
 * const rf: ReducerFunction<State, AM> = (s, a) => {
 *   // NOTE: The exact shape of ActionUnion<AM> depends on your core types.
 *   // Replace 'type'/'payload' with your project's action keys if different.
 *   switch ((a as any).type as keyof AM) {
 *     case 'add': return { count: s.count + (a as any).payload as number };
 *     case 'set': return { count: (a as any).payload as number };
 *     default:    return s;
 *   }
 * };
 *
 * const r = new Reducer<State, AM>(rf);
 *
 * const s0 = { count: 0 };
 * const s1 = r.reduce(s0, { type: 'add', payload: 2 } as unknown as ActionUnion<AM>);
 * // s1.count === 2
 * ```
 *
 * @public
 */
export class Reducer<S, AM extends ActionMapBase = ActionMapBase> {
  /**
   * The underlying pure reducer function.
   * @internal
   */
  private readonly _reduce: ReducerFunction<S, AM>;

  /**
   * Creates a new {@link Reducer} from a pure reducer function.
   *
   * @param reduce - A function `(state, action) => nextState` that implements your update logic.
   *
   * @example
   * ```ts
   * const reducer = new Reducer<MyState, MyAM>((state, action) => {
   *   // implement your transitions here
   *   return state;
   * });
   * ```
   *
   * @public
   */
  constructor(reduce: ReducerFunction<S, AM>) {
    this._reduce = reduce;
  }

  /**
   * Applies the reducer to produce the next state.
   *
   * @param state  - Current state.
   * @param action - An action drawn from {@link ActionUnion | `ActionUnion<AM>`}.
   * @returns The next state produced by the underlying reducer function.
   *
   * @example
   * ```ts
   * const next = reducer.reduce(curr, someAction as ActionUnion<MyAM>);
   * ```
   *
   * @public
   */
  reduce(state: S, action: ActionUnion<AM>): S {
    return this._reduce(state, action);
  }
}
