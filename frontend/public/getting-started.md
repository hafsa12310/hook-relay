# HookRelay: start with one message

You do not need to know Kafka, Redis or JSON to try the practice version.

## A. Try it without a backend (recommended first)

1. Open a terminal in the main project folder. This is the folder containing `frontend`, `hook-relay-api` and `mock-receiver`.
2. Run these commands:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

3. Open the address shown in the terminal, usually http://127.0.0.1:5173. Leave the terminal open.
4. Leave **Practice** selected at the top of the page.
5. On **Start here**, click **Run my first practice test**.
6. Watch the result. After about six seconds it should say **Delivered**.

These are pretend messages. Nothing is sent to your backend. “Delivered” means the practice receiving app replied successfully; it does not prove your real backend works.

### Write your own example

1. Click **Send a test** in the menu.
2. Keep “An order was placed”, or choose a payment example.
3. Edit the order reference, amount and currency if you like. No JSON is required.
4. Click **Send this message** once.
5. You will first see **Message saved**. This means HookRelay accepted the message; it may not have arrived yet.
6. Watch the result in the panel beside the form, or click **See the result** for details.

### Try something going wrong

1. Click **How it works**, then **Try a guided test**.
2. Choose **The receiving app is briefly offline**.
3. Read “What you should see”. Click **Run this test**.
4. Follow the moving envelope: the shop shares an order, HookRelay saves it, the sender tries the warehouse, and the failed request gets another turn. The explanation on the left describes each event while the animation on the right shows it. On smaller screens, the panels stack so their text stays readable.
5. Click **Next event** to skip a quiet wait and pause at the next change. Or open **Change speed or move one second at a time** to change playback speed. Click any place in the drawing to learn what it does.
6. Click **Start over** to clear practice results and repeat the test.

For a useful second story, choose **The same message arrives twice**. Ayesha’s backpack order reaches the warehouse, but the sender stops before recording success. After recovery, the envelope arrives again with the same ID. Watch **requests made** become 2 while **orders recorded** stays at 1. This is practice data, not a measurement of the real backend.

Use **Turn animation off** if you prefer a still diagram. Your device’s reduced-motion setting is also respected. For the ten-order test, click an order chip below the drawing to follow that particular order.

Other tests show a receiver that stays offline, a sending process that stops, a repeated message, an offline queue and a busy receiving app. Every test explains its expected result. **Read short lessons** explains the terms one at a time.

## B. Real backend setup

Real mode needs several programs running. Do this only when you want to send real requests. The browser cannot start these programs for you.

You need Node.js and npm, plus Docker Desktop with Docker Compose. Use a Node version compatible with the backend packages (Node 22.12+ is a suitable baseline). Open Docker Desktop before continuing.

These instructions use the local development databases and ports in this repository's Docker Compose file. If your backend is already configured, keep your existing environment values and database setup. Do not replace them just to try the UI.

### 1. Start the supporting services

Open a terminal in the **main project folder**:

```sh
docker compose -f hook-relay-api/docker-compose.yml up -d --wait
```

This starts PostgreSQL (storage), Kafka (saved messages for workers to read) and Redis (the shared sending limit). Wait for them to be healthy. If the command reports a port conflict or another error, fix that error before continuing. Do not delete existing database volumes to work around it.

### 2. Configure the API and sender

In your editor, create `hook-relay-api/.env` if it does not already exist. For a fresh installation using this repository's local Docker services, use:

```dotenv
DATABASE_URL=postgresql://hookrelay:hookrelay_dev_password@localhost:5432/hookrelay
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC=webhook.delivery.requested.v1
REDIS_URL=redis://127.0.0.1:6379
WEBHOOK_RATE_LIMIT=5
WEBHOOK_RATE_WINDOW_MS=1000
PORT=3000
```

The password above is the local development value already in `docker-compose.yml`. It is not a production configuration.

If another application is using port 3000, use `PORT=3001` here. Do not stop an unrelated application. Step 8 explains how to connect the frontend to that port.

### 3. Prepare the delivery database and build the backend

In the same terminal, starting from the main project folder:

```sh
cd hook-relay-api
npm install
npx prisma migrate deploy --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
npm run build
cd ..
```

These commands apply the included database migrations, generate the database client and build the API/sender. The explicit `prisma7.config.ts` filename matters in this repository.

If a migration fails, stop and read the error. Do not reset your database or mark failed migrations as successful just to continue.

### 4. Create the Kafka topic once

From the main project folder:

```sh
docker compose -f hook-relay-api/docker-compose.yml exec -T kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --if-not-exists --topic webhook.delivery.requested.v1 --partitions 1 --replication-factor 1
```

The topic is the named place where the sender reads message IDs. The repository disables automatic topic creation, so this step is required for a fresh setup.

### 5. Prepare the receiving app once

For a fresh local setup, create its database:

```sh
docker compose -f hook-relay-api/docker-compose.yml exec -T postgres psql -U hookrelay -d hookrelay -c 'CREATE DATABASE hookrelay_receiver;'
```

If PostgreSQL says this database already exists, keep it and continue. If you already use a different receiver database, use that existing configuration instead.

Create its two tables:

```sh
docker compose -f hook-relay-api/docker-compose.yml exec -T postgres psql -v ON_ERROR_STOP=1 -U hookrelay -d hookrelay_receiver <<'SQL'
CREATE TABLE IF NOT EXISTS processed_webhooks (
  delivery_id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS received_events (
  id BIGSERIAL PRIMARY KEY,
  delivery_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
SQL
```

These tables match the INSERT and duplicate-check queries in the current receiver service. `IF NOT EXISTS` leaves existing tables in place; it does not repair an incompatible existing schema.

Create `mock-receiver/.env` for this fresh local setup:

```dotenv
RECEIVER_DATABASE_URL=postgresql://hookrelay:hookrelay_dev_password@localhost:5432/hookrelay_receiver
PORT=4000
```

Then build the receiver:

```sh
cd mock-receiver
npm install
npm run build
cd ..
```

### 6. Start the receiving app

Open a **new terminal**, starting from the main project folder:

```sh
cd mock-receiver
npm run start:prod
```

Keep this terminal open. The receiving app must be on port 4000 because the current backend fixes its destination to `http://localhost:4000/webhooks`.

### 7. Start the API and sender

Open a **new terminal**, starting from the main project folder:

```sh
cd hook-relay-api
npm run start:prod
```

Leave it open. Then open **another terminal**, again starting from the main project folder:

```sh
cd hook-relay-api
npm run start:worker
```

Leave this one open too. The sender should report that it is listening for delivery messages. Its background services also publish saved work, retry due messages and recover expired reservations.

### 8. Connect the frontend

Create or edit `frontend/.env`:

```dotenv
VITE_API_BASE_URL=/api
HOOKRELAY_API_PROXY_TARGET=http://localhost:3000
```

If you chose API port 3001 in step 2, use `http://localhost:3001` for the proxy target instead. Keep the first line as `/api`. This setup avoids needing browser CORS changes during local development.

In a **new terminal**, starting from the main project folder:

```sh
cd frontend
npm install
npm run dev
```

If the frontend is already running, press Ctrl+C in its terminal and start it again after changing `.env`.

### 9. Send one real message

1. Open the frontend's address in your browser.
2. Select **Real backend** at the top.
3. Click **Send a test** in the menu.
4. Keep the example and click **Send this message** once.
5. First expect **Message saved**. Then expect **Delivered**.
6. Click **See the result** for the delivery reference and updates.

Only deliveries submitted or looked up in this browser appear here. A successful API response does not prove that every supporting service is healthy.

## C. If something does not work

| What you see                                  | What to do next                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The page will not open                        | Keep the frontend terminal running. Open the exact URL printed by `npm run dev`.                                                                                |
| “We could not get the latest delivery update” | Check that the API terminal is running and the proxy target matches its port. Click **Check again**. This checks the saved delivery; it does not send it again. |
| A message says the server did not return JSON | Another app may be using the configured API port. Follow steps 2 and 8 to use a free port.                                                                      |
| Message stays at “Waiting to start”           | Check the sender terminal, Kafka topic and database connection.                                                                                                 |
| Message waits for a turn                      | This can be normal when the receiving app is busy. HookRelay will continue automatically. Check Redis if the wait does not end.                                 |
| “Will try again”                              | The receiving app may be offline. Start it and leave the sender running.                                                                                        |
| “Stopped — no tries left”                     | The allowed tries were used up. Check the receiving app's records before sending another copy; it may have acted before the sender stopped.                     |
| “DATABASE_URL is missing”                     | Check `hook-relay-api/.env` and run the API/sender commands from the `hook-relay-api` folder.                                                                   |
| “RECEIVER_DATABASE_URL is missing”            | Check `mock-receiver/.env` and run the receiver command from the `mock-receiver` folder.                                                                        |

Do not repeatedly click Send after a connection error. The first request may already have saved the message. POST requests are not retried automatically.

## D. Stop when finished

Press Ctrl+C in each API, sender, receiver and frontend terminal. To stop the supporting Docker services without deleting their saved data, run this from the main project folder:

```sh
docker compose -f hook-relay-api/docker-compose.yml stop
```

## E. Check the frontend code

From the frontend folder:

```sh
npm test
npm run build
```

The automated practice and UI tests use a model or mocked API responses. They do not replace step 9 against your real running backend.
