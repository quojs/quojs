import { describe, it, expect, vi, beforeEach } from "vitest";
import { LooseEventBus } from "../../src/eventBus/LooseEventBus";

describe("LooseEventBus", () => {
  let bus: LooseEventBus<string, string, any>;

  beforeEach(() => {
    bus = new LooseEventBus();
  });

  it("initializes with empty handlers", () => {
    expect(bus).toBeInstanceOf(LooseEventBus);
    // @ts-expect-error tests
    expect(bus.handlers.size).toBe(0);
  });

  describe("on()", () => {
    it("registers a handler for a channel/event", () => {
      const handler = vi.fn();
      const unsubscribe = bus.on("user", "created", handler);
      
      // @ts-expect-error tests
      expect(bus.handlers.get("user")?.get("created")).toEqual([handler]);
      expect(unsubscribe).toBeTypeOf("function");
    });

    it("registers multiple handlers for same event", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on("user", "created", handler1);
      bus.on("user", "created", handler2);

      // @ts-expect-error tests
      expect(bus.handlers.get("user")?.get("created")).toEqual([handler1, handler2]);
    });

    it("unsubscribe works", () => {
      const handler = vi.fn();
      const unsub = bus.on("user", "created", handler);

      unsub();

      // Behavior assertion: no calls after unsubscribe
      bus.emit("user", "created", { any: 1 });
      expect(handler).not.toHaveBeenCalled();

      // Structural (robust): tolerate key deletion or empty list
      // @ts-expect-error tests - testing internal map
      const maybeList = bus.handlers.get("user")?.get("created");
      expect(Array.isArray(maybeList) ? maybeList.length : 0).toBe(0);

      // AFTER — channel map is deleted once last handler is removed
      // @ts-expect-error tests - private for test
      expect(bus.handlers.get("user")).toBeUndefined();
    });

    it("keeps different channel/event combos separate", () => {
      const userHandler = vi.fn();
      const postHandler = vi.fn();

      bus.on("user", "created", userHandler);
      bus.on("post", "published", postHandler);

      // @ts-expect-error tests
      expect(bus.handlers.get("user")?.get("created")).toEqual([userHandler]);
      // @ts-expect-error tests
      expect(bus.handlers.get("post")?.get("published")).toEqual([postHandler]);
    });
  });

  describe("off()", () => {
    it("removes a specific handler", () => {
      const h1 = vi.fn();
      const h2 = vi.fn();

      bus.on("user", "created", h1);
      bus.on("user", "created", h2);
      bus.off("user", "created", h1);

      // @ts-expect-error tests
      expect(bus.handlers.get("user")?.get("created")).toEqual([h2]);
    });

    it("no-ops on missing channel/event/handler", () => {
      const h = vi.fn();
      expect(() => bus.off("no", "event", h)).not.toThrow();

      bus.on("user", "created", h);
      expect(() => bus.off("user", "none", h)).not.toThrow();

      const other = vi.fn();
      expect(() => bus.off("user", "created", other)).not.toThrow();

      // @ts-expect-error tests
      expect(bus.handlers.get("user")?.get("created")).toEqual([h]);
    });
  });

  describe("emit()", () => {
    it("calls all handlers with payload", () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      const payload = { id: 1 };
      
      bus.on("user", "created", h1);
      bus.on("user", "created", h2);
      bus.emit("user", "created", payload);

      expect(h1).toHaveBeenCalledWith(payload);
      expect(h2).toHaveBeenCalledWith(payload);
    });

    it("filters by channel/event", () => {
      const h = vi.fn();

      bus.on("user", "created", h);
      bus.emit("user", "updated", {});
      bus.emit("post", "created", {});

      expect(h).not.toHaveBeenCalled();
    });

    it("handler can unsubscribe itself without breaking others", () => {
      const h1 = vi.fn(() => bus.off("user", "created", h1));
      const h2 = vi.fn();

      bus.on("user", "created", h1);
      bus.on("user", "created", h2);
      bus.emit("user", "created", {});

      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);

      bus.emit("user", "created", {});
      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(2);
    });

    it("continues if one throws", () => {
      const h1 = vi.fn(() => {
        throw new Error("x");
      });

      const h2 = vi.fn();
      const err = vi.spyOn(console, "error").mockImplementation(() => {});

      bus.on("user", "created", h1);
      bus.on("user", "created", h2);
      bus.emit("user", "created", {});

      expect(h2).toHaveBeenCalled();
      expect(err).toHaveBeenCalled();

      err.mockRestore();
    });

    it("works with primitives and undefined", () => {
      const h = vi.fn();

      bus.on("counter", "inc", h);
      bus.emit("counter", "inc", 42);
      expect(h).toHaveBeenCalledWith(42);

      const h2 = vi.fn();

      bus.on("app", "start", h2);
      bus.emit("app", "start", undefined as any);
      expect(h2).toHaveBeenCalledWith(undefined);
    });
  });
});

describe("LooseEventBus error isolation", () => {
  it("continues after a handler throws and logs the error", () => {
    const bus = new LooseEventBus<string, string, number>();
    const spy = vi.fn();
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    bus.on("c", "e", () => {
      throw new Error("boom");
    });

    bus.on("c", "e", () => spy());

    bus.emit("c", "e", 1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(err).toHaveBeenCalled();

    err.mockRestore();
  });
});

describe("LooseEventBus - wildcard/pattern behavior", () => {
  let bus: LooseEventBus<string, string, any>;

  beforeEach(() => {
    bus = new LooseEventBus();
  });

  it("matches '*' (one segment) but not deeper", () => {
    const hit = vi.fn();

    bus.on("todo", "data.*", hit);
    bus.emit("todo", "data.a", 1);
    bus.emit("todo", "data.a.title", 2);
    bus.emit("todo", "data", 3);

    expect(hit).toHaveBeenCalledTimes(1);
    expect(hit).toHaveBeenCalledWith(1);
  });

  it("matches '**' for any tail depth, including empty", () => {
    const hit = vi.fn();

    bus.on("files", "path.**", hit);
    bus.emit("files", "path", 1);
    bus.emit("files", "path.a", 2);
    bus.emit("files", "path.a.b.c", 3);

    expect(hit).toHaveBeenCalledTimes(3);
    expect(hit.mock.calls.map(([p]) => p)).toEqual([1, 2, 3]);
  });

  it("handles middle '**' (e.g. 'a.**.c') across zero-or-more segments", () => {
    const hit = vi.fn();

    bus.on("x", "a.**.c", hit);
    bus.emit("x", "a.c", 1);
    bus.emit("x", "a.b.c", 2);
    bus.emit("x", "a.b.d.c", 3);
    bus.emit("x", "a", 4);
    bus.emit("x", "a.b", 5);
    bus.emit("x", "a.c.d", 6);

    expect(hit).toHaveBeenCalledTimes(3);
    expect(hit.mock.calls.map(([p]) => p)).toEqual([1, 2, 3]);
  });

  it("collapses consecutive '**' and still matches correctly", () => {
    const hit = vi.fn();

    bus.on("c", "a.**.**.b", hit);
    bus.emit("c", "a.b", 1);
    bus.emit("c", "a.x.b", 2);
    bus.emit("c", "a.x.y.b", 3);
    bus.emit("c", "a.x", 4);

    expect(hit).toHaveBeenCalledTimes(3);
    expect(hit.mock.calls.map(([p]) => p)).toEqual([1, 2, 3]);
  });

  it("treats strings without '*' as exact (no pattern)", () => {
    const hit = vi.fn();

    bus.on("ev", "alpha.beta", hit);
    bus.emit("ev", "alpha.beta", 1);
    bus.emit("ev", "alpha.gamma", 2);
    bus.emit("ev", "alpha.beta.gamma", 3);

    expect(hit).toHaveBeenCalledTimes(1);
    expect(hit).toHaveBeenCalledWith(1);
  });

  it("normalizes leading dot in patterns ('.a.b' == 'a.b')", () => {
    const hit = vi.fn();

    bus.on("p", ".a.b", hit);
    bus.emit("p", "a.b", 42);

    expect(hit).toHaveBeenCalledTimes(1);
    expect(hit).toHaveBeenCalledWith(42);
  });

  it("pattern '**' matches any event including empty string; '*' does not", () => {
    const star = vi.fn();
    const dstar = vi.fn();
    
    bus.on("z", "*", star);
    bus.on("z", "**", dstar);
    bus.emit("z", "", 1);
    bus.emit("z", "seg", 2);
    bus.emit("z", "seg.more", 3);

    expect(star).toHaveBeenCalledTimes(1);
    expect(star).toHaveBeenCalledWith(2);
    expect(dstar).toHaveBeenCalledTimes(3);
    expect(dstar.mock.calls.map(([p]) => p)).toEqual([1, 2, 3]);
  });

  it("delivers exact first, then pattern, without duplicates", () => {
    const order: string[] = [];

    const handler = () => order.push("exact");
    const pat = () => order.push("pattern");

    bus.on("o", "data.a", handler);
    bus.on("o", "data.*", pat);
    bus.emit("o", "data.a", null);

    expect(order).toEqual(["exact", "pattern"]);
  });

  it("de-dupes if the same handler is registered twice (exact/pattern)", () => {
    const h = vi.fn();

    bus.on("o", "data.a", h);
    bus.on("o", "data.*", h);
    bus.emit("o", "data.a", 7);

    expect(h).toHaveBeenCalledTimes(1);
    expect(h).toHaveBeenCalledWith(7);
  });

  it("off() for patterns works (unsubscribe pattern handler)", () => {
    const h = vi.fn();
    const unsub = bus.on("p", "data.*", h);

    bus.emit("p", "data.x", 1);
    expect(h).toHaveBeenCalledTimes(1);

    unsub();
    bus.emit("p", "data.y", 2);
    expect(h).toHaveBeenCalledTimes(1);
  });

  it("pattern and exact co-exist across different channels", () => {
    const a = vi.fn();
    const b = vi.fn();

    bus.on("ch1", "evt.**", a);
    bus.on("ch2", "evt.*", b);

    bus.emit("ch1", "evt", 1);
    bus.emit("ch1", "evt.x.y", 2);
    bus.emit("ch2", "evt.x", 3);
    bus.emit("ch2", "evt.x.y", 4);

    expect(a.mock.calls.map(([p]) => p)).toEqual([1, 2]);
    expect(b.mock.calls.map(([p]) => p)).toEqual([3]);
  });

  it("handlers can unsubscribe themselves in a pattern list without breaking others", () => {
    const h1 = vi.fn(() => unsub());
    const h2 = vi.fn();
    const unsub = bus.on("self", "x.*", h1);

    bus.on("self", "x.*", h2);
    bus.emit("self", "x.a", 1);

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);

    bus.emit("self", "x.a", 2);
    expect(h2).toHaveBeenCalledTimes(2);
  });
});

describe("LooseEventBus extra pattern/normalization branches", () => {
  it("exact subscription normalizes leading dot ('.a.b' == 'a.b')", () => {
    const bus = new LooseEventBus<string, string, any>();
    const hit = vi.fn();

    bus.on("p", ".a.b" as any, hit);
    bus.emit("p", "a.b" as any, 1);

    expect(hit).toHaveBeenCalledWith(1);
  });

  it("de-dupes the same handler when two different patterns both match the same event", () => {
    const bus = new LooseEventBus<string, string, any>();
    const h = vi.fn();

    bus.on("c", "data.**", h);
    bus.on("c", "data.*.*", h);
    bus.emit("c", "data.a.b", 7);

    expect(h).toHaveBeenCalledTimes(1);
    expect(h).toHaveBeenCalledWith(7);
  });

  it("pattern exhausted before subject -> no match branch", () => {
    const bus = new LooseEventBus<string, string, any>();
    const h = vi.fn();

    bus.on("c", "a.b", h);
    bus.emit("c", "a.b.c", 1); // extra subject segment -> should NOT match exact
    
    expect(h).not.toHaveBeenCalled();
  });
});

describe("LooseEventBus.clear()", () => {
  it("removes all exact and pattern listeners and becomes inert", () => {
    const bus = new LooseEventBus<string, string, any>();
    const h = vi.fn();

    // Add one exact and one pattern subscription so both maps are non-empty
    bus.on("ch", "a.b", h); // exact
    bus.on("ch", "a.*", h); // pattern

    // Sanity: both internal maps should have something prior to clear
    // @ts-expect-error tests - private access for test
    expect(bus.handlers.size).toBe(1);
    // @ts-expect-error tests - private access for test
    expect(bus.patternHandlers.size).toBe(1);

    // Act
    bus.clear();

    // Assert: both maps fully cleared
    // @ts-expect-error tests - private access for test
    expect(bus.handlers.size).toBe(0);
    // @ts-expect-error tests - private access for test
    expect(bus.patternHandlers.size).toBe(0);

    // And emitting after clear should not call previous handlers
    bus.emit("ch", "a.b", 123 as any);
    expect(h).not.toHaveBeenCalled();
  });

  it("off() cleans event list and removes channel map when last handler is removed", () => {
    const bus = new LooseEventBus<string, string, any>();
    const h = vi.fn();
    bus.on("ch", "ev", h);

    // Use the public off() path (normalizes event key) rather than the returned unsub
    bus.off("ch", "ev", h);

    // @ts-expect-error tests - private for test
    expect(bus.handlers.get("ch")).toBeUndefined(); // triggers the map cleanup branches
  });

  it("pattern a.* does not match 'a' (subject shorter than pattern, no '**')", () => {
    const bus = new LooseEventBus<string, string, any>();
    const hit = vi.fn();
    bus.on("x", "a.*", hit);

    bus.emit("x", "a", 1); // should not match
    expect(hit).not.toHaveBeenCalled();
  });
});
