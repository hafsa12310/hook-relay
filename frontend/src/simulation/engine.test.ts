import { describe, expect, it } from "vitest";
import { addDelivery, initial, step } from "./engine";
import { scenarios } from "./scenarios";
import { terminal } from "../api/types";
const finish = (scenario: Parameters<typeof initial>[0]) => {
  let s = initial(scenario);
  for (let i = 0; i < 400; i++) {
    s = step(s);
    if (s.records.length && s.records.every((d) => terminal(d.status))) break;
  }
  return s;
};
describe("deterministic delivery model", () => {
  it.each(scenarios.map((s) => [s.id] as const))(
    "%s finishes predictably",
    (id) => {
      const a = finish(id);
      expect(a).toEqual(finish(id));
      expect(a.records.every((d) => terminal(d.status))).toBe(true);
    },
  );
  it("acceptance is pending, not delivery", () => {
    const s = addDelivery(initial(), { type: "order.created" });
    expect(s.records[0].status).toBe("PENDING");
    expect(s.requests).toBe(0);
  });
  it("rate waiting consumes no attempt", () => {
    let s = initial("rate", 1, 10);
    for (let i = 0; i < 3; i++) s = step(s);
    const waiting = s.records.filter((d) => d.status === "WAITING");
    expect(waiting.length).toBe(9);
    expect(waiting.every((d) => d.attemptCount === 0)).toBe(true);
  });
  it("Redis unavailable defers instead of bypassing", () => {
    let s = initial("redis");
    for (let i = 0; i < 4; i++) s = step(s);
    expect(s.records[0].waitReason).toBe("REDIS_UNAVAILABLE");
    expect(s.records[0].attemptCount).toBe(0);
    expect(s.requests).toBe(0);
  });
  it("crash after receiver duplicates request but not the action", () => {
    const s = finish("crash-after");
    expect(s.requests).toBe(2);
    expect(s.actions).toHaveLength(1);
    expect(s.duplicates).toBe(1);
    expect(s.records[0].attemptCount).toBe(2);
  });
  it("crash before sending still consumes a claim", () => {
    const s = finish("crash-before");
    expect(s.requests).toBe(1);
    expect(s.records[0].attemptCount).toBe(2);
    expect(s.time).toBeGreaterThan(30);
  });
  it("Kafka outage preserves acceptance without sending", () => {
    let s = initial("kafka");
    for (let i = 0; i < 10; i++) s = step(s);
    expect(s.records[0].status).toBe("PENDING");
    expect(s.records[0].phase).toBe("outbox");
    expect(s.requests).toBe(0);
  });
  it("exhausts exactly five attempts", () => {
    const s = finish("exhausted");
    expect(s.records[0].status).toBe("DEAD");
    expect(s.requests).toBe(5);
  });
  it("rolling window removes individual old permissions", () => {
    const s = initial();
    s.time = 8;
    s.permissions = [1, 5, 8];
    s.window = 5;
    expect(step(s).permissions).toEqual([5, 8]);
  });
  it("reset has no retained records or duplicate state", () => {
    const s = finish("crash-after");
    const reset = initial(s.scenario, s.limit, s.window);
    expect(reset.records).toEqual([]);
    expect(reset.history).toEqual({});
    expect(reset.time).toBe(0);
    expect(reset.actions).toEqual([]);
  });
});
