import { useEffect, useRef, useState } from "react";
import { API_BASE, getDelivery, storageKey } from "../api/client";
import { terminal, type Delivery, type Observation } from "../api/types";
export function readIds(): string[] {
  try {
    const v: unknown = JSON.parse(
      localStorage.getItem(storageKey(API_BASE)) || "[]",
    );
    return Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string").slice(0, 200)
      : [];
  } catch {
    return [];
  }
}
export function useLive(enabled: boolean) {
  const [ids, setIds] = useState(readIds);
  const [records, setRecords] = useState<Record<string, Delivery>>({});
  const [history, setHistory] = useState<Record<string, Observation[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const cache = useRef(records);
  cache.current = records;
  const track = (id: string) =>
    setIds((old) => (old.includes(id) ? old : [id, ...old].slice(0, 200)));
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(API_BASE), JSON.stringify(ids));
    } catch {
      /* Private browsing may disable persistence. */
    }
  }, [ids]);
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    let failures = 0;
    const run = async () => {
      if (stopped) return;
      if (document.hidden) {
        timer = setTimeout(run, 5000);
        return;
      }
      const active = ids.filter(
        (id) => !cache.current[id] || !terminal(cache.current[id].status),
      );
      if (!active.length) {
        setLoading(false);
        return;
      }
      setLoading(true);
      let failed = false;
      for (let i = 0; i < active.length && !stopped; i += 4) {
        await Promise.allSettled(
          active.slice(i, i + 4).map(async (id) => {
            try {
              const d = await getDelivery(id, controller.signal);
              if (stopped) return;
              const prev = cache.current[id];
              if (
                !prev ||
                prev.updatedAt !== d.updatedAt ||
                prev.status !== d.status ||
                prev.attemptCount !== d.attemptCount
              ) {
                setHistory((h) => ({
                  ...h,
                  [id]: [
                    ...(h[id] || []),
                    {
                      at: new Date().toISOString(),
                      status: d.status,
                      attempt: d.attemptCount,
                      message:
                        d.errorMessage ||
                        d.waitReason ||
                        "State returned by API",
                    },
                  ].slice(-100),
                }));
              }
              cache.current = { ...cache.current, [id]: d };
              setRecords(cache.current);
              setErrors((e) => {
                const n = { ...e };
                delete n[id];
                return n;
              });
              setChecked(true);
            } catch (e) {
              if (stopped) return;
              failed = true;
              setErrors((old) => ({
                ...old,
                [id]: e instanceof Error ? e.message : "Request failed",
              }));
            }
          }),
        );
      }
      if (stopped) return;
      setLoading(false);
      failures = failed ? failures + 1 : 0;
      timer = setTimeout(run, Math.min(30000, 1000 * 2 ** failures));
    };
    void run();
    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [enabled, ids, revision]);
  return {
    ids,
    records: ids.flatMap((id) => (records[id] ? [records[id]] : [])),
    history,
    errors: Object.fromEntries(
      Object.entries(errors).filter(([id]) => ids.includes(id)),
    ),
    loading,
    checked,
    track,
    retry: () => setRevision((v) => v + 1),
  };
}
