# Quo.js

![Quo.js logo](./assets/logo.svg)

Declarativa • Ultrasencilla • eXpressiva: Quo.js es una librería moderna de gestión de estado inspirada en Redux, pero sin el “equipaje” de
Redux Toolkit. Recupera la simplicidad y la potencia del patrón Redux original, mientras
introduce **canales + eventos**, **middleware y efectos asíncronos nativos**, **suscripciones granulares**
y **hooks para React preparados para Suspense y Concurrent Mode**.

## Paquetes

- **[@quojs/core](./packages/core/README.es.md)** — *Store* núcleo, *reducers*, *middleware*, *effects*
  (agnóstico del *framework*)
- **[@quojs/react](./packages/react/README.es.md)** — *Provider* y *hooks* para React
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

👉 Revisa las comparaciones [aquí](https://quojs.dev).

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

### Núcleo

- [Desarrollador](https://docs.quojs.dev/es/v0/core): guía de inicio rápido, tutorial, gists, etc.
- [TypeDoc](./packages/core/docs/es/README.md): una documentación más técnica extraída utilizando TypeDoc.

### Bindings para React

- [Desarrollador](https://docs.quojs.dev/es/v0/react): guía de inicio rápido, tutorial, gists, etc.
- [TypeDoc](./packages/react/docs/es/README.md): una documentación más técnica extraída utilizando TypeDoc.

## Contribuir

- Empieza aquí — [Guía de contribución](./CONTRIBUTING.es.md)
- [Código de conducta](./CODE_OF_CONDUCT.es.md)
- [Gobernanza](./GOVERNANCE.es.md)
- [Mantenedores](./MAINTAINERS.es.md)
- [Seguridad](./SECURITY.es.md)
- [Marcas](./TRADEMARKS.es.md)

## Estado

Quo.js está en **fase RC**. Las APIs son estables, los tipos son estrictos y se usa en producción.
Se agradecen comentarios y PRs.

Hecho con ❤️ en <img src="./assets/mx.svg" alt="Mexico flag" width="16" height="16" />, para el 🌎.
