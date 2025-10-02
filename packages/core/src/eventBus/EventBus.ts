import type { ActionMapBase } from "../types";

export class EventBus<AM extends ActionMapBase> {
  private handlers: Map<string, Map<string, Set<(payload: any) => void>>> = new Map();

  /**
   * Subscribe to a (channel, event). Returns an unsubscribe function */
  public on<C extends keyof AM & string, E extends keyof AM[C] & string>(
    channel: C,
    event: E,
    handler: (payload: AM[C][E]) => void,
  ): () => void {
    let byEvent = this.handlers.get(channel);
    if (!byEvent) {
      byEvent = new Map();
      this.handlers.set(channel, byEvent);
    }

    let set = byEvent.get(event);
    if (!set) {
      set = new Set();
      byEvent.set(event, set);
    }

    set.add(handler as any);

    return () => this.off(channel, event, handler);
  }

  /**
   * Remove a specific handler from (channel,event) */
  public off<C extends keyof AM & string, E extends keyof AM[C] & string>(
    channel: C,
    event: E,
    handler: (payload: AM[C][E]) => void,
  ): void {
    const byEvent = this.handlers.get(channel);
    if (!byEvent) return;

    const set = byEvent.get(event);
    if (!set) return;

    set.delete(handler as any);

    if (set.size === 0) byEvent.delete(event);
    if (byEvent.size === 0) this.handlers.delete(channel);
  }

  /**
   * Emit to exact (channel, event) subscribers */
  public emit<C extends keyof AM & string, E extends keyof AM[C] & string>(
    channel: C,
    event: E,
    payload: AM[C][E],
  ): void {
    const byEvent = this.handlers.get(channel);
    if (!byEvent) return;

    const set = byEvent.get(event);
    if (!set || set.size === 0) return;

    for (const h of [...set]) {
      try {
        (h as any)(payload);
      } catch (err) {
        console.error("EventBus handler error:", err);
      }
    }
  }

  /**
   * Clear all listeners (useful for tests/HMR teardown) */
  public clear(): void {
    this.handlers.clear();
  }
}
