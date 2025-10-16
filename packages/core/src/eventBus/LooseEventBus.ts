/**
 * @mergeModuleWith @quojs/core
 */

/**
 * Flexible, synchronous pub/sub bus that supports **exact** and **pattern** event subscriptions.
 *
 * @typeParam C - Channel name type (defaults to `string`).
 * @typeParam E - Event name type (defaults to `string`). Events are treated as **dot-separated paths** (e.g. `"a.b.c"`).
 * @typeParam P - Payload type for all events (defaults to `any`).
 *
 * @remarks
 * - **Exact handlers** subscribe to a specific `(channel, event)` pair. Event keys are **normalized** by stripping a single leading dot (`".foo"` → `"foo"`).
 * - **Pattern handlers** subscribe using wildcards over dot-separated segments:
 *   - `*`   matches **one** segment.
 *   - `**`  matches **zero or more** segments (greedy).
 * - On {@link LooseEventBus.emit | `emit`}, exact handlers fire first, then any matching pattern handlers.
 * - Handlers are **de-duplicated**: if the same function is both exact and pattern-registered, it is called **once**.
 * - Handler invocation is **synchronous**. Exceptions are caught and logged; remaining handlers still run.
 *
 * @example
 * ```ts
 * type C = 'ui' | 'data';
 * type E = string;
 * type P = unknown;
 *
 * const bus = new LooseEventBus<C, E, P>();
 *
 * // Exact
 * const offA = bus.on('ui', 'panel.open', () => console.log('panel opened'));
 *
 * // Patterns
 * const offB = bus.on('ui', 'panel.*', () => console.log('any single sub-event under panel'));
 * const offC = bus.on('ui', 'panel.**', () => console.log('any depth under panel'));
 *
 * bus.emit('ui', 'panel.open', null);
 * // => exact fires, then 'panel.*', then 'panel.**'
 *
 * offA(); offB(); offC(); // unsubscribe
 * ```
 *
 * @public
 */
export class LooseEventBus<C extends string = string, E extends string = string, P = any> {
  /**
   * Exact handlers: `channel → event → [handlers]`.
   * @internal
   */
  private handlers = new Map<C, Map<E, Array<(p: P) => void>>>();

  /**
   * Pattern handlers with `*` and `**`: `channel → pattern(string) → [handlers]`.
   * @internal
   */
  private patternHandlers = new Map<C, Map<string, Array<(p: P) => void>>>();

  /**
   * Subscribes a handler to either an **exact** event or a **pattern**.
   *
   * @param channel - Channel to subscribe on.
   * @param event - Exact event (e.g. `"a.b"`) or pattern (contains `*`/`**`).
   * @param handler - Function invoked with the emitted payload.
   * @returns An **unsubscribe** function that removes this handler.
   *
   * @remarks
   * - Exact subscriptions are stored under a **normalized** key (leading `.` removed).
   * - Pattern subscriptions are stored **as provided**; matching normalizes the subject.
   *
   * @example Exact subscription
   * ```ts
   * const off = bus.on('data', 'items.loaded', ({ count }) => {
   *   console.log('Loaded', count);
   * });
   * // Later
   * off();
   * ```
   *
   * @example Pattern subscription
   * ```ts
   * // Match any single sub-event: 'panel.open', 'panel.close', etc.
   * const offStar = bus.on('ui', 'panel.*', () => {});
   *
   * // Match any depth: 'panel.open', 'panel.items.add', 'panel', etc.
   * const offGlob = bus.on('ui', 'panel.**', () => {});
   * ```
   *
   * @public
   */
  on(channel: C, event: E, handler: (payload: P) => void): () => void {
    const eventStr = String(event);
    if (!this.isPattern(eventStr)) {
      // Exact subscription with normalized key (strip leading dot)
      const key = this.normalizeEventKey(eventStr) as E;

      if (!this.handlers.has(channel)) this.handlers.set(channel, new Map());
      const map = this.handlers.get(channel)!;

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(handler);

      // capture normalized key for off()
      return () => this.offExactNormalized(channel, key, handler);
    } else {
      // Pattern subscription (stored as provided; matcher handles normalization)
      const pattern = eventStr;

      if (!this.patternHandlers.has(channel)) this.patternHandlers.set(channel, new Map());
      const pmap = this.patternHandlers.get(channel)!;

      if (!pmap.has(pattern)) pmap.set(pattern, []);
      pmap.get(pattern)!.push(handler);

      return () => this.offPattern(channel, pattern, handler);
    }
  }

  /**
   * Unsubscribes an **exact** handler. The `event` key is normalized internally,
   * so callers can pass `"foo"` or `".foo"` interchangeably.
   *
   * @param channel - Channel name.
   * @param event - Exact event key to remove (normalization applied).
   * @param handler - The same handler reference previously passed to {@link LooseEventBus.on | `on`}.
   *
   * @example
   * ```ts
   * const h = () => {};
   * bus.on('ui', 'panel.open', h);
   * // Remove it (with or without leading dot)
   * bus.off('ui', '.panel.open', h);
   * ```
   *
   * @public
   */
  off(channel: C, event: E, handler: (payload: P) => void): void {
    const key = this.normalizeEventKey(String(event)) as E;
    this.offExactNormalized(channel, key, handler);
  }

  /**
   * Internal exact unsubscription using an already **normalized** event key.
   *
   * @param channel - Channel name.
   * @param normalizedEvent - Event key with leading dot removed.
   * @param handler - Handler to remove.
   * @internal
   */
  private offExactNormalized(
    channel: C,
    normalizedEvent: E,
    handler: (payload: P) => void,
  ): void {
    const cMap = this.handlers.get(channel);
    if (!cMap) return;
    const list = cMap.get(normalizedEvent);
    if (!list) return;

    const i = list.indexOf(handler);
    if (i !== -1) list.splice(i, 1);

    // cleanup empties
    if (list.length === 0) cMap.delete(normalizedEvent);
    if (cMap.size === 0) this.handlers.delete(channel);
  }

  /**
   * Internal removal for a **pattern** subscription. No-ops if missing.
   *
   * @param channel - Channel name.
   * @param pattern - Pattern string as originally subscribed.
   * @param handler - Handler to remove.
   * @internal
   */
  private offPattern(channel: C, pattern: string, handler: (payload: P) => void): void {
    const pMap = this.patternHandlers.get(channel);
    if (!pMap) return;

    const list = pMap.get(pattern);
    if (!list) return;

    const i = list.indexOf(handler);
    if (i !== -1) list.splice(i, 1);

    // cleanup empties
    if (list.length === 0) pMap.delete(pattern);
    if (pMap.size === 0) this.patternHandlers.delete(channel);
  }

  /**
   * Emits an event to all exact subscribers first, then to **matching pattern** subscribers.
   * Duplicate handler references are called **once** (de-duped).
   *
   * @param channel - Channel to emit on.
   * @param event - Event key (subject). A leading dot is ignored for matching.
   * @param payload - Payload delivered to handlers.
   *
   * @example
   * ```ts
   * // Suppose:
   * //  - on('ui', 'panel.open', h)
   * //  - on('ui', 'panel.*', h)       // same handler ref!
   * //  - on('ui', 'panel.**', other)
   * bus.emit('ui', 'panel.open', { id: 1 });
   * // => 'h' runs once (de-duped), then 'other'
   * ```
   *
   * @public
   */
  emit(channel: C, event: E, payload: P): void {
    const eventStr = String(event);
    const normalizedEvent = this.normalizeEventKey(eventStr) as E;

    // Exact delivery (normalized)
    const exactList = this.handlers.get(channel)?.get(normalizedEvent) ?? [];

    // Pattern delivery (normalize subject before matching)
    const patternMap = this.patternHandlers.get(channel);
    const patternLists: Array<Array<(p: P) => void>> = [];
    if (patternMap && patternMap.size) {
      const subject = this.normalizeEventKey(eventStr);
      for (const [pattern, handlers] of patternMap.entries()) {
        if (this.matchPattern(pattern, subject)) {
          patternLists.push(handlers);
        }
      }
    }

    const called = new Set<(p: P) => void>();
    const deliver = (arr: Array<(p: P) => void>) => {
      for (const h of [...arr]) {
        if (called.has(h)) continue;

        called.add(h);

        try {
          h(payload);
        } catch (exc) {
          console.error(exc);
          continue;
        }
      }
    };

    deliver(exactList);
    for (const list of patternLists) deliver(list);
  }

  /**
   * Determines if a string is a **pattern** (contains `*`).
   * @param s - Event or pattern string.
   * @returns `true` if it contains at least one `*`, else `false`.
   * @internal
   */
  private isPattern(s: string): boolean {
    return s.includes("*");
  }

  /**
   * Normalizes event keys for exact matching by stripping a **single** leading dot.
   *
   * @param s - Event key.
   * @returns Normalized key without a leading dot.
   * @example
   * ```ts
   * normalizeEventKey('.a.b') // 'a.b'
   * normalizeEventKey('a.b')  // 'a.b'
   * ```
   * @internal
   */
  private normalizeEventKey(s: string): string {
    return s.replace(/^\./, "");
  }

  /**
   * Splits a path into dot-separated segments after normalization and removes empties.
   * @param p - Event or pattern string.
   * @internal
   */
  private splitPath(p: string): string[] {
    return this.normalizeEventKey(p).split(".").filter(Boolean);
  }

  /**
   * Pattern matcher over dot-separated segments.
   *
   * Rules:
   * - **literal**: exact match.
   * - `*`   : matches exactly **one** segment.
   * - `**`  : matches **zero or more** remaining segments (including empty).
   *
   * @param pattern - Pattern (may include `*`/`**`).
   * @param path - Subject event key to test.
   * @returns `true` if the pattern matches the path; otherwise `false`.
   *
   * @example
   * ```ts
   * matchPattern('a.*', 'a.b')        // true
   * matchPattern('a.*', 'a.b.c')      // false
   * matchPattern('a.**', 'a')         // true
   * matchPattern('a.**', 'a.b.c')     // true
   * matchPattern('**.end', 'x.y.end') // true
   * ```
   *
   * @internal
   */
  private matchPattern(pattern: string, path: string): boolean {
    const pSegs = this.splitPath(pattern);
    const sSegs = this.splitPath(path);

    let i = 0; // pattern idx
    let j = 0; // subject idx

    while (i < pSegs.length && j < sSegs.length) {
      const token = pSegs[i];

      if (token === "**") {
        // trailing '**' matches the rest
        if (i === pSegs.length - 1) return true;

        // collapse consecutive '**'
        const rest = pSegs.slice(i).filter((t) => t !== "**");
        if (rest.length === 0) return true; // all **

        // try to align the next non-** token at any suffix position
        for (let k = j; k <= sSegs.length; k++) {
          if (this.matchPattern(pSegs.slice(i + 1).join("."), sSegs.slice(k).join("."))) {
            return true;
          }
        }
        return false;
      }

      if (token === "*" || token === sSegs[j]) {
        i++;
        j++;
        continue;
      }

      return false;
    }

    // Subject consumed. Remaining pattern tokens must be only '**'
    if (j === sSegs.length) {
      for (; i < pSegs.length; i++) {
        if (pSegs[i] !== "**") return false;
      }
      return true;
    }

    // Subject remains but pattern exhausted (unless last was '**', handled above)
    return false;
  }

  /**
   * Removes **all** listeners (exact and pattern). Useful for tests/HMR teardown.
   *
   * @example
   * ```ts
   * afterEach(() => bus.clear());
   * ```
   *
   * @public
   */
  clear(): void {
    this.handlers.clear();
    this.patternHandlers.clear();
  }
}
