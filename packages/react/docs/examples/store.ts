import type {
  ActionPair,
  Readonly,
  EffectFunction,
  ReducerSpec,
  StoreInstance,
} from "@quojs/core";
import { createStore } from "@quojs/core";

// State
export type CountState = {
  value: number;
  step: number;
  history: number[];
};

export type UIState = {
  theme: "light" | "dark";
  busy: boolean;
};

// App state composed of multiple reducers (slices)
export type AppState = {
  count: CountState;
  ui: UIState;
};

// Action Maps
export type CounterAM = {
  add: number;
  subtract: number;
  set: number;
  setStep: number;
  pushHistory: number;
};

export type UIAM = {
  setTheme: UIState["theme"];
  setBusy: boolean;
};

// App-level Action Map (channels)
export type AppAM = {
  count: CounterAM;
  ui: UIAM;
};

// Middleware
export const LogMiddleware = async (getState: () => Readonly<AppState>, action: any): Promise<boolean> => {
  // Simple audit
  if (typeof console !== "undefined") console.dir(action);

  // Example veto: block further 'add' if current value > 10
  if (action.channel === "count" && action.event === "add") {
    const { count: { value } } = getState();

    if (value > 10) return false;
  }
  
  return true;
};

// Reducers
const COUNT_ACTIONS = [
  ["count", "add"],
  ["count", "subtract"],
  ["count", "set"],
  ["count", "setStep"],
  ["count", "pushHistory"],
] as const satisfies readonly ActionPair<AppAM>[];

export const countReducer: ReducerSpec<CountState, AppAM> = {
  actions: [...COUNT_ACTIONS],
  state: { value: 0, step: 1, history: [] },
  reducer: (state, action) => {
    switch (action.event) {
      case "add":        return { ...state, value: state.value + action.payload };
      case "subtract":   return { ...state, value: state.value - action.payload };
      case "set":        return { ...state, value: action.payload };
      case "setStep":    return { ...state, step: action.payload };
      case "pushHistory":return { ...state, history: [...state.history, action.payload] };
      default:           return state;
    }
  },
};

const UI_ACTIONS = [
  ["ui", "setTheme"],
  ["ui", "setBusy"],
] as const satisfies readonly ActionPair<AppAM>[];

export const uiReducer: ReducerSpec<UIState, AppAM> = {
  actions: [...UI_ACTIONS],
  state: { theme: "light", busy: false },
  reducer: (state, action) => {
    switch (action.event) {
      case "setTheme": return { ...state, theme: action.payload };
      case "setBusy":  return { ...state, busy: action.payload };
      default:         return state;
    }
  },
};

// Effects
export const countResetEffect: EffectFunction<Readonly<AppState>, AppAM> = (
  action,
  getState,
  dispatch,
) => {
  if (action.channel !== "count" || action.event !== "add") return;
  const s = getState();
  if (s.count.value > 9) {
    dispatch("count", "set", 0);
    dispatch("count", "pushHistory", 0);
  }
};

// Store
export type AppStore = StoreInstance<keyof AppState & string, AppState, AppAM>;

export const store: AppStore = createStore({
    name: "test",
  reducer: {
    count: countReducer,
    ui: uiReducer,
  },
  middleware: [LogMiddleware],
  effects: [countResetEffect],
});
