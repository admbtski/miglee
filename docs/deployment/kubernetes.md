# Kubernetes Deployment Guide

> Dokumentacja deploymentu aplikacji na Kubernetes.

## Spis treści

1. [Struktura katalogów](#struktura-katalogów)
2. [Środowiska](#środowiska)
3. [Komendy deploy](#komendy-deploy)
4. [Migracje bazy danych](#migracje-bazy-danych)
5. [Konfiguracja secrets](#konfiguracja-secrets)
6. [Troubleshooting](#troubleshooting)

---

## Struktura katalogów

```
infra/k8s/
├── base/                          # Wspólne definicje (obecnie puste)
│   └── kustomization.yaml
│
├── components/                    # Reużywalne komponenty
│   ├── api/                       # API (Fastify + GraphQL)
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   ├── pdb.yaml
│   │   ├── serviceaccount.yaml
│   │   ├── migration-job.yaml
│   │   └── kustomization.yaml
│   │
│   ├── web/                       # Web (Next.js SSR)
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   ├── pdb.yaml
│   │   ├── serviceaccount.yaml
│   │   └── kustomization.yaml
│   │
│   └── workers/                   # BullMQ Workers
│       ├── worker-reminders.yaml
│       ├── worker-feedback.yaml
│       ├── worker-audit-archive.yaml
│       ├── serviceaccount.yaml
│       └── kustomization.yaml
│
└── envs/                          # Środowiska
    ├── dev/                       # Lokalne K8s (minikube, kind)
    ├── stage/                     # Staging
    └── prod/                      # Produkcja
```

---

## Środowiska

| Środowisko | Namespace | Repliki API/Web | Cel |
|------------|-----------|-----------------|-----|
| `dev` | `appname-dev` | 1 / 1 | Lokalne testowanie K8s |
| `stage` | `appname-stage` | 1-3 / 1-3 | Pre-production testing |
| `prod` | `appname-prod` | 2-10 / 2-10 | Produkcja z HPA |

### Zasoby per środowisko

**Stage:**
- API: 100m-1000m CPU, 256Mi-1Gi RAM
- Web: 100m-1000m CPU, 256Mi-1Gi RAM
- Workers: 50m-500m CPU, 128Mi-512Mi RAM

**Prod:**
- API: 250m-2000m CPU, 512Mi-2Gi RAM
- Web: 200m-1500m CPU, 512Mi-1.5Gi RAM
- Workers: 100m-1000m CPU, 256Mi-2Gi RAM

---

## Komendy deploy

### Preview manifestów

```bash
# Podgląd stage
kubectl kustomize infra/k8s/envs/stage

# Podgląd prod
kubectl kustomize infra/k8s/envs/prod

# Zapisz do pliku
kubectl kustomize infra/k8s/envs/stage > /tmp/stage-manifests.yaml
```

### Deploy na stage

```bash
# 1. Zaaplikuj manifesty
kubectl apply -k infra/k8s/envs/stage

# 2. Sprawdź status
kubectl -n appname-stage get pods
kubectl -n appname-stage get deployments
kubectl -n appname-stage get services
```

### Deploy na prod

```bash
# 1. Zaaplikuj manifesty
kubectl apply -k infra/k8s/envs/prod

# 2. Sprawdź rollout status
kubectl -n appname-prod rollout status deployment/api
kubectl -n appname-prod rollout status deployment/web

# 3. Sprawdź health
kubectl -n appname-prod get pods -o wide
```

### Aktualizacja obrazów (CI/CD)

W CI/CD nadpisuj tagi obrazów:

```bash
# Kustomize set image
cd infra/k8s/envs/prod
kustomize edit set image appname-api=your-registry.com/appname-api:sha-abc1234
kustomize edit set image appname-web=your-registry.com/appname-web:sha-abc1234

# Lub bezpośrednio w kubectl
kubectl apply -k . --record
```

---

## Migracje bazy danych

### Przed deployem nowej wersji

```bash
# 1. Zaktualizuj obraz w migration job
cd infra/k8s/envs/prod
kustomize edit set image appname-api=your-registry.com/appname-api:sha-abc1234

# 2. Uruchom migration job
kubectl apply -f infra/k8s/components/api/migration-job.yaml -n appname-prod

# 3. Czekaj na zakończenie
kubectl -n appname-prod wait --for=condition=complete job/migrate-db --timeout=300s

# 4. Sprawdź logi
kubectl -n appname-prod logs job/migrate-db

# 5. Usuń job (opcjonalnie - TTL automatycznie usuwa po 1h)
kubectl -n appname-prod delete job migrate-db
```

### Rollback migracji

**⚠️ Migracje Prisma są zazwyczaj nieodwracalne!**

Przed destrukcyjną migracją:
1. Zrób snapshot bazy danych
2. Przetestuj rollback na stage

```bash
# Przywróć snapshot z RDS
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier appname-prod-restored \
  --db-snapshot-identifier your-snapshot-id
```

---

## Konfiguracja secrets

### Development (lokalne K8s)

```bash
# Utwórz secret ręcznie
kubectl -n appname-dev create secret generic app-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=JWT_SECRET="..." \
  --from-literal=STRIPE_SECRET_KEY="sk_test_..."
```

### Stage/Prod (zalecane: External Secrets)

1. **Zainstaluj External Secrets Operator:**
```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets --create-namespace
```

2. **Utwórz SecretStore dla AWS Secrets Manager:**
```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets
  namespace: appname-prod
spec:
  provider:
    aws:
      service: SecretsManager
      region: eu-central-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
```

3. **Utwórz ExternalSecret:**
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
  namespace: appname-prod
spec:
  secretStoreRef:
    name: aws-secrets
    kind: SecretStore
  target:
    name: app-secrets
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: appname/prod/database
        property: url
    - secretKey: JWT_SECRET
      remoteRef:
        key: appname/prod/auth
        property: jwt_secret
```

---

## Troubleshooting

### Pody nie startują

```bash
# Sprawdź eventy
kubectl -n appname-prod describe pod <pod-name>

# Sprawdź logi
kubectl -n appname-prod logs <pod-name> --previous

# Sprawdź stan deploymentu
kubectl -n appname-prod describe deployment api
```

### Readiness probe fails

```bash
# Sprawdź czy endpoint działa
kubectl -n appname-prod exec -it <pod-name> -- wget -qO- http://localhost:4000/health/ready

# Sprawdź połączenie z DB
kubectl -n appname-prod exec -it <pod-name> -- env | grep DATABASE
```

### HPA nie skaluje

```bash
# Sprawdź czy metrics-server działa
kubectl -n kube-system get pods | grep metrics-server

# Sprawdź metryki
kubectl top pods -n appname-prod

# Sprawdź HPA status
kubectl -n appname-prod describe hpa api
```

### Rollback deploymentu

```bash
# Sprawdź historię
kubectl -n appname-prod rollout history deployment/api

# Rollback do poprzedniej wersji
kubectl -n appname-prod rollout undo deployment/api

# Rollback do konkretnej rewizji
kubectl -n appname-prod rollout undo deployment/api --to-revision=2
```

---

## Checklist przed produkcją

- [ ] Secrets skonfigurowane przez External Secrets lub SOPS
- [ ] Ingress z certyfikatem TLS (cert-manager lub ACM)
- [ ] NetworkPolicies włączone (opcjonalnie)
- [ ] ResourceQuotas per namespace
- [ ] Monitoring (Prometheus/Grafana)
- [ ] Logi centralne (Loki/CloudWatch)
- [ ] Backup bazy danych
- [ ] CI/CD pipeline gotowy

