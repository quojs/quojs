import React, { type ReactNode } from "react";
import type { StoreInstance } from "@quojs/core";
import { StoreContext } from "./StoreContext";

export const StoreProvider: React.FC<{
  store: StoreInstance<any, any, any>;
  children: ReactNode;
}> = ({ store, children }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
);