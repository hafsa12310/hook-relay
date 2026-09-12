import { AnimatedStory } from "./AnimatedStory";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
} from "lucide-react";
import { lessons } from "../content/system";
import { scenarios, type Scenario } from "../simulation/scenarios";
import { terminal } from "../api/types";
import type { useSimulation } from "../hooks/useSimulation";
export function SimulationControls({
  simulation,
}: {
  simulation: ReturnType<typeof useSimulation>;
}) {
  const { state, running } = simulation;
  const scenario = scenarios.find((s) => s.id === state.scenario)!;
  const finished =
    state.records.length > 0 && state.records.every((d) => terminal(d.status));
  return (
    <section
      className="simulation-controls practice-workspace"
      aria-label="Guided practice workspace"
    >
      <div className="section-heading">
        <div>
          <h2>Choose a test. Watch it happen.</h2>
          <p>
            Controls and explanation on the left. Message flow on the right.
          </p>
        </div>
        <span className="clock">Practice time: {state.time}s</span>
      </div>
      <AnimatedStory
        simulation={simulation}
        controls={
          <div className="practice-controls">
            <label>
              Choose what to try
              <select
                value={state.scenario}
                onChange={(e) => simulation.reset(e.target.value as Scenario)}
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="button-row">
              <button
                className="primary"
                onClick={() => {
                  if (running) simulation.pause();
                  else {
                    if (finished) simulation.reset();
                    simulation.start();
                  }
                }}
              >
                {running ? <Pause size={17} /> : <Play size={17} />}{" "}
                {running
                  ? "Pause the test"
                  : finished
                    ? "Run it again"
                    : state.time
                      ? "Continue the test"
                      : "Run this test"}
              </button>
              <button onClick={simulation.next} disabled={finished}>
                <SkipForward size={17} />
                Next event
              </button>
              <button onClick={() => simulation.reset()}>
                <RotateCcw size={16} />
                Start over
              </button>
            </div>
            <details className="playback-options">
              <summary>Change speed or move one second at a time</summary>
              <div className="button-row">
                <button onClick={simulation.step}>
                  <SkipForward size={16} />
                  Move forward 1 second
                </button>
                <label className="speed">
                  Playback speed
                  <select
                    value={simulation.speed}
                    onChange={(e) =>
                      simulation.setSpeed(Number(e.target.value))
                    }
                  >
                    <option value={1}>Normal</option>
                    <option value={4}>4 times faster</option>
                    <option value={16}>16 times faster</option>
                  </select>
                </label>
              </div>
              <p>
                Longer tests include waiting. Speeding up only changes practice
                time, not your real backend.
              </p>
            </details>
            <details className="expected-result">
              <summary>What you should see</summary>
              <p>{scenario.expected}</p>
            </details>
          </div>
        }
      />
      <details className="practice-technical">
        <summary>Technical explanation of this step</summary>
        <p>{state.event}</p>
        <p>
          This is a practice model, not a test of your real backend. Random
          retry delays are omitted and background scheduling times are
          simplified.
        </p>
      </details>
    </section>
  );
}
export function RedisWindow({
  simulation,
  sim,
}: {
  simulation: ReturnType<typeof useSimulation>;
  sim: boolean;
}) {
  const { state } = simulation;
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {sim
              ? "PRACTICE SENDING LIMIT"
              : "REAL SENDING LIMIT — NOT AVAILABLE"}
          </span>
          <h2>Why some messages wait their turn</h2>
        </div>
      </div>
      <p>
        HookRelay limits how quickly messages go to the same app. Each dot below
        is one permission to send. As time moves on, old dots leave the window
        and stop counting.
      </p>
      <p className="mono small">Receiving app: http://localhost:4000</p>
      {!sim ? (
        <p>
          No Redis inspection endpoint exists. Source defaults are 5 permissions
          per 1,000 ms; deployed values and current usage are unknown. A granted
          permission may be unused after a crash or claim race.
        </p>
      ) : (
        <>
          <div className="window-settings">
            <label>
              Messages allowed
              <input
                type="number"
                min={1}
                max={20}
                value={state.limit}
                onChange={(e) =>
                  simulation.reset(
                    state.scenario,
                    Math.min(20, Math.max(1, Number(e.target.value) || 1)),
                    state.window,
                  )
                }
              />
            </label>
            <label>
              Over the last (seconds)
              <input
                type="number"
                min={1}
                max={30}
                value={state.window}
                onChange={(e) =>
                  simulation.reset(
                    state.scenario,
                    state.limit,
                    Math.min(30, Math.max(1, Number(e.target.value) || 1)),
                  )
                }
              />
            </label>
            <div>
              <strong>
                {state.permissions.length} / {state.limit}
              </strong>
              <small>recent sending permissions</small>
            </div>
          </div>
          <p className="small muted">
            Changing these numbers starts the test over. Practice allows 3
            messages in 8 seconds so the wait is easy to see. The backend source
            default is 5 in 1 second.
          </p>
          <div
            className="rolling-window"
            aria-label={`${state.permissions.length} permissions in the rolling window`}
          >
            {state.permissions.map((t, i) => (
              <span
                key={`${t}-${i}`}
                style={{
                  left: `${Math.max(1, Math.min(97, ((t - (state.time - state.window)) / state.window) * 100))}%`,
                }}
                title={`Permission at ${t}s`}
              >
                {i + 1}
              </span>
            ))}
          </div>
          <div className="window-labels">
            <span>{state.time - state.window}s · expires ←</span>
            <span>now · {state.time}s</span>
          </div>
          <p>
            {state.permissions.length >= state.limit
              ? "Too many messages were allowed recently. The next one waits. Waiting does not use a sending attempt."
              : "Another message can be given permission to send."}{" "}
            {state.permissions.length
              ? `The oldest permission stops counting in ${Math.max(0, state.permissions[0] + state.window - state.time)}s.`
              : "No messages have been given permission recently."}
          </p>
          <div className="mini-metrics">
            <span>
              <b>{state.requests}</b> requests sent
            </span>
            <span>
              <b>{state.actions.length}</b> orders recorded
            </span>
            <span>
              <b>{state.duplicates}</b> repeated requests recognised
            </span>
          </div>
        </>
      )}
    </section>
  );
}
export function Lessons() {
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(0);
  const l = lessons[selected];
  return (
    <section className="lessons-layout">
      <nav className="lesson-nav" aria-label="Lessons">
        {lessons.map((l, i) => (
          <button
            className={selected === i ? "selected" : ""}
            key={l.title}
            onClick={() => {
              setSelected(i);
              setStep(0);
            }}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {l.title}
          </button>
        ))}
      </nav>
      <article className="panel lesson">
        <BookOpen size={25} />
        <span className="eyebrow">LESSON {selected + 1} OF 9</span>
        <h2>{l.title}</h2>
        <p className="lesson-lead">{l.simple}</p>
        <h3>In HookRelay</h3>
        <p>{l.example}</p>
        <div className="lesson-demo">
          <span className="eyebrow">
            STEP {step + 1} / {l.demo.length} · EXAMPLE
          </span>
          <p>{l.demo[step]}</p>
          <button onClick={() => setStep((s) => (s + 1) % l.demo.length)}>
            {step === l.demo.length - 1 ? "Try again" : "Next step"}{" "}
            <ArrowRight size={15} />
          </button>
        </div>
        <h3>Why this matters</h3>
        <p>{l.why}</p>
        <details>
          <summary>Technical details (optional)</summary>
          <p>{l.detail}</p>
        </details>
      </article>
    </section>
  );
}
export function ManualExperiments() {
  const [chosen, setChosen] = useState(0);
  const tests = [
    {
      name: "1. Send a message successfully",
      steps: [
        "Start the backend using the setup guide. Keep the receiving app and sender running.",
        "Open “Send a test”. Keep the example order and click “Send this message” once.",
        "Open “Your deliveries” and click the message.",
      ],
      result:
        "First “Waiting to start” or “Sending”, then “Delivered”. Fast intermediate steps may be missed between checks.",
    },
    {
      name: "2. The receiving app is briefly offline",
      steps: [
        "Press Ctrl+C in the receiving app terminal. Leave the other programs running.",
        "Send one message from “Send a test”. Watch for “Will try again”.",
        "Restart the receiving app with npm run start:prod in its folder, before all five tries are used.",
      ],
      result:
        "The same message is delivered on a later try. You do not need to send it again.",
    },
    {
      name: "3. The receiving app stays offline",
      steps: [
        "Press Ctrl+C in the receiving app terminal.",
        "Send one message and leave the receiver offline. Keep the sender running.",
        "Watch the updates for several minutes. The waits become longer between tries.",
      ],
      result:
        "After five tries, the result says “Stopped — no tries left”. Restart the receiving app when you finish.",
    },
    {
      name: "4. Sending stops before the message leaves",
      steps: [
        "Stop the sender with Ctrl+C. In its folder, run HOOKRELAY_DEMO_CRASH=after-claim npm run start:worker. This works only outside production mode.",
        "In “Send a test”, choose “Sender recovery test (advanced)” and send once.",
        "The sender will stop itself. Restart it normally with npm run start:worker. Wait for its 30-second sending reservation to expire and recovery to run.",
      ],
      result:
        "The message is recovered and sent. The first try was counted even though it did not send a request.",
    },
    {
      name: "5. The same message arrives twice",
      steps: [
        "Stop the sender. In its folder, run HOOKRELAY_DEMO_CRASH=after-receiver npm run start:worker outside production mode. Keep the receiving app running.",
        "Choose “Sender recovery test (advanced)” in “Send a test” and send once. The sender stops after the receiving app acts.",
        "Restart the sender normally. After recovery, check the receiving app terminal for “Duplicate ignored”.",
      ],
      result:
        "The repeated request uses the same message ID. The receiving app records only one business action. This browser cannot read receiver logs or prove that count.",
    },
    {
      name: "6. The message queue is offline",
      steps: [
        "In a terminal at the project root, run docker compose -f hook-relay-api/docker-compose.yml stop kafka.",
        "Send one message. It should stay saved while the queue is unavailable.",
        "Run docker compose -f hook-relay-api/docker-compose.yml start kafka. If the sender exited, restart it.",
      ],
      result:
        "Saved work can continue when Kafka returns. The browser cannot directly inspect the queue or the saved publication record.",
    },
    {
      name: "7. Send 10 messages at once",
      steps: [
        "Keep all backend programs running.",
        "In “Send a test”, open “Optional: send several messages at once”. Keep 10 and click “Send these messages”.",
        "Open “Your deliveries”. Look for “Waiting for a turn” and compare “Tries started”.",
      ],
      result:
        "Some messages may briefly wait without using a try. The default limit is fast, so the browser may miss these short waits.",
    },
    {
      name: "8. The sending-limit service is offline",
      steps: [
        "From the project root, run docker compose -f hook-relay-api/docker-compose.yml stop redis.",
        "Send one message. It should wait because the shared sending limit cannot be checked.",
        "Run docker compose -f hook-relay-api/docker-compose.yml start redis.",
      ],
      result:
        "Sending resumes after Redis is available again. Waiting should not use a sending attempt.",
    },
  ];
  const test = tests[chosen];
  return (
    <section className="panel">
      <h2>Try this with your running backend</h2>
      <p>
        To watch an animated example first, choose Practice at the top of the
        page.
      </p>
      <p>
        Unlike practice mode, you make the changes yourself in your terminal.
        This browser cannot stop or start the backend programs.
      </p>
      <label>
        Choose one test
        <select
          value={chosen}
          onChange={(e) => setChosen(Number(e.target.value))}
        >
          {tests.map((t, i) => (
            <option key={t.name} value={i}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <ol className="manual">
        {test.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <div className="expected-result">
        <strong>What you should see</strong>
        <p>{test.result}</p>
      </div>
      <p>
        When finished, restart any programs you stopped so the next test starts
        normally.
      </p>
    </section>
  );
}
