import { v4 } from "uuid";

import type { ActionPair, ReducerFunction, ReducerSpec } from "@quojs/core";
import { typedActions } from "@quojs/core";

import { eReducerStatus, eTodoStatus, type iTodo, type iTodoState } from "../../../../types";
import type { tAppAM } from "../../store";
import { withImmer } from "../withImmer";

export const todoInitialState: iTodoState = {
  data: {},
  filter: {
    categories: {},
    selectedCategory: "",
    selectedStatus: "ALL",
  },
  status: eReducerStatus.Loading,
  statusDetails: "fetching todos...",
};

const TODO_ACTIONS = [
  ["todo", "addTodo"],
  ["todo", "deleteTodo"],
  ["todo", "setTodoTitle"],
  ["todo", "setTodoCategory"],
  ["todo", "setTodoStatus"],
  ["todo", "setCategoryFilter"],
  ["todo", "setStatusFilter"],
  ["todo", "clearFilters"],
  ["todo", "fetchTodosLoading"],
  ["todo", "fetchTodosSuccess"],
  ["todo", "fetchTodosFailure"],
] as const satisfies readonly ActionPair<tAppAM>[];

/**
 * todo Reducer (Immer-wrapped)
 * 
 * The only Reducer in the Application, it stores:
 * 
 * - todoes in a dictionary, in which the key is the
 *   id and the value is the todo itself
 * - filter state
 * - status and statusDetails properties for async */
const todoReducer: ReducerFunction<iTodoState, tAppAM> = withImmer<iTodoState, any>((draft, action) => {
  const { event, payload } = action;

  switch (event) {
    case "addTodo": {
      const addTodoPayload = payload as tAppAM["todo"]["addTodo"];

      // categories++
      if (addTodoPayload.category) {
        if (!draft.filter.categories[addTodoPayload.category]) {
          draft.filter.categories[addTodoPayload.category] = 0;
        }
        draft.filter.categories[addTodoPayload.category]++;
      }

      const key = addTodoPayload.id ?? v4();
      draft.data[key] = {
        id: key,
        ...addTodoPayload,
      } as iTodo;
      return;
    }

    case "deleteTodo": {
      const { id } = payload as tAppAM["todo"]["deleteTodo"];
      const todoItem = draft.data[id];

      if (todoItem?.category) {
        const cat = todoItem.category;
        if (draft.filter.categories[cat] <= 1) {
          delete draft.filter.categories[cat];
        } else {
          draft.filter.categories[cat]--;
        }
      }

      delete draft.data[id];
      return;
    }

    case "setTodoTitle": {
      const { id, title } = payload as tAppAM["todo"]["setTodoTitle"];
      const t = draft.data[id];

      if (t) t.title = title;

      return;
    }

    case "setTodoCategory": {
      const { id, category } = payload as tAppAM["todo"]["setTodoCategory"];
      const t = draft.data[id];
      if (!t) return;

      /**
       * If the todo had a previous category,
       * we subtract from that category */
      const oldCat = t.category;
      if (oldCat) {
        if (draft.filter.categories[oldCat] <= 1) {
          delete draft.filter.categories[oldCat];
        } else {
          draft.filter.categories[oldCat]--;
        }
      }

      // increment new category
      if (category) {
        if (!draft.filter.categories[category]) {
          draft.filter.categories[category] = 0;
        }
        draft.filter.categories[category]++;
      }

      t.category = category;
      return;
    }

    case "setTodoStatus": {
      const { id, status } = payload as tAppAM["todo"]["setTodoStatus"];
      const t = draft.data[id];

      if (t) t.status = status;

      return;
    }


    // fetched todoes
    case "fetchTodosLoading": {
      draft.status = eReducerStatus.Loading;
      draft.statusDetails = "fetching todoes...";

      return;
    }

    case "fetchTodosSuccess": {
      const { todos } = payload as tAppAM["todo"]["fetchTodosSuccess"];

      draft.data = todos.reduce<Record<string, iTodo>>((todoes, todo) => {
        todoes[todo.id] = {
          id: `${todo.id}`,
          title: todo.title,
          category: "fetched",
          status: todo?.completed ? eTodoStatus.Complete : eTodoStatus.Pending,
        }

        return todoes;
      }, { ...draft.data });

      // increment new category
      if (!draft.filter.categories["fetched"]) {
        draft.filter.categories["fetched"] = todos.length;
      } else {
        draft.filter.categories["fetched"] += todos.length;
      }
      return;
    }

    case "fetchTodosFailure": {
      const { error } = payload as tAppAM["todo"]["fetchTodosFailure"];

      draft.status = eReducerStatus.Failure;
      draft.statusDetails = error;

      return;
    }

    // filter state
    case "setStatusFilter": {
      const { by } = payload as tAppAM["todo"]["setStatusFilter"];
      draft.filter.selectedStatus = by;

      return;
    }

    case "setCategoryFilter": {
      const { by } = payload as tAppAM["todo"]["setCategoryFilter"];
      draft.filter.selectedCategory = by;

      return;
    }

    case "clearFilters": {
      draft.filter.selectedCategory = "";
      draft.filter.selectedStatus = "";
      return;
    }

    default:
      return; // no change
  }
});

export const todoSpec: ReducerSpec<iTodoState, tAppAM> = {
  actions: [
    ...TODO_ACTIONS,
  ],
  state: todoInitialState,
  reducer: (state = todoInitialState, action) => todoReducer(state, action),
};
