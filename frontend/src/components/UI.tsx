import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { statusLabels } from "../content/plainLanguage";
import type { Status } from "../api/types";
export function Badge({ status }: { status: Status }) {
  return (
    <span
      className={`badge ${status.toLowerCase()}`}
      title={`Backend status: ${status}`}
    >
      <span aria-hidden="true">
        {status === "DELIVERED"
          ? "✓"
          : status === "DEAD" || status === "FAILED"
            ? "×"
            : status === "PROCESSING"
              ? "↻"
              : "◷"}
      </span>
      {statusLabels[status]}
    </span>
  );
}
export function CopyButton({ text }: { text: string }) {
  const [message, setMessage] = useState("");
  return (
    <button
      className="icon-button"
      aria-label="Copy to clipboard"
      title={message || "Copy"}
      onClick={() => {
        navigator.clipboard.writeText(text).then(
          () => setMessage("Copied"),
          () => setMessage("Copy unavailable; select the text manually"),
        );
      }}
    >
      {message === "Copied" ? <Check size={15} /> : <Copy size={15} />}
      <span className="sr-only" role="status">
        {message}
      </span>
    </button>
  );
}
export const date = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "—";
export function countdown(value: string | null, now: number) {
  if (!value) return "Not scheduled";
  const n = Math.ceil((Date.parse(value) - now) / 1000);
  return n > 0 ? `In ${n}s` : "Eligible now; awaiting scheduling";
}
