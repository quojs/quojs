import { produce, type Draft } from "immer";

export type RecipeReducer<S, A = any> = (draft: Draft<S>, action: A) => void | undefined;

export function withImmer<S, A = any>(recipe: RecipeReducer<S, A>) {
    return (state: S, action: A): S => produce(state, (draft) => recipe(draft, action));
}
