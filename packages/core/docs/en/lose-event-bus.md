# LooseEventBus (Atomic Subscriptions)

> [Version en español](../es/lose-event-bus.md)

A more flexible bus.

```ts
const loose = new LooseEventBus();

loose.on("counter", "value", ({ oldValue, newValue }) => { ... });
loose.emit("counter", "value", { oldValue: { value: 1}, newValue: { value: 2} });
```

You never deal with strings directly—everything is typed.

> see the [EventBus.ts](../../src/eventBus/EventBus.ts) class.

<- Back to [Quo.js core docs](./core.md)
