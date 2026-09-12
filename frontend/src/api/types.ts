export const statuses = [
  "PENDING",
  "WAITING",
  "PROCESSING",
  "RETRY_SCHEDULED",
  "DELIVERED",
  "FAILED",
  "DEAD",
] as const;
export type Status = (typeof statuses)[number];
export type Payload = { type: string; [key: string]: unknown };
export interface Delivery {
  id: string;
  eventType: string;
  payload: Payload;
  destinationUrl: string;
  status: Status;
  attemptCount: number;
  nextAttemptAt: string | null;
  waitReason: string | null;
  destinationStatus: number | null;
  errorMessage: string | null;
  processingExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface Observation {
  at: string;
  status: Status;
  attempt: number;
  message: string;
}
export const terminal = (s: Status) =>
  s === "DELIVERED" || s === "FAILED" || s === "DEAD";
export const explanations: Record<Status, string> = {
  PENDING: "Waiting to be picked up for background processing.",
  WAITING:
    "Deferred before another sending attempt. Waiting for permission does not consume an attempt.",
  PROCESSING: "A worker has claimed this delivery for a limited time.",
  RETRY_SCHEDULED:
    "An unsuccessful attempt can be tried again when its scheduled time arrives.",
  DELIVERED: "The receiver returned a successful HTTP response.",
  FAILED: "Delivery stopped because of a non-retryable error.",
  DEAD: "The attempt budget is exhausted. The receiver may have acted before a worker crashed; its outcome can be unknown.",
};
export const acceptedMessage =
  "Accepted means the event was saved for processing. Delivery may still be pending.";
export function validatePayload(raw: string): Payload {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(
      "Invalid JSON. Check quotes, commas, and matching brackets.",
    );
  }
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !("type" in value) ||
    typeof value.type !== "string" ||
    !value.type.trim()
  )
    throw new Error(
      "Use a JSON object with a non-empty type at the top level.",
    );
  return value as Payload;
}
