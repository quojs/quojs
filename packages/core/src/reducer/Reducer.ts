import type { ActionMapBase, ActionUnion, ReducerFunction } from "../types";

export class Reducer<S, AM extends ActionMapBase = ActionMapBase> {
  private readonly _reduce: ReducerFunction<S, AM>;

  constructor(reduce: ReducerFunction<S, AM>) {
    this._reduce = reduce;
  }

  reduce(state: S, action: ActionUnion<AM>): S {
    return this._reduce(state, action);
  }
}
