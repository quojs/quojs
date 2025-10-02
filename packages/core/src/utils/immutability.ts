import type { DeepReadonly } from "../types";

export function freezeState<T>(obj: T, seen = new WeakSet<object>()): DeepReadonly<T> {
  if (obj === null || typeof obj !== "object") return obj as any;
  if (seen.has(obj as any)) return obj as any;
  if (Object.isFrozen(obj)) return obj as any;

  seen.add(obj as any);

  // Arrays: handle indices only (skip length descriptor churn)
  if (Array.isArray(obj)) {
    const arr = obj as unknown as any[];
    for (let i = 0; i < arr.length; i++) {
      arr[i] = freezeState(arr[i], seen);
    }
    return Object.freeze(arr) as any;
  }

  // Plain objects: freeze string and symbol props (value descriptors only)
  for (const key of Object.getOwnPropertyNames(obj)) {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (!desc || !("value" in desc)) continue; // skip getters/setters
    (obj as any)[key] = freezeState((obj as any)[key], seen);
  }
  for (const sym of Object.getOwnPropertySymbols(obj)) {
    const desc = Object.getOwnPropertyDescriptor(obj, sym);
    if (!desc || !("value" in desc)) continue;
    (obj as any)[sym as any] = freezeState((obj as any)[sym as any], seen);
  }

  return Object.freeze(obj) as any;
}
