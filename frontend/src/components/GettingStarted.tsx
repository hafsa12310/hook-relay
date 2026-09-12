import { ArrowRight, CheckCircle2 } from "lucide-react";
import { API_BASE } from "../api/client";
import { CopyButton, Badge } from "./UI";
import type { Delivery } from "../api/types";
import { nextSteps } from "../content/plainLanguage";
export function FirstSteps({
  sim,
  onSend,
  onDemo,
  onSetup,
}: {
  sim: boolean;
  onSend: () => void;
  onDemo: () => void;
  onSetup: () => void;
}) {
  return (
    <section className="panel welcome">
      <span className="eyebrow">NEW HERE? START WITH THIS</span>
      <h2>
        Send an example order.
        <br />
        Watch it reach another app.
      </h2>
      <p>
        A webhook is a message from one app to another. HookRelay helps that
        message arrive, even when something temporarily goes wrong.
      </p>
      <ol className="first-steps">
        <li>
          <b>1</b>
          <div>
            <strong>{sim ? "Use practice mode" : "Start your backend"}</strong>
            <p>
              {sim
                ? "Nothing to install. No real messages are sent."
                : "Follow the setup guide once, then leave the services running."}
            </p>
          </div>
        </li>
        <li>
          <b>2</b>
          <div>
            <strong>Send an example message</strong>
            <p>We have filled in an order for you. No coding needed.</p>
          </div>
        </li>
        <li>
          <b>3</b>
          <div>
            <strong>Watch the result</strong>
            <p>“Delivered” means the receiving app replied successfully.</p>
          </div>
        </li>
      </ol>
      <div className="button-row">
        <button className="primary" onClick={sim ? onDemo : onSetup}>
          {sim ? "Run my first practice test" : "Show the setup steps"}
          <ArrowRight size={17} />
        </button>
        <button onClick={onSend}>
          {sim ? "Write my own example" : "My backend is ready — send a test"}
        </button>
      </div>
      <p>
        {sim
          ? "Recommended first step: the practice test runs automatically in about 6 seconds."
          : "Real mode sends real requests. It will not switch to practice if your backend is unavailable."}
      </p>
    </section>
  );
}
export function DeliveryProgress({
  delivery,
  sim,
  onInspect,
}: {
  delivery: Delivery;
  sim: boolean;
  onInspect: () => void;
}) {
  const sent = delivery.status === "DELIVERED";
  const stopped = delivery.status === "FAILED" || delivery.status === "DEAD";
  return (
    <section className="panel result-card" aria-label="Latest delivery result">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {sim ? "PRACTICE RESULT" : "REAL DELIVERY RESULT"}
          </span>
          <h2>
            {sent
              ? "Your message arrived"
              : stopped
                ? "This delivery has stopped"
                : "Your message is on its way"}
          </h2>
        </div>
        <Badge status={delivery.status} />
      </div>
      <p>
        Message reference: <code>{delivery.id}</code>
      </p>
      <ol className="delivery-steps">
        <li className="complete">
          <CheckCircle2 size={19} />
          <span>1. Saved</span>
        </li>
        <li className={sent ? "complete" : ""}>
          <span>2. Sending{delivery.attemptCount > 1 ? " again" : ""}</span>
        </li>
        <li className={sent ? "complete" : ""}>
          <span>{stopped ? "3. Stopped" : "3. Delivered"}</span>
        </li>
      </ol>
      <p>{nextSteps[delivery.status]}</p>
      <button onClick={onInspect}>
        See this message’s details <ArrowRight size={15} />
      </button>
    </section>
  );
}
const commands = [
  {
    title: "Open this project in your terminal",
    text: "A terminal is the window where you run commands. Start in the main hook-relay folder, the one containing frontend and hook-relay-api.",
    command: "pwd",
  },
  {
    title: "Start the supporting services",
    text: "Open Docker Desktop first. These services store messages, queue work and limit sending. Wait until Docker reports they are ready.",
    command: "docker compose -f hook-relay-api/docker-compose.yml up -d --wait",
  },
  {
    title: "Complete the one-time database and queue setup",
    text: "Download the full setup guide below and follow its “Real backend setup” section. It explains the required environment variables, receiver tables and Kafka topic. Starting Docker alone is not enough.",
    command: null,
  },
  {
    title: "Start the API in a new terminal",
    text: "Run these commands from the project folder. Keep this terminal open. If port 3000 is already used, follow the port instructions below.",
    command:
      "cd hook-relay-api\nnpm install\nnpm run build\nnpm run start:prod",
  },
  {
    title: "Start the sender in another terminal",
    text: "The sender (called a worker) picks up saved messages and delivers them. Leave it running.",
    command: "cd hook-relay-api\nnpm run start:worker",
  },
  {
    title: "Start the receiving app in another terminal",
    text: "This example app receives the messages. It must run on port 4000.",
    command: "cd mock-receiver\nnpm install\nnpm run build\nnpm run start:prod",
  },
];
export function SetupGuide() {
  return (
    <section className="panel setup-guide">
      <span className="eyebrow">REAL BACKEND · ONE-TIME SETUP</span>
      <h2>Get ready to send real messages</h2>
      <p>
        Practice mode works immediately. Real mode needs the backend programs
        running on your computer. These instructions do not start or stop
        anything when you click them.
      </p>
      <p>
        <a
          className="guide-link"
          href="/getting-started.md"
          download="HookRelay-getting-started.md"
        >
          Download the full step-by-step setup guide
        </a>
      </p>
      <ol>
        {commands.map((c) => (
          <li key={c.title}>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
            {c.command && (
              <div className="command">
                <pre>{c.command}</pre>
                <CopyButton text={c.command} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <div className="note">
        <h3>Is another app already using port 3000?</h3>
        <p>
          In the API terminal, use <code>PORT=3001 npm run start:prod</code>. In{" "}
          <code>frontend/.env</code>, set{" "}
          <code>HOOKRELAY_API_PROXY_TARGET=http://localhost:3001</code>. Restart
          the frontend. Keep <code>VITE_API_BASE_URL=/api</code>.
        </p>
      </div>
      <h3>Now send one test</h3>
      <p>
        Choose “Send a test” in the menu. Keep the example order, click “Send
        this message”, then watch the result. The screen will tell you if the
        connection fails. Current API address: <code>{API_BASE}</code>.
      </p>
      <details>
        <summary>What if a delivery keeps waiting?</summary>
        <p>
          Check the sender, Kafka and Redis terminals for errors. This page can
          show delivery updates, but cannot check those services directly. Their
          health is unknown until you check them yourself.
        </p>
      </details>
    </section>
  );
}
