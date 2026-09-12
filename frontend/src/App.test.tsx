// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "./App";
import { API_BASE, storageKey } from "./api/client";
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("scrollTo", vi.fn());
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false;
    },
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("sends a simulated event, presents acceptance and opens the inspector", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Send a test" }));
  fireEvent.click(screen.getByRole("button", { name: "Send this message" }));
  await screen.findByText("✓ Message saved · practice");
  expect(
    screen.getByText(
      "Accepted means the event was saved for processing. Delivery may still be pending.",
    ),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "See the result" }));
  expect(screen.getByRole("dialog").textContent).toContain("PENDING");
  expect(screen.getByRole("dialog").textContent).toContain("sim-0001");
  fireEvent.click(screen.getByRole("button", { name: "Close inspector" }));
  await act(async () => {
    await new Promise((r) => setTimeout(r, 100));
  });
});
it("shows a real API failure and keeps live mode active", async () => {
  localStorage.setItem(storageKey(API_BASE), JSON.stringify(["offline-id"]));
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /^Real backend/ }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "Cannot reach the HookRelay API",
    ),
  );
  expect(
    screen
      .getByRole("button", { name: /^Real backend/ })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  expect(screen.queryByText("sim-0001")).toBeNull();
  expect(screen.getByRole("button", { name: "Check again" })).toBeTruthy();
});
it("lessons progress and simulation controls step and reset", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "How it works" }));
  fireEvent.click(screen.getByRole("button", { name: "Read short lessons" }));
  fireEvent.click(screen.getByRole("button", { name: /03 Kafka/ }));
  expect(
    screen.getByText("Partition 0: [offset 0] [offset 1] [offset 2]"),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Next step" }));
  expect(
    screen.getByText("Consumer A reads offset 0; message remains"),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Try a guided test" }));
  fireEvent.click(
    screen.getByText("Change speed or move one second at a time"),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Move forward 1 second" }),
  );
  expect(screen.getByText("Practice time: 1s")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Start over" }));
  expect(screen.getByText("Practice time: 0s")).toBeTruthy();
});

it("starts the first practice test in one click without setup or network requests", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  render(<App />);
  expect(
    screen.getByRole("button", { name: "Run my first practice test" }),
  ).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Run my first practice test" }),
  );
  expect(screen.getByRole("button", { name: "Pause the test" })).toBeTruthy();
  expect(screen.getByText("What you should see")).toBeTruthy();
  expect(fetcher).not.toHaveBeenCalled();
});
it("edits an order without JSON and submits the edited data", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Send a test" }));
  expect(screen.queryByRole("textbox", { name: "Message as JSON" })).toBeNull();
  fireEvent.change(screen.getByLabelText("Order reference"), {
    target: { value: "my-order-42" },
  });
  fireEvent.change(screen.getByLabelText("Amount"), {
    target: { value: "1234" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send this message" }));
  await screen.findByText("✓ Message saved · practice");
  fireEvent.click(screen.getByRole("button", { name: "See the result" }));
  expect(screen.getByRole("dialog").textContent).toContain("my-order-42");
  expect(screen.getByRole("dialog").textContent).toContain("1234");
  await act(async () => {
    await new Promise((r) => setTimeout(r, 100));
  });
});
it("shows real setup instructions without running infrastructure commands", () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /^Real backend/ }));
  expect(screen.getByText("Get ready to send real messages")).toBeTruthy();
  expect(screen.getByText(/Starting Docker alone is not enough/)).toBeTruthy();
  expect(fetcher).not.toHaveBeenCalled();
});

it("keeps test controls and changing explanations beside the animated flow", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "How it works" }));
  const controls = screen.getByRole("region", {
    name: "Test controls and explanation",
  });
  const flow = screen.getByRole("region", { name: "Animated flow and counts" });
  fireEvent.click(within(controls).getByRole("button", { name: "Next event" }));
  expect(
    within(controls).getByText("Saved safely, with a note to publish it"),
  ).toBeTruthy();
  expect(within(flow).getByTestId("story-envelope")).toBeTruthy();
  expect(within(flow).getByText("messages saved")).toBeTruthy();
  fireEvent.click(within(controls).getByRole("button", { name: "Start over" }));
  expect(within(flow).queryByTestId("story-envelope")).toBeNull();
});
it("shows the submitted message in the result panel beside the composer", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Send a test" }));
  const result = screen.getByRole("complementary", { name: "Delivery result" });
  expect(within(result).getByText("Ready when you are")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Send this message" }));
  await within(result).findByText("✓ Message saved · practice");
  expect(
    within(result).getByRole("region", { name: "Latest delivery result" })
      .textContent,
  ).toContain("sim-0001");
  await act(async () => {
    await new Promise((r) => setTimeout(r, 100));
  });
});
