# Quo.js vs Redux Toolkit — React Vite Demo

> [Version en español](./README.es.md)

A small, focused React demo that hosts **both state implementations** side by side:

- **Quo.js** (custom Redux-like store with channels/events and fine‑grained subscriptions)
- **Redux Toolkit (RTK)** (standard Redux stack with `createSlice` + `createAsyncThunk`)

Use this project to run the UI locally and reproduce the **[React Profiler Analysis](./redux-quojs-profiler.md)**.

## Project layout

Both implementations expose the same UI and user flows (list, add, update, delete). The comparison shell mounts either page under separate routes so you can profile them in isolation.

- Route **/quojs** → Quo.js page wrapped in its own provider
- Route **/rtk** → RTK page wrapped in its own provider

The app is a **Vite** project that lives inside a **Rush** monorepo.

## Prerequisites

- **Node.js**: LTS recommended (e.g. 18.x).  
- **pnpm**: used by Rush for dependency management  
  ```bash
  npm i -g pnpm
  ```
- **Rush** (global CLI)
  ```bash
  npm i -g @microsoft/rush
  ```

## Clone & bootstrap

Clone this repo, and then navigate to the repo folder and issue the following terminal commands:

```bash

# Install all dependencies for the monorepo
rush install          # or: rush update

# (optional) Build everything
rush build
```

## Run the app (dev)

The comparison shell is a Vite app that routes to each implementation.

```bash
cd examples/quojs-in-react
rushx dev             # same as: pnpm dev
```

Open **http://localhost:5173** (or whatever Vite prints).

- Visit **/quojs** for the Quo.js page.
- Visit **/rtk** for the RTK page.

## Production build & preview (for stable profiling numbers)

Dev builds include extra checks (e.g., React Strict Mode effects and development transforms). For more stable timing, profile a **production** build:

```bash
cd examples/quojs-in-react
rushx build           # Vite production build
rushx preview         # Serves the production build
# default: http://localhost:4173
```

Then open `/quojs` or `/rtk` on the preview server.

## Using the React Profiler

1. **Install React DevTools** in your browser (Chrome/Edge/Firefox).  
2. Open your app, then open DevTools → **Profiler** tab.
3. In the Profiler toolbar:
   - Turn on **“Record profiling”**.
   - Hit `Refresh` so the profiler also captures the fetching stage
   - (Optional) Enable *“Record why each component rendered”* for richer insights.
4. Interact with the page to capture specific frames:
   - **Add Todo**: 
      1. __paste__ the word `test` into the Todo's Title input (we do this to prevent Frame-spamming when typing the word letter by letter)
      2. __paste__ the word `test` into the Todo's Category input (same as above)
      3. click **Add** after entering title/category.
   - **Toggle statuses**: once the new todo has been added, toggle each todo status (12 in total)
5. Inspect the flamegraph for each commit:
   - How many frames did you capture? (expect 18)
   - Which components re-rendered?
   - How long did the commit take?
   - How much of the tree was invalidated?

### Reproducing the documented frames

| What to capture | Route | Interaction |
|---|---|---|
| Frame 1 (initial render) | `/quojs` and `/rtk` | Start recording → Reload page |
| Frame 39/31 (add todo) | `/quojs` and `/rtk` | Type a title/category → **Add** |
| Frame 40/32 (toggle id=1) | `/quojs` and `/rtk` | Toggle status for item id **1** |
| Frame 41/33 (toggle id=2) | `/quojs` and `/rtk` | Toggle status for item id **2** |
| Frame 42/34 (toggle id=3) | `/quojs` and `/rtk` | Toggle status for item id **3** |

> Quo.js should show **isolated item re-renders** for the toggle steps, whereas RTK typically re-renders the **entire list** when the backing collection reference changes.

### Exporting profiles
In the Profiler, click **Save profile…** to export a `.json` you can keep for reproducibility.

## Data source

The fetch example uses MSW with mock data from `https://jsonplaceholder.typicode.com/todos?id=0` by default. You can change this in the actions/hooks if needed. Network access is not required by default and it must be allowed by your browser / dev proxy if you disable MSW.

## License

This demo is for comparison/documentation purposes. See repository root for license details.