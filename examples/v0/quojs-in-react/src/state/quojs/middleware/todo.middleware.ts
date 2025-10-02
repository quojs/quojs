import type { MiddlewareFunction } from "@quojs/core";
import type { tAppAM } from "../store";

/**
 * Example of an async middleware */
export const todoMiddleware: Array<MiddlewareFunction<any, tAppAM>> = [
    async (_state, action, dispatch) => {
        if (action.channel !== "todo") return true;
        
        if (action.event === "fetchTodos") {
            dispatch(action.payload.actions.loading.channel, action.payload.actions.loading.event, {});

            try {
                const response = await fetch(action.payload.url);
                const data = await response.json();

                dispatch(action.payload.actions.success.channel, action.payload.actions.success.event, { todos: data });
            } catch (e) {
                dispatch(action.payload.actions.failure.channel, action.payload.actions.failure.event, { error: e });
            }

            return false;
        }

        return true;
    },
];