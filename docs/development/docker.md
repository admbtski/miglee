# Docker Development Setup

## Dwa tryby

| Tryb            | Plik                            | Cel                       | Użycie                       |
| --------------- | ------------------------------- | ------------------------- | ---------------------------- |
| **Hybrydowy**   | `docker/docker-compose.dev.yml` | Aktywny development       | `pnpm infra:up` + `pnpm dev` |
| **Full Docker** | `docker-compose.dev.yml`        | Weryfikacja całego stacku | `pnpm docker:up`             |

---

## Tryb Hybrydowy (Zalecany)

Docker uruchamia tylko infrastrukturę (postgres, redis), aplikacje działają lokalnie z pełnym HMR.

### Quick Start

```bash
# 1. Start infrastruktury
pnpm infra:up

# 2. Migracje (pierwszy raz)
cd apps/api && pnpm prisma:migrate && cd ../..

# 3. Start aplikacji
pnpm dev
```

### Komendy

| Komenda                  | Opis                              |
| ------------------------ | --------------------------------- |
| `pnpm infra:up`          | Start postgres + redis            |
| `pnpm infra:up:tools`    | + Adminer (http://localhost:8080) |
| `pnpm infra:up:stripe`   | + Stripe CLI                      |
| `pnpm infra:down`        | Stop                              |
| `pnpm infra:logs`        | Logi                              |
| `pnpm infra:logs:stripe` | Logi Stripe CLI                   |
| `pnpm infra:ps`          | Status                            |

### Stripe CLI (tryb hybrydowy)

```bash
# Start Stripe
pnpm infra:up:stripe

# Zobacz logi - skopiuj webhook secret (whsec_...)
pnpm infra:logs:stripe

# Dodaj do .env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

Stripe CLI forwarduje do `http://host.docker.internal:4000/webhooks/stripe` (twoja lokalna aplikacja).

### Dostępne serwisy

| Serwis       | URL                                |
| ------------ | ---------------------------------- |
| Web App      | http://localhost:3000              |
| GraphQL API  | http://localhost:4000/graphql      |
| GraphiQL     | http://localhost:4000/graphiql     |
| Health Check | http://localhost:4000/health       |
| Bull Board   | http://localhost:4000/admin/queues |
| Adminer      | http://localhost:8080              |

---

## Tryb Full Docker (Weryfikacja)

Wszystko w kontenerach. Używaj do weryfikacji czy stack działa przed deploymentem.

**⚠️ Brak HMR - zmiany wymagają przebudowania obrazu.**

### Quick Start

```bash
# 1. Zbuduj obrazy
pnpm docker:build

# 2. Start
pnpm docker:up

# 3. Migracje
docker compose -f docker-compose.dev.yml exec api pnpm -C apps/api prisma:migrate
```

### Komendy

| Komenda                  | Opis                                   |
| ------------------------ | -------------------------------------- |
| `pnpm docker:build`      | Buduj obrazy                           |
| `pnpm docker:up`         | Start core (postgres, redis, api, web) |
| `pnpm docker:up:workers` | + Background workers                   |
| `pnpm docker:up:tools`   | + Adminer                              |
| `pnpm docker:up:stripe`  | + Stripe CLI                           |
| `pnpm docker:up:all`     | Wszystko                               |
| `pnpm docker:down`       | Stop                                   |
| `pnpm docker:logs`       | Logi                                   |
| `pnpm docker:logs:api`   | Logi API                               |
| `pnpm docker:logs:web`   | Logi Web                               |
| `pnpm docker:ps`         | Status                                 |
| `pnpm docker:restart`    | Restart                                |

### Stripe CLI (full docker)

```bash
pnpm docker:up:stripe
docker compose -f docker-compose.dev.yml logs -f stripe
# Skopiuj whsec_... do .env
```

---

## Konfiguracja

### Pierwsza konfiguracja

```bash
cp env.example .env
pnpm install
```

### Zmienne środowiskowe

Edytuj `.env`:

```bash
# Baza danych (automatycznie dla obu trybów)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app?schema=public

# JWT (wymagane)
JWT_SECRET=twoj-secret-min-32-znaki

# Stripe (opcjonalne)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (opcjonalne)
RESEND_API_KEY=re_...
```

---

## Baza danych

### Migracje

```bash
# Tryb hybrydowy
cd apps/api && pnpm prisma:migrate

# Full Docker
docker compose -f docker-compose.dev.yml exec api pnpm -C apps/api prisma:migrate
```

### Prisma Studio

```bash
cd apps/api && pnpm prisma:studio
# http://localhost:5555
```

### Adminer

```bash
pnpm infra:up:tools  # lub docker:up:tools
# http://localhost:8080
# Serwer: postgres (lub localhost w hybrydowym)
# User: postgres, Hasło: postgres, Baza: app
```

### Reset bazy

```bash
# Tryb hybrydowy
cd apps/api && pnpm prisma:reset

# Full Docker
docker compose -f docker-compose.dev.yml exec api pnpm -C apps/api prisma:reset
```

---

## Troubleshooting

### Port zajęty

```bash
lsof -i :3000
lsof -i :4000
kill -9 <PID>
```

### "Database does not exist"

```bash
docker compose -f docker/docker-compose.dev.yml exec postgres createdb -U postgres app
```

### Stripe webhooks nie dochodzą

1. Sprawdź czy Stripe CLI działa:

   ```bash
   pnpm infra:logs:stripe
   ```

2. Sprawdź endpoint:

   ```bash
   curl -X POST http://localhost:4000/webhooks/stripe
   # Powinno zwrócić błąd signature, nie 404
   ```

3. Sprawdź `STRIPE_WEBHOOK_SECRET` w `.env`

### Problemy z obrazami Docker

```bash
pnpm docker:down
docker volume prune -f
pnpm docker:build --no-cache
pnpm docker:up
```

---

## Architektura

### Tryb Hybrydowy

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOST (macOS/Linux)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│   │     web      │   │     api      │   │   workers    │       │
│   │  Next.js 15  │──▶│  Fastify 5   │◀──│  (BullMQ)    │       │
│   │  :3000       │   │  :4000       │   │              │       │
│   │  (pnpm dev)  │   │  (pnpm dev)  │   │  (pnpm dev)  │       │
│   └──────────────┘   └──────────────┘   └──────────────┘       │
│           │                  │                  │               │
│           └──────────────────┴──────────────────┘               │
│                              │                                  │
│ ┌────────────────────────────▼────────────────────────────────┐│
│ │                    Docker (infra)                            ││
│ │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐     ││
│ │  │   postgres   │   │    redis     │   │  stripe-cli  │     ││
│ │  │   :5432      │   │    :6379     │   │  (profile)   │     ││
│ │  └──────────────┘   └──────────────┘   └──────────────┘     ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Tryb Full Docker

```
┌─────────────────────────────────────────────────────────────────┐
│                   Docker Network: miglee-network                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│   │     web      │   │     api      │   │   workers    │       │
│   │  Next.js 15  │──▶│  Fastify 5   │◀──│  (profile)   │       │
│   │  :3000       │   │  :4000       │   │              │       │
│   └──────────────┘   └──────────────┘   └──────────────┘       │
│                              │                                  │
│   ┌──────────────┐   ┌──────▼───────┐   ┌──────────────┐       │
│   │   postgres   │   │    redis     │   │  stripe-cli  │       │
│   │   :5432      │   │    :6379     │   │  (profile)   │       │
│   └──────────────┘   └──────────────┘   └──────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Exposed: 3000 (web), 4000 (api), 5432 (pg), 6379 (redis), 8080 (adminer)
```

---

## Pliki

| Plik                            | Opis                            |
| ------------------------------- | ------------------------------- |
| `docker-compose.dev.yml`        | Full Docker (weryfikacja)       |
| `docker/docker-compose.dev.yml` | Tryb hybrydowy (infra + stripe) |
| `docker/Dockerfile.api`         | Obraz API                       |
| `docker/Dockerfile.web`         | Obraz Web                       |
| `env.example`                   | Szablon zmiennych               |
| `.dockerignore`                 | Ignorowane przy budowaniu       |
