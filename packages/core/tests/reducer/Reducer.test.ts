import { describe, it, expect, vi } from "vitest";
import { Reducer } from "../../src/reducer/Reducer";
import { createStore, typedActions } from "../../src";

// Sample types for testing
type TestState = {
  count: number;
  items: string[];
};

type TestActionMap = {
  counter: {
    increment: { amount: number };
    decrement: { amount: number };
  };
  items: {
    add: { item: string };
    clear: undefined;
  };
};

describe("Reducer", () => {
  describe("constructor", () => {
    it("should initialize with provided reducer function", () => {
      const reducerFn = vi.fn((state: TestState) => state);
      const reducer = new Reducer<TestState, TestActionMap>(reducerFn);

      expect(reducer).toBeInstanceOf(Reducer);
      // @ts-expect-error tests - testing private field
      expect(reducer._reduce).toBe(reducerFn);
    });
  });

  describe("reduce()", () => {
    it("should call reducer with state and Quo.js action", () => {
      const reducerFn = vi.fn((state: TestState) => state);
      const reducer = new Reducer<TestState, TestActionMap>(reducerFn);
      const action = {
        channel: "counter",
        event: "increment",
        payload: { amount: 1 },
      };
      const state = { count: 5, items: [] };

      // @ts-expect-error tests
      reducer.reduce(state, action);
      expect(reducerFn).toHaveBeenCalledWith(state, action);
    });

    it("should return the result of the reducer function", () => {
      const newState = { count: 1, items: [] };
      const reducerFn = vi.fn(() => newState);
      const reducer = new Reducer<TestState, TestActionMap>(reducerFn);
      const action = {
        channel: "counter",
        event: "increment",
        payload: { amount: 1 },
      };

      // @ts-expect-error tests
      const result = reducer.reduce({ count: 0, items: [] }, action);
      expect(result).toBe(newState);
    });

    it("should handle state transformations", () => {
      const reducerFn = (state: TestState, action: any) => {
        switch (action.channel) {
          case "counter":
            switch (action.event) {
              case "increment":
                return { ...state, count: state.count + action.payload.amount };
              case "decrement":
                return { ...state, count: state.count - action.payload.amount };
            }
            break;
          case "items":
            switch (action.event) {
              case "add":
                return { ...state, items: [...state.items, action.payload.item] };
              case "clear":
                return { ...state, items: [] };
            }
        }
        return state;
      };

      const reducer = new Reducer<TestState, TestActionMap>(reducerFn);
      const initialState = { count: 0, items: [] };

      // Test counter actions
      const state1 = reducer.reduce(initialState, {
        channel: "counter",
        event: "increment",
        payload: { amount: 5 },
      });
      expect(state1).toEqual({ count: 5, items: [] });

      const state2 = reducer.reduce(state1, {
        channel: "counter",
        event: "decrement",
        payload: { amount: 2 },
      });
      expect(state2).toEqual({ count: 3, items: [] });

      // Test items actions
      const state3 = reducer.reduce(state2, {
        channel: "items",
        event: "add",
        payload: { item: "first" },
      });
      expect(state3).toEqual({ count: 3, items: ["first"] });

      const state4 = reducer.reduce(state3, {
        channel: "items",
        event: "clear",
        payload: undefined,
      });
      expect(state4).toEqual({ count: 3, items: [] });
    });
  });

  describe("edge cases", () => {
    it("should handle null state", () => {
      const reducerFn = vi.fn((state: TestState | null) => state);
      const reducer = new Reducer<TestState | null, TestActionMap>(reducerFn);
      const action = {
        channel: "counter",
        event: "increment",
        payload: { amount: 1 },
      };

      // @ts-expect-error tests
      expect(() => reducer.reduce(null, action)).not.toThrow();
    });

    it("should handle actions with undefined payload", () => {
      const reducerFn = vi.fn((state: TestState) => state);
      const reducer = new Reducer<TestState, TestActionMap>(reducerFn);
      const action = {
        channel: "items",
        event: "clear",
        payload: undefined,
      };

      // @ts-expect-error tests
      expect(() => reducer.reduce({ count: 0, items: ["test"] }, action)).not.toThrow();
    });
  });

  describe("with store integration", () => {
    it("should work with createStore", async () => {
      const store = createStore({
    name: "test",
        reducer: {
          counter: {
            actions: [
              ["counter", "increment"],
              ["counter", "decrement"],
            ],
            state: { count: 0 },
            reducer: (
              state: { count: number },
              action: { event: any; payload: { amount: number } },
            ) => {
              switch (action.event) {
                case "increment":
                  return { count: state.count + action.payload.amount };
                case "decrement":
                  return { count: state.count - action.payload.amount };
                default:
                  return state;
              }
            },
          },
        },

        middleware: [],
      });

      await store.dispatch("counter", "increment", { amount: 5 });
      expect(store.getState().counter).toEqual({ count: 5 });

      await store.dispatch("counter", "decrement", { amount: 2 });
      expect(store.getState().counter).toEqual({ count: 3 });
    });
  });
});
