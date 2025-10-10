![Logo de Quo.js](https://github.com/quojs/quojs/blob/main/assets/logo.svg)

# Quo.js El estado de las cosas, re-escrito.

**@quojs/core** es una biblioteca moderna de gestión de estado, **agnóstica de framework** e inspirada en Redux — pero sin el peso de Toolkit. Introduce **canales + eventos**, **middleware y effects asíncronos nativos**, y **suscripciones atómicas**.

> Funciona en **navegadores y en Node**. No asume DOM. Adecuado para Node 18+, Bun y Deno (con ESM).

## Instalación

```bash
npm i @quojs/core
```

## ¿Por qué Quo.js?

- 🔗 **Modelo Canal + Evento** — `{ channel, event, payload }` para modularidad natural
- 🎯 **suscripciones atómicas** — seguimiento atómico de cambios
- ⚡ **Middleware y effects asíncronos** — integrados, sin _thunk/saga_
- 🛡 **TypeScript primero** — tipos ergonómicos y predecibles
- 🧩 **Reductores dinámicos** — añade/quita reduceres en tiempo de ejecución
- 🧭 **Agnóstico de framework** — úsalo con `@quojs/react` o sin UI en Node

## Docs

- [Conceptos clave](./docs/es/core.md): acciones, reducers, _middleware_, _effects_

## Enlaces

- [Monorepo](../../)
- [Gobernanza](../../GOVERNANCE.es.md)
- [Código de conducta](../../CODE_OF_CONDUCT.es.md)
- [Guía de Contribución](../../CONTRIBUTING.es.md)

## Estado

**Fase RC**. APIs estables (potencialmente cambiantes), tipos estrictos, uso en producción. Se agradecen comentarios y PRs.

Hecho con ❤️ en <img src="../../assets/mx.svg" alt="Mexico flag" width="16" height="16" /> para
el 🌎.
