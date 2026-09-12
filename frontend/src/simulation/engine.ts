import type { Delivery, Observation, Payload } from "../api/types";
import { terminal } from "../api/types";
import type { Scenario } from "./scenarios";
export const epoch = Date.parse("2026-01-01T12:00:00Z");
export const iso = (t: number) => new Date(epoch + t * 1000).toISOString();
type Phase =
  "outbox" | "queue" | "http" | "finish" | "lease" | "scheduled" | "done";
export interface SimDelivery extends Delivery {
  phase: Phase;
  due: number;
  acted: boolean;
}
export interface SimState {
  time: number;
  scenario: Scenario;
  records: SimDelivery[];
  history: Record<string, Observation[]>;
  permissions: number[];
  limit: number;
  window: number;
  actions: string[];
  requests: number;
  duplicates: number;
  event: string;
  component: string;
  sequence: number;
}
export function initial(
  scenario: Scenario = "success",
  limit = 3,
  window = 8,
): SimState {
  return {
    time: 0,
    scenario,
    records: [],
    history: {},
    permissions: [],
    limit,
    window,
    actions: [],
    requests: 0,
    duplicates: 0,
    event: "Ready when you are. Start or step to save an event.",
    component: "api",
    sequence: 0,
  };
}
export function addDelivery(state: SimState, payload: Payload): SimState {
  const s = structuredClone(state);
  const id = `sim-${String(++s.sequence).padStart(4, "0")}`;
  s.records.unshift({
    id,
    eventType: payload.type,
    payload,
    destinationUrl: "http://localhost:4000/webhooks",
    status: "PENDING",
    attemptCount: 0,
    nextAttemptAt: null,
    waitReason: null,
    destinationStatus: null,
    errorMessage: null,
    processingExpiresAt: null,
    createdAt: iso(s.time),
    updatedAt: iso(s.time),
    phase: "outbox",
    due: s.time + 1,
    acted: false,
  });
  s.history[id] = [
    {
      at: iso(s.time),
      status: "PENDING",
      attempt: 0,
      message: "Delivery + outbox event saved in one PostgreSQL transaction.",
    },
  ];
  s.event = "Accepted: delivery and outbox saved atomically in PostgreSQL.";
  s.component = "postgres";
  return s;
}
export function step(state: SimState): SimState {
  let s = structuredClone(state);
  s.time++;
  s.permissions = s.permissions.filter((t) => t > s.time - s.window);
  if (!s.records.length) {
    for (let i = 0; i < (s.scenario === "rate" ? 10 : 1); i++)
      s = addDelivery(s, {
        type: "order.created",
        data: { orderId: `order-${101 + i}`, amount: 2500, currency: "PKR" },
      });
    return s;
  }
  s.event = "Virtual clock advancing; waiting for the next eligible event.";
  for (const d of s.records) {
    if (terminal(d.status) || d.due > s.time) continue;
    let message = "";
    if (d.phase === "outbox") {
      if (s.scenario === "kafka" && s.time < 12) {
        s.event =
          "Kafka is unavailable. The unpublished outbox record remains durable in PostgreSQL.";
        s.component = "outbox";
        continue;
      }
      d.phase = "queue";
      d.due = s.time + 1;
      s.component = "kafka";
      message =
        "Outbox publisher published the delivery ID to Kafka. The log retains messages after reads.";
    } else if (d.phase === "queue") {
      s.component = "redis";
      if (s.scenario === "redis" && s.time < 12) {
        d.status = "WAITING";
        d.waitReason = "REDIS_UNAVAILABLE";
        d.phase = "scheduled";
        d.due = s.time + 5;
        d.nextAttemptAt = iso(d.due);
        message =
          "Redis unavailable: deferred for five seconds; no attempt consumed.";
      } else if (s.permissions.length >= s.limit) {
        d.status = "WAITING";
        d.waitReason = "RATE_LIMIT";
        d.phase = "scheduled";
        d.due = s.permissions[0] + s.window + 1;
        d.nextAttemptAt = iso(d.due);
        message =
          "Rolling window full: waiting for permission, without incrementing attempts.";
      } else {
        s.permissions.push(s.time);
        d.status = "PROCESSING";
        d.attemptCount++;
        d.waitReason = null;
        d.nextAttemptAt = null;
        d.processingExpiresAt = iso(s.time + 30);
        d.phase = "http";
        d.due = s.time + 1;
        s.component = "worker";
        message =
          "Redis granted permission; worker claimed a 30-second lease and incremented the attempt count.";
      }
    } else if (d.phase === "http") {
      if (s.scenario === "crash-before" && d.attemptCount === 1) {
        d.phase = "lease";
        d.due = (Date.parse(d.processingExpiresAt!) - epoch) / 1000;
        message =
          "Worker disappeared before HTTP. The attempt is counted; recovery waits for lease expiry.";
        s.component = "recovery";
      } else {
        s.requests++;
        s.component = "receiver";
        if (
          s.scenario === "exhausted" ||
          (s.scenario === "temporary" && d.attemptCount === 1)
        ) {
          d.destinationStatus = 503;
          d.errorMessage = "Receiver returned HTTP 503";
          d.processingExpiresAt = null;
          if (d.attemptCount >= 5) {
            d.status = "DEAD";
            d.phase = "done";
            message = "Five attempts exhausted. Delivery is DEAD.";
          } else {
            d.status = "RETRY_SCHEDULED";
            d.phase = "scheduled";
            d.due = s.time + [10, 30, 60, 120][d.attemptCount - 1];
            d.nextAttemptAt = iso(d.due);
            message = `HTTP 503: retry scheduled after ${[10, 30, 60, 120][d.attemptCount - 1]} seconds.`;
          }
        } else {
          if (s.actions.includes(d.id)) {
            s.duplicates++;
            message =
              "Receiver recognized the delivery ID: duplicate request, no repeated business action.";
          } else {
            s.actions.push(d.id);
            d.acted = true;
            message =
              "Receiver saved the delivery ID and business action atomically in its PostgreSQL database.";
          }
          if (s.scenario === "crash-after" && d.attemptCount === 1) {
            d.phase = "lease";
            d.due = (Date.parse(d.processingExpiresAt!) - epoch) / 1000;
            message +=
              " Worker crashed before recording success; outcome is unknown to HookRelay.";
          } else {
            d.phase = "finish";
            d.due = s.time + 1;
          }
        }
      }
    } else if (d.phase === "finish") {
      d.status = "DELIVERED";
      d.destinationStatus = 200;
      d.errorMessage = null;
      d.processingExpiresAt = null;
      d.phase = "done";
      s.component = "postgres";
      message =
        "Worker recorded the successful receiver response in PostgreSQL.";
    } else if (d.phase === "lease") {
      d.processingExpiresAt = null;
      d.status = d.attemptCount >= 5 ? "DEAD" : "PENDING";
      d.phase = d.status === "DEAD" ? "done" : "outbox";
      d.due = s.time + 1;
      d.errorMessage = "Processing lease expired; queued for recovery";
      s.component = "recovery";
      message =
        "Lease expired. Recovery atomically makes the delivery eligible again and saves an outbox event.";
    } else if (d.phase === "scheduled") {
      d.status = "PENDING";
      d.nextAttemptAt = null;
      d.waitReason = null;
      d.phase = "outbox";
      d.due = s.time + 1;
      s.component = "scheduler";
      message =
        "Scheduler returned due work to PENDING and saved a new outbox event in the same transaction.";
    }
    if (message) {
      d.updatedAt = iso(s.time);
      s.event = message;
      s.history[d.id].push({
        at: iso(s.time),
        status: d.status,
        attempt: d.attemptCount,
        message,
      });
    }
  }
  return s;
}

/** Advance the same virtual clock to the next visible change; never invent a transition. */
export function nextEvent(state: SimState): SimState {
  if (state.records.length && state.records.every((d) => terminal(d.status)))
    return state;
  const signature = (s: SimState) =>
    JSON.stringify({
      deliveries: s.records.map((d) => [
        d.id,
        d.phase,
        d.status,
        d.attemptCount,
        d.updatedAt,
      ]),
    });
  const before = signature(state);
  let next = state;
  for (let i = 0; i < 300; i++) {
    next = step(next);
    if (signature(next) !== before) break;
  }
  return next;
}
