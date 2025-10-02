// file: packages\quojs\src\store\Store.queueOrdering.test.ts
import { describe, it, expect } from "vitest";
import { createStore } from "../../src";

describe("Store dispatch queue ordering", () => {
  it("processes enqueued actions in order with effects chaining", async () => {
    const s = createStore({
    name: "test",
      reducer: {
        counter: {
          actions: [
            ["counter", "inc"],
            ["counter", "add"],
          ],
          state: { value: 0 },
          reducer: (st = { value: 0 }, a: any) => {
            switch (a.event) {
              case "inc":
                return { value: st.value + 1 };
              case "add":
                return { value: st.value + a.payload.value };
              default:
                return st;
            }
          },
        },
      },
      middleware: [],
    });

    // On first inc, enqueue add 10; on the add, enqueue inc once more
    let firstInc = true;
    s.onEffect("counter", "inc", async (_p, _g, dispatch) => {
      if (firstInc) {
        firstInc = false;
        await dispatch("counter", "add", { value: 10 });
      }
    });
    s.onEffect("counter", "add", async (_p, _g, dispatch) => {
      await dispatch("counter", "inc", undefined);
    });

    await Promise.all([
      s.dispatch("counter", "inc", undefined),
      s.dispatch("counter", "inc", undefined),
    ]);

    // Order should be: inc (1) -> add(10) -> inc (from add) -> inc (second top-level)
    expect(s.getState().counter.value).toBe(1 + 10 + 1 + 1);
  });
});
