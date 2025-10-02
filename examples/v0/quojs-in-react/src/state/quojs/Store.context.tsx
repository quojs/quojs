import { createContext } from "react";
import type { tAppStore } from "./store";

export const AppStoreContext = createContext<tAppStore | null>(null);
