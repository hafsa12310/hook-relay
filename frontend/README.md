# HookRelay frontend

See how reliable webhook delivery works.

**New to the project? Start with the [beginner guide](public/getting-started.md).** It explains the one-click practice test, simple message form, real backend setup, expected results, and troubleshooting in order. The same guide can be downloaded from the real-mode setup panel.

React + TypeScript + Vite + Tailwind CSS. The frontend lives independently in `frontend/`; no backend changes are required.

## Run

Requires Node.js 20.19+ (or a supported newer LTS) and npm.

```sh
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the URL printed by Vite (normally http://127.0.0.1:5173). Learning simulation works without any backend services. `npm run build` creates `dist/`; `npm run preview` serves that production bundle. The development server proxies `/api` to `http://localhost:3000`. If that port is occupied, run the API with `PORT=3001` and set `HOOKRELAY_API_PROXY_TARGET=http://localhost:3001` in `frontend/.env`, then restart Vite. Keep `VITE_API_BASE_URL=/api` to retain the same-origin development proxy.

For production, configure a same-origin `/api` reverse proxy to your running API, or build with `VITE_API_BASE_URL=https://your-api.example` and enable that frontend origin in NestJS CORS. The repository's API currently does not enable CORS. Never use `no-cors`. Vite's development proxy is not included in the static production bundle. Hosting a public page does not make a locally running backend remotely reachable.

## Two explicit modes

- **Practice (learning simulation)** is the initial mode. All records, timeline events, permissions and infrastructure activity are simulated. A pure state machine and virtual seconds make scenarios deterministic. Mode changes stop the simulation clock; returning resumes an otherwise running scenario. Reset clears all records, history, receiver duplicate state and clock timers. Limit/window changes reset the scenario. Learning results illustrate the design; they are not backend correctness tests.
- **Real backend (live mode)** uses actual API responses only. Failures remain visible; there is no simulated fallback. The browser stores up to 200 tracked IDs under a key namespaced by the resolved API base URL. Simulation records never enter that store. Snapshots and observations are session-only, so reopening the browser refetches all saved IDs. Private browsing/storage restrictions can prevent ID persistence.

Live overview counts are **deliveries tracked in this browser**, not system-wide metrics. The simple summary groups unfinished deliveries as “still on the way”. Expand “Show counts for each stage” for the separate states. Plain-language result labels map to the exact backend statuses, which remain available in the technical details. Counts include only successfully fetched records, not unfetched or invalid IDs. Errors flag stale prior records. You can add an existing ID on Your deliveries.

## Verified backend contracts

Inspected `hook-relay-api/src/webhooks/webhooks.controller.ts`, `webhooks.service.ts`, delivery/retry/recovery services, Redis limiter, Prisma schema and mock receiver controller/service.

| Integration           | Contract                                                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /send-webhook`  | JSON object with nonempty top-level `type`; entire body is saved as payload. HTTP 202: `{ accepted: true, deliveryId: string, message: string }`.                                  |
| `GET /deliveries/:id` | Delivery row: id, eventType, payload, destinationUrl, status, attemptCount, destinationStatus, errorMessage, nextAttemptAt, processingExpiresAt, waitReason, createdAt, updatedAt. |
| Destination           | Source fixes `http://localhost:4000/webhooks`; the composer is read-only. Inspector uses the returned record's destination.                                                        |
| Receiver              | HTTP 200 success, PostgreSQL-backed duplicate detection using `X-HookRelay-Delivery-ID`. Same ID with a changed payload produces conflict.                                         |

The GET response also contains a processing ownership token. The frontend does not render it. No list, attempt-history, metrics, dependency-health, Redis-inspection or infrastructure-control contracts are used. Root API response is not treated as health. Infrastructure remains Unknown in live mode; successful delivery GET establishes only that an API response was observed. There is no destination registration, API-key authentication, signature verification or terminal replay interface.

Polling runs roughly once per second, with at most four concurrent GETs, exponential failure backoff capped at 30 seconds, no hidden-tab requests, abort cleanup on mode change/unmount, and no routine polling once a terminal state is fetched. Requests have a 15-second timeout. Observed updates are browser observations, not historical attempts; polling may miss intermediate states. A due countdown says “Eligible now; awaiting scheduling” until a new state arrives. Failed POSTs are never automatically retried because they might already have created a delivery. Stopping a burst prevents subsequent submissions; it does not cancel accepted deliveries. Burst maximum is 20.

## Scenario walkthrough

Open **How it works → Try a guided test**, choose a test, then use Run this test, Pause the test or Start over. On laptop and desktop screens, controls and the current explanation sit on the left while the animation and counts remain visible on the right. The composer similarly places the submitted delivery result beside the form. Narrow screens use a readable stacked layout. Each test includes an animated order story: follow a moving envelope from an online shop through saved storage, Kafka, the sender and an example warehouse. Failure paths show waiting, recovery and duplicate recognition. Click a stop for an explanation, or an order chip to follow a specific message in a burst. **Next event** advances the same virtual clock past quiet waits and pauses at the next delivery change; no state transitions are invented. The expandable playback controls still allow one-second steps and faster playback. Animations pause with playback, clean up on reset/unmount and respect reduced-motion preferences. All animation and counters are practice-only; the warehouse is a story name for the mock receiver. Use 16× speed for long retry budgets. Inspect rows below the lab for payload, lease, attempts and the simulated timeline.

1. **Successful delivery:** atomic delivery/outbox save → publication → Redis permission → claim → receiver action → PostgreSQL success.
2. **Receiver temporarily unavailable:** first HTTP 503 → ten-second retry delay → same ID succeeds on its second attempt.
3. **Retries exhausted:** five HTTP failures, with 10/30/60/120-second delays, end in DEAD.
4. **Crash before sending:** first claim increments the attempt; no HTTP request occurs; 30-second lease expires; recovery requeues; second claim succeeds.
5. **Crash after receiver acts:** first request records one action; worker loses the outcome; lease recovery repeats the same ID; receiver recognizes a duplicate. Two requests, one action.
6. **Kafka unavailable:** delivery and unpublished outbox remain durable; publication resumes at virtual second 12.
7. **Redis limit reached:** ten events share an origin; limited permissions defer excess events into WAITING with zero attempt increments during the wait.
8. **Redis unavailable:** checks defer for five seconds without bypassing the limiter; simulated Redis recovers at second 12.

The Redis visualization shows a sorted-set sliding window of timestamped permissions, not a fixed wall-clock counter. Teaching defaults (3 permissions / 8 seconds) intentionally make waiting visible and differ from backend source defaults (5 / 1 second). Runtime settings are not exposed. A permission may be unused after a crash or claim race.

The model uses actual source values for five claims and 30-second leases, but omits random jitter and simplifies polling/publisher/scheduler timing. Actual retry delays add up to 999ms jitter and honor longer Retry-After on 429/503; Redis deferrals add safety/jitter. Recovery scans every five seconds in the backend. The lessons discuss one-partition consumer-group limits, offsets and retention, duplicate outbox publication, ownership versus receiver idempotency, and why there is no end-to-end exactly-once guarantee.

Live mode supplies manual experiment guidance; the browser never claims to control Docker or services. For the worker crash experiment, the existing backend supports `HOOKRELAY_DEMO_CRASH=after-claim` or `after-receiver` in non-production with event type `demo.worker-crash`. Restart the worker yourself. Follow the beginner guide linked above for the repository-specific service and database setup.

## Checks

```sh
npm test
npm run build
```

Tests cover payload validation, API errors and missing IDs, accepted-versus-delivered messaging, non-retried POSTs, browser namespace separation, active/terminal polling, concurrency, hidden tabs, abort cleanup, failure backoff, deterministic scenarios, Redis deferrals, claim accounting, receiver duplicates and simulation timer reset.

## Structure

- `src/api/`: delivery contracts, validation and HTTP client.
- `src/hooks/`: live observations/polling and virtual-clock lifecycle.
- `src/simulation/`: pure state machine and scenario catalog.
- `src/components/`: composer, tables, accessible dialog inspector, architecture and labs.
- `src/content/`: plain-language explanations, eight example stories and nine lessons.
- `src/simulation/storyView.ts`: state-derived captions, locations and recovery/duplicate presentation for the animated flow.
- `src/styles.css`: responsive light/dark design, focus and reduced-motion styles.

## Optional future contracts (not implemented or required)

An authenticated paginated delivery list could enable system-wide browsing. A persisted attempt-history endpoint could replace incomplete browser observations. Explicit per-dependency health and rate-limit configuration/measurement endpoints could support genuine infrastructure visibility. These need backend design and are not silently assumed by this frontend.

## Validation results

- Production TypeScript + Vite build passed.
- 57 Vitest checks passed, including rendered React interaction tests in jsdom.
- Local frontend HTTP smoke check returned 200.
- Proxy lookup reached port 3000, which returned HTML for a different application rather than a HookRelay delivery response. Full end-to-end delivery against a running HookRelay stack was therefore not verified. Point the configurable proxy at the NestJS API to run that check.
- No browser screenshot/visual QA or production deployment was performed.
