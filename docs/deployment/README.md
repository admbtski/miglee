# Deployment Documentation

Dokumentacja deploymentu aplikacji na AWS (EKS) z podejściem platform-agnostic.

## Dokumenty

| Dokument | Opis |
|----------|------|
| [ROADMAP.md](./ROADMAP.md) | Pełny roadmap deploymentu: fazy, zadania, checklist |
| [docker.md](../development/docker.md) | Lokalne środowisko Docker (dev) |

## Quick Links

### Środowiska

| Env | Namespace | URL (przykład) |
|-----|-----------|----------------|
| dev | - | localhost:3000 / :4000 |
| stage | `appname-stage` | app.stage.domain.com |
| prod | `appname-prod` | app.domain.com |

### Komendy

```bash
# Lokalne dev (docker)
pnpm infra:up && pnpm dev

# Build produkcyjnych obrazów
docker build -f docker/Dockerfile.api.prod -t appname-api:latest .
docker build -f docker/Dockerfile.web.prod -t appname-web:latest .

# Deploy stage (z CI/CD)
# Automatycznie na push do main

# Deploy prod (z CI/CD)  
# Na tag v* + manual approval
```

## Architektura

```
                    ┌─────────────┐
                    │   ALB/NLB   │
                    │   + WAF     │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
        ┌─────▼─────┐            ┌─────▼─────┐
        │    Web    │            │    API    │
        │  Next.js  │───────────▶│  Fastify  │
        │  (SSR)    │            │  GraphQL  │
        └───────────┘            └─────┬─────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
              ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
              │  Workers  │      │    RDS    │      │  Redis    │
              │  BullMQ   │      │ PostgreSQL│      │ElastiCache│
              └───────────┘      └───────────┘      └───────────┘
```

## Status

Zobacz [ROADMAP.md](./ROADMAP.md) dla aktualnego statusu i następnych kroków.

