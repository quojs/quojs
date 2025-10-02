import { useDispatch } from "@quojs/react";
import type { iAsyncActions, tAppAM } from "../../store";
import type { eTodoStatus, iTodoSpec } from "../../../../types";

export function useTodoActions() {
    const dispatch = useDispatch<tAppAM>();

    return {
        addTodo: (todo: iTodoSpec) => dispatch("todo", "addTodo", todo),
        deleteTodo: (id: string) => dispatch("todo", "deleteTodo", { id }),
        setTodoTitle: (id: string, title: string) => dispatch("todo", "setTodoTitle", { id, title }),
        setTodoCategory: (id: string, category: string) => dispatch("todo", "setTodoCategory", { id, category }),
        setTodoStatus: (id: string, status: eTodoStatus) => dispatch("todo", "setTodoStatus", { id, status }),

        fetchTodos: (url: string = "https://jsonplaceholder.typicode.com/todos?id=0", offset: number = 0, limit: number = 10) => {
            const actions: iAsyncActions<tAppAM> = {
                loading: {
                    channel: "todo",
                    event: "fetchTodosLoading",
                },
                success: {
                    channel: "todo",
                    event: "fetchTodosSuccess",
                    payload: { todos: [] }
                },
                failure: {
                    channel: "todo",
                    event: "fetchTodosFailure",
                    payload: { error: "" }
                },
            };

            dispatch("todo", "fetchTodos", { offset, limit, url, actions });
        }
    };
};

export function useTodoFilterActions() {
    const dispatch = useDispatch<tAppAM>();

    return {
        setCategoryFilter: (by: string) => dispatch("todo", "setCategoryFilter", { by }),
        setStatusFilter: (by: eTodoStatus) => dispatch("todo", "setStatusFilter", { by }),
        clearFilters: () => dispatch("todo", "clearFilters", {}),
    };
};
