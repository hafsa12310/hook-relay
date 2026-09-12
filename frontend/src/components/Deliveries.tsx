import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { statuses, type Delivery, type Observation } from "../api/types";
import { nextSteps, statusLabels, waitLabel } from "../content/plainLanguage";
import { Badge, CopyButton, countdown, date } from "./UI";
export function DeliveryTable({
  records,
  onInspect,
  compact = false,
}: {
  records: Delivery[];
  onInspect: (id: string) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [technical, setTechnical] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const filtered = records.filter(
    (d) =>
      (filter === "ALL" || d.status === filter) &&
      `${d.id} ${d.eventType} ${JSON.stringify(d.payload.data)}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      {!compact && (
        <div className="table-toolbar">
          <label className="search">
            <Search size={17} />
            <input
              aria-label="Search deliveries"
              placeholder="Find an order reference or message ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter delivery status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All results</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </div>
      )}
      {!compact && (
        <button
          className="text-button"
          aria-pressed={technical}
          onClick={() => setTechnical((v) => !v)}
        >
          {technical ? "Hide technical columns" : "Show technical columns"}
        </button>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Message · click to see details</th>
              <th>Result</th>
              <th>Tries started</th>
              {technical && <th>Created</th>}
              {!compact && technical && (
                <>
                  <th>Next scheduled</th>
                  <th>Latest result</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, compact ? 5 : 200).map((d) => (
              <tr key={d.id}>
                <td>
                  <button
                    className="text-button"
                    onClick={() => onInspect(d.id)}
                  >
                    {d.eventType === "order.created"
                      ? "Order"
                      : d.eventType === "payment.received"
                        ? "Payment"
                        : "Message"}{" "}
                    ·{" "}
                    {d.payload.data &&
                    typeof d.payload.data === "object" &&
                    "orderId" in d.payload.data
                      ? String(d.payload.data.orderId)
                      : d.payload.data &&
                          typeof d.payload.data === "object" &&
                          "paymentId" in d.payload.data
                        ? String(d.payload.data.paymentId)
                        : d.id}
                  </button>
                  <small>Reference: {d.id}</small>
                </td>
                <td>
                  <Badge status={d.status} />
                </td>
                <td className="mono">{d.attemptCount}</td>
                {technical && <td>{date(d.createdAt)}</td>}
                {!compact && technical && (
                  <>
                    <td>{date(d.nextAttemptAt)}</td>
                    <td>
                      {d.destinationStatus
                        ? `HTTP ${d.destinationStatus}`
                        : d.errorMessage || d.waitReason || "—"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="empty">
            <span className="empty-icon">↗</span>
            <h3>
              {records.length
                ? "No matching deliveries"
                : "Your first delivery starts here"}
            </h3>
            <p>
              {records.length
                ? "Try another search or status filter."
                : "Send an example message to get started. There is nothing to check yet."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
export function Inspector({
  delivery,
  history,
  sim,
  now,
  onClose,
  error,
}: {
  delivery?: Delivery;
  history: Observation[];
  sim: boolean;
  now: number;
  onClose: () => void;
  error?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="inspector"
      aria-labelledby="inspector-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <div className="drawer-head">
        <div>
          <span className="eyebrow">
            {sim ? "SIMULATED DELIVERY" : "LIVE DELIVERY"}
          </span>
          <h2 id="inspector-title">What happened to this message?</h2>
        </div>
        <button aria-label="Close inspector" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      {!delivery ? (
        <p role="status">{error || "Looking up this message…"}</p>
      ) : (
        <>
          <Badge status={delivery.status} />
          <p>{nextSteps[delivery.status]}</p>
          <h3>What happens next?</h3>
          <p>
            {delivery.status === "DELIVERED"
              ? "Nothing else is needed. This delivery is finished."
              : delivery.status === "FAILED" || delivery.status === "DEAD"
                ? "Check the error details and the receiving app before sending another copy."
                : "Keep this page open. The result will update automatically."}
          </p>
          <div className="copy-line">
            <code>{delivery.id}</code>
            <CopyButton text={delivery.id} />
          </div>
          <p>
            <strong>Tries started:</strong> {delivery.attemptCount}. A try can
            be counted even if the sender stops before the message leaves.
          </p>
          {delivery.nextAttemptAt && (
            <p>
              <strong>Next try:</strong>{" "}
              {countdown(delivery.nextAttemptAt, now)}
            </p>
          )}
          {delivery.waitReason && <p>{waitLabel(delivery.waitReason)}</p>}
          <details>
            <summary>Technical details, times and error messages</summary>
            <p>
              Backend status: <code>{delivery.status}</code>
            </p>
            <dl className="facts">
              <dt>Destination</dt>
              <dd>{delivery.destinationUrl}</dd>
              <dt>Attempts</dt>
              <dd>
                {delivery.attemptCount} /{" "}
                {sim
                  ? "5"
                  : "limit not reported by the running API; source default is 5"}
              </dd>
              <dt>Next attempt</dt>
              <dd>{countdown(delivery.nextAttemptAt, now)}</dd>
              <dt>Why it is waiting</dt>
              <dd>{waitLabel(delivery.waitReason)}</dd>
              <dt>Receiver response</dt>
              <dd>
                {delivery.destinationStatus
                  ? `HTTP ${delivery.destinationStatus}`
                  : "No response reported"}
              </dd>
              <dt>Latest error</dt>
              <dd>{delivery.errorMessage || "None"}</dd>
              <dt>Sending reservation ends</dt>
              <dd>{date(delivery.processingExpiresAt)}</dd>
              <dt>Created</dt>
              <dd>{date(delivery.createdAt)}</dd>
              <dt>Updated</dt>
              <dd>{date(delivery.updatedAt)}</dd>
            </dl>
          </details>
          <details>
            <summary>See the original message (JSON)</summary>
            <div className="section-heading">
              <h3>Message content</h3>
              <CopyButton text={JSON.stringify(delivery.payload, null, 2)} />
            </div>
            <pre>{JSON.stringify(delivery.payload, null, 2)}</pre>
          </details>
          <h3>{sim ? "Practice updates" : "Updates seen by this browser"}</h3>
          <p className="muted small">
            {sim
              ? "These updates come from the practice test, not the real backend."
              : "This browser checks for changes regularly. It may miss short-lived steps, so this is not a complete history of every sending attempt."}
          </p>
          <ol className="timeline">
            {history.map((h, i) => (
              <li key={i}>
                <small>
                  {date(h.at)} · attempt {h.attempt}
                </small>
                <strong>{statusLabels[h.status]}</strong>
                <p>{nextSteps[h.status]}</p>
                <details>
                  <summary>Technical update</summary>
                  <p>{h.message}</p>
                </details>
              </li>
            ))}
          </ol>
        </>
      )}
    </dialog>
  );
}
