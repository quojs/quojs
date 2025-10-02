import { useEffect } from "react";

import { TodoList } from "./todoList/TodoList";
import { TodoFactory } from "./todoFactory/TodoFactory";
import { TodoFilter } from "./todoFilter/TodoFilter";
import { store, useTodoActions } from "../../state/quojs";
import { AppStoreContext } from "../../state/quojs/Store.context";

export interface iQuojsTodoPageProps { }

export const QuojsTodoPage: React.FC<iQuojsTodoPageProps> = (_: iQuojsTodoPageProps) => {
    const { fetchTodos } = useTodoActions();

    useEffect(() => {
        fetchTodos();
    }, []);

    return (
        <AppStoreContext.Provider value={store}>
            <div>
                <h2>Quo.js's TODOs</h2>
                <TodoFactory />
                <TodoFilter />
                <TodoList />
            </div>
        </AppStoreContext.Provider>
    );
};
