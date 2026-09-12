import type { SimDelivery, SimState } from "./engine";
import { epoch } from "./engine";
export const storyNodes = [
  "shop",
  "saved",
  "queue",
  "sender",
  "warehouse",
  "receipt",
] as const;
export type StoryNode = (typeof storyNodes)[number];
export type StoryPlace = StoryNode | "gate" | "wait";
export interface StoryView {
  place: StoryPlace;
  from: StoryPlace;
  to: StoryPlace;
  returning: boolean;
  title: string;
  text: string;
  tone: "ready" | "working" | "waiting" | "problem" | "success";
  countdown: number | null;
  motionKey: string;
  crashed: boolean;
  warehouseRecorded: boolean;
  duplicate: boolean;
}
export function storyView(s: SimState, d?: SimDelivery): StoryView {
  const view: StoryView = {
    place: "shop",
    from: "shop",
    to: "shop",
    returning: false,
    title: "The shop has an order to share",
    text: "Press Run this test. The moving envelope will represent the order message, not the physical backpack.",
    tone: "ready",
    countdown: null,
    motionKey: "ready",
    crashed: false,
    warehouseRecorded: false,
    duplicate: false,
  };
  if (!d) return view;
  view.motionKey = `${s.scenario}:${d.id}:${d.updatedAt}:${d.phase}:${d.attemptCount}`;
  view.warehouseRecorded = s.actions.includes(d.id);
  view.duplicate =
    view.warehouseRecorded &&
    d.attemptCount > 1 &&
    (d.phase === "finish" || d.status === "DELIVERED") &&
    s.scenario === "crash-after";
  if (d.status === "DELIVERED")
    return {
      ...view,
      place: "receipt",
      from: "warehouse",
      to: "receipt",
      tone: "success",
      title: "Delivered — the warehouse replied",
      text: view.duplicate
        ? "The repeated request was recognised. HookRelay has now saved the successful result. The order was recorded only once."
        : "The warehouse recorded the order and replied successfully. HookRelay saved the result, so this delivery is finished.",
    };
  if (d.status === "DEAD" || d.status === "FAILED")
    return {
      ...view,
      place: "wait",
      from: "warehouse",
      to: "wait",
      tone: "problem",
      title: "Stopped — no more automatic tries",
      text:
        d.status === "DEAD"
          ? "All five tries were used. In this practice case the warehouse kept returning an error. A real crash can instead leave the receiver’s outcome unknown."
          : "The error needs attention. HookRelay will not automatically retry this delivery.",
    };
  if (d.phase === "lease")
    return {
      ...view,
      place: "sender",
      from: "sender",
      to: d.acted ? "warehouse" : "sender",
      tone: "problem",
      crashed: true,
      countdown: Math.max(
        0,
        Math.ceil((Date.parse(d.processingExpiresAt!) - epoch) / 1000 - s.time),
      ),
      title: d.acted
        ? "The order arrived, but the sender stopped"
        : "The sender stopped before making a request",
      text: d.acted
        ? "The warehouse has recorded the order. HookRelay has not received a saved success result, so it must wait for the reservation to expire before recovery."
        : "No request reached the warehouse on this try. The sender’s reservation is still active; recovery waits for it to expire.",
    };
  if (d.status === "WAITING")
    return {
      ...view,
      place: "gate",
      from: "queue",
      to: "gate",
      tone: "waiting",
      countdown: Math.max(0, d.due - s.time),
      title:
        d.waitReason === "REDIS_UNAVAILABLE"
          ? s.time < 12
            ? "The limit checker is offline — wait safely"
            : "The limit checker is back — waiting for the next check"
          : "No sending permission yet — wait your turn",
      text:
        d.waitReason === "REDIS_UNAVAILABLE"
          ? s.time < 12
            ? "Redis cannot check the shared limit. The message waits without using a try. HookRelay will check again later."
            : "Redis is available again. This message still waits until its scheduled check; waiting has not used a sending try."
          : "The recent sending window is full. This order stays saved and waits. Its try count does not increase just for waiting.",
    };
  if (d.status === "RETRY_SCHEDULED")
    return {
      ...view,
      place: "wait",
      from: "sender",
      to: "warehouse",
      tone: "waiting",
      countdown: Math.max(0, d.due - s.time),
      title: "The warehouse could not accept this request",
      text: "The warehouse replied with an error. HookRelay scheduled another try for the same delivery ID. Watch the return path when the wait ends.",
    };
  if (d.phase === "outbox") {
    const recovered =
      d.attemptCount > 0 && d.errorMessage?.includes("lease expired");
    const requeued = (s.history[d.id]?.length ?? 0) > 1;
    return {
      ...view,
      place: "saved",
      from: requeued ? "wait" : "shop",
      to: "saved",
      returning: requeued,
      tone: "working",
      title: recovered
        ? "The reservation expired — recover the saved message"
        : requeued
          ? "The wait is over — queue the same message again"
          : "Saved safely, with a note to publish it",
      text: recovered
        ? "Recovery made the same delivery eligible again and saved a new publication note. No new order is created."
        : requeued
          ? "The scheduler saved another publication note. The delivery keeps its original ID as it goes through the queue again."
          : s.scenario === "kafka" && s.time < 12
            ? "The message and its publication note are saved together in PostgreSQL. Kafka is offline, so the note stays here until publishing can resume."
            : "The API saved the message and an outbox note together. That note says the message still needs to be published to the queue.",
    };
  }
  if (d.phase === "queue")
    return {
      ...view,
      place: "queue",
      from: "saved",
      to: "queue",
      tone: "working",
      title: "The saved note was published to the queue",
      text: "The publisher sent the delivery ID to Kafka. A sender can now read it. Reading a Kafka message does not automatically delete it.",
    };
  if (d.phase === "http")
    return {
      ...view,
      place: "sender",
      from: "queue",
      to: "sender",
      tone: "working",
      title: `Permission granted — try ${d.attemptCount} begins`,
      text: "Redis allowed a send. The sender reserved this message for 30 seconds and increased the try count. The HTTP request is the next step.",
    };
  if (d.phase === "finish")
    return {
      ...view,
      place: "warehouse",
      from: "sender",
      to: "warehouse",
      tone: "success",
      title: view.duplicate
        ? "“I already recorded this order”"
        : "The warehouse recorded the order",
      text: view.duplicate
        ? "The warehouse saw the same delivery ID again. It replied successfully without recording a second order."
        : "The warehouse saved the delivery ID and the order together. HookRelay still needs to record the successful reply.",
    };
  return view;
}
