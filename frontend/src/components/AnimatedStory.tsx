import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ShoppingBag,
  Database,
  Layers,
  Truck,
  Store,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Timer,
  Pause,
  ArrowRight,
  Ban,
} from "lucide-react";
import type { useSimulation } from "../hooks/useSimulation";
import { scenarioStories } from "../content/scenarioStories";
import {
  storyView,
  type StoryPlace,
  type StoryNode,
} from "../simulation/storyView";
import { statusLabels } from "../content/plainLanguage";
import { terminal } from "../api/types";
const locations: Record<StoryPlace, [number, number]> = {
  shop: [17, 23],
  saved: [50, 23],
  queue: [83, 23],
  sender: [83, 72],
  warehouse: [50, 72],
  receipt: [17, 72],
  gate: [83, 47],
  wait: [50, 94],
};
const stops: [StoryNode, string, string, typeof ShoppingBag][] = [
  ["shop", "Online shop", "Shares the order", ShoppingBag],
  ["saved", "Saved safely", "Database + publication note", Database],
  ["queue", "Message queue", "Kafka holds the delivery ID", Layers],
  ["sender", "Sender", "Reserves work, then sends", Truck],
  ["warehouse", "Warehouse app", "Records each order once", Store],
  [
    "receipt",
    "Delivery confirmed",
    "Success saved in the database",
    CheckCircle2,
  ],
];
const explanations: Record<StoryNode, string> = {
  shop: "The shop submits an order.created message to the HookRelay API. The envelope is that message, not a parcel.",
  saved:
    "PostgreSQL saves the delivery and an outbox note in one transaction. A publisher reads the note and sends the ID to Kafka.",
  queue:
    "Kafka keeps a durable log of messages. The sender reads delivery IDs from it; reading does not automatically delete them.",
  sender:
    "After permission from Redis, the sender claims a 30-second reservation. It then makes the HTTP request. A crash can happen between these steps.",
  warehouse:
    "The example warehouse is the mock receiver. It saves the delivery ID and its recorded order in one PostgreSQL transaction, so the same ID and payload do not record another order.",
  receipt:
    "This is HookRelay saving the successful HTTP result in PostgreSQL. It does not mean a separate email or receipt was sent to the customer.",
};
export function AnimatedStory({
  simulation,
  controls,
}: {
  simulation: ReturnType<typeof useSimulation>;
  controls?: ReactNode;
}) {
  const { state, running, speed } = simulation;
  const story = scenarioStories[state.scenario];
  const [follow, setFollow] = useState<string | null>(null);
  const [explain, setExplain] = useState<StoryNode | null>(null);
  const [motion, setMotion] = useState(true);
  const [reduced, setReduced] = useState(
    () =>
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const delivery =
    state.records.find((d) => d.id === follow) || state.records[0];
  const view = storyView(state, delivery);
  const packet = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const el = packet.current;
    if (
      !el ||
      !delivery ||
      !motion ||
      reduced ||
      !running ||
      typeof el.animate !== "function"
    )
      return;
    const from = locations[view.from];
    const to = locations[view.to];
    const points = view.returning
      ? [from, [4, 94], [4, 47], [50, 47], to]
      : view.from === "queue" && view.to === "sender"
        ? [from, locations.gate, to]
        : [from, to];
    const a = el.animate(
      points.map(([left, top]) => ({ left: `${left}%`, top: `${top}%` })),
      { duration: Math.max(60, 850 / speed), easing: "ease-in-out" },
    );
    animation.current = a;
    return () => {
      a.cancel();
      animation.current = null;
    };
  }, [view.motionKey, motion, reduced, speed]);
  useEffect(() => {
    const a = animation.current;
    if (a && a.playState !== "finished") {
      // The virtual clock stops on completion; let the final envelope arrive.
      if (
        running ||
        (state.records.length > 0 &&
          state.records.every((d) => terminal(d.status)))
      )
        a.play();
      else a.pause();
    }
  }, [running]);
  const done =
    state.records.length > 0 && state.records.every((d) => terminal(d.status));
  const queueOffline = state.scenario === "kafka" && state.time < 12;
  const gateOffline = state.scenario === "redis" && state.time < 12;
  const warehouseOffline =
    state.scenario === "exhausted" ||
    (state.scenario === "temporary" &&
      (!delivery || delivery.attemptCount < 2));
  const counters = {
    saved: state.records.length,
    waiting: state.records.filter(
      (d) => d.status === "WAITING" || d.status === "RETRY_SCHEDULED",
    ).length,
    delivered: state.records.filter((d) => d.status === "DELIVERED").length,
  };
  return (
    <section className="animated-story" aria-label="Animated order story">
      <div
        className="story-side"
        role="region"
        aria-label="Test controls and explanation"
      >
        {controls}
        <div className="story-intro">
          <div className="story-avatar">
            <ShoppingBag size={28} />
          </div>
          <div>
            <span className="eyebrow">IMAGINE THIS · PRACTICE STORY</span>
            <h3>{story.title}</h3>
            <p>{story.setup}</p>
            <details className="story-more">
              <summary>About this example</summary>
              <p className="story-context">
                The “warehouse” represents HookRelay’s example receiving app.
                This story illustrates the test; no physical order is placed.
              </p>
              <p className="story-problem">
                <strong>In this case:</strong> {story.problem}
              </p>
            </details>
          </div>
        </div>
        <div className={`story-caption tone-${view.tone}`} role="status">
          <span className="caption-symbol">
            {view.crashed ? (
              <Ban size={23} />
            ) : view.countdown !== null ? (
              <Timer size={23} />
            ) : view.tone === "success" ? (
              <CheckCircle2 size={23} />
            ) : running ? (
              <ArrowRight size={23} />
            ) : (
              <Pause size={23} />
            )}
          </span>
          <div>
            <h3>{view.title}</h3>
            <p>{view.text}</p>
            {view.countdown !== null && (
              <p className="story-countdown">
                <b>{view.countdown}s</b>{" "}
                {view.crashed
                  ? "until the sending reservation expires"
                  : "until this message can be checked again"}{" "}
                · use Next event to skip the quiet wait.
              </p>
            )}
            {delivery && (
              <small>
                Following {delivery.id} · {delivery.attemptCount} of 5 tries
                started
              </small>
            )}
          </div>
        </div>
        {delivery && (
          <div className="story-attempts">
            <strong>Tries for this message</strong>
            <div>
              {Array.from({ length: 5 }, (_, i) => {
                const number = i + 1;
                const used = delivery.attemptCount >= number;
                const failed = (state.history[delivery.id] || []).some(
                  (h) =>
                    h.attempt === number &&
                    ["RETRY_SCHEDULED", "FAILED", "DEAD"].includes(h.status),
                );
                const succeeded =
                  delivery.status === "DELIVERED" &&
                  delivery.attemptCount === number;
                const interrupted =
                  ["crash-before", "crash-after"].includes(state.scenario) &&
                  number === 1 &&
                  (delivery.phase === "lease" || delivery.attemptCount > 1);
                const label = !used
                  ? "Not used yet"
                  : succeeded
                    ? "Delivered"
                    : failed
                      ? "Request failed"
                      : interrupted
                        ? "Sender stopped"
                        : "Started";
                return (
                  <span
                    key={number}
                    className={`story-try ${!used ? "unused" : succeeded ? "succeeded" : failed ? "failed" : interrupted ? "interrupted" : "started"}`}
                    title={`Try ${number}: ${label}`}
                  >
                    <b>
                      {!used
                        ? "·"
                        : succeeded
                          ? "✓"
                          : failed
                            ? "×"
                            : interrupted
                              ? "!"
                              : "↻"}
                    </b>
                    <small>Try {number}</small>
                    <span className="sr-only">{label}</span>
                  </span>
                );
              })}
            </div>
            <details>
              <summary>How tries are counted</summary>
              <p>
                Waiting for sending permission does not fill a box. Reserving
                work does, even if the sender stops before making a request.
              </p>
            </details>
          </div>
        )}
      </div>
      <div
        className="story-board"
        role="region"
        aria-label="Animated flow and counts"
      >
        <div className="story-tools">
          <span>
            <span className="static-dot" />{" "}
            {running ? "Playing" : done ? "Finished" : "Paused"} · practice time{" "}
            {state.time}s
          </span>
          <button
            aria-pressed={motion && !reduced}
            onClick={() => setMotion((v) => !v)}
            disabled={reduced}
          >
            {reduced
              ? "Reduced motion is on"
              : motion
                ? "Turn animation off"
                : "Turn animation on"}
          </button>
        </div>
        <div
          className="story-scene"
          data-playing={running && motion && !reduced}
          data-testid="story-scene"
          aria-label="Message route: shop, safe storage, queue, sending limit, sender, warehouse, recorded result"
        >
          <div className="story-wire top-one" aria-hidden="true">
            →
          </div>
          <div className="story-wire top-two" aria-hidden="true">
            →
          </div>
          <div className="story-wire side-wire" aria-hidden="true">
            ↓
          </div>
          <div className="story-wire bottom-one" aria-hidden="true">
            ←
          </div>
          <div className="story-wire bottom-two" aria-hidden="true">
            ←
          </div>
          <div
            className={`story-return ${view.returning || view.place === "wait" || view.crashed ? "lit" : ""}`}
            aria-hidden="true"
          />
          <div
            className={`story-return-rise ${view.returning || view.place === "wait" || view.crashed ? "lit" : ""}`}
            aria-hidden="true"
          />
          <span className="return-caption">
            ↶ Wait or recover, then try the same ID again
          </span>
          {stops.map(([id, label, detail, Icon]) => {
            const offline =
              (id === "queue" && queueOffline) ||
              (id === "warehouse" && warehouseOffline) ||
              (id === "sender" && view.crashed);
            return (
              <button
                key={id}
                className={`story-stop stop-${id} ${view.place === id ? "current" : ""} ${offline ? "offline" : ""} ${id === "warehouse" && view.warehouseRecorded ? "has-order" : ""}`}
                style={{
                  left: `${locations[id][0]}%`,
                  top: `${locations[id][1]}%`,
                }}
                onClick={() => setExplain(explain === id ? null : id)}
                aria-expanded={explain === id}
              >
                <span className="stop-icon">
                  <Icon size={25} />
                  {offline && <Ban size={13} className="stop-warning" />}
                </span>
                <strong>{label}</strong>
                <small>
                  {offline
                    ? id === "sender"
                      ? "Stopped unexpectedly"
                      : "Offline in this test"
                    : detail}
                </small>
                {id === "warehouse" && view.warehouseRecorded && (
                  <span className="warehouse-stamp">
                    ✓ Order recorded{view.duplicate ? " · repeat ignored" : ""}
                  </span>
                )}
              </button>
            );
          })}
          <div
            className={`story-gate ${view.place === "gate" ? "current" : ""} ${gateOffline ? "offline" : ""}`}
            style={{ left: "83%", top: "47%" }}
          >
            <ShieldCheck size={17} />
            <span>
              {gateOffline
                ? "Limit check offline"
                : view.place === "gate"
                  ? "Wait for a turn"
                  : "Check sending limit"}
            </span>
          </div>
          {delivery && (
            <div
              ref={packet}
              data-testid="story-envelope"
              className={`story-envelope ${view.tone}`}
              style={{
                left: `${locations[view.to][0]}%`,
                top: `${locations[view.to][1]}%`,
              }}
              aria-hidden="true"
            >
              <Mail size={19} />
            </div>
          )}
        </div>
        <p className="story-legend">
          <Mail size={15} /> Moving envelope = the order message. Click a place
          to learn what it does. This drawing simplifies the route; it is not a
          live network trace.
        </p>
        <div className="story-ledger">
          <div>
            <b>{counters.saved}</b>
            <span>messages saved</span>
          </div>
          <div>
            <b>{state.requests}</b>
            <span>requests made</span>
          </div>
          <div>
            <b>{state.actions.length}</b>
            <span>orders recorded</span>
          </div>
          <div>
            <b>{state.duplicates}</b>
            <span>repeats ignored</span>
          </div>
        </div>
        {state.records.length > 1 && (
          <p>
            {counters.waiting} messages are waiting. {counters.delivered} of{" "}
            {state.records.length} are delivered. Counts above cover the whole
            practice test.
          </p>
        )}
        {state.records.length > 1 && (
          <div className="story-order-picker">
            <strong>Follow an order</strong>
            <div>
              {state.records.map((d) => (
                <button
                  key={d.id}
                  aria-pressed={delivery?.id === d.id}
                  onClick={() => setFollow(d.id)}
                  title={statusLabels[d.status]}
                >
                  <span className={`metric-dot ${d.status.toLowerCase()}`} />
                  {d.payload.data &&
                  typeof d.payload.data === "object" &&
                  "orderId" in d.payload.data
                    ? String(d.payload.data.orderId)
                    : d.id}
                  <small>{statusLabels[d.status]}</small>
                </button>
              ))}
            </div>
          </div>
        )}
        {explain && (
          <div className="story-place-detail">
            <strong>{stops.find((s) => s[0] === explain)?.[1]}</strong>
            <p>{explanations[explain]}</p>
            <button onClick={() => setExplain(null)}>Close explanation</button>
          </div>
        )}
        <details className="story-takeaway">
          <summary>
            {done ? "What this example showed" : "What to watch for"}
          </summary>
          <p>{story.takeaway}</p>
        </details>
      </div>
    </section>
  );
}
