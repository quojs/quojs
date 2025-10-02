export function detectChangedProps(
  oldState: any,
  newState: any,
  path = "",
  seenPairs: WeakMap<object, WeakSet<object>> = new WeakMap(),
): string[] {
  if (oldState === newState) return [];

  // Primitive or null vs anything -> changed
  if (
    typeof oldState !== "object" ||
    typeof newState !== "object" ||
    oldState === null ||
    newState === null
  ) {
    return [path];
  }

  // Date support
  if (oldState instanceof Date && newState instanceof Date) {
    return oldState.getTime() === newState.getTime() ? [] : [path];
  }

  // RegExp support
  if (oldState instanceof RegExp && newState instanceof RegExp) {
    return oldState.source === newState.source && oldState.flags === newState.flags ? [] : [path];
  }

  // Cycle/alias safety based on (old,new) PAIR tracking.
  // This avoids false negatives when the same object appears in multiple places.
  const oldObj = oldState as object;
  const newObj = newState as object;
  let bucket = seenPairs.get(oldObj);
  if (bucket) {
    if (bucket.has(newObj)) return [];
    bucket.add(newObj);
  } else {
    bucket = new WeakSet<object>();
    bucket.add(newObj);
    seenPairs.set(oldObj, bucket);
  }

  // Array vs non-array mismatch
  const isArrOld = Array.isArray(oldState);
  const isArrNew = Array.isArray(newState);
  if (isArrOld !== isArrNew) return [path];

  const changedPaths: string[] = [];

  // Arrays
  if (isArrOld) {
    const a = oldState;
    const b = newState as any[];
    if (a.length !== b.length) return [path];

    for (let i = 0; i < a.length; i++) {
      const childPath = path ? `${path}.${i}` : `${i}`;
      const elementPaths = detectChangedProps(a[i], b[i], childPath, seenPairs);
      changedPaths.push(...elementPaths);
    }
    return changedPaths.filter(Boolean);
  }

  // Plain objects (keys union)
  const oldKeys = Object.keys(oldState);
  const newKeys = Object.keys(newState);
  const allKeys = new Set([...oldKeys, ...newKeys]);

  for (const key of allKeys) {
    const nextPath = path ? `${path}.${key}` : key;
    const hasOld = Object.prototype.hasOwnProperty.call(oldState, key);
    const hasNew = Object.prototype.hasOwnProperty.call(newState, key);

    if (!hasOld) {
      changedPaths.push(nextPath);
      continue;
    }
    if (!hasNew) {
      changedPaths.push(nextPath);
      continue;
    }

    const nested = detectChangedProps(oldState[key], newState[key], nextPath, seenPairs);
    changedPaths.push(...nested);
  }

  return changedPaths.filter(Boolean);
}