// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useLive } from "./useLive";
import { useSimulation } from "./useSimulation";
import { API_BASE, storageKey } from "../api/client";
import { addDelivery, initial } from "../simulation/engine";
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const delivery = {
  ...addDelivery(initial(), { type: "test" }).records[0],
  id: "real-id",
};
const flush = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
};
it("polls active records and stops polling terminal records", async () => {
  localStorage.setItem(storageKey(API_BASE), JSON.stringify(["real-id"]));
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(delivery)))
    .mockResolvedValue(
      new Response(
        JSON.stringify({
          ...delivery,
          status: "DELIVERED",
          updatedAt: "2026-01-01T12:00:05Z",
        }),
      ),
    );
  vi.stubGlobal("fetch", fetcher);
  const { result } = renderHook(() => useLive(true));
  await flush();
  expect(result.current.records[0].status).toBe("PENDING");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(result.current.records[0].status).toBe("DELIVERED");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10000);
  });
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it("bounds concurrency to four and aborts on unmount", async () => {
  localStorage.setItem(
    storageKey(API_BASE),
    JSON.stringify(Array.from({ length: 12 }, (_, i) => `id-${i}`)),
  );
  const signals: AbortSignal[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((_url, options) => {
      signals.push(options.signal);
      return new Promise(() => {});
    }),
  );
  const { unmount } = renderHook(() => useLive(true));
  expect(signals).toHaveLength(4);
  unmount();
  expect(signals.every((s) => s.aborted)).toBe(true);
});
it("pauses network polling when hidden", async () => {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: true,
  });
  localStorage.setItem(storageKey(API_BASE), JSON.stringify(["real-id"]));
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  renderHook(() => useLive(true));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10000);
  });
  expect(fetcher).not.toHaveBeenCalled();
});
it("shows network errors with backoff and no simulated records", async () => {
  localStorage.setItem(storageKey(API_BASE), JSON.stringify(["real-id"]));
  const fetcher = vi.fn().mockRejectedValue(new TypeError("offline"));
  vi.stubGlobal("fetch", fetcher);
  const { result } = renderHook(() => useLive(true));
  await flush();
  expect(result.current.errors["real-id"]).toContain("Cannot reach");
  expect(result.current.records).toEqual([]);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it("simulation mode makes no live requests", () => {
  localStorage.setItem(storageKey(API_BASE), JSON.stringify(["real-id"]));
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  renderHook(() => useLive(false));
  expect(fetcher).not.toHaveBeenCalled();
});
it("reset clears simulation timers and data; leaving mode pauses clock", async () => {
  const { result, rerender, unmount } = renderHook(
    ({ enabled }) => useSimulation(enabled),
    { initialProps: { enabled: true } },
  );
  act(() => result.current.start());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
  expect(result.current.state.time).toBe(2);
  act(() => result.current.reset());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(result.current.state.time).toBe(0);
  expect(result.current.state.records).toEqual([]);
  act(() => result.current.start());
  rerender({ enabled: false });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(result.current.state.time).toBe(0);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
