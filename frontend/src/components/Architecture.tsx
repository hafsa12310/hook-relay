import { useState } from "react";
import {
  Database,
  Server,
  Radio,
  Layers,
  Cpu,
  Gauge,
  Inbox,
  Timer,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { components } from "../content/system";
const icons = [
  Server,
  Database,
  Layers,
  Radio,
  Cpu,
  Gauge,
  Inbox,
  Timer,
  RotateCcw,
];
export function Architecture({
  sim,
  active,
}: {
  sim: boolean;
  active: string;
}) {
  const [selected, setSelected] = useState("postgres");
  const c = components.find((c) => c.id === selected)!;
  return (
    <section className="panel architecture">
      <div className="section-heading">
        <div>
          <h2>The delivery journey</h2>
          <p>One event. A system designed to see it through.</p>
        </div>
        <span className="eyebrow">
          {sim ? "SIMULATED FLOW" : "CONCEPTUAL ARCHITECTURE"}
        </span>
      </div>
      <div className="flow-entry">
        Your application <ArrowRight size={14} /> POST /send-webhook
      </div>
      <div className="flow-grid">
        {components.map((c, i) => {
          const Icon = icons[i];
          return (
            <button
              key={c.id}
              className={`flow-node ${selected === c.id ? "selected" : ""} ${sim && active === c.id ? "active-node" : ""}`}
              onClick={() => setSelected(c.id)}
              aria-pressed={selected === c.id}
            >
              <Icon size={22} />
              <strong>{c.name}</strong>
              <small>{c.label}</small>
              <span className="node-index">
                {String(i + 1).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>
      <div className="feedback">
        API → PostgreSQL → outbox publisher → Kafka → worker
        <br />
        Worker ↔ Redis · Worker → receiver · Worker → PostgreSQL
        <br />↳ Scheduler & lease recovery → PostgreSQL + outbox → Kafka
      </div>
      <div className="component-detail">
        <strong>{c.name}</strong>
        <p>
          {c.what} {c.why}
        </p>
        <details>
          <summary>Why it matters & connections</summary>
          <p>{c.failure}</p>
          <p>{c.peers}</p>
        </details>
      </div>
      <small className="muted">
        {sim
          ? "Message highlights illustrate simulated events, not measured infrastructure activity."
          : "Only delivery records are observed live. Arrows show relationships, not actual broker activity or exact transition times."}
      </small>
    </section>
  );
}
