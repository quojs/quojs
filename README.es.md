# Quo.js

![Quo.js logo](./assets/logo.svg)

Declarativa • Ultrasencilla • eXpressiva: Quo.js es una librería moderna de gestión de estado inspirada en Redux, pero sin el “equipaje” de
Redux Toolkit. Recupera la simplicidad y la potencia del patrón Redux original, mientras
introduce **canales + eventos**, **middleware y efectos asíncronos nativos**, **suscripciones granulares**
y **hooks para React preparados para Suspense y Concurrent Mode**.

## Paquetes

- **[@quojs/core](./packages/quojs/README.md)** — *Store* núcleo, *reducers*, *middleware*, *effects*
  (agnóstico del *framework*)
- **[@quojs/react](./packages/quojs-react/README.md)** — *Provider* y *hooks* para React
  (compatibles con Suspense/Concurrent)
- **[examples/](./examples/)** — ejemplos ejecutables

## ¿Por qué Quo.js?

- 🗪 **Modelo Canal + Evento** — las acciones son `{ channel, event, payload }`; los *reducers* se suscriben
  exactamente a la granularidad que necesites.
- 🎯 **suscripciones atómicas** — suscríbete a propiedades atómicas para evitar **[renders innecesarios](./examples/quojs-in-react/redux-quojs-profiler.md).
- 🧭 **TypeScript de primera** — *typings* ergonómicos y APIs predecibles.
- ⚡ **Middleware & effects integrados** — asíncronos por defecto; sin *boilerplate* de thunk/saga.
- 🧩 **Reducers dinámicos** — agrega/quita *reducers* en tiempo de ejecución.
- 📌 **Ligero** — superficie pequeña y enfocada.
- 🧭 **Agnóstico de framework** — React hoy; se aceptan más *bindings*.

## ¿Cómo se compara **Quo.js** con otros contenedores de estado?

Al evaluar un gestor de estado, la superficie del API no lo es todo.  
Lo que realmente importa es la filosofía detrás, las compensaciones que hace y cómo esas decisiones afectan la **experiencia de desarrollo, el rendimiento y la escalabilidad** en proyectos reales.

Quo.js fue diseñado como una evolución pragmática de las ideas originales de Redux:  
*Actions* explícitas, transiciones de estado predecibles, tipado fuerte con TypeScript y manejo de *async/effects* integrado — sin la “magia” oculta ni el _boilerplate_ de otros ecosistemas.  

Para ayudarte a decidir si Quo.js es la mejor opción, hemos preparado comparaciones directas contra otras librerías populares. Cada documento explora:

- **Modelo conceptual** (cómo fluye el estado a través de *Actions*, *Reducers* y *Effects*)  
- **Ergonomía de desarrollo** (*boilerplate*, tipado, herramientas de depuración)  
- **Rendimiento** (granularidad de suscripciones, eficiencia en re-renderizados)  
- **Async & effects** (cómo se expresan *workflows* y efectos secundarios)  
- **Integración con React** (selectores, Suspense, soporte para concurrent mode)

👉 Revisa las comparaciones aquí:
- [Quo.js vs Redux](./docs/es/comparacion/con-redux.md) y el [proyecto de ejemplo](./examples/quojs-in-react/README.es.md)
- [Quo.js vs MobX](./docs/es/comparacion/con-mobx.md)
*(y más próximamente)*

## Inicio rápido (Monorepo)

```bash
npm i -g @microsoft/rush
rush install
rush build
rush test
```

Compilaciones focalizadas:

```bash
rush build --to @quojs/core
rush build --from @quojs/react
```

Consulta la **Guía de Desarrollo** para SDLC, caché y lanzamientos:

- [Guía de Desarrollo](./docs/es/GUIA_DE_DESARROLLO.md)

## Docs

- [Núcleo](./packages/quojs/docs/es/core.md) (o documentación del paquete en `packages/quojs/`)
- [Integración con React](./packages/quojs/docs/es/core.md)

## Contribuir

- Empieza aquí — [Guía de contribución](../../CONTRIBUTING.md)
- [Código de conducta](../../CODE_OF_CONDUCT.md)
- [Gobernanza](../../GOVERNANCE.md)
- [Mantenedores](../../MAINTAINERS.md)
- [Seguridad](../../SECURITY.md)
- [Marcas](../../TRADEMARKS.md)

## Estado

Quo.js está en **fase RC**. Las APIs son estables, los tipos son estrictos y se usa en producción.
Se agradecen comentarios y PRs.

Hecho con ❤️ en <img src="./assets/mx.svg" alt="Mexico flag" width="16" height="16" />, para el 🌎.
