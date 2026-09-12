import { statuses, type Delivery, type Payload } from "./types";
export const API_BASE = (
  (import.meta as ImportMeta & { env: Record<string, string> }).env
    .VITE_API_BASE_URL || "/api"
).replace(/\/$/, "");
export const storageKey = (base: string) =>
  `hookrelay:live:${new URL(base || "/", window.location.origin).href}:ids`;
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}
async function request(
  path: string,
  init: RequestInit,
  base = API_BASE,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(base + path, {
      ...init,
      signal: AbortSignal.any([
        ...(init.signal ? [init.signal] : []),
        AbortSignal.timeout(15000),
      ]),
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw e;
    throw new ApiError(
      "Cannot reach the HookRelay API. Start the API on port 3000 and check the proxy or CORS configuration.",
    );
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      body && typeof body === "object" && "message" in body
        ? String(body.message)
        : response.statusText;
    throw new ApiError(`HTTP ${response.status}: ${detail}`, response.status);
  }
  return body;
}
export async function sendWebhook(payload: Payload, signal: AbortSignal) {
  const body = await request("/send-webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (
    !body ||
    typeof body !== "object" ||
    !("deliveryId" in body) ||
    typeof body.deliveryId !== "string" ||
    !body.deliveryId.trim()
  )
    throw new ApiError(
      "The API response has no delivery ID. The request may have been accepted; do not automatically resend.",
    );
  return body.deliveryId;
}
export async function getDelivery(
  id: string,
  signal: AbortSignal,
): Promise<Delivery> {
  const b = await request(`/deliveries/${encodeURIComponent(id)}`, { signal });
  if (!b || typeof b !== "object")
    throw new ApiError(
      "The server did not return a delivery JSON object. Check that the API base URL or proxy target points to HookRelay, not another application.",
    );
  const d = b as Delivery;
  if (
    d.id !== id ||
    !statuses.includes(d.status) ||
    typeof d.attemptCount !== "number" ||
    typeof d.eventType !== "string" ||
    typeof d.destinationUrl !== "string" ||
    !d.payload ||
    !Number.isFinite(Date.parse(d.createdAt)) ||
    !Number.isFinite(Date.parse(d.updatedAt))
  )
    throw new ApiError("Unexpected delivery response shape.");
  return d;
}
