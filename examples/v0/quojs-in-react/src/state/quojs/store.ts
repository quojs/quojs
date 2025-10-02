import type { ActionMapBase, ReducerSpec } from "@quojs/core";
import type { eTodoStatus, iTodoSpec, iTypiTodo } from "../../types";

import { createStore, type StoreInstance } from "@quojs/core";

import { rootReducer } from "./reducer";
import { todoMiddleware } from "./middleware";

export type iAsyncActions<AM extends Record<string, Record<string, any>>> = {
    [K in keyof AM]: {
        loading: { channel: K; event: keyof AM[K]; payload?: AM[K][keyof AM[K]] };
        success: { channel: K; event: keyof AM[K]; payload?: AM[K][keyof AM[K]] };
        failure: { channel: K; event: keyof AM[K]; payload?: AM[K][keyof AM[K]] };
    };
}[keyof AM];

/**
 * App-specific channels */
export type tAppAM = {
    todo: {
        // fetch
        fetchTodos: {
            url: string,
            offset: number,
            limit: number,

            actions: iAsyncActions<tAppAM>
        },
        fetchTodosLoading: {},
        fetchTodosSuccess: { todos: iTypiTodo[] },
        fetchTodosFailure: { error: string },

        // crud
        addTodo: iTodoSpec,
        deleteTodo: { id: string },
        setTodoStatus: { id: string, status: eTodoStatus },
        setTodoCategory: { id: string, category: string },
        setTodoTitle: { id: string, title: string },

        // filter
        setStatusFilter: { by: eTodoStatus },
        setCategoryFilter: { by: string },
        clearFilters: {}
    };
};

/**
 * Convenience union for consumers */
export type tAnyAM = ActionMapBase & tAppAM;

export type StateFromReducers<R> = {
    [K in keyof R]: R[K] extends ReducerSpec<infer S, any> ? S : never;
};

/**
 * Create the app store with base reducers + middleware */
export const store: StoreInstance<keyof typeof rootReducer & string, StateFromReducers<typeof rootReducer>, tAppAM> =
    createStore({
        name: "Quo.js Store",
        reducer: rootReducer,
        middleware: todoMiddleware,
    });

export type tAppStore = typeof store;

