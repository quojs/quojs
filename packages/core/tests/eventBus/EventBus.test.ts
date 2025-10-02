import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus } from "../../src/eventBus/EventBus";

type TestActionMap = {
  user: {
    created: { id: string; name: string };
    updated: { id: string; changes: Partial<{ name: string; email: string }> };
  };
  post: {
    published: { id: string; title: string; content: string };
    deleted: { id: string };
  };
};

describe("EventBus", () => {
  let bus: EventBus<TestActionMap>;

  beforeEach(() => {
    bus = new EventBus<TestActionMap>();
  });

  it("should initialize with empty handlers", () => {
    const b = new EventBus<TestActionMap>();

    expect(b).toBeInstanceOf(EventBus);
    // @ts-expect-error tests - accessing private property for test
    expect(b.handlers.size).toBe(0);
  });

  describe("on()", () => {
    it("registers a handler and returns unsubscribe", () => {
      const handler = vi.fn();
      const unsubscribe = bus.on("user", "created", handler);

      // @ts-expect-error tests - private for test
      const set = bus.handlers.get("user")?.get("created");
      expect(set instanceof Set).toBe(true);
      expect(set?.has(handler)).toBe(true);
      expect(unsubscribe).toBeTypeOf("function");

      unsubscribe();
      // @ts-expect-error tests tests
      const after = bus.handlers.get("user")?.get("created");
      expect(after?.size ?? 0).toBe(0);
    });

    it("registers multiple handlers preserving order (in Set)", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on("user", "created", handler1);
      bus.on("user", "created", handler2);

      // @ts-expect-error tests
      const set = bus.handlers.get("user")?.get("created");
      // Iteration order of Set is insertion order
      expect(Array.from(set)).toEqual([handler1, handler2]);
    });
  });

  describe("off()", () => {
    it("removes a specific handler", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on("user", "created", handler1);
      bus.on("user", "created", handler2);
      bus.off("user", "created", handler1);

      // @ts-expect-error tests
      const set = bus.handlers.get("user")?.get("created");
      expect(set.has(handler1)).toBe(false);
      expect(set.has(handler2)).toBe(true);
    });

    it("no-ops if channel/event missing", () => {
      const handler = vi.fn();
      // @ts-expect-error tests deliberately wrong
      expect(() => bus.off("nonexistent", "event", handler)).not.toThrow();
      bus.on("user", "created", handler);
      // @ts-expect-error tests deliberately wrong
      expect(() => bus.off("user", "nonexistent", handler)).not.toThrow();
    });
  });

  describe("emit()", () => {
    it("does not throw for missing channel/event", () => {
      // @ts-expect-error tests
      expect(() => bus.emit("missing", "event", {})).not.toThrow();
      bus.on("user", "created", vi.fn());
      // @ts-expect-error tests
      expect(() => bus.emit("user", "other", {})).not.toThrow();
    });

    it("calls handlers in registration order", () => {
      const calls: string[] = [];
      const h1 = () => calls.push("h1");
      const h2 = () => calls.push("h2");

      bus.on("user", "created", h1);
      bus.on("user", "created", h2);
      bus.emit("user", "created", { id: "1", name: "A" });

      expect(calls).toEqual(["h1", "h2"]);
    });

    it("continues other handlers if one throws", () => {
      const h1 = vi.fn(() => {
        throw new Error("err");
      });
      const h2 = vi.fn();
      const err = vi.spyOn(console, "error").mockImplementation(() => {});

      bus.on("user", "created", h1);
      bus.on("user", "created", h2);
      bus.emit("user", "created", { id: "x", name: "y" });

      expect(h2).toHaveBeenCalled();
      expect(err).toHaveBeenCalled();
      err.mockRestore();
    });

    it("iterates over a snapshot so offs/on during emit don't affect current tick", () => {
      const h1 = vi.fn();
      const h2 = vi.fn(() => {
        bus.off("user", "created", h1);
        bus.on("user", "created", vi.fn());
      });

      bus.on("user", "created", h1);
      bus.on("user", "created", h2);
      bus.emit("user", "created", { id: "1", name: "Test" });

      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);

      // second emit should not call h1 again
      bus.emit("user", "created", { id: "2", name: "Test2" });
      expect(h1).toHaveBeenCalledTimes(1);
    });
  });

  describe("edge cases", () => {
    it("handles empty action maps", () => {
      const empty = new EventBus<Record<string, never>>();
      // @ts-expect-error tests
      expect(() => empty.emit("any", "event", {})).not.toThrow();
    });
  });

  describe("integration", () => {
    it("works across channels", () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      const h3 = vi.fn();

      const unsub1 = bus.on("user", "created", h1);
      bus.on("user", "created", h2);
      const unsub3 = bus.on("post", "published", h3);

      const p1 = { id: "1", name: "Alice" };
      bus.emit("user", "created", p1);
      expect(h1).toHaveBeenCalledWith(p1);
      expect(h2).toHaveBeenCalledWith(p1);
      expect(h3).not.toHaveBeenCalled();

      unsub1();
      const p2 = { id: "2", name: "Bob" };
      bus.emit("user", "created", p2);
      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledWith(p2);

      const post = { id: "p1", title: "Hello", content: "World" };
      bus.emit("post", "published", post);
      expect(h3).toHaveBeenCalledWith(post);

      unsub3();
      bus.emit("post", "published", { id: "p2", title: "Bye", content: "!" });
      expect(h3).toHaveBeenCalledTimes(1);
    });
  });
});

describe("EventBus error isolation", () => {
  it("continues after a handler throws and logs the error", () => {
    const bus = new EventBus<any>();
    const spy = vi.fn();
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    bus.on("c" as any, "e" as any, () => {
      throw new Error("boom");
    });
    bus.on("c" as any, "e" as any, () => spy());

    bus.emit("c" as any, "e" as any, 123);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(err).toHaveBeenCalled();

    err.mockRestore();
  });
});

describe("EventBus cleanup branches", () => {
  it("deletes empty event set after last unsubscribe and emit is a no-op", () => {
    const bus = new EventBus<any>();
    const h = vi.fn();
    
    const unsub = bus.on("user" as any, "created" as any, h);
    unsub();

    // @ts-expect-error tests private for test
    expect(bus.handlers.get("user")?.get("created")).toBeUndefined();

    // should not throw or call anything
    expect(() => bus.emit("user" as any, "created" as any, {})).not.toThrow();

    // clear bus (simulate Store tearing down)
    bus.clear();

    expect(h).toHaveBeenCalledTimes(0);
  });
});
