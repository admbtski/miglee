# CI/CD Pipeline Documentation

> GitHub Actions workflows for continuous integration and deployment.

## Spis treści

1. [Przegląd Workflows](#przegląd-workflows)
2. [CI - Pull Request Validation](#ci---pull-request-validation)
3. [Build and Push](#build-and-push)
4. [Deploy Stage](#deploy-stage)
5. [Deploy Production](#deploy-production)
6. [Konfiguracja](#konfiguracja)
7. [Troubleshooting](#troubleshooting)

---

## Przegląd Workflows

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CI/CD Pipeline                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PR → main                                                           │
│    │                                                                 │
│    ├── ci.yml ─────────────────────────────────────────────────────►│
│    │   ├── Lint                                                      │
│    │   ├── Type Check                                                │
│    │   ├── Tests (with Postgres + Redis)                            │
│    │   ├── Build                                                     │
│    │   └── Validate K8s Manifests                                   │
│    │                                                                 │
│  Push → main                                                         │
│    │                                                                 │
│    ├── build-and-push.yml ─────────────────────────────────────────►│
│    │   ├── Build API image                                          │
│    │   ├── Build Web image                                          │
│    │   ├── Push to registry (sha-xxx)                               │
│    │   ├── Security scan (Trivy)                                    │
│    │   └── Trigger deploy-stage                                     │
│    │                                                                 │
│    └── deploy-stage.yml ───────────────────────────────────────────►│
│        ├── Run migrations                                            │
│        ├── Deploy to stage                                          │
│        └── Smoke tests                                               │
│                                                                      │
│  Tag v*.*.* ──────────────────────────────────────────────────────► │
│    │                                                                 │
│    ├── build-and-push.yml (with :latest tag)                        │
│    │                                                                 │
│    └── deploy-prod.yml ────────────────────────────────────────────►│
│        ├── Pre-deployment checks                                     │
│        ├── Database backup (RDS snapshot)                           │
│        ├── Manual approval ⏸️                                        │
│        ├── Run migrations                                            │
│        ├── Deploy to production                                      │
│        ├── Smoke tests                                               │
│        └── Notifications                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## CI - Pull Request Validation

**Plik**: `.github/workflows/ci.yml`

**Trigger**: PR do `main`, push do `main`

### Jobs:

| Job | Opis | Czas |
|-----|------|------|
| `lint` | ESLint + TypeScript check | ~2-3 min |
| `test` | Testy z Postgres + Redis | ~3-5 min |
| `build` | Kompilacja API + Web | ~3-5 min |
| `validate-k8s` | Walidacja manifestów K8s | ~30s |

### Wymagania:
- Wszystkie joby muszą przejść przed merge

---

## Build and Push

**Plik**: `.github/workflows/build-and-push.yml`

**Trigger**: Push do `main`, tag `v*.*.*`

### Tagowanie obrazów:

| Trigger | Tagi |
|---------|------|
| Push do main | `sha-abc1234`, `main` |
| Tag v1.2.3 | `sha-abc1234`, `v1.2.3`, `latest` |

### Registry:

Domyślnie: GitHub Container Registry (`ghcr.io`)

Alternatywy:
- AWS ECR: odkomentuj sekcje AWS w workflow
- Docker Hub: zmień `REGISTRY` env

---

## Deploy Stage

**Plik**: `.github/workflows/deploy-stage.yml`

**Trigger**: Wywołany przez `build-and-push` lub manual

### Kroki:
1. Run database migrations (Job)
2. Update image tags w Kustomize
3. `kubectl apply -k`
4. Wait for rollout
5. Smoke tests

---

## Deploy Production

**Plik**: `.github/workflows/deploy-prod.yml`

**Trigger**: Tag `v*.*.*` lub manual dispatch

### Kroki:
1. **Pre-deploy**: Weryfikacja obrazu
2. **Backup**: Snapshot RDS (przed migracją)
3. **Manual Approval**: Wymaga zatwierdzenia w GitHub
4. **Migrate**: Prisma migrate deploy
5. **Deploy**: kubectl apply
6. **Smoke tests**: Health checks
7. **Notify**: Slack (opcjonalnie)

### Wymagana konfiguracja:

W GitHub → Settings → Environments → `production`:
- Wymagaj approval od maintainerów
- Ustaw protection rules

---

## Konfiguracja

### GitHub Secrets (Settings → Secrets and variables → Actions)

| Secret | Opis | Wymagany |
|--------|------|----------|
| `AWS_ACCESS_KEY_ID` | AWS credentials | Dla EKS |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials | Dla EKS |
| `AWS_REGION` | np. `eu-central-1` | Dla EKS |
| `SLACK_WEBHOOK_URL` | Notyfikacje | Opcjonalnie |

### GitHub Variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Opis | Przykład |
|----------|------|----------|
| `NEXT_PUBLIC_API_URL` | URL API dla build | `https://api.example.com` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `wss://api.example.com` |
| `STAGE_API_URL` | Stage API dla smoke tests | `https://stage.api.example.com` |
| `PROD_API_URL` | Prod API dla smoke tests | `https://api.example.com` |

### GitHub Environments (Settings → Environments)

1. **stage**
   - No protection rules (auto-deploy)

2. **production**
   - Required reviewers: 1+
   - Wait timer: 0-5 min (opcjonalnie)
   - Deployment branches: `main` only

---

## Troubleshooting

### Build fails - "pnpm install" error

```
Error: Cannot find lockfile
```

**Fix**: Upewnij się, że `pnpm-lock.yaml` jest w repo.

### Deploy fails - "kubectl: command not found"

GitHub-hosted runners mają kubectl zainstalowany. Dla self-hosted:
```bash
curl -LO "https://dl.k8s.io/release/stable.txt"
```

### Image push fails - "denied: permission denied"

1. Sprawdź `packages: write` permission w workflow
2. Dla ECR: sprawdź IAM permissions

### Migrations fail

```bash
# Sprawdź logi migration job
kubectl -n appname-stage logs job/migrate-db

# Rollback (jeśli trzeba)
kubectl -n appname-stage rollout undo deployment/api
```

### Rollback deployment

```bash
# Sprawdź historię
kubectl -n appname-prod rollout history deployment/api

# Rollback do poprzedniej wersji
kubectl -n appname-prod rollout undo deployment/api

# Lub do konkretnej rewizji
kubectl -n appname-prod rollout undo deployment/api --to-revision=5
```

---

## Lokalne testowanie workflows

```bash
# Zainstaluj act (GitHub Actions local runner)
brew install act

# Uruchom CI workflow lokalnie
act pull_request -W .github/workflows/ci.yml

# Z secrets
act pull_request -W .github/workflows/ci.yml --secret-file .secrets
```

---

## Checklist przed pierwszym deploy

- [ ] Secrets skonfigurowane w GitHub
- [ ] Environments utworzone (stage, production)
- [ ] AWS credentials działają (jeśli EKS)
- [ ] Registry dostępny (ghcr.io lub ECR)
- [ ] Domeny skonfigurowane
- [ ] TLS certyfikaty (cert-manager lub ACM)

