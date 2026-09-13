# HookRelay

**See how reliable webhook delivery works.**

HookRelay is a reliable webhook delivery system built with NestJS, PostgreSQL, Kafka, Redis, and React. It saves incoming events before processing them in the background, retries temporary failures, recovers work after worker crashes, and helps receivers safely handle duplicate requests.

The included interactive frontend is designed for both learning and demonstration. You can explore predictable delivery scenarios without starting the backend, or connect it to the real HookRelay API to submit webhooks and inspect their actual progress.

## What HookRelay demonstrates

- Transactional outbox publication
- Asynchronous processing with Kafka
- Automatic retries and backoff
- Worker ownership with expiring processing leases
- Recovery after worker crashes
- At-least-once delivery behavior
- Receiver-side idempotency and duplicate protection
- Shared destination rate limiting with a Redis sliding window
- Real delivery tracking through a beginner-friendly interface

HookRelay does not claim end-to-end exactly-once delivery. A receiver can act before a worker crash prevents the result from being recorded, so a recovered delivery might be sent again. The mock receiver demonstrates how using the delivery ID prevents that duplicate request from repeating the recorded business action.

## Architecture

```mermaid
flowchart LR
    U[Client] -->|POST event| API[NestJS API]
    API -->|Delivery + outbox event<br/>in one transaction| PG[(PostgreSQL)]
    PG --> OP[Outbox publisher]
    OP --> K[Kafka]
    K --> W[Delivery worker]
    W -->|Check permission| R[(Redis)]
    W -->|HTTP request| MR[Mock receiver]
    MR --> RDB[(Receiver database)]
    W -->|Record result| PG
    S[Retry scheduler] --> PG
    RC[Lease recovery] --> PG
```

PostgreSQL is the durable source of delivery state. Kafka carries background delivery messages, while Redis only coordinates the shared rate limit.

## Repository structure

```text
hook-relay/
├── hook-relay-api/   NestJS API, worker, Prisma schema, and infrastructure setup
├── mock-receiver/    NestJS receiver with PostgreSQL duplicate protection
└── frontend/         React, TypeScript, Vite, and Tailwind interface
```

## Try the frontend without the backend

Learning simulation mode is the fastest way to explore the project. It uses a deterministic virtual clock and clearly labels all records and activity as simulated.

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the address shown by Vite, normally `http://localhost:5173`. Choose **Practice (No setup)** and then run a scenario.

The simulation includes:

- Successful delivery
- Temporary receiver failure followed by a successful retry
- Exhausted retries ending in `DEAD`
- A worker crash before sending
- A worker crash after the receiver acts
- Kafka becoming unavailable and recovering
- Redis rate-limit waiting
- Redis becoming unavailable

## Run the complete system locally

You need Node.js, npm, and Docker with Docker Compose.

### 1. Start PostgreSQL, Kafka, and Redis

```bash
cd hook-relay-api
docker compose up -d --wait
```

### 2. Configure and prepare the API database

Create `hook-relay-api/.env`:

```dotenv
DATABASE_URL=postgresql://hookrelay:hookrelay_dev_password@localhost:5432/hookrelay
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC=webhook.delivery.requested.v1
REDIS_URL=redis://localhost:6379
```

Then install dependencies, apply the database migrations, generate Prisma Client, and build the application:

```bash
npm install
npx prisma migrate deploy --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
npm run build
```

Create the Kafka topic:

```bash
docker compose exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create \
  --if-not-exists \
  --topic webhook.delivery.requested.v1 \
  --partitions 1 \
  --replication-factor 1
```

### 3. Prepare the mock receiver database

Create a separate database and its two demo tables:

```bash
docker compose exec postgres psql -U hookrelay -d postgres \
  -c 'CREATE DATABASE hookrelay_receiver;'

docker compose exec postgres psql -U hookrelay -d hookrelay_receiver \
  -c 'CREATE TABLE IF NOT EXISTS processed_webhooks (delivery_id TEXT PRIMARY KEY, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()); CREATE TABLE IF NOT EXISTS received_events (id BIGSERIAL PRIMARY KEY, delivery_id TEXT NOT NULL UNIQUE, event_type TEXT NOT NULL, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());'
```

If the database already exists, PostgreSQL will report that fact; continue with the table command.

Create `mock-receiver/.env`:

```dotenv
RECEIVER_DATABASE_URL=postgresql://hookrelay:hookrelay_dev_password@localhost:5432/hookrelay_receiver
PORT=4000
```

Then build the receiver:

```bash
cd ../mock-receiver
npm install
npm run build
```

### 4. Start the applications

Open three terminals from the repository root.

Terminal 1 — mock receiver:

```bash
cd mock-receiver
npm run start:prod
```

Terminal 2 — API:

```bash
cd hook-relay-api
npm run start:prod
```

Terminal 3 — worker, outbox publisher, retry scheduler, and recovery process:

```bash
cd hook-relay-api
npm run start:worker
```

The API runs at `http://localhost:3000`. The receiver runs at `http://localhost:4000/webhooks`.

### 5. Connect the frontend

Create `frontend/.env`:

```dotenv
VITE_API_BASE_URL=/api
HOOKRELAY_API_PROXY_TARGET=http://localhost:3000
```

Start it:

```bash
cd frontend
npm install
npm run dev
```

Open the frontend, select **Real backend**, and send the example webhook.

## API

The current backend intentionally exposes two endpoints.

### Submit a webhook

```http
POST /send-webhook
Content-Type: application/json
```

```json
{
  "type": "order.created",
  "data": {
    "orderId": "order-101",
    "amount": 2500,
    "currency": "PKR"
  }
}
```

An accepted request returns HTTP `202` and a delivery ID:

```json
{
  "accepted": true,
  "deliveryId": "delivery-id",
  "message": "Delivery saved and queued for publishing"
}
```

Accepted means the event was saved for processing. It may still be pending, waiting, processing, or scheduled for another attempt.

### Inspect a delivery

```http
GET /deliveries/:id
```

The frontend tracks IDs submitted through the current browser and polls this endpoint while those deliveries are active. The backend does not currently expose list, metrics, health, Kafka inspection, Redis inspection, replay, destination registration, authentication, or signature endpoints.

## Delivery states

| State | Meaning |
| --- | --- |
| `PENDING` | Waiting to be picked up |
| `WAITING` | Delayed before another sending attempt, such as by the shared rate limit |
| `PROCESSING` | Claimed by a worker |
| `RETRY_SCHEDULED` | Eligible for another attempt later |
| `DELIVERED` | The receiver returned a successful response |
| `FAILED` | Stopped after a non-retryable error |
| `DEAD` | The attempt budget was exhausted |

A rate-limit delay does not consume an HTTP-attempt allowance. An attempt can still be counted when a worker claims work and then crashes before making the request.

## Useful commands

Run frontend checks:

```bash
cd frontend
npm test
npm run build
```

Run API checks:

```bash
cd hook-relay-api
npm test
npm run build
```

Stop local infrastructure while keeping database volumes:

```bash
cd hook-relay-api
docker compose down
```

## Current scope

The receiver URL is currently controlled by the backend. Destination registration, API-key authentication, webhook signatures, and manual replay of terminal deliveries are planned improvements rather than requirements for this version.

The frontend has two separate modes:

- **Practice (No setup):** deterministic simulations with no network requests.
- **Real backend:** actual POST and GET requests to your configured HookRelay API. Connection failures remain visible and never silently switch the application into simulation mode.

For a more detailed beginner walkthrough, open `frontend/public/getting-started.md` or use the setup guide available inside the frontend.
