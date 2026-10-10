# Workshop Inventory Kit — How It Works

Starter kit for the HackITS 2026 "smart warehouse for a repair workshop" challenge. It gives you
everything **around** the inventory service: a message broker, a simulated workshop that
produces events, the contract your service must honour, and automated tests that grade it.

> **The inventory service itself is not in this repo.** You build it. It must consume the
> workshop's events from Kafka-compatible topics, keep a stock ledger, and expose a small HTTP API.

## Architecture

```
                 ┌────────────────────────── docker compose ───────────────────────────┐
                 │                                                                     │
  data/          │   ┌───────────┐  produces   ┌────────────────────────────┐          │
  events.jsonl ──┼──►│ simulator │────────────►│  Redpanda (Kafka API)      │◄── Console :8080
                 │   │  :8090    │             │  localhost:19092 / :9092   │          │
  browser ◄──────┼───┤  panel    │             │                            │          │
  (demo panel)   │   └───────────┘             │  shop.catalog              │          │
                 │                             │  shop.work_orders          │          │
                 │                             │  shop.inspections          │          │
                 │                             │  shop.purchasing           │          │
                 │                             │  inventory.events  (out)   │          │
                 │                             │  inventory.dlq     (out)   │          │
                 │                             └──────▲──────────────┬──────┘          │
                 └────────────────────────────────────┼──────────────┼─────────────────┘
                                                      │ publishes    │ consumes
                                              ┌───────┴──────────────▼──────┐
                                              │  YOUR inventory service     │  HTTP :8000
                                              │  (ledger + API, you build)  │◄──────────┐
                                              └─────────────────────────────┘           │
                                                                                        │
                                              contract-tests (run_tests.py) ────────────┘
                                              also publishes scenarios & reads inventory.events
```

Data flow: **workshop events in → your service → `stock.*` events out + HTTP API**. The
contract tests sit on both sides: they inject known scenarios into the input topics, then check
the events your service emits and the answers of its API.

## Components

| Path | What it does |
|---|---|
| `docker-compose.yml` | Starts Redpanda, Redpanda Console and the simulator. The `contract-tests` service is under the `tests` profile, so `up` doesn't start it. |
| `simulator/simulator.py` | Creates the topics, replays `data/events.jsonl` at accelerated speed, and serves the demo panel + a small JSON API (stdlib `http.server`, `confluent-kafka` producer with idempotence and `acks=all`). |
| `simulator/panel.html` | Single-page UI served at `:8090`. Lets a person open work orders, capture/approve/reject/void inspections, change stages, delete orders, and register purchase receipts. |
| `data/events.jsonl` | Six weeks of synthetic workshop operation (1,742 deliveries, 65 duplicates, deliberately out of order). One line = `{topic, replay_at, event}`. See `data/README.md`. |
| `contract/` | The source of truth: `openapi.yaml` (HTTP API), `schemas/input/*` and `schemas/output/*` (JSON Schema per event), `schemas/common.schema.json`, `schemas/index.json` (event → topic → schema), and `README.md` with the 23 business rules. |
| `contract-tests/run_tests.py` | 14 scenarios (50 of 100 points), plus `snapshot` / `compare` for the rebuild check. Validates every output event against its schema and its `key`. |
| `tools/validate_events.py` | Offline validator: checks any JSONL file against the contract schemas and reports unknown types, wrong topics, schema errors and duplicate `event_id`s. |
| `labels/etiquetas-demo.pdf` | Code 128 labels (locations `U-100`…`U-112`, parts of the demo models) for scanning on the floor. |

### The simulator in detail

1. **Startup** (`ensure_topics`): waits up to ~2 min for the broker, optionally deletes the topics
   (`RESET=1`), then creates the 4 input and 2 output topics with 3 partitions each.
2. **Replay** (`Shop.run_replay`, background thread): sends each record to its topic, sleeping
   `Δ(replay_at) / SPEED` between records (capped at 30 s). `SPEED=3600` ≈ 1 simulated hour per
   second (~17 min total); `SPEED=0` sends everything with no pauses.
3. **Panel actions** (`Shop` methods behind `POST /api/...`): publish new events stamped with the
   *real* time, using IDs starting at 90001 so they don't collide with the dataset. Order codes
   look like `R<ddmmyy><nnn>`.
4. **Catalog state**: on load it scans the dataset for the latest `part.upserted` / `bom.upserted`
   so the panel can offer models and BOM lines.

Simulator HTTP endpoints (used by the panel):

| Method & path | Effect |
|---|---|
| `GET /api/state` | Replay progress, models + BOM lines, parts, orders and their inspections |
| `POST /api/orders` `{model_id}` | `work_order.opened` + stage change to `quick_inspection` |
| `POST /api/orders/{id}/inspections` | `inspection.submitted` (`kind`: `quick`/`full`, `items`) |
| `POST /api/inspections/{id}/{approve\|reject\|discard\|void}` | Corresponding `inspection.*` event (approving a quick inspection moves the order to `awaiting_full_inspection`; voiding returns it to `quick_inspection`) |
| `POST /api/orders/{id}/stage` `{to_stage}` | `work_order.stage_changed` |
| `POST /api/orders/{id}/delete` | `work_order.deleted` |
| `POST /api/purchases` | `purchase.item_received` (`part_number`, `quantity`, optional `work_order_code`, `purpose`) |

### The simulator at runtime (observed)

The behaviour below was measured by running `simulator/simulator.py` with `SPEED=86400`. Kafka was
replaced by a stand-in that records every message the simulator produces. The simulator's own
code was unchanged.

**Startup log**

```
tópico creado: shop.catalog
tópico creado: shop.work_orders
tópico creado: shop.inspections
tópico creado: shop.purchasing
tópico creado: inventory.events
tópico creado: inventory.dlq
panel del simulador en http://localhost:8090
...
replay terminado: 1742 eventos
```

The panel is available right away. The replay runs in a background thread, so you can use the
panel while the history is still streaming.

**Replay timeline**

| Phase | Simulated time | What gets published |
|---|---|---|
| Catalog burst | 31 Jul 2026 | ~340 `part/location/bom.upserted` in ~2 s of real time (the events are close together) |
| Opening stock | before 5 Aug | Opening-stock purchase receipts with no work order, which seed the inventory |
| Operation | 5 Aug → 13 Sep | Work orders, inspections and purchases interleaved, with duplicates and out-of-order arrivals |

- Span: 43.9 simulated days. At the default `SPEED=3600` that is about **17.5 min**. At
  `SPEED=86400` it took **45.7 s**.
- Totals per topic: `shop.purchasing` 889, `shop.catalog` 345, `shop.work_orders` 306,
  `shop.inspections` 202, for **1,742 messages**. 65 of them reuse an `event_id`, and your
  service must ignore those.
- No real gap is longer than 30 s: each pause is capped at 30 s whatever the speed. The single
  76 h quiet period in the data takes 30 s at `SPEED=3600`, not 76 s.
- Replayed events keep their **original** `occurred_at` (Aug–Sep 2026). Panel events are stamped
  with the **current** time.
- Progress can be read from `GET /api/state` → `replay: {sent, total, sim_time, done, speed}`.
  During the test it went `458 → 531 → 718 → 1036 → 1280 → 1583 → 1742` at 5 s intervals.

**Models offered by the panel**: KESSLER 000.604.515 (65 lines), 000.613.940 (52), 000.634.204 (38),
GROB MSP-04 (4), DOOSAN DNM400 (4). 256 parts. The GROB and DOOSAN models are the short ones,
and their labels are in `labels/etiquetas-demo.pdf`.

**A demo session through the panel API** and the messages it produced, in order:

| Action | Topic | Event (key = order code) |
|---|---|---|
| Open order, GROB MSP-04 → `R091026900` (id 90001) | `shop.work_orders` | `work_order.opened` + `stage_changed` → `quick_inspection` |
| Submit quick inspection (1 `missing` qty 2, 1 `damaged`/`repair`, 1 `ok`) | `shop.inspections` | `inspection.submitted` |
| Approve it | `shop.inspections` + `shop.work_orders` | `inspection.approved` + `stage_changed` → `awaiting_full_inspection` |
| Register purchase for that order | `shop.purchasing` | `purchase.item_received` (key `PR-9001`, `purpose: restock`) |
| Submit full inspection with no items, then void it | both | `inspection.submitted`, `stage_changed` → `quick_inspection`, `inspection.voided` |
| Move to `cleaning`, then delete the order | `shop.work_orders` | `stage_changed`, `work_order.deleted` |

The panel fills in fields automatically: `missing` always becomes `action: buy`, `ok` gets
`action: null`, and an empty quantity is sent as `null`. Your service then has to fall back to
the BOM's `qty_per_unit` (contract rule 5).

**Error responses**: an unknown stage returns `400 {"detail": "etapa desconocida: nope"}`, and
an unknown route returns `404 {"detail": "no existe"}`.

**Gotchas found while running it**

- **The panel does not validate what you type.** A purchase sent with an empty `part_number`
  (for example for part 24 "FLECHA", which has no SKU) was published with
  `part_number: null, description: null`. `tools/validate_events.py` rejects that event, and a
  strict service may send it to the DLQ. For a part without a SKU, type its label code (`P-24`).
- **Every start replays the whole file** (from the code: there is no offset tracking). Restarting
  the simulator without `RESET=1` publishes all 1,742 messages again with the same `event_id`s.
  Idempotency covers this, but the topics grow.
- **Panel state lives only in memory.** After a restart, orders and inspections created in the
  panel disappear from the UI, and the IDs start again at 90001 / `R<date>900`. Use `RESET=1`
  when you restart for a demo so they don't collide with IDs already on the topics.
- Validation results: the dataset has **0 errors**. Panel events had 0 errors in the session
  above, apart from the null-`part_number` case.

## Event model

Every event, in or out, uses the same envelope (`contract/README.md` §1):

```json
{ "event_id": "uuid", "event_type": "inspection.approved", "event_version": 1,
  "occurred_at": "2026-10-06T16:42:11Z", "source": "shop-floor", "key": "R061026012", "data": {} }
```

| Topic | Events | Direction |
|---|---|---|
| `shop.catalog` | `part.upserted`, `location.upserted`, `bom.upserted` | in |
| `shop.work_orders` | `work_order.opened`, `.stage_changed`, `.deleted` | in |
| `shop.inspections` | `inspection.submitted`, `.approved`, `.rejected`, `.discarded`, `.voided` | in |
| `shop.purchasing` | `purchase.item_received` | in |
| `inventory.events` | `stock.received`, `.unmatched_receipt`, `.reserved`, `.shortage_detected`, `.shortage_resolved`, `.issued`, `.transferred`, `.adjusted`, `.reorder_suggested` | out |
| `inventory.dlq` | original event that couldn't be processed | out |

Delivery guarantees you must design for: **at-least-once** (duplicates), **ordering only per key
within a topic** (cross-topic arrival is arbitrary), and **full retention** (rebuilding from
offset 0 must give the same `on_hand`).

## What your service has to do (summary)

- Only `inspection.approved` creates material need, per `(work order, bom_line_id)`; later
  approvals **replace** the quantity, they don't add.
- On a need: reserve `min(available, need)`, flag the rest as a shortage; `available` never goes below 0.
- Purchase receipts: `restock` → match `part_number` to catalog `sku` (trim + case-insensitive),
  book into location `U-100` (id 100) and fill open shortages; `customer_order` → ignore;
  no/ambiguous match → `stock.unmatched_receipt` for manual resolution.
- Void / delete cancels reservations and closes shortages.
- Idempotent per `event_id`; unknown references are retried/queued; unprocessable events go to
  the DLQ without stopping consumption.
- On a cold start, consume `shop.catalog` to the end **before** the other topics.

Full rules (1–23): [`contract/README.md`](contract/README.md) §3. Required HTTP API:
[`contract/openapi.yaml`](contract/openapi.yaml) — `GET /parts/{id}/availability`,
`/parts/{id}/ledger`, `/work-orders/{code}/materials`, `/shortages`, `/reorder-suggestions`,
`/unmatched-receipts`; `POST /unmatched-receipts/{id}/resolve`, `/issues`, `/transfers`, `/counts`.

## Running it locally

### Prerequisites
- Docker Desktop (Compose v2).
- Optional, for running scripts without Docker: [`uv`](https://docs.astral.sh/uv/) and Python 3.12
  (`confluent-kafka` has no wheel for 3.14 yet).

### 1. Start the kit

```bash
docker compose up -d
docker compose logs -f simulator     # watch topic creation and replay progress
```

| Service | URL / address |
|---|---|
| Broker (from your machine) | `localhost:19092` |
| Broker (from another container on the compose network) | `redpanda:9092` |
| Redpanda Console (inspect topics/messages) | http://localhost:8080 |
| Simulator panel | http://localhost:8090 |

Options (shell env or `.env`):

```bash
SPEED=0 docker compose up -d      # replay with no pauses
SPEED=600 docker compose up -d    # 10 simulated minutes per second
RESET=1 docker compose up -d      # delete and recreate topics (fresh start)
```

The simulator also accepts `NO_REPLAY=1` (panel only, no dataset), `EVENTS`, `PORT` and `BROKER`.

### 2. Run your service

Point it at `localhost:19092` (or `redpanda:9092` if it runs in the compose network) and have it
listen on HTTP port **8000**. Consume the four `shop.*` topics, publish to `inventory.events`
and `inventory.dlq`.

### 3. Develop without a broker

`data/events.jsonl` is the same stream the simulator replays; reading it top to bottom is
equivalent to consuming the topics.

```bash
uv run --with jsonschema tools/validate_events.py data/events.jsonl
uv run --with jsonschema tools/validate_events.py my-outputs.jsonl   # check your own events
```

The validator exits with code 1 on any contract violation.

### 4. Run the contract tests

With the kit up and your service on port 8000:

```bash
docker compose run --rm contract-tests --api http://host.docker.internal:8000

# or without Docker
uv run --python 3.12 --with confluent-kafka==2.6.1 --with jsonschema \
  contract-tests/run_tests.py --api http://localhost:8000
```

| Flag | Purpose |
|---|---|
| `--only a,b` | Run only these scenarios |
| `--timeout 20` | Max seconds to wait for an expected result |
| `--settle 3` | Seconds to wait to confirm something did **not** happen |

Run only **one** inventory service while testing — the tests read everything on `inventory.events`.
Scenarios use their own IDs/SKUs/order codes, so you can re-run without resetting.

Rebuild check (the judges run this):

```bash
docker compose run --rm -v "$PWD:/out" contract-tests snapshot --out /out/saldo.json --api http://host.docker.internal:8000
# wipe your DB, let your service re-read all topics from offset 0
docker compose run --rm -v "$PWD:/out" contract-tests compare  --out /out/saldo.json --api http://host.docker.internal:8000
```

### 5. Try the demo flow

1. Open http://localhost:8090 and receive a machine (opens a work order).
2. Capture its inspection, marking parts as `missing`/`damaged` with action `buy`, then approve it.
3. Your service should show a reservation and a shortage.
4. Register a purchase receipt (matching part number, optionally with the order code) → shortage resolved.
5. Scan a label from `labels/etiquetas-demo.pdf` → `POST /issues` records the exit.

## Troubleshooting

- **Simulator prints "esperando al broker"** — Redpanda is still booting; it retries for ~2 min.
- **Service can't reach the broker** — on the host use `localhost:19092`, inside Docker `redpanda:9092`.
- **Tests can't reach your API from Docker** — use `host.docker.internal`, not `localhost`.
- **Stale data from earlier runs** — `RESET=1 docker compose up -d`, or `docker compose down -v`.
- **Replay too slow** — raise `SPEED` or use `SPEED=0`.

## Further reading

[`contract/README.md`](contract/README.md) · [`contract/openapi.yaml`](contract/openapi.yaml) ·
[`data/README.md`](data/README.md) · [`contract-tests/README.md`](contract-tests/README.md) ·
the challenge PDF in the repo root.