# EventBus

> [Version en español](../es/event-bus.md)

## What is the EventBus?

An in-process, synchronous, type-safe publish/subscribe system. Unlike Redux's global action
type string, Quo.js uses:

- **Channels:** Think of these as namespaced action groups (e.g., "user", "counter") that directly map to your redicer names
- **Events:** Events within a channel (e.g., "login", "inc"), like good-old Redux action types

This **prevents action name collision** and enables more granular reducers and middleware.

## EventBus (Strongly Typed)

Allows subscription to arbitrary channel/event/property combos, e.g. for atomic property in
connect

```ts
const bus = new EventBus<MyActionMap>();

bus.on("counter", "add", (payload) => { ... });
bus.emit("counter", "add", undefined);
bus.off("counter", "add", handler);
```

This is what powers Store's `connect` method for atomic property subscription.

> see the [EventBus.ts](../../src/eventBus/EventBus.ts) class.

<- Back to [Quo.js core docs](./core.md)