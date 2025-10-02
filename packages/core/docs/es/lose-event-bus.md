# LooseEventBus (Suscripciones atómicas)

Un bus más flexible.

```ts
const loose = new LooseEventBus();

loose.on("cuenta", "valor", ({ oldValue, newValue }) => { ... });
loose.emit("cuenta", "valor", { oldValue: { valor: 1}, newValue: { valor: 2 }});
```

Nunca lidias directamente con _strings_ — todo está tipado.

> ve la clase [EventBus.ts](../../src/eventBus/EventBus.ts).

<- Volver a [Quo.js core docs](./core.md)
