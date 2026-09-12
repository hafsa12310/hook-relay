import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, RotateCcw, Send, Square } from "lucide-react";
import { acceptedMessage, validatePayload, type Payload } from "../api/types";
import { sendWebhook } from "../api/client";
import { CopyButton } from "./UI";
const preset = {
  type: "order.created",
  data: { orderId: "order-101", amount: 2500, currency: "PKR" },
};
export function Composer({
  sim,
  onSim,
  onTrack,
  onInspect,
  renderResult,
}: {
  sim: boolean;
  onSim: (p: Payload) => string;
  onTrack: (id: string) => void;
  onInspect: (id: string) => void;
  renderResult?: (id: string | null) => ReactNode;
}) {
  const [raw, setRaw] = useState(JSON.stringify(preset, null, 2));
  const [view, setView] = useState("form");
  const [presetName, setPresetName] = useState("order");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState("");
  const [count, setCount] = useState(10);
  const [progress, setProgress] = useState<string[]>([]);
  const stop = useRef(false);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      stop.current = true;
      controller.current?.abort();
    },
    [],
  );
  let payload: Payload | undefined;
  let validation = "";
  try {
    payload = validatePayload(raw);
  } catch (e) {
    validation = (e as Error).message;
  }
  const formData =
    payload?.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
      ? (payload.data as Record<string, unknown>)
      : {};
  const editData = (key: string, value: unknown) => {
    if (payload)
      setRaw(
        JSON.stringify(
          { ...payload, data: { ...formData, [key]: value } },
          null,
          2,
        ),
      );
  };
  async function submit(burst = false) {
    if (lock.current || !payload) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setAccepted("");
    setProgress([]);
    stop.current = false;
    controller.current = new AbortController();
    try {
      for (let i = 0; i < (burst ? count : 1); i++) {
        if (stop.current) break;
        const p = burst
          ? {
              ...payload,
              data: {
                ...(typeof payload.data === "object" && payload.data !== null
                  ? payload.data
                  : {}),
                orderId: `burst-${Date.now()}-${i + 1}`,
              },
            }
          : payload;
        try {
          if (sim) {
            const id = onSim(p);
            setAccepted(id);
            setProgress((old) => [
              ...old,
              `Event ${i + 1}: accepted in simulation`,
            ]);
            await new Promise((resolve) => setTimeout(resolve, 80));
          } else {
            const id = await sendWebhook(p, controller.current.signal);
            onTrack(id);
            setAccepted(id);
            setProgress((old) => [...old, `Event ${i + 1}: accepted · ${id}`]);
          }
        } catch (e) {
          if (controller.current.signal.aborted) break;
          const message = (e as Error).message;
          setError(
            message +
              " We will not send it again automatically, because it may already have been saved.",
          );
          setProgress((old) => [...old, `Event ${i + 1}: failed · ${message}`]);
        }
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="composer-layout">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>1. Choose your example</h2>
            <p>
              This is a sample order, not a real purchase. You can keep the
              details below.
            </p>
          </div>
          <Send size={21} />
        </div>
        <label>
          What happened?
          <select
            disabled={busy}
            value={presetName}
            onChange={(e) => {
              setPresetName(e.target.value);
              setRaw(
                JSON.stringify(
                  e.target.value === "order"
                    ? preset
                    : e.target.value === "payment"
                      ? {
                          type: "payment.received",
                          data: {
                            paymentId: "pay-201",
                            amount: 2500,
                            currency: "PKR",
                          },
                        }
                      : {
                          type: "demo.worker-crash",
                          data: { orderId: "crash-101" },
                        },
                  null,
                  2,
                ),
              );
              setError("");
            }}
          >
            <option value="order">An order was placed</option>
            <option value="payment">A payment was received</option>
            <option value="crash">Sender recovery test (advanced)</option>
          </select>
        </label>
        <div className="tabs" aria-label="Message editor">
          {["form", "raw"].map((v) => (
            <button
              key={v}
              className={view === v ? "selected" : ""}
              onClick={() => setView(v)}
            >
              {v === "form" ? "Simple form" : "Edit JSON (advanced)"}
            </button>
          ))}
        </div>
        {view === "form" && payload ? (
          <div className="simple-form">
            <h3>2. Check the message details</h3>
            <label>
              {payload.type === "payment.received"
                ? "Payment reference"
                : "Order reference"}
              <input
                disabled={busy}
                value={String(
                  formData[
                    payload.type === "payment.received"
                      ? "paymentId"
                      : "orderId"
                  ] ?? "",
                )}
                onChange={(e) =>
                  editData(
                    payload.type === "payment.received"
                      ? "paymentId"
                      : "orderId",
                    e.target.value,
                  )
                }
              />
            </label>
            <div className="form-pair">
              <label>
                Amount
                <input
                  disabled={busy}
                  type="number"
                  min="0"
                  value={
                    typeof formData.amount === "number" ? formData.amount : ""
                  }
                  onChange={(e) => editData("amount", Number(e.target.value))}
                />
              </label>
              <label>
                Currency
                <select
                  disabled={busy}
                  value={String(formData.currency ?? "PKR")}
                  onChange={(e) => editData("currency", e.target.value)}
                >
                  {Array.from(
                    new Set([
                      String(formData.currency ?? "PKR"),
                      "PKR",
                      "USD",
                      "EUR",
                      "GBP",
                    ]),
                  ).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <p>The order reference helps you recognise this message later.</p>
            <details>
              <summary>Message type and destination</summary>
              <label>
                Event type
                <input
                  disabled={busy}
                  value={payload.type}
                  onChange={(e) =>
                    setRaw(
                      JSON.stringify(
                        { ...payload, type: e.target.value },
                        null,
                        2,
                      ),
                    )
                  }
                />
              </label>
              <p>
                The receiving app is the example app included with HookRelay.
                Its address is set by the backend.
              </p>
              <input
                aria-label="Destination address"
                readOnly
                value="http://localhost:4000/webhooks"
              />
            </details>
          </div>
        ) : (
          <label>
            Message as JSON
            <p>
              JSON is the text format used by the backend. Keep the event name
              in the top-level type field.
            </p>
            <textarea
              disabled={busy}
              rows={14}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              spellCheck={false}
            />
          </label>
        )}
        {validation ? (
          <p className="error" role="alert">
            {validation}
          </p>
        ) : (
          <p className="valid">✓ Your message is ready to send</p>
        )}
        <h3 className="send-step-title">3. Send it and check the result</h3>
        <p>
          {sim
            ? "This sends a practice message. No backend is needed."
            : "This sends a real message to your running HookRelay backend."}
        </p>
        <div className="button-row">
          <button
            className="primary"
            disabled={busy || !!validation}
            onClick={() => void submit()}
          >
            <Send size={16} />
            {busy ? "Sending your message…" : "Send this message"}
          </button>
          <button
            disabled={busy}
            onClick={() => {
              setRaw(JSON.stringify(preset, null, 2));
              setPresetName("order");
              setError("");
              setAccepted("");
              setProgress([]);
            }}
          >
            <RotateCcw size={15} /> Restore example
          </button>
        </div>
      </section>
      <aside className="composer-result" aria-label="Delivery result">
        <div className="composer-result-sticky">
          <div className="result-heading">
            <span className="eyebrow">RESULT</span>
            <h2>Watch your message here</h2>
          </div>
          {!accepted && !error && (
            <section className="panel empty-result" aria-live="polite">
              <Send size={30} />
              <h3>{busy ? "Sending your message…" : "Ready when you are"}</h3>
              <p>
                {busy
                  ? "Waiting for HookRelay to confirm that it saved your message."
                  : "Fill in the form beside this panel, then click Send this message. Its progress will appear here."}
              </p>
            </section>
          )}
          {error && (
            <div className="error-box" role="alert">
              <h3>We could not confirm that your message was saved</h3>
              <p>
                Check that your backend is running and its address is correct.
                Do not send another copy right away: the first request may
                already have worked.
              </p>
              <details>
                <summary>Technical error details</summary>
                <p>{error}</p>
              </details>
            </div>
          )}
          {accepted && (
            <div className="success-box" role="status">
              <strong>✓ Message saved{sim ? " · practice" : ""}</strong>
              <p>
                Your message is saved, but it may not have arrived yet. Follow
                its progress in this result panel.
              </p>
              <details>
                <summary>What does “accepted” mean?</summary>
                <p>{acceptedMessage}</p>
              </details>
              {
                <>
                  <div className="copy-line">
                    <code>{accepted}</code>
                    <CopyButton text={accepted} />
                  </div>
                  <button onClick={() => onInspect(accepted)}>
                    See the result <ArrowRight size={14} />
                  </button>
                </>
              }
            </div>
          )}
          {renderResult?.(accepted || null)}
        </div>

        <details className="panel burst-experiment">
          <summary>Optional: send several messages at once</summary>
          <h2>Try a busy receiving app</h2>
          <p>
            Send several messages to the same receiving app. HookRelay may make
            some wait so it does not send too many at once.
          </p>
          <label>
            How many messages? (1 to 20)
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              disabled={busy}
              onChange={(e) =>
                setCount(
                  Math.max(
                    1,
                    Math.min(20, Math.floor(Number(e.target.value) || 1)),
                  ),
                )
              }
            />
          </label>
          <button
            disabled={busy || !!validation}
            onClick={() => void submit(true)}
          >
            Send these messages <ArrowRight size={15} />
          </button>
          {busy && (
            <button
              onClick={() => {
                stop.current = true;
              }}
            >
              <Square size={14} /> Stop sending more
            </button>
          )}
          <p className="muted small">
            Messages already saved will still be delivered. Stopping only
            prevents more messages from being submitted.
          </p>
          <div className="submission-log" aria-live="polite">
            {progress.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </details>
        <section className="note">
          <h3>What should I expect?</h3>
          <p>
            First you will see “Message saved”. Then HookRelay sends it in the
            background. The result changes to “Delivered” when the receiving app
            replies successfully.
          </p>
        </section>
      </aside>
    </div>
  );
}
