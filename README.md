# Quo.js

![Quo.js logo](./assets/logo.svg)

Declarative • Ultra‑simple • Expressive: Quo.js is a modern state management library inspired by
Redux—but without the Redux Toolkit baggage. It brings back the simplicity and power of the
original Redux pattern while introducing **channels + events**, **native async middleware &
effects**, **granular subscriptions**, and **React hooks ready for Suspense and Concurrent
Mode**.

> [Spanish version](./README.es.md)

## Packages

- **[@quojs/core](./packages/quojs/README.md)** — Core store, reducers, middleware, effects
  (framework‑agnostic)
- **[@quojs/react](./packages/quojs-react/README.md)** — React provider & hooks
  (Suspense/Concurrent‑ready)
- **[examples/](./examples/)** — runnable samples

## Why Quo.js?

- 🗪 **Channel + Event model** — actions are `{ channel, event, payload }`; reducers subscribe at
  exactly the granularity you need.
- 🎯 **Fine‑grained subscriptions** — subscribe to atomic props to avoid
  \*\*[unnecessary renders](./examples/quojs-in-react/redux-quojs-profiler.md).
- 🧭 **TypeScript‑first** — ergonomic typings and predictable APIs.
- ⚡ **Built‑in middleware & effects** — async by default; no thunk/saga boilerplate.
- 🧩 **Dynamic reducers** — add/remove reducers at runtime.
- 📌 **Lightweight** — small, focused surface.
- 🧭 **Framework‑agnostic** — React today; more adapters welcome.

## How does **Quo.js** compare to other state containers?

When evaluating a state manager, raw API surface isn’t the whole story. What matters most is the
philosophy behind it, the trade-offs it makes, and how those choices affect **developer
experience, performance, and scalability** in real projects.

Quo.js was designed as a pragmatic evolution of Redux’s original ideas: explicit events,
predictable state transitions, strong TypeScript typing, and built-in async/effect handling —
without the hidden “magic” or boilerplate of other ecosystems.

To help you decide if Quo.js is the right fit, we’ve prepared direct comparisons against other
popular libraries. Each document explores:

- **Conceptual model** (how state flows through actions, reducers, and effects)
- **Developer ergonomics** (boilerplate, typing, debugging tools)
- **Performance** (granularity of subscriptions, rendering efficiency)
- **Async & effects** (how workflows and side-effects are expressed)
- **React integration** (selectors, Suspense, concurrent mode readiness)

👉 Check out the comparisons here:

- [Quo.js vs Redux](./docs/en/comparison/redux-comparison.md) and the [example project](./examples/quojs-in-react/README.md)
- [Quo.js vs MobX](./docs/en/comparison/mobx-comparison.md)
_(and more to come)_

## Quick Start (Monorepo)

```bash
npm i -g @microsoft/rush
rush install
rush build
rush test
```

Focused builds:

```bash
rush build --to @quojs/core
rush build --from @quojs/react
```

See the **Developer Guide** for SDLC, caching, and releases:

- [Developer Guide](./docs/en/DEVELOPER_GUIDE.md)

## Docs

- [Core](./packages/quojs/docs/es/core.md) (o documentación del paquete en `packages/quojs/`)
- [React Bindings](./packages/quojs/docs/es/core.md)

## Contributing

- Start here — [Contributing guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Governance](./GOVERNANCE.md)
- [Maintainers](./MAINTAINERS.md)
- [Security](./SECURITY.md)
- [Trademarks](./TRADEMARKS.md)

## Status

Quo.js is in **RC stage**. APIs are stable, types are strict, and it’s used in production. Feedback
and PRs welcome.

Made in <img src="./assets/mx.svg" alt="Mexico flag" width="16" height="16" />, for the world.
