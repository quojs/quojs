import { createQuoHooks } from "@quojs/react";
import { AppStoreContext } from "./Store.context";
import type { AppState } from "../redux";
import type { tAppAM } from "./store";

export const {
  useStore,
  useDispatch,
  useSelector,
  useSliceProp,
  useSliceProps,
  shallowEqual,
} = createQuoHooks<keyof AppState & string, AppState, tAppAM>(AppStoreContext);