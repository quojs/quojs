import type { ActionMapBase } from "../types";

/**
 * Minimal, synchronous pub/sub event bus keyed by **channel** and **event**.
 *
 * @typeParam AM - Action map shape:
 * ```ts
 * type ActionMapBase = Record<string, Record<string, unknown>>;
 * // Example:
 * type AM = {
 *   ui: { toggle: boolean };
 *   data: { loaded: { items: string[] } };
 * };
 * ```
 *
 * @remarks
 * - Handlers are stored per `(channel, event)` and invoked **synchronously** in subscription order.
 * - Exceptions thrown by a handler are **caught and logged**, and do **not** stop other handlers.
 * - Intended for in-memory, single-process usage (no cross-tab/process broadcasting).
 *
 * @example
 * ```ts
 * type AM = {
 *   ui: { toggle: boolean };
 *   data: { loaded: { items: string[] } };
 * };
 *
 * const bus = new EventBus<AM>();
 *
 * // Subscribe
 * const off = bus.on('ui', 'toggle', (on) => {
 *   console.log('UI toggled:', on);
 * });
 *
 * // Emit
 * bus.emit('ui', 'toggle', true); // logs: "UI toggled: true"
 *
 * // Unsubscribe
 * off();
 * ```
 *
 * @public
 */
export class EventBus<AM extends ActionMapBase> {
  /**
   * Internal registry: `channel → event → Set<handler>`.
   * @internal
   */
  private handlers: Map<string, Map<string, Set<(payload: any) => void>>> = new Map();

  /**
   * Subscribes a handler to an exact `(channel, event)`.
   *
   * @typeParam C - Channel key (must be a string key of `AM`).
   * @typeParam E - Event key within channel `C` (must be a string key of `AM[C]`).
   * @param channel - Channel name to subscribe to.
   * @param event - Event name within the channel.
   * @param handler - Function invoked with the payload type `AM[C][E]`.
   * @returns An **unsubscribe** function that removes this handler.
   *
   * @example
   * ```ts
   * const off = bus.on('data', 'loaded', ({ items }) => {
   *   console.log('Loaded', items.length, 'items');
   * });
   *
   * // Later, stop listening:
   * off();
   * ```
   *
   * @public
   */
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
   * Removes a specific handler previously added with {@link EventBus.on | `on`}.
   *
   * @typeParam C - Channel key (string key of `AM`).
   * @typeParam E - Event key within channel `C` (string key of `AM[C]`).
   * @param channel - Channel name of the subscription to remove.
   * @param event - Event name of the subscription to remove.
   * @param handler - The same handler reference that was passed to `on`.
   *
   * @example
   * ```ts
   * const h = (n: number) => console.log('inc', n);
   * bus.on('math', 'inc', h);
   *
   * // Explicitly remove this handler:
   * bus.off('math', 'inc', h);
   * ```
   *
   * @public
   */
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
   * Emits an event to all subscribers of the exact `(channel, event)`.
   *
   * Handlers are invoked **synchronously**. Any exception thrown by a handler is
   * caught and logged, and other handlers still run.
   *
   * @typeParam C - Channel key (string key of `AM`).
   * @typeParam E - Event key within channel `C` (string key of `AM[C]`).
   * @param channel - Channel name to emit on.
   * @param event - Event name to emit.
   * @param payload - Payload matching `AM[C][E]`.
   *
   * @example
   * ```ts
   * bus.emit('ui', 'toggle', false);
   * ```
   *
   * @public
   */
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
   * Clears **all** listeners across all channels/events.
   *
   * Useful for tests or during HMR teardown to avoid duplicate handlers.
   *
   * @example
   * ```ts
   * // In a test teardown:
   * afterEach(() => bus.clear());
   * ```
   *
   * @public
   */
  public clear(): void {
    this.handlers.clear();
  }
}