// file: packages\quojs\src\store\Store.reducer-throw.test.ts
import { describe, it, expect, vi } from "vitest";
import { createStore, typedActions } from "../../src";

describe("Store effect error handling", () => {
  it("swallows effect errors and logs", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const store = createStore({
    name: "test",
      reducer: {
        counter: {
          actions: [["counter", "inc"]],
          state: { value: 0 },
          reducer: (s: any, a: any) => (a.event === "inc" ? { value: s.value + 1 } : s),
        },
      },
      middleware: [],
    });

    store.registerEffect((a: any) => {
      if (a.event === "inc") throw new Error("boom");
    });
    await expect(store.dispatch("counter", "inc", undefined)).resolves.toBeUndefined();
    expect(err).toHaveBeenCalled(); // effect error logged
    err.mockRestore();
  });
});
