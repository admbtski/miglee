# Observability Deployment on Kubernetes (AWS EKS)

Guide for deploying observability infrastructure and instrumenting apps on AWS EKS.

## 🏗️ Architecture Options

### Option A: Managed (Recommended for AWS)

**Grafana Cloud** (fully managed)
- ✅ Zero infrastructure to manage
- ✅ Global scale, high availability
- ✅ Pre-configured dashboards
- ✅ Easy setup: just set OTLP endpoint
- ❌ Cost: ~$50-200/month depending on volume

**AWS Managed Services**
- AWS Distro for OpenTelemetry (ADOT) Collector
- Amazon Managed Grafana (AMG)
- Amazon Managed Prometheus (AMP)
- CloudWatch Logs + X-Ray for traces
- ✅ Native AWS integration
- ❌ More complex setup
- ❌ Higher AWS costs at scale

### Option B: Self-Hosted on K8s

Deploy Grafana stack to EKS:
- ⚠️ You manage infrastructure
- ⚠️ Requires persistent storage (EBS/EFS)
- ⚠️ Backup/restore planning
- ✅ Full control
- ✅ Cost-effective at large scale

##🚀 Deployment: Grafana Cloud (Simplest)

### 1. Create Grafana Cloud Account

1. Sign up at https://grafana.com
2. Create a stack (choose EU/US region closest to your app)
3. Generate OTLP credentials:
   - Go to Settings → OpenTelemetry
   - Copy OTLP endpoint
   - Generate API token

### 2. Create K8s Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: grafana-cloud-otlp
  namespace: appname-prod
type: Opaque
stringData:
  endpoint: "https://otlp-gateway-prod-eu-west-0.grafana.net/otlp"
  username: "123456"  # Instance ID
  password: "glc_xxx"  # API token
```

Apply:
```bash
kubectl apply -f grafana-cloud-secret.yaml
```

### 3. Update ConfigMap

```yaml
# infra/k8s/envs/prod/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: appname-prod
data:
  NODE_ENV: production
  
  # OpenTelemetry
  OTEL_SERVICE_NAME: appname-api
  OTEL_SERVICE_VERSION: "1.0.0"
  OTEL_EXPORTER_OTLP_ENDPOINT: "https://otlp-gateway-prod-eu-west-0.grafana.net/otlp"
  OTEL_TRACE_SAMPLE_RATE: "0.1"  # 10% sampling
  OTEL_ENABLE_TRACING: "true"
  OTEL_ENABLE_METRICS: "true"
```

### 4. Update Deployment

Add auth header from secret:

```yaml
# infra/k8s/components/api/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  template:
    spec:
      containers:
        - name: api
          env:
            # ... existing env vars ...
            
            # Observability
            - name: OTEL_SERVICE_NAME
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: OTEL_SERVICE_NAME
            
            - name: OTEL_SERVICE_VERSION
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: OTEL_SERVICE_VERSION
            
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: OTEL_EXPORTER_OTLP_ENDPOINT
            
            # Grafana Cloud auth
            - name: GRAFANA_CLOUD_USERNAME
              valueFrom:
                secretKeyRef:
                  name: grafana-cloud-otlp
                  key: username
            
            - name: GRAFANA_CLOUD_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: grafana-cloud-otlp
                  key: password
            
            - name: OTEL_EXPORTER_OTLP_HEADERS
              value: "Authorization=Basic $(echo -n $(GRAFANA_CLOUD_USERNAME):$(GRAFANA_CLOUD_PASSWORD) | base64)"
            
            # Sampling
            - name: OTEL_TRACE_SAMPLE_RATE
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: OTEL_TRACE_SAMPLE_RATE
            
            # K8s attributes (Downward API)
            - name: KUBERNETES_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            
            - name: K8S_POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            
            - name: K8S_NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
```

### 5. Deploy

```bash
# Dev
kubectl apply -k infra/k8s/envs/dev

# Prod
kubectl apply -k infra/k8s/envs/prod
```

### 6. Verify

```bash
# Check pod logs for observability initialization
kubectl logs -n appname-prod deployment/api | grep Observability

# Should see:
# [Observability] Initializing...
# [Observability] ✅ Tracing initialized successfully
# [Observability] ✅ Metrics initialized successfully
```

---

## 🏗️ Deployment: ADOT Collector (AWS Native)

### 1. Install ADOT Operator

```bash
# Add ADOT addon to EKS cluster
aws eks create-addon \
  --cluster-name appname-prod \
  --addon-name adot \
  --addon-version v0.96.0-eksbuild.1
```

### 2. Deploy Collector

```yaml
# infra/k8s/observability/adot-collector.yaml
apiVersion: opentelemetry.io/v1alpha1
kind: OpenTelemetryCollector
metadata:
  name: adot-collector
  namespace: appname-prod
spec:
  mode: deployment
  config: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
    
    processors:
      batch:
        timeout: 10s
      
      memory_limiter:
        check_interval: 5s
        limit_mib: 512
    
    exporters:
      # Amazon Managed Prometheus
      prometheusremotewrite:
        endpoint: https://aps-workspaces.eu-west-1.amazonaws.com/workspaces/ws-xxx/api/v1/remote_write
        auth:
          authenticator: sigv4auth
      
      # AWS X-Ray for traces
      awsxray:
        region: eu-west-1
      
      # CloudWatch for logs
      awscloudwatchlogs:
        log_group_name: /aws/eks/appname-prod/logs
        region: eu-west-1
    
    extensions:
      sigv4auth:
        region: eu-west-1
        service: aps
    
    service:
      extensions: [sigv4auth]
      pipelines:
        traces:
          receivers: [otlp]
          processors: [memory_limiter, batch]
          exporters: [awsxray]
        
        metrics:
          receivers: [otlp]
          processors: [memory_limiter, batch]
          exporters: [prometheusremotewrite]
        
        logs:
          receivers: [otlp]
          processors: [memory_limiter, batch]
          exporters: [awscloudwatchlogs]
```

### 3. Update App ConfigMap

```yaml
OTEL_EXPORTER_OTLP_ENDPOINT: "http://adot-collector:4318"
```

---

## 🏗️ Deployment: Self-Hosted Grafana Stack

### 1. Add Grafana Helm Repo

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

### 2. Deploy Tempo (Traces)

```yaml
# values-tempo.yaml
tempo:
  retention: 168h  # 7 days
  
  storage:
    trace:
      backend: s3
      s3:
        bucket: appname-prod-tempo
        endpoint: s3.eu-west-1.amazonaws.com
        region: eu-west-1

serviceAccount:
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT:role/tempo-s3-role
```

```bash
helm install tempo grafana/tempo-distributed \
  -n observability \
  -f values-tempo.yaml
```

### 3. Deploy Loki (Logs)

```yaml
# values-loki.yaml
loki:
  storage:
    type: s3
    s3:
      s3: s3://appname-prod-loki
      region: eu-west-1

serviceAccount:
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT:role/loki-s3-role
```

```bash
helm install loki grafana/loki-distributed \
  -n observability \
  -f values-loki.yaml
```

### 4. Deploy Prometheus

```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n observability
```

### 5. Deploy OTel Collector

Use collector configs from `infra/observability/otel-collector/otel-collector.prodlike.yaml` with K8s deployment.

---

## 📊 Monitoring the Observability Stack

### Health Checks

```bash
# Check collector
kubectl get pods -n observability | grep collector

# Check collector logs
kubectl logs -n observability deployment/otel-collector

# Test OTLP endpoint
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://otel-collector:13133/health
```

### Metrics

```bash
# Check if app is sending traces
kubectl exec -it deployment/api -- \
  curl http://localhost:13133/health

# View collector metrics
kubectl port-forward -n observability svc/otel-collector 8888:8888
open http://localhost:8888/metrics
```

---

## 🔧 Troubleshooting

### No traces appearing in Grafana

1. Check collector is running:
   ```bash
   kubectl get pods -n observability
   ```

2. Check collector logs for errors:
   ```bash
   kubectl logs -n observability deployment/otel-collector | grep error
   ```

3. Verify app env vars:
   ```bash
   kubectl exec deployment/api -- env | grep OTEL
   ```

4. Check app logs:
   ```bash
   kubectl logs deployment/api | grep Observability
   ```

### High costs in Grafana Cloud

1. Reduce sampling rate:
   ```yaml
   OTEL_TRACE_SAMPLE_RATE: "0.05"  # 5% instead of 10%
   ```

2. Add tail sampling in collector (keep errors, slow requests)

3. Filter noisy endpoints in collector config

### IRSA (IAM Roles for Service Accounts) Setup

For ADOT/self-hosted using AWS services (S3, AMP, X-Ray):

```bash
# Create IAM policy
aws iam create-policy \
  --policy-name AdotCollectorPolicy \
  --policy-document file://adot-policy.json

# Create service account with role
eksctl create iamserviceaccount \
  --name adot-collector \
  --namespace observability \
  --cluster appname-prod \
  --attach-policy-arn arn:aws:iam::ACCOUNT:policy/AdotCollectorPolicy \
  --approve
```

---

## 📚 Resources

- [Grafana Cloud OTLP](https://grafana.com/docs/grafana-cloud/send-data/otlp/)
- [ADOT on EKS](https://aws-otel.github.io/docs/getting-started/adot-eks-add-on)
- [Amazon Managed Prometheus](https://docs.aws.amazon.com/prometheus/)
- [Grafana Helm Charts](https://github.com/grafana/helm-charts)

