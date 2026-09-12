export const scenarios = [
  {
    id: "success",
    name: "1. Send a message successfully",
    description: "Send one example order to a receiving app.",
    expected: "The message changes from “Waiting to start” to “Delivered”.",
  },
  {
    id: "temporary",
    name: "2. The receiving app is briefly offline",
    description:
      "The first try fails. The app comes back and HookRelay tries again.",
    expected: "The same message is delivered on its second try.",
  },
  {
    id: "exhausted",
    name: "3. The receiving app stays offline",
    description: "Every try fails. HookRelay stops after five tries.",
    expected: "The result says “Stopped — no tries left”.",
  },
  {
    id: "crash-before",
    name: "4. Sending stops before the message leaves",
    description:
      "The sending process stops unexpectedly. HookRelay waits for its reservation to expire, then recovers the work.",
    expected:
      "Two sending attempts are counted, but only one request reaches the receiving app.",
  },
  {
    id: "crash-after",
    name: "5. The same message arrives twice",
    description:
      "The receiving app saves the order, but the sending process stops before recording success. The message is sent again.",
    expected: "Two requests arrive, but only one order is recorded.",
  },
  {
    id: "kafka",
    name: "6. The message queue is offline",
    description:
      "HookRelay saves the message safely while Kafka, the message queue, is unavailable. It comes back after 12 practice seconds.",
    expected: "The saved message continues its journey and is delivered.",
  },
  {
    id: "rate",
    name: "7. Send 10 messages at once",
    description:
      "Only a few messages may be sent at a time. The rest wait their turn.",
    expected:
      "All 10 messages arrive. Waiting for a turn does not use a sending attempt.",
  },
  {
    id: "redis",
    name: "8. The sending-limit service is offline",
    description:
      "Redis, which checks the shared sending limit, is unavailable. HookRelay waits rather than sending without checking.",
    expected:
      "Sending continues when Redis comes back after 12 practice seconds.",
  },
] as const;
export type Scenario = (typeof scenarios)[number]["id"];
