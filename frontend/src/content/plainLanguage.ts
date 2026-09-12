import type { Status } from "../api/types";
export const statusLabels: Record<Status, string> = {
  PENDING: "Waiting to start",
  WAITING: "Waiting for a turn",
  PROCESSING: "Sending",
  RETRY_SCHEDULED: "Will try again",
  DELIVERED: "Delivered",
  FAILED: "Stopped — needs attention",
  DEAD: "Stopped — no tries left",
};
export const nextSteps: Record<Status, string> = {
  PENDING:
    "Your message is saved. HookRelay will pick it up automatically. You do not need to send it again.",
  WAITING:
    "HookRelay is waiting for permission to send. It will continue automatically, and this wait does not use a sending attempt.",
  PROCESSING:
    "HookRelay has reserved this message for sending. Wait for the result. If the sending process stops, the reservation can expire and the work can be recovered.",
  RETRY_SCHEDULED:
    "The last try did not work. HookRelay will try the same message again after a short wait. You do not need to do anything.",
  DELIVERED:
    "The receiving app replied successfully. This delivery is finished.",
  FAILED:
    "HookRelay stopped because the error is not one it automatically retries. Open the technical details to see the reported error.",
  DEAD: "HookRelay has used all its allowed tries. The receiving app may still have received the message before a sending process stopped. Check the receiving app before sending it again.",
};
export function waitLabel(reason: string | null) {
  return reason === "RATE_LIMIT"
    ? "Too many messages were sent recently. Waiting for a turn."
    : reason === "REDIS_UNAVAILABLE"
      ? "The shared sending limit cannot be checked right now. HookRelay will wait and check again."
      : reason || "No extra wait reported";
}
