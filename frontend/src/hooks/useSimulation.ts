import { useEffect, useRef, useState } from "react";
import {
  addDelivery,
  nextEvent,
  initial,
  step,
  type SimState,
} from "../simulation/engine";
import type { Scenario } from "../simulation/scenarios";
import type { Payload } from "../api/types";
import { terminal } from "../api/types";
export function useSimulation(enabled: boolean) {
  const [state, setState] = useState(() => initial());
  const current = useRef(state);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const update = (next: SimState) => {
    current.current = next;
    setState(next);
  };
  useEffect(() => {
    if (!enabled || !running) return;
    const timer = setInterval(() => {
      const next = step(current.current);
      current.current = next;
      setState(next);
    }, 1000 / speed);
    return () => clearInterval(timer);
  }, [enabled, running, speed]);
  useEffect(() => {
    if (state.records.length && state.records.every((d) => terminal(d.status)))
      setRunning(false);
  }, [state]);
  return {
    state,
    running,
    speed,
    setSpeed,
    start: () => setRunning(true),
    pause: () => setRunning(false),
    next: () => {
      setRunning(false);
      update(nextEvent(current.current));
    },
    step: () => {
      setRunning(false);
      update(step(current.current));
    },
    reset: (
      scenario: Scenario = state.scenario,
      limit = state.limit,
      window = state.window,
    ) => {
      setRunning(false);
      update(initial(scenario, limit, window));
    },
    send: (p: Payload) => {
      const next = addDelivery(current.current, p);
      update(next);
      setRunning(true);
      return next.records[0].id;
    },
  };
}
