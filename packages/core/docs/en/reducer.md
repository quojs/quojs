# Reducer

> [Version en español](../es/reducer.md)

A **Reducer** in Quo.js is a pure function that updates state based on a _channel_ and _event_ (not
a plain string action).

## Why?

- Prevents action collision across domains
- Makes reducers more focused
- Allows for reducers to tune into the actions of others
- Type-safe, easy to compose

## Example

```ts
import { Reducer } from "quojs";

const counterReducer = new Reducer((count, action) => {
  switch (action.event) {
    case "add":
      return { value: count.value + 1 };
    case "sub":
      return { value: count.value - 1 };
    case "set":
      return { value: action.payload };

    default:
      return count;
  }
});
```

> **You do NOT have to do this**, reducers are automagically wrapped for you to keep typing and API consistent.

## Reducer API

- `reduce(state, action)`: Applies the action and returns the next state.

> see the [Reducer.ts](../../src/reducer/Reducer.ts) class.

<- Back to [Quo.js core docs](./core.md)
