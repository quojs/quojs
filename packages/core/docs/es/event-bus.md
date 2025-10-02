# EventBus

## ¿Qué es el EventBus?

Un sistema de *publish/subscribe* **en proceso**, **síncrono** y **con tipos** (*type‑safe*).
A diferencia del tipo de acción global basado en *strings* de Redux, **Quo.js** usa:

- **Canales:** grupos de acciones con espacio de nombres (p. ej., "usuario", "cuenta").
- **Eventos:** eventos dentro de un canal (p. ej., "login", "sumar").

Esto **previene colisiones de nombres de acciones** y habilita *reducers* y *middleware* más granulares.

## EventBus (fuertemente tipado)

Permite suscribirse a combinaciones arbitrarias de canal/evento/propiedad (por ejemplo, para suscripción
atómica en `connect`).

```ts
const bus = new EventBus<MyActionMap>();

bus.on("cuenta", "sumar", (payload) => { ... });
bus.emit("cuenta", "sumar", 1);
bus.off("cuenta", "sumar", handler);
```

Esto es lo que impulsa el método `connect` del *Store* para la suscripción atómica a propiedades.

> ve la clase [EventBus.ts](../../src/eventBus/EventBus.ts).

<- Volver a [Quo.js core docs](./core.md)
