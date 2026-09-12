import { describe, expect, it } from "vitest";
import { initial, nextEvent, step, type SimState } from "./engine";
import { storyView } from "./storyView";
import { scenarios } from "./scenarios";
import { scenarioStories } from "../content/scenarioStories";
import { terminal } from "../api/types";
function at(s: SimState, time: number) {
  while (s.time < time) s = step(s);
  return s;
}
describe("animated story follows the real practice state", () => {
  it.each(scenarios.map((s) => [s.id] as const))(
    "%s has a concrete story and a correct final scene",
    (id) => {
      let s = initial(id);
      let events = 0;
      while (
        (!s.records.length || s.records.some((d) => !terminal(d.status))) &&
        events++ < 150
      )
        s = nextEvent(s);
      expect(scenarioStories[id].setup.length).toBeGreaterThan(20);
      expect(s.records.every((d) => terminal(d.status))).toBe(true);
      expect(storyView(s, s.records[0]).place).toBe(
        id === "exhausted" ? "wait" : "receipt",
      );
    },
  );
  it("does not show receipt or warehouse activity merely for acceptance", () => {
    const s = step(initial());
    const view = storyView(s, s.records[0]);
    expect(view.place).toBe("saved");
    expect(view.warehouseRecorded).toBe(false);
    expect(s.requests).toBe(0);
  });
  it("crash before HTTP stays at the sender with a countdown", () => {
    const s = at(initial("crash-before"), 4);
    const v = storyView(s, s.records[0]);
    expect(v.crashed).toBe(true);
    expect(v.to).toBe("sender");
    expect(v.countdown).toBe(29);
    expect(s.requests).toBe(0);
  });
  it("crash after HTTP shows a recorded order before success is saved", () => {
    const s = at(initial("crash-after"), 4);
    const v = storyView(s, s.records[0]);
    expect(v.warehouseRecorded).toBe(true);
    expect(v.to).toBe("warehouse");
    expect(v.crashed).toBe(true);
    expect(s.records[0].status).toBe("PROCESSING");
  });
  it("the repeated request does not add a second order", () => {
    let s = at(initial("crash-after"), 4);
    while (!terminal(s.records[0].status)) s = nextEvent(s);
    expect(storyView(s, s.records[0]).duplicate).toBe(true);
    expect(s.requests).toBe(2);
    expect(s.actions).toHaveLength(1);
  });
  it("a waiting burst order is held at the permission gate without a try", () => {
    const s = at(initial("rate"), 3);
    const d = s.records.find((d) => d.status === "WAITING")!;
    expect(storyView(s, d).place).toBe("gate");
    expect(d.attemptCount).toBe(0);
  });
  it("next event skips quiet lease time but preserves recovery and request counts", () => {
    const s = at(initial("crash-before"), 4);
    const next = nextEvent(s);
    expect(next.time).toBe(33);
    expect(next.records[0].phase).toBe("outbox");
    expect(next.records[0].attemptCount).toBe(1);
    expect(next.requests).toBe(0);
    expect(storyView(next, next.records[0]).returning).toBe(true);
    expect(next).toEqual(at(s, 33));
  });
  it("reset clears the scene, counts and pending message", () => {
    const reset = initial("crash-after");
    expect(storyView(reset).place).toBe("shop");
    expect(reset.actions).toEqual([]);
    expect(reset.requests).toBe(0);
    expect(reset.time).toBe(0);
  });
});
