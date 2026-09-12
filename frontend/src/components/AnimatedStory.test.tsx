// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AnimatedStory } from "./AnimatedStory";
import { initial, step, type SimState } from "../simulation/engine";
import type { useSimulation } from "../hooks/useSimulation";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function simulation(
  state: SimState,
  running = true,
): ReturnType<typeof useSimulation> {
  return {
    state,
    running,
    speed: 1,
    setSpeed: vi.fn(),
    start: vi.fn(),
    pause: vi.fn(),
    step: vi.fn(),
    next: vi.fn(),
    reset: vi.fn(),
    send: vi.fn(() => "sim-0001"),
  };
}
it("pauses, resumes and cancels the envelope animation", () => {
  const pause = vi.fn(),
    play = vi.fn(),
    cancel = vi.fn();
  const animate = vi.fn(() => ({ pause, play, cancel, playState: "running" }));
  vi.stubGlobal("Animation", class {});
  Object.defineProperty(HTMLElement.prototype, "animate", {
    value: animate,
    configurable: true,
  });
  const state = step(initial());
  const { rerender, unmount } = render(
    <AnimatedStory simulation={simulation(state)} />,
  );
  expect(animate).toHaveBeenCalledTimes(1);
  rerender(<AnimatedStory simulation={simulation(state, false)} />);
  expect(pause).toHaveBeenCalled();
  rerender(<AnimatedStory simulation={simulation(state, true)} />);
  expect(play).toHaveBeenCalled();
  unmount();
  expect(cancel).toHaveBeenCalledTimes(1);
  delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
});
it("reduced-motion preference keeps the meaning without moving an envelope", () => {
  const animate = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "animate", {
    value: animate,
    configurable: true,
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  const state = step(initial());
  const { rerender } = render(
    <AnimatedStory simulation={simulation(state, true)} />,
  );
  rerender(<AnimatedStory simulation={simulation(state, true)} />);
  expect(animate).not.toHaveBeenCalled();
  expect(screen.getByText("Reduced motion is on")).toBeTruthy();
  expect(
    screen.getByText("Saved safely, with a note to publish it"),
  ).toBeTruthy();
  delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
});
it("lets the user follow a waiting order and explain a component", () => {
  let state = initial("rate");
  for (let i = 0; i < 3; i++) state = step(state);
  render(<AnimatedStory simulation={simulation(state, false)} />);
  const waiting = state.records.find((d) => d.status === "WAITING")!;
  const order = (waiting.payload.data as { orderId: string }).orderId;
  fireEvent.click(
    screen.getByRole("button", {
      name: new RegExp(order + " Waiting for a turn"),
    }),
  );
  expect(
    screen.getByText("No sending permission yet — wait your turn"),
  ).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: /Saved safely Database/ }),
  );
  expect(
    screen.getByText(/PostgreSQL saves the delivery and an outbox note/),
  ).toBeTruthy();
});
