# Deployment Roadmap: Dev → Stage → Production (AWS + K8s)

> **Cel**: Platform-agnostic konteneryzacja gotowa na Kubernetes, z AWS jako pierwszym targetem.
> **Zasada**: Kod i obrazy są neutralne, adaptery infrastruktury są wymienne.

---

## Spis treści

1. [Obecny stan](#obecny-stan)
2. [Architektura docelowa](#architektura-docelowa)
3. [Faza 1: Fundamenty](#faza-1-fundamenty)
4. [Faza 2: Kubernetes Manifests](#faza-2-kubernetes-manifests)
5. [Faza 3: CI/CD](#faza-3-cicd)
6. [Faza 4: Observability](#faza-4-observability)
7. [Faza 5: Security Hardening](#faza-5-security-hardening)
8. [Faza 6: Dokumentacja operacyjna](#faza-6-dokumentacja-operacyjna)
9. [Decyzje architektoniczne](#decyzje-architektoniczne)
10. [Checklist przed produkcją](#checklist-przed-produkcją)

---

## Obecny stan

| Obszar | Status | Uwagi |
|--------|--------|-------|
| **Dockerfiles** | ⚠️ Częściowo | Dev Dockerfiles istnieją, brak production-optimized |
| **Health endpoints** | ⚠️ Częściowo | `/health` istnieje, brak `/readyz` (DB+Redis check) |
| **Graceful shutdown** | ⚠️ Częściowo | Wymaga review (SIGTERM handling) |
| **Kubernetes manifests** | ❌ Brak | Do stworzenia od zera |
| **CI/CD** | ❌ Brak | GitHub Actions do napisania |
| **OpenTelemetry** | ❌ Brak | Tylko Pino logging |
| **GraphQL limits** | ⚠️ Częściowo | depth-limit jest, brak complexity |
| **Resolver metrics** | ❌ Brak | Do instrumentacji |
| **WebSocket limits** | ⚠️ Częściowo | Rate limiting jest, brak per-connection limits |
| **Pod security** | ❌ N/A | K8s manifesty nie istnieją |
| **Runbooks** | ❌ Brak | Do napisania |

---

## Architektura docelowa

### Komponenty produkcyjne

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              KUBERNETES CLUSTER                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────┐  │
│  │     Web     │    │     API     │    │         Workers             │  │
│  │  Next.js    │───▶│  Fastify    │◀───│  reminders │ feedback │ audit│  │
│  │  :3000      │    │  :4000      │    │                             │  │
│  │  2+ repliki │    │  2+ repliki │    │  1 replika każdy            │  │
│  └─────────────┘    └─────────────┘    └─────────────────────────────┘  │
│         │                  │                         │                   │
│         ▼                  ▼                         ▼                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                        Managed Services                          │    │
│  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐         │    │
│  │  │   RDS        │   │ ElastiCache  │   │     S3       │         │    │
│  │  │ PostgreSQL   │   │    Redis     │   │   Storage    │         │    │
│  │  │   + PostGIS  │   │              │   │              │         │    │
│  │  └──────────────┘   └──────────────┘   └──────────────┘         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  AWS ALB/NLB    │◀── Internet traffic
│  + WAF (opcja)  │
│  + ACM (TLS)    │
└─────────────────┘
```

### Środowiska

| Środowisko | Namespace | Cel | Repliki |
|------------|-----------|-----|---------|
| **dev** | `appname-dev` | Lokalne docker-compose | 1 |
| **stage** | `appname-stage` | Test przed prod, mniejsza skala | 1-2 |
| **prod** | `appname-prod` | Produkcja, HA | 2+ |

### Nazewnictwo workloadów

```
appname-{env}/
├── web                    # Next.js SSR
├── api                    # Fastify GraphQL
├── worker-reminders       # BullMQ worker
├── worker-feedback        # BullMQ worker
├── worker-audit-archive   # BullMQ worker
├── configmap-app          # Konfiguracja jawna
├── secret-app             # Sekrety (z Secrets Manager)
└── ingress                # Routing + TLS
```

---

## Faza 1: Fundamenty

> **Cel**: Przygotowanie aplikacji do uruchomienia w K8s bez zmian w kodzie.

### 1.1 Production Dockerfiles

**Status**: ⚠️ Do zrobienia  
**Czas**: 2-3h  
**Plik**: `docker/Dockerfile.api.prod`, `docker/Dockerfile.web.prod`

**Wymagania**:
- [ ] Multi-stage build (builder → runner)
- [ ] Non-root user w runnerze
- [ ] `NODE_ENV=production`
- [ ] Tylko produkcyjne dependencies
- [ ] Expose port (3000/4000)
- [ ] HEALTHCHECK instruction
- [ ] Read-only filesystem gdzie możliwe

**Struktura**:
```dockerfile
# Stage 1: Builder
FROM node:22-alpine AS builder
# install pnpm, copy lockfile, install deps, build

# Stage 2: Runner  
FROM node:22-alpine AS runner
USER node
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

### 1.2 Health Endpoints

**Status**: ⚠️ Częściowo  
**Czas**: 1h  
**Plik**: `apps/api/src/routes/health.ts`

**Wymagania**:

| Endpoint | Cel | Checks | K8s Probe |
|----------|-----|--------|-----------|
| `GET /healthz` | Czy proces żyje | Zawsze 200 | livenessProbe |
| `GET /readyz` | Czy gotowy do ruchu | DB + Redis ping | readinessProbe |

**Implementacja `/readyz`**:
```typescript
// Sprawdź:
// 1. prisma.$queryRaw`SELECT 1`
// 2. redis.ping()
// Zwróć 200 tylko jeśli oba OK
```

**Dla Web (Next.js)**:
- `/api/health` - już istnieje
- `/api/ready` - opcjonalnie sprawdza połączenie z API

### 1.3 Graceful Shutdown

**Status**: ⚠️ Wymaga review  
**Czas**: 1-2h  
**Plik**: `apps/api/src/index.ts`

**Wymagania**:
- [ ] Obsługa `SIGTERM` i `SIGINT`
- [ ] Stop accepting new connections
- [ ] Drain existing requests (timeout 30s)
- [ ] Close DB connections
- [ ] Close Redis connections
- [ ] Close WebSocket connections
- [ ] Exit process

**Sekwencja**:
```
SIGTERM received
    ↓
readiness → false (K8s stops sending traffic)
    ↓
wait for in-flight requests (max 30s)
    ↓
close WebSocket connections
    ↓
close Redis connections  
    ↓
close DB connections
    ↓
process.exit(0)
```

### 1.4 Environment Config Split

**Status**: ✅ Częściowo (env.ts istnieje)  
**Czas**: 1h

**Podział ConfigMap vs Secret**:

| ConfigMap (jawne) | Secret (wrażliwe) |
|-------------------|-------------------|
| `NODE_ENV` | `DATABASE_URL` |
| `PORT` | `REDIS_PASSWORD` |
| `LOG_LEVEL` | `JWT_SECRET` |
| `CORS_ORIGINS` | `STRIPE_SECRET_KEY` |
| `APP_URL` | `STRIPE_WEBHOOK_SECRET` |
| `API_URL` | `RESEND_API_KEY` |
| `ENABLE_BULL_BOARD` | `S3_ACCESS_KEY` |
| `OTEL_*` | `S3_SECRET_KEY` |

### 1.5 GraphQL Complexity Limit

**Status**: ⚠️ Brak  
**Czas**: 1h  
**Plik**: `apps/api/src/graphql/index.ts`

**Wymagania**:
- [ ] Depth limit: już jest (`graphql-depth-limit`)
- [ ] Complexity limit: dodać (`graphql-query-complexity`)
- [ ] Max complexity: np. 1000
- [ ] Log when rejected

---

## Faza 2: Kubernetes Manifests

> **Cel**: Pełna definicja K8s resources dla stage/prod.

### 2.1 Struktura katalogów

**Czas**: 30min

```
infra/
└── k8s/
    ├── base/                    # Wspólne definicje
    │   ├── kustomization.yaml
    │   ├── namespace.yaml
    │   └── labels.yaml
    │
    ├── components/              # Reużywalne komponenty
    │   ├── api/
    │   │   ├── deployment.yaml
    │   │   ├── service.yaml
    │   │   └── hpa.yaml
    │   ├── web/
    │   │   ├── deployment.yaml
    │   │   ├── service.yaml
    │   │   └── hpa.yaml
    │   └── workers/
    │       ├── reminders.yaml
    │       ├── feedback.yaml
    │       └── audit-archive.yaml
    │
    └── envs/
        ├── stage/
        │   ├── kustomization.yaml
        │   ├── namespace.yaml
        │   ├── configmap.yaml
        │   ├── ingress.yaml
        │   └── patches/
        │       └── replicas.yaml
        │
        └── prod/
            ├── kustomization.yaml
            ├── namespace.yaml
            ├── configmap.yaml
            ├── ingress.yaml
            ├── pdb.yaml
            └── patches/
                └── replicas.yaml
```

### 2.2 Labels Standard

**Wszystkie workloady muszą mieć**:
```yaml
metadata:
  labels:
    app.kubernetes.io/name: appname
    app.kubernetes.io/component: api | web | worker-reminders | ...
    app.kubernetes.io/part-of: appname
    app.kubernetes.io/version: <git_sha>
    app.kubernetes.io/managed-by: kustomize
```

### 2.3 API Deployment

**Czas**: 2h  
**Plik**: `infra/k8s/components/api/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 2  # Overlay per env
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  template:
    spec:
      terminationGracePeriodSeconds: 30
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      containers:
        - name: api
          image: <ecr>/appname-api:sha-xxx
          ports:
            - containerPort: 4000
          env:
            - name: NODE_ENV
              value: production
          envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: app-secrets
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /healthz
              port: 4000
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /readyz
              port: 4000
            initialDelaySeconds: 5
            periodSeconds: 5
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
```

### 2.4 Web Deployment

**Czas**: 1h  
**Plik**: `infra/k8s/components/web/deployment.yaml`

Analogicznie do API, ale:
- Port: 3000
- Image: `appname-web:sha-xxx`
- Health: `/api/health`

### 2.5 Workers Deployments

**Czas**: 1h  
**Pliki**: `infra/k8s/components/workers/*.yaml`

```yaml
# worker-reminders.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker-reminders
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: worker
          image: <ecr>/appname-api:sha-xxx  # Ten sam obraz co API
          command: ["pnpm", "worker:reminders"]
          # Brak portów
          # Brak probes HTTP (opcjonalnie exec probe)
```

### 2.6 Ingress

**Czas**: 1h  
**Plik**: `infra/k8s/envs/{stage,prod}/ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: appname-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: <acm-cert-arn>
spec:
  rules:
    - host: app.domain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 3000
    - host: api.domain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 4000
```

### 2.7 HPA + PDB

**Czas**: 1h

**HorizontalPodAutoscaler**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

**PodDisruptionBudget**:
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/component: api
```

### 2.8 Migration Job

**Czas**: 1h  
**Plik**: `infra/k8s/components/jobs/migrate.yaml`

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: migrate-{{ .Values.sha }}
spec:
  backoffLimit: 3
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: <ecr>/appname-api:sha-xxx
          command: ["pnpm", "-C", "apps/api", "prisma:migrate", "deploy"]
          envFrom:
            - secretRef:
                name: app-secrets
```

---

## Faza 3: CI/CD

> **Cel**: Automatyczny pipeline build → test → deploy.

### 3.1 Workflow: PR Validation (`ci.yml`)

**Czas**: 1h  
**Trigger**: Pull Request

```yaml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test  # gdy będą testy
```

### 3.2 Workflow: Build & Push (`build.yml`)

**Czas**: 2h  
**Trigger**: Push to main / Tag

```yaml
name: Build
on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        
      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2
        
      - name: Build API image
        run: |
          docker build -f docker/Dockerfile.api.prod \
            -t $ECR_REGISTRY/appname-api:sha-${{ github.sha }} .
          docker push $ECR_REGISTRY/appname-api:sha-${{ github.sha }}
          
      - name: Build Web image
        run: |
          docker build -f docker/Dockerfile.web.prod \
            -t $ECR_REGISTRY/appname-web:sha-${{ github.sha }} .
          docker push $ECR_REGISTRY/appname-web:sha-${{ github.sha }}
```

### 3.3 Workflow: Deploy Stage (`deploy-stage.yml`)

**Czas**: 2h  
**Trigger**: Push to main (after build)

```yaml
name: Deploy Stage
on:
  workflow_run:
    workflows: [Build]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    environment: stage
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure kubectl
        uses: aws-actions/amazon-eks-update-kubeconfig@v2
        
      - name: Run migrations
        run: |
          kubectl apply -f infra/k8s/jobs/migrate.yaml
          kubectl wait --for=condition=complete job/migrate-$SHA
          
      - name: Deploy
        run: |
          cd infra/k8s/envs/stage
          kustomize edit set image appname-api=$ECR/appname-api:sha-$SHA
          kustomize edit set image appname-web=$ECR/appname-web:sha-$SHA
          kustomize build . | kubectl apply -f -
          
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/api -n appname-stage
          kubectl rollout status deployment/web -n appname-stage
          
      - name: Smoke test
        run: |
          curl -f https://api.stage.domain.com/healthz
          curl -f https://app.stage.domain.com/api/health
```

### 3.4 Workflow: Deploy Prod (`deploy-prod.yml`)

**Czas**: 2h  
**Trigger**: Tag + Manual approval

```yaml
name: Deploy Prod
on:
  push:
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: prod  # Wymaga approval w GitHub
    steps:
      # ... analogicznie do stage
      # + snapshot DB przed migracją
```

---

## Faza 4: Observability

> **Cel**: Widzieć co się dzieje w systemie.

### 4.1 OpenTelemetry SDK

**Czas**: 2h  
**Plik**: `apps/api/src/lib/otel.ts`

**Wymagania**:
- [ ] Zainstalować: `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`
- [ ] Konfiguracja exportera OTLP
- [ ] Propagacja kontekstu (trace_id)
- [ ] Instrumentacja HTTP/Fastify

### 4.2 Resolver Metrics

**Czas**: 2h  
**Plik**: `apps/api/src/graphql/utils/resolver-metrics.ts`

```typescript
// Wrapper dla resolverów
// Mierzy: histogram czasu, counter błędów
// Labels: gql_type, field, success

const resolverDuration = new Histogram({
  name: 'graphql_resolver_duration_seconds',
  help: 'GraphQL resolver duration',
  labelNames: ['type', 'field', 'success'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
```

### 4.3 Trace ID in Logs

**Czas**: 1h  
**Plik**: `apps/api/src/lib/pino.ts`

```typescript
// Dodać do każdego loga:
// trace_id, span_id z OTel context
```

### 4.4 Metryki minimum

| Metryka | Typ | Labels |
|---------|-----|--------|
| `http_request_duration_seconds` | Histogram | method, path, status |
| `graphql_resolver_duration_seconds` | Histogram | type, field, success |
| `graphql_errors_total` | Counter | type, code |
| `db_query_duration_seconds` | Histogram | operation |
| `redis_operation_duration_seconds` | Histogram | command |
| `ws_connections_active` | Gauge | - |
| `bullmq_jobs_total` | Counter | queue, status |
| `bullmq_job_duration_seconds` | Histogram | queue |

### 4.5 Alerty minimum (prod)

| Alert | Warunek | Severity |
|-------|---------|----------|
| API high latency | p95 > 2s przez 5min | warning |
| API error rate | 5xx > 5% przez 5min | critical |
| API down | 0 healthy pods | critical |
| DB connection errors | > 10/min | critical |
| Redis errors | > 10/min | warning |
| Worker backlog | oldest job > 30min | warning |
| Pod restarts | > 3 w 10min | warning |
| HPA maxed out | replicas = max przez 10min | warning |

---

## Faza 5: Security Hardening

> **Cel**: Minimalizacja powierzchni ataku.

### 5.1 Pod Security

**Wszystkie pody muszą mieć**:
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop: ["ALL"]
```

### 5.2 RBAC

- [ ] Osobny ServiceAccount per workload
- [ ] Brak cluster-admin w podach
- [ ] Namespace-scoped roles

### 5.3 Network Policies (docelowo)

```yaml
# Tylko API może gadać z DB
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-access
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/component: api
  policyTypes:
    - Egress
  egress:
    - to:
        - ipBlock:
            cidr: <rds-subnet>/24
      ports:
        - port: 5432
```

### 5.4 Secrets Management

**Docelowo**: AWS Secrets Manager + External Secrets Operator

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: app-secrets
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: appname/prod/database
        property: url
```

### 5.5 API Security Checklist

- [ ] Rate limiting na wszystkich endpointach
- [ ] CORS poprawnie skonfigurowany
- [ ] Secure cookies (HttpOnly, Secure, SameSite)
- [ ] GraphQL depth limit
- [ ] GraphQL complexity limit
- [ ] WebSocket connection limits
- [ ] Input validation (Zod)
- [ ] SQL injection protection (Prisma)
- [ ] XSS protection (helmet)

---

## Faza 6: Dokumentacja operacyjna

### 6.1 Runbook: API Down

```markdown
## Symptomy
- /healthz zwraca 5xx lub timeout
- Alerty o braku healthy pods

## Diagnostyka
1. kubectl get pods -n appname-prod -l component=api
2. kubectl logs -n appname-prod deployment/api --tail=100
3. kubectl describe pod <pod-name>

## Recovery
1. Jeśli CrashLoopBackOff → sprawdź logi, rollback jeśli nowy deploy
2. Jeśli OOMKilled → zwiększ memory limits
3. Jeśli DB/Redis unreachable → sprawdź managed services
```

### 6.2 Runbook: DB Issues

```markdown
## Connection refused
1. Sprawdź RDS status w AWS Console
2. Sprawdź Security Groups
3. Sprawdź DATABASE_URL w secrets

## Slow queries
1. Sprawdź RDS Performance Insights
2. Sprawdź connection pool exhaustion
3. EXPLAIN problematic queries
```

### 6.3 Runbook: Rollback

```markdown
## Rollback kodu
1. Znajdź poprzedni SHA: git log --oneline -10
2. kubectl set image deployment/api api=ecr/appname-api:sha-<PREV>
3. kubectl set image deployment/web web=ecr/appname-web:sha-<PREV>
4. kubectl rollout status deployment/api deployment/web

## Rollback DB (destrukcyjna migracja)
1. Upewnij się że masz snapshot sprzed migracji
2. Restore snapshot do nowej instancji RDS
3. Update DATABASE_URL w secrets
4. Restart deployments
```

### 6.4 Runbook: Secret Rotation

```markdown
## JWT_SECRET
1. Wygeneruj nowy secret
2. Update w Secrets Manager
3. Restart api deployment (graceful)
4. Użytkownicy muszą się przelogować

## STRIPE_WEBHOOK_SECRET
1. Wygeneruj nowy endpoint w Stripe Dashboard
2. Update secret
3. Restart api

## DATABASE_URL (password change)
1. Change password w RDS
2. Update secret
3. Restart wszystkich workloadów
```

---

## Decyzje architektoniczne

### ADR-001: Managed Services

**Decyzja**: Używamy managed services (RDS, ElastiCache) zamiast self-hosted w K8s.

**Uzasadnienie**:
- Mniejszy overhead operacyjny
- Automatyczne backupy
- HA out-of-the-box
- Lock-in tylko na poziomie infra, nie kodu

### ADR-002: Jeden obraz API dla workerów

**Decyzja**: Workers używają tego samego obrazu co API, różne `command`.

**Uzasadnienie**:
- Mniej buildów
- Brak dryfu wersji
- Łatwiejszy debug

### ADR-003: Migracje jako K8s Job

**Decyzja**: Prisma migrate deploy jako Job przed rollout, nie w API start.

**Uzasadnienie**:
- Brak race conditions przy wielu replikach
- Jasny punkt failure w pipeline
- Możliwość retry/rollback

### ADR-004: Redis Pub/Sub dla realtime

**Decyzja**: Używamy Redis Pub/Sub jako backplane dla WebSocket/subscriptions.

**Uzasadnienie**:
- Prosty setup
- Wystarczający dla "best-effort" realtime
- Już zaimplementowane (mqemitter-redis)

**Ograniczenia**:
- Brak gwarancji dostarczenia (OK dla UI updates)
- Krytyczne eventy muszą iść przez DB

---

## Checklist przed produkcją

### Infrastruktura

- [ ] EKS cluster utworzony
- [ ] RDS PostgreSQL + PostGIS skonfigurowany
- [ ] ElastiCache Redis skonfigurowany
- [ ] S3 bucket utworzony
- [ ] ECR repositories utworzone
- [ ] ACM certificate dla domen
- [ ] ALB Ingress Controller zainstalowany
- [ ] External Secrets Operator zainstalowany
- [ ] Metrics Server zainstalowany

### Aplikacja

- [ ] Production Dockerfiles działają
- [ ] /healthz i /readyz działają
- [ ] Graceful shutdown działa
- [ ] GraphQL limits skonfigurowane
- [ ] Rate limiting działa
- [ ] CORS poprawny

### CI/CD

- [ ] Build pipeline działa
- [ ] Deploy stage działa
- [ ] Deploy prod z approval działa
- [ ] Rollback przetestowany

### Observability

- [ ] Logi trafiają do systemu
- [ ] Metryki zbierane
- [ ] Dashboardy skonfigurowane
- [ ] Alerty skonfigurowane
- [ ] On-call rotation ustalona

### Security

- [ ] Sekrety w Secrets Manager
- [ ] Pod security contexts
- [ ] RBAC skonfigurowany
- [ ] Backup RDS działa
- [ ] Test restore wykonany

### Dokumentacja

- [ ] Runbooki napisane
- [ ] Architektura udokumentowana
- [ ] Onboarding guide dla devów

---

## Timeline (orientacyjny)

| Faza | Czas | Zależności |
|------|------|------------|
| Faza 1: Fundamenty | 1 tydzień | - |
| Faza 2: K8s Manifests | 1-2 tygodnie | Faza 1 |
| Faza 3: CI/CD | 1 tydzień | Faza 2 |
| Faza 4: Observability | 1 tydzień | Faza 2 |
| Faza 5: Security | 1 tydzień | Faza 2, 3 |
| Faza 6: Runbooks | 2-3 dni | Faza 1-5 |
| **TOTAL** | **5-7 tygodni** | |

---

*Dokument utworzony: 2024-12-20*  
*Ostatnia aktualizacja: 2024-12-20*

