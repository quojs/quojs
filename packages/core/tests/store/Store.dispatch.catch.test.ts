import { describe, it, expect, vi, afterEach } from "vitest";

import { createStore, typedActions } from "../../src";

// Covers the outer try/catch in Store.dispatch by forcing devtools.send to throw.

describe("Store.dispatch catch block", () => {
  const origWin: any = (globalThis as any).window;
  afterEach(() => {
    (globalThis as any).window = origWin;
  });

  it("catches unexpected errors thrown by devtools.send and does not reject", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock Redux DevTools so that .send throws at the end of the dispatch loop
    (globalThis as any).window = {
      __REDUX_DEVTOOLS_EXTENSION__: {
        connect: () => ({
          init: vi.fn(),
          subscribe: vi.fn(),
          send: () => {
            throw new Error("devtools boom");
          },
        }),
      },
    } as any;

    const store = createStore({
    name: "test",
      reducer: {
        counter: {
          actions: [["counter", "inc"]] as any,
          state: { value: 0 },
          reducer: (s = { value: 0 }, a: any) =>
            a.event === "inc" ? { value: s.value + 1 } : s,
        },
      },
      middleware: [],
    });

    // Dispatch resolves (outer catch prevents rejection)
    await expect(store.dispatch("counter", "inc", undefined as any)).resolves.toBeUndefined();

    // State update occurred before devtools threw
    expect((store.getState() as any).counter.value).toBe(1);

    // Outer catch logged the error message
    expect(errSpy).toHaveBeenCalled();
    const sawMsg = errSpy.mock.calls.some((args) =>
      String(args[0]).includes("dispatch queue error"),
    );
    expect(sawMsg).toBe(true);

    // Finally block cleared isProcessingQueue, so subsequent dispatch still works
    await expect(store.dispatch("counter", "inc", undefined as any)).resolves.toBeUndefined();
    expect((store.getState() as any).counter.value).toBe(2);

    errSpy.mockRestore();
  });
});
