import type { Scenario } from "../simulation/scenarios";
export interface ScenarioStory {
  title: string;
  setup: string;
  problem: string;
  takeaway: string;
}
export const scenarioStories: Record<Scenario, ScenarioStory> = {
  success: {
    title: "Ayesha orders a backpack",
    setup:
      "Ayesha places order-101 for a PKR 2,500 backpack in an online shop. The shop sends a message so the warehouse app can record the order.",
    problem:
      "Everything is working. Follow the message from the shop to the warehouse.",
    takeaway:
      "“Saved” means HookRelay kept the message. “Delivered” means the warehouse replied successfully. These are two different steps.",
  },
  temporary: {
    title: "The warehouse is briefly offline",
    setup:
      "Ayesha has placed her backpack order. The shop needs the warehouse app to record it.",
    problem:
      "The warehouse cannot accept the first request. HookRelay saves a reminder to try the same message again after a short wait.",
    takeaway:
      "A temporary problem does not require Ayesha or the shop to send another order. HookRelay retries the saved message.",
  },
  exhausted: {
    title: "The warehouse does not come back",
    setup:
      "The shop sends Ayesha’s order, but the warehouse app keeps returning an error.",
    problem:
      "Watch the five tries fill up. The waits get longer, and HookRelay eventually stops.",
    takeaway:
      "Retries have a limit. In this example all requests fail. In other crash cases, “no tries left” does not prove the receiving app did nothing.",
  },
  "crash-before": {
    title: "The sender stops before leaving",
    setup:
      "A sender picks up Ayesha’s saved order and reserves it for 30 seconds.",
    problem:
      "The sender stops unexpectedly before making the request. The reservation must expire before HookRelay can recover the work.",
    takeaway:
      "A try is counted when the sender reserves the work. A crash can consume a try even when no request reaches the warehouse.",
  },
  "crash-after": {
    title: "One order arrives twice",
    setup:
      "The warehouse records Ayesha’s order. Then the sender stops before telling HookRelay that the request succeeded.",
    problem:
      "HookRelay cannot know the outcome. After the reservation expires, it sends the same delivery ID again. Watch the warehouse’s order count.",
    takeaway:
      "Two requests, one recorded order. The warehouse recognises the delivery ID and ignores the repeat. This is duplicate protection, not an exactly-once delivery promise.",
  },
  kafka: {
    title: "The queue is unavailable",
    setup: "Ayesha’s order arrives while Kafka, the message queue, is offline.",
    problem:
      "HookRelay saves both the message and a note to publish it later. Watch the message stay safe until the queue comes back at practice second 12.",
    takeaway:
      "The saved publication note is called an outbox record. It lets publication continue after an outage; publication can still produce duplicate queue messages.",
  },
  rate: {
    title: "Ten orders arrive together",
    setup:
      "The shop receives ten example backpack orders and needs to tell the same warehouse app about all of them.",
    problem:
      "Only a few messages may be sent within the recent time window. Watch some move ahead while others wait. Click an order chip to follow it.",
    takeaway:
      "Waiting for a sending permission does not use a try. The shared limit protects the receiving app even when several senders are working.",
  },
  redis: {
    title: "The sending limit cannot be checked",
    setup:
      "The shop sends Ayesha’s order, but Redis, the shared sending-limit service, is offline.",
    problem:
      "HookRelay waits instead of sending without checking the limit. Redis comes back at practice second 12.",
    takeaway:
      "When the limit cannot be checked, HookRelay defers the message. This wait does not consume a sending attempt.",
  },
};
