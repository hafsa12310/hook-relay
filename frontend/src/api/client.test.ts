// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { acceptedMessage, validatePayload } from "./types";
import { sendWebhook, storageKey, getDelivery } from "./client";
afterEach(() => vi.unstubAllGlobals());
describe("payload and API contract", () => {
  it("requires nonempty top-level type", () => {
    for (const raw of [
      "[]",
      "null",
      "{}",
      '{"data":{"type":"x"}}',
      '{"type":" "}',
      "broken",
    ])
      expect(() => validatePayload(raw)).toThrow();
    expect(
      validatePayload('{"type":"order.created","data":{"amount":2500}}').type,
    ).toBe("order.created");
  });
  it("explains accepted versus delivered", () => {
    expect(acceptedMessage).toContain("saved for processing");
    expect(acceptedMessage).toContain("still be pending");
  });
  it("returns the actual deliveryId", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ accepted: true, deliveryId: "abc" }), {
          status: 202,
        }),
      ),
    );
    expect(await sendWebhook({ type: "x" }, new AbortController().signal)).toBe(
      "abc",
    );
  });
  it("rejects missing ID", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 202 })),
    );
    await expect(
      sendWebhook({ type: "x" }, new AbortController().signal),
    ).rejects.toThrow("no delivery ID");
  });
  it("does not retry uncertain POSTs", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("network"));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      sendWebhook({ type: "x" }, new AbortController().signal),
    ).rejects.toThrow("Cannot reach");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("surfaces API validation responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "type required" }), {
          status: 400,
        }),
      ),
    );
    await expect(
      sendWebhook({ type: "x" }, new AbortController().signal),
    ).rejects.toThrow("HTTP 400: type required");
  });
  it("namespaces live storage by API URL", () => {
    expect(storageKey("https://a.test")).not.toEqual(
      storageKey("https://b.test"),
    );
    expect(storageKey("/api")).toContain(":live:");
  });
});

it("rejects HTML from a different app at the configured API URL", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response("<!doctype html><title>Other app</title>", {
        status: 200,
      }),
    ),
  );
  await expect(getDelivery("id", new AbortController().signal)).rejects.toThrow(
    "not another application",
  );
});
