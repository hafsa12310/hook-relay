export const components = [
  {
    id: "api",
    name: "NestJS API",
    label: "Accept the event",
    what: "Validates the top-level type and accepts an HTTP request.",
    why: "A quick acknowledgement lets the caller continue while delivery runs in the background.",
    failure: "Without durable acceptance, an acknowledged event could be lost.",
    peers: "Browser → API → PostgreSQL",
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    label: "Save atomically",
    what: "Saves the delivery and its outbox event in one transaction. It is the durable source of delivery state.",
    why: "Either both records commit or neither does.",
    failure:
      "Separate writes can leave a saved delivery with no instruction to publish it.",
    peers: "API, publisher, worker, scheduler, recovery",
  },
  {
    id: "outbox",
    name: "Outbox publisher",
    label: "Publish saved work",
    what: "Reads unpublished outbox records and publishes delivery IDs to Kafka.",
    why: "Publication can resume after a broker outage.",
    failure:
      "A crash after publication but before marking the row can produce duplicate messages.",
    peers: "PostgreSQL → publisher → Kafka",
  },
  {
    id: "kafka",
    name: "Kafka",
    label: "Queue for workers",
    what: "A durable event log that workers read in the background.",
    why: "Decouples accepting events from sending HTTP requests.",
    failure:
      "During an outage the outbox holds unpublished work until publication can resume.",
    peers: "Publisher → topic / partition → worker consumer group",
  },
  {
    id: "worker",
    name: "Delivery worker",
    label: "Claim & send",
    what: "Obtains Redis permission, claims a delivery with an expiring lease, then sends HTTP.",
    why: "Conditional database updates establish ownership of an attempt.",
    failure:
      "A crash can leave the receiver outcome unknown, requiring recovery.",
    peers: "Kafka, Redis, PostgreSQL, receiver",
  },
  {
    id: "redis",
    name: "Redis",
    label: "Share permissions",
    what: "Uses a sorted-set sliding window per destination origin to grant rate-limit permissions.",
    why: "Workers respect the same limit. Redis is not the durable delivery queue.",
    failure:
      "When Redis is unavailable, work is deferred instead of bypassing the limit.",
    peers: "Worker ↔ Redis; same-origin URL paths share the allowance",
  },
  {
    id: "receiver",
    name: "Mock receiver",
    label: "Record the action",
    what: "Records each delivery ID and its demo business action atomically in receiver PostgreSQL.",
    why: "A repeated delivery with the same ID and payload does not repeat the action.",
    failure:
      "Without duplicate protection, retries could record the same order twice.",
    peers: "Worker → HTTP receiver → receiver PostgreSQL",
  },
  {
    id: "scheduler",
    name: "Retry scheduler",
    label: "Requeue due work",
    what: "Returns due WAITING and RETRY_SCHEDULED deliveries to PENDING with a new outbox record.",
    why: "A failed attempt or denied permission can become eligible later.",
    failure: "Without scheduling, deferred deliveries would remain stuck.",
    peers: "PostgreSQL → outbox; runs every second in this backend",
  },
  {
    id: "recovery",
    name: "Lease recovery",
    label: "Recover abandoned work",
    what: "Recovers expired PROCESSING claims and saves an outbox event, or marks exhausted work DEAD.",
    why: "A worker reserves work only for a limited time.",
    failure:
      "Without expiry, a disappeared worker could own the delivery forever.",
    peers: "PostgreSQL → outbox; scans every five seconds",
  },
];
export const lessons = [
  {
    title: "Webhooks",
    simple:
      "An HTTP request that tells another application something happened.",
    example:
      "An order service submits order.created. HookRelay sends that JSON to the receiver.",
    why: "Applications can react to events without repeatedly asking whether something changed.",
    detail:
      "The payload keeps type at the top level. This API selects the receiver URL; there is no destination registration yet.",
    demo: [
      "An order is created",
      "POST /send-webhook carries order.created",
      "The receiver gets an HTTP request",
    ],
  },
  {
    title: "Asynchronous processing",
    simple: "Save work now. Process it in the background.",
    example:
      "The API returns HTTP 202 with a delivery ID before the worker finishes sending.",
    why: "A slow receiver does not hold open the original request.",
    detail:
      "Accepted is not delivered. Read GET /deliveries/:id to observe the durable outcome.",
    demo: [
      "Request submitted",
      "202 Accepted — saved, still pending",
      "Worker sends HTTP",
      "Success saved — DELIVERED",
    ],
  },
  {
    title: "Kafka",
    simple: "A durable event log that workers read in the background.",
    example:
      "The topic webhook.delivery.requested.v1 contains messages carrying delivery IDs.",
    why: "The API and delivery worker can operate at different speeds.",
    detail:
      "An offset is a position within a partition. A normal consumer group assigns each partition to one consumer at a time. The current one-partition setup does not demonstrate parallel partition consumption by workers in the same group. Reading a message does not necessarily delete it; retention is separate.",
    demo: [
      "Partition 0: [offset 0] [offset 1] [offset 2]",
      "Consumer A reads offset 0; message remains",
      "Consumer A advances to offset 1",
      "Consumer B in the same group waits for a partition assignment",
    ],
  },
  {
    title: "Transactional outbox",
    simple:
      "A database record saying this saved delivery still needs to be published.",
    example: "One transaction inserts both Delivery and OutboxEvent.",
    why: "Avoids losing publication between a database commit and a broker failure.",
    detail:
      "The publisher supports eventual publication, but can publish duplicates if it crashes before marking an event published. It does not provide end-to-end exactly-once delivery.",
    demo: [
      "BEGIN transaction",
      "Delivery + outbox inserted",
      "COMMIT both together",
      "Kafka unavailable: outbox stays unpublished",
      "Kafka returns: publisher sends the ID",
    ],
  },
  {
    title: "Retries and backoff",
    simple: "Wait before trying a temporary failure again.",
    example:
      "A 503 response schedules a later attempt; five claims exhaust the attempt budget.",
    why: "Spreading retries gives a struggling receiver time to recover.",
    detail:
      "Backend delays are 10, 30, 60, 120 seconds plus random jitter. Retry-After on 429 or 503 can increase the delay. Network errors, 408, 429 and 5xx are retryable; other errors can be FAILED. Simulation omits jitter for deterministic results.",
    demo: [
      "Attempt 1 → 503",
      "Wait at least 10 seconds",
      "Attempt 2 → 503",
      "Wait at least 30 seconds",
      "Attempt 3 → success",
    ],
  },
  {
    title: "Worker ownership & leases",
    simple:
      "A worker reserves a delivery for a limited time. If it disappears, the delivery can be recovered.",
    example:
      "The worker claims PROCESSING for 30 seconds and increments attemptCount before HTTP.",
    why: "Ownership prevents competing workers from finishing the same active claim; expiry prevents abandoned work staying stuck.",
    detail:
      "A conditional update and private ownership token protect state writes. A claim can consume an attempt even if the process crashes before HTTP. Recovery checks every five seconds. Ownership is distinct from receiver duplicate protection.",
    demo: [
      "Worker claims: attempt 1, lease active",
      "Worker crashes before HTTP",
      "Lease expires after 30 seconds",
      "Recovery saves PENDING + outbox",
      "Worker claims attempt 2",
    ],
  },
  {
    title: "At-least-once delivery",
    simple: "Reliable recovery can send the same delivery more than once.",
    example:
      "The receiver acts, then a worker crashes before recording success.",
    why: "An uncertain outcome should not silently lose the event, but repeated requests must be safe.",
    detail:
      "DEAD can mean the final claim expired with an unknown receiver outcome. Do not interpret it as proof that no business action happened. HookRelay does not promise end-to-end exactly-once delivery.",
    demo: [
      "Receiver records an action",
      "Worker crashes before saving success",
      "Lease expires; recovery requeues",
      "Same delivery ID sent again",
    ],
  },
  {
    title: "Receiver idempotency",
    simple:
      "Receiving the same delivery again does not repeat the recorded business action.",
    example:
      "The receiver stores delivery IDs with a unique constraint and compares duplicate payloads.",
    why: "A repeated HTTP request does not create a second recorded order event.",
    detail:
      "The processed_webhooks row and received_events action commit in one receiver PostgreSQL transaction. Same ID with different payload returns conflict. This protects the recorded database action, not arbitrary external effects.",
    demo: [
      "First request → insert delivery ID + action",
      "Same ID, same payload → duplicate recognized",
      "Business actions: 1; HTTP requests: 2",
    ],
  },
  {
    title: "Redis shared rate limiting",
    simple:
      "Workers share recent permissions so they respect the same delivery limit.",
    example:
      "All paths at http://localhost:4000 share one sorted-set sliding window.",
    why: "Adding workers should not multiply the permitted request rate.",
    detail:
      "Expired permission timestamps leave a rolling window, not a counter reset at every wall-clock second. Rate-limit waiting does not consume an HTTP attempt. A granted permission can be unused after a crash or a lost claim race. Default backend settings are 5 permissions / 1000 ms; runtime settings are not exposed.",
    demo: [
      "Permission granted at t=0.2",
      "Permission granted at t=0.7",
      "Limit reached: defer without incrementing attempts",
      "At t=1.2, the first permission expires",
    ],
  },
];
