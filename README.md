# NestJS Refactoring Exercise

A hands-on exercise for practising **SOLID principles** and **clean-code refactoring** in a realistic NestJS application.

The repo ships a small but deliberately *messy* books API. The happy path works, but the code is riddled with the kinds of architectural shortcuts that pile up under deadline pressure. Your job is to **find the violations, name the principle each one breaks, and refactor the code to be production-ready** without throwing the framework away.

> The goal isn't academic purity. It's protecting core business logic from external volatility (databases, third-party SDKs, config, cross-cutting concerns) so the codebase stays modular, testable, and resilient to change.

---

## The scenario

A `books` service that can:

- **Create** a book, enriching missing `title`/`author` from a third-party metadata SDK (faked `OpenLibrarySdk`).
- **Price** books with country-specific tax and tier rules.
- **Notify** an admin by email/SMS when things happen.
- **Purchase** a book, reserving stock in an external warehouse (faked HTTP client) inside a DB transaction.

It works, as long as a pile of environment variables happens to be set correctly. That fragility is part of the lesson.

---

## The task

Work through it in three passes.

### 1. Spot the issues
Read the code under [`src/books/`](src/books/) and, for each smell you find, note:
1. **Where** it is (file + rough line).
2. **What** is wrong.
3. **Which principle** it compromises.

### 2. Refactor
Fix them one category at a time. Commit each refactor separately so the before/after diff stays readable. Keep the API behaviour identical, only the structure should change.

### 3. Verify
After each refactor, confirm the app still boots and the endpoints still behave (see [Running it](#running-it)). Bonus: add the unit tests that the original code made impossible.

---

## Issues to hunt for

There are **8 planted anti-patterns**. Each maps to a principle and a real production risk.

| # | Anti-pattern | Principle | Why it hurts in production |
|---|--------------|-----------|----------------------------|
| 1 | **Bloated controller** | SRP | A controller doing routing + validation + hashing + notifications is fragile and near-impossible to unit-test. |
| 2 | **Hardcoded vendor SDK** | OCP / DIP | A concrete third-party SDK wired straight into a service makes swapping or upgrading vendors a rewrite. |
| 3 | **Overloaded interface** | ISP / LSP | A fat interface forces specialised implementations to stub irrelevant methods: dead code or runtime "Not Implemented" throws. |
| 4 | **ORM leakage** | Clean boundaries | Injecting the ORM connection / entities into business logic leaks persistence details and locks you to one database. |
| 5 | **Dual-write problem** | Distributed integrity | A network call inside a DB transaction can't be rolled back, leaving inconsistent state when the remote call fails. |
| 6 | **Nested switch-case** | OCP | Editing a core service for every new country/tier rule risks breaking the existing ones. |
| 7 | **Tangled cross-cutting concern** | SRP | Timers, logging, and metrics smeared through business methods clutter the core logic. |
| 8 | **Untrusted environment** | DIP | Raw `process.env` reads buried in business logic cause brittle runtime crashes when a variable is missing or malformed. |

<details>
<summary>Hints for where to look (no spoilers)</summary>

- *"What would I have to change, and where, if a requirement shifted?"* points at OCP / DIP
- *"Could I unit-test this without a database or network?"* points at coupling / boundaries
- *"If this line fails, what state am I left in?"* points at integrity
- *"Is this line about books, or about plumbing?"* points at SRP

</details>

---

## Project layout

```
src/
├── app.module.ts              # root module, TypeORM + config wiring
├── data-source.ts             # standalone DataSource for the migration CLI
├── migrations/                # schema history (books table, price column)
└── books/
    ├── books.controller.ts    # HTTP layer
    ├── books.service.ts       # core orchestration
    ├── notifications.ts       # email/SMS notifiers
    ├── pricing/
    │   └── pricing.service.ts # price + tax calculation
    ├── vendor/
    │   ├── open-library.sdk.ts  # faked metadata SDK
    │   └── http-client.ts       # faked warehouse HTTP client
    ├── dto/
    └── entities/book.entity.ts
```

The git history is part of the exercise:

- `scaffold nestjs app …` is the clean starting point.
- `add book enrichment, pricing, notifications and purchase flow` is the messy "before" state you're refactoring.

---

## Running it

### Prerequisites
- Node.js 20+
- PostgreSQL running locally on `5432`

### Setup

```bash
npm install
```

Create a database and a `.env` file in the project root:

```bash
createdb application

cat > .env <<'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=application
EOF
```

### Migrations

Schema is migration-driven (`synchronize` is off, on purpose).

```bash
npm run migration:run                                  # apply pending migrations
npm run migration:generate -- src/migrations/SomeName  # diff entities into a new migration
npm run migration:revert                               # roll back the last one
```

### Start

```bash
npm run start:dev
```

The feature paths depend on these environment variables. Note how their absence breaks things (that's issue #8):

| Variable | Used for | If missing |
|----------|----------|------------|
| `OPEN_LIBRARY_API_KEY` | metadata enrichment | enrichment throws at runtime |
| `DEFAULT_BOOK_PRICE` | base price (default `9.99`) | silently uses default |
| `DEFAULT_COUNTRY` | tax region (default `US`) | silently uses default |
| `NOTIFICATIONS_ENABLED` | toggle notifications | notifications silently skipped |
| `ADMIN_EMAIL` | notification recipient | falls back to a placeholder |

```bash
OPEN_LIBRARY_API_KEY=fake-key NOTIFICATIONS_ENABLED=true npm run start:dev
```

### Try the API

```bash
# create with metadata enrichment (title/author auto-filled from ISBN)
curl -X POST localhost:3000/books -H 'Content-Type: application/json' \
  -d '{"isbn":9780132350123}'

# create with a bad ISBN (controller validation rejects it)
curl -X POST localhost:3000/books -H 'Content-Type: application/json' \
  -d '{"isbn":123}'

# purchase (reserves warehouse stock inside a DB transaction)
curl -X POST localhost:3000/books/1/purchase -H 'Content-Type: application/json' \
  -d '{"quantity":2}'

# list
curl localhost:3000/books
```

---

## Suggested refactoring direction

Not prescriptive, but the production-grade shape usually involves:

- A **repository abstraction** so business logic doesn't depend on TypeORM directly (4).
- A **vendor port + adapter** for the metadata SDK and warehouse client (2, 5).
- **Segregated notifier interfaces** (e.g. `EmailNotifier`, `SmsNotifier`) instead of one fat one (3).
- A **strategy / registry** for pricing rules instead of nested switches (6).
- **Pipes / `class-validator`** to move validation out of the controller (1).
- **Interceptors** for timing and metrics instead of inline timers (7).
- A typed, validated **config module** instead of scattered `process.env` reads (8).
- Moving the warehouse call **outside** the transaction (or an outbox pattern) to fix the dual-write (5).

---

## License

UNLICENSED, for learning purposes.
