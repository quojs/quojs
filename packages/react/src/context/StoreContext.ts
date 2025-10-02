import { createContext } from "react";
import type { StoreInstance } from "@quojs/core";

export const StoreContext = createContext<StoreInstance<any, any, any> | null>(null);