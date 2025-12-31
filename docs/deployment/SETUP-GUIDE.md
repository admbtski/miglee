# Deployment Setup Guide

Krok po kroku konfiguracja GitHub Actions i AWS EKS.

## Spis treści

1. [Wymagania wstępne](#1-wymagania-wstępne)
2. [Konfiguracja GitHub](#2-konfiguracja-github)
3. [Konfiguracja AWS](#3-konfiguracja-aws)
4. [Konfiguracja Kubernetes](#4-konfiguracja-kubernetes)
5. [Pierwszy deployment](#5-pierwszy-deployment)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Wymagania wstępne

### Narzędzia lokalne

```bash
# AWS CLI
brew install awscli
aws --version

# kubectl
brew install kubectl
kubectl version --client

# eksctl (do tworzenia klastra)
brew install eksctl
eksctl version

# kustomize (dla K8s manifests)
brew install kustomize
kustomize version
```

### Konta i dostępy

- [x] Konto GitHub z dostępem do repo
- [x] Konto AWS z uprawnieniami administratora
- [x] Domena (do konfiguracji później)

---

## 2. Konfiguracja GitHub

### 2.1. GitHub Environments

Utwórz dwa środowiska w **Settings → Environments**:

#### Environment: `stage`
1. Idź do: `https://github.com/<owner>/<repo>/settings/environments`
2. Kliknij **New environment** → nazwa: `stage`
3. Nie dodawaj wymagań approval (auto-deploy)

#### Environment: `production`
1. Kliknij **New environment** → nazwa: `production`
2. ✅ **Required reviewers** - dodaj siebie lub zespół
3. ✅ **Wait timer** - opcjonalnie 5 minut

### 2.2. GitHub Secrets

**Settings → Secrets and variables → Actions → Secrets**

#### Repository secrets (dla wszystkich workflows):

| Secret | Wartość | Opis |
|--------|---------|------|
| `AWS_ACCESS_KEY_ID` | `AKIA...` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | `...` | AWS secret key |
| `AWS_REGION` | `eu-central-1` | Region AWS |
| `AWS_ACCOUNT_ID` | `123456789012` | ID konta AWS |

### 2.3. GitHub Variables

**Settings → Secrets and variables → Actions → Variables**

#### Repository variables:

| Variable | Wartość | Opis |
|----------|---------|------|
| `NEXT_PUBLIC_API_URL` | `https://api.example.com/graphql` | Prod API URL |
| `NEXT_PUBLIC_WS_URL` | `wss://api.example.com/graphql` | Prod WS URL |

#### Environment variables (stage):

| Variable | Wartość |
|----------|---------|
| `STAGE_API_URL` | `https://stage.api.example.com` |
| `STAGE_WEB_URL` | `https://stage.app.example.com` |

#### Environment variables (production):

| Variable | Wartość |
|----------|---------|
| `PROD_API_URL` | `https://api.example.com` |
| `PROD_WEB_URL` | `https://app.example.com` |

---

## 3. Konfiguracja AWS

### 3.1. Utwórz użytkownika IAM dla CI/CD

```bash
# Utwórz użytkownika
aws iam create-user --user-name github-actions-deploy

# Utwórz access key
aws iam create-access-key --user-name github-actions-deploy
# Zapisz: AccessKeyId i SecretAccessKey → GitHub Secrets
```

### 3.2. Polityka IAM dla CI/CD

```bash
cat << 'EOF' > github-actions-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRAccess",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeRepositories",
        "ecr:CreateRepository"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EKSAccess",
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": "*"
    },
    {
      "Sid": "RDSSnapshot",
      "Effect": "Allow",
      "Action": [
        "rds:CreateDBSnapshot",
        "rds:DescribeDBSnapshots"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-user-policy \
  --user-name github-actions-deploy \
  --policy-name GitHubActionsDeployPolicy \
  --policy-document file://github-actions-policy.json
```

### 3.3. Utwórz repozytoria ECR

```bash
# Utwórz repozytoria dla obrazów Docker
aws ecr create-repository --repository-name appname/api --region eu-central-1
aws ecr create-repository --repository-name appname/web --region eu-central-1
aws ecr create-repository --repository-name appname/migrator --region eu-central-1

# Sprawdź
aws ecr describe-repositories --region eu-central-1
```

### 3.4. Utwórz klaster EKS

```bash
# Utwórz klaster (zajmie ~15-20 minut)
eksctl create cluster \
  --name appname-cluster \
  --region eu-central-1 \
  --version 1.29 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed

# Sprawdź połączenie
kubectl get nodes
```

### 3.5. Utwórz bazę RDS (PostgreSQL + PostGIS)

```bash
# Utwórz subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name appname-db-subnet \
  --db-subnet-group-description "Subnet group for appname" \
  --subnet-ids subnet-xxx subnet-yyy

# Utwórz instancję RDS
aws rds create-db-instance \
  --db-instance-identifier appname-stage \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.3 \
  --master-username postgres \
  --master-user-password 'SECURE_PASSWORD_HERE' \
  --allocated-storage 20 \
  --db-subnet-group-name appname-db-subnet \
  --vpc-security-group-ids sg-xxx \
  --publicly-accessible false \
  --backup-retention-period 7 \
  --region eu-central-1
```

**Włączenie PostGIS** (po utworzeniu):

```bash
# Połącz się z RDS i wykonaj:
psql -h your-rds-endpoint -U postgres -d postgres
CREATE EXTENSION postgis;
CREATE DATABASE app;
\c app
CREATE EXTENSION postgis;
```

### 3.6. Utwórz ElastiCache (Redis)

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id appname-stage-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --region eu-central-1
```

---

## 4. Konfiguracja Kubernetes

### 4.1. Utwórz namespace'y

```bash
kubectl create namespace appname-stage
kubectl create namespace appname-prod
```

### 4.2. Zainstaluj Ingress Controller

#### Opcja A: Nginx Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.6/deploy/static/provider/aws/deploy.yaml

# Sprawdź
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

#### Opcja B: AWS Load Balancer Controller

```bash
# Dodaj IAM policy
eksctl utils associate-iam-oidc-provider --cluster appname-cluster --approve

# Zainstaluj controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=appname-cluster \
  --set serviceAccount.create=true
```

### 4.3. Zainstaluj cert-manager (TLS)

```bash
# Zainstaluj cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.4/cert-manager.yaml

# Poczekaj na gotowość
kubectl wait --for=condition=Available deployment --all -n cert-manager --timeout=120s

# Utwórz ClusterIssuer dla Let's Encrypt
cat << 'EOF' | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

### 4.4. Utwórz sekrety w klastrze

```bash
# Stage secrets
kubectl create secret generic app-secrets \
  --namespace appname-stage \
  --from-literal=DATABASE_URL='postgresql://postgres:PASSWORD@rds-endpoint:5432/app?schema=public' \
  --from-literal=JWT_SECRET='your-jwt-secret-min-32-chars' \
  --from-literal=REDIS_PASSWORD='' \
  --from-literal=STRIPE_SECRET_KEY='sk_test_...' \
  --from-literal=STRIPE_WEBHOOK_SECRET='whsec_...' \
  --from-literal=RESEND_API_KEY='re_...'

# Sprawdź
kubectl get secrets -n appname-stage
```

### 4.5. Aktualizuj pliki kustomization

Edytuj `infra/k8s/envs/stage/kustomization.yaml`:

```yaml
images:
  - name: appname-api
    newName: 123456789012.dkr.ecr.eu-central-1.amazonaws.com/appname/api
    newTag: latest
  - name: appname-web
    newName: 123456789012.dkr.ecr.eu-central-1.amazonaws.com/appname/web
    newTag: latest
```

### 4.6. Aktualizuj configmap z domenami

Edytuj `infra/k8s/envs/stage/configmap.yaml`:

```yaml
data:
  APP_URL: "https://stage.your-domain.com"
  API_URL: "https://stage.api.your-domain.com"
  # ...
```

---

## 5. Pierwszy deployment

### 5.1. Zmień registry w workflow

Edytuj `.github/workflows/build-and-push.yml`:

```yaml
env:
  REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com
```

I odkomentuj sekcję AWS ECR login:

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ secrets.AWS_REGION }}

- name: Login to Amazon ECR
  uses: aws-actions/amazon-ecr-login@v2
```

### 5.2. Zmień deploy workflows

Edytuj `.github/workflows/deploy-stage.yml` i `deploy-prod.yml`:

Odkomentuj sekcje AWS/EKS:

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ secrets.AWS_REGION }}

- name: Update kubeconfig
  run: aws eks update-kubeconfig --name appname-cluster --region ${{ secrets.AWS_REGION }}
```

### 5.3. Push i obserwuj

```bash
# Commit wszystkie zmiany
git add .
git commit -m "feat: configure AWS deployment"
git push origin main

# Obserwuj GitHub Actions
# https://github.com/<owner>/<repo>/actions
```

### 5.4. Ręczne uruchomienie (pierwszy raz)

1. Idź do **Actions** → **Build and Push**
2. Kliknij **Run workflow**
3. Poczekaj na build
4. Idź do **Deploy Stage**
5. Kliknij **Run workflow** z tagiem z poprzedniego buildu

---

## 6. Troubleshooting

### Problem: "Error: Cannot find kubectl"

```bash
# W GitHub Actions kubectl jest domyślnie dostępny
# Sprawdź wersję:
kubectl version --client
```

### Problem: "Error: EKS cluster not found"

```bash
# Upewnij się że nazwa klastra jest poprawna
aws eks list-clusters --region eu-central-1
```

### Problem: "Error: Unauthorized"

```bash
# Sprawdź aws-auth ConfigMap
kubectl get configmap aws-auth -n kube-system -o yaml

# Dodaj użytkownika CI/CD do aws-auth
eksctl create iamidentitymapping \
  --cluster appname-cluster \
  --arn arn:aws:iam::123456789012:user/github-actions-deploy \
  --username github-actions \
  --group system:masters
```

### Problem: "ImagePullBackOff"

```bash
# Sprawdź czy obraz istnieje
aws ecr describe-images --repository-name appname/api --region eu-central-1

# Sprawdź logi poda
kubectl describe pod <pod-name> -n appname-stage
kubectl logs <pod-name> -n appname-stage
```

### Problem: "CrashLoopBackOff"

```bash
# Sprawdź logi
kubectl logs <pod-name> -n appname-stage --previous

# Najczęstsze przyczyny:
# 1. Brak DATABASE_URL lub błędny format
# 2. Brak połączenia z Redis
# 3. Brakujące zmienne środowiskowe
```

### Przydatne komendy

```bash
# Status deploymentów
kubectl get deployments -n appname-stage

# Logi API
kubectl logs -f deployment/api -n appname-stage

# Shell w podzie
kubectl exec -it deployment/api -n appname-stage -- sh

# Restart deployment
kubectl rollout restart deployment/api -n appname-stage

# Rollback
kubectl rollout undo deployment/api -n appname-stage
```

---

## Checklist przed produkcją

- [ ] Secrets NIE są w repo (sprawdź .gitignore)
- [ ] DATABASE_URL wskazuje na RDS, nie localhost
- [ ] JWT_SECRET jest unikalny i silny
- [ ] TLS działa (https://)
- [ ] CORS_ORIGINS zawiera produkcyjne domeny
- [ ] LOG_LEVEL=info (nie debug)
- [ ] ENABLE_BULL_BOARD=false
- [ ] Backup RDS włączony
- [ ] Monitoring/Alerty skonfigurowane
- [ ] DNS wskazuje na Load Balancer

---

## Szybki start (TL;DR)

```bash
# 1. AWS Setup
aws configure
eksctl create cluster --name appname-cluster --region eu-central-1

# 2. GitHub Secrets
# Add: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_ACCOUNT_ID

# 3. K8s Secrets
kubectl create secret generic app-secrets -n appname-stage \
  --from-literal=DATABASE_URL='...' \
  --from-literal=JWT_SECRET='...'

# 4. Deploy
git push origin main
# GitHub Actions → Build → Deploy Stage
```

