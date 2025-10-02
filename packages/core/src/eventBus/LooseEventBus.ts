export class LooseEventBus<C extends string = string, E extends string = string, P = any> {
  /**
   * Exact handlers: channel -> event -> [handlers] */
  private handlers = new Map<C, Map<E, Array<(p: P) => void>>>();

  /**
   * Pattern handlers (supports '*' and '**'):
   * channel -> pattern(string) -> [handlers] */
  private patternHandlers = new Map<C, Map<string, Array<(p: P) => void>>>();

  /**
   * Subscribe to an event (exact or pattern) */
  on(channel: C, event: E, handler: (payload: P) => void): () => void {
    const eventStr = String(event);
    if (!this.isPattern(eventStr)) {
      // Exact subscription with normalized key (strip leading dot)
      const key = this.normalizeEventKey(eventStr) as E;

      if (!this.handlers.has(channel)) this.handlers.set(channel, new Map());
      const map = this.handlers.get(channel);

      if (!map.has(key)) map.set(key, []);
      map.get(key).push(handler);

      // capture normalized key for off()
      return () => this.offExactNormalized(channel, key, handler);
    } else {
      // Pattern subscription (stored as provided; matcher handles normalization)
      const pattern = eventStr;

      if (!this.patternHandlers.has(channel)) this.patternHandlers.set(channel, new Map());
      const pmap = this.patternHandlers.get(channel);

      if (!pmap.has(pattern)) pmap.set(pattern, []);
      pmap.get(pattern).push(handler);

      return () => this.offPattern(channel, pattern, handler);
    }
  }

  /**
   * Public off for exact events - normalizes the key so callers don't need to */
  off(channel: C, event: E, handler: (payload: P) => void): void {
    const key = this.normalizeEventKey(String(event)) as E;
    this.offExactNormalized(channel, key, handler);
  }

  /**
   * Internal exact off with already-normalized key */
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
   * Unsubscribe a pattern handler. (No-ops if missing) */
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
   * Emit to exact subscribers first, then to matching pattern subscribers.
   * De-dupes handlers to avoid double calls if a handler is registered twice */
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
   * Treat any key containing '*' as a pattern */
  private isPattern(s: string): boolean {
    return s.includes("*");
  }

  /**
   * Normalize event keys for exact matching: strip a single leading '.' */
  private normalizeEventKey(s: string): string {
    return s.replace(/^\./, "");
  }

  private splitPath(p: string): string[] {
    return this.normalizeEventKey(p).split(".").filter(Boolean);
  }

  /**
   * Pattern matcher with '.'-separated segments:
   * - literal: exact
   * - '*'  : matches one segment
   * - '**' : matches any remaining segments (including empty) */
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
   * Remove all listeners (useful for tests/HMR teardown) */
  clear(): void {
    this.handlers.clear();
    this.patternHandlers.clear();
  }
}
