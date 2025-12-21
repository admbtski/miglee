#!/bin/bash
# =============================================================================
# Local K8s Testing Script
# =============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CLUSTER_NAME="appname-dev"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        error "kubectl not found. Install: brew install kubectl"
    fi
    
    if ! command -v kind &> /dev/null; then
        if ! command -v minikube &> /dev/null; then
            warn "Neither kind nor minikube found."
            echo ""
            echo "Install kind (recommended):"
            echo "  brew install kind"
            echo ""
            echo "Or install minikube:"
            echo "  brew install minikube"
            exit 1
        fi
    fi
    
    log "Prerequisites OK"
}

# Create cluster
create_cluster() {
    if command -v kind &> /dev/null; then
        if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
            log "Cluster '${CLUSTER_NAME}' already exists"
        else
            log "Creating Kind cluster '${CLUSTER_NAME}'..."
            kind create cluster --name "$CLUSTER_NAME"
        fi
        kubectl config use-context "kind-${CLUSTER_NAME}"
    else
        log "Using minikube..."
        if ! minikube status &> /dev/null; then
            minikube start
        fi
        kubectl config use-context minikube
    fi
}

# Build and load images
build_and_load_images() {
    log "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build API
    docker build -f docker/Dockerfile.api --target production -t appname-api:local .
    
    # Build Web
    docker build -f docker/Dockerfile.web --target production \
        --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000 \
        --build-arg NEXT_PUBLIC_WS_URL=ws://localhost:4000 \
        -t appname-web:local .
    
    if command -v kind &> /dev/null; then
        log "Loading images into Kind..."
        kind load docker-image appname-api:local --name "$CLUSTER_NAME"
        kind load docker-image appname-web:local --name "$CLUSTER_NAME"
    fi
}

# Deploy to cluster
deploy() {
    log "Deploying to cluster..."
    
    cd "$PROJECT_ROOT"
    
    # Update kustomization to use local images
    kubectl kustomize infra/k8s/envs/dev | \
        sed 's|appname-api:latest|appname-api:local|g' | \
        sed 's|appname-web:latest|appname-web:local|g' | \
        kubectl apply -f -
    
    log "Waiting for pods to be ready..."
    kubectl -n appname-dev wait --for=condition=ready pod -l app.kubernetes.io/name=appname --timeout=120s || true
    
    log "Pod status:"
    kubectl -n appname-dev get pods
}

# Port forward for local access
port_forward() {
    log "Setting up port forwarding..."
    echo ""
    echo "Run these commands in separate terminals:"
    echo ""
    echo "  # API on localhost:4000"
    echo "  kubectl -n appname-dev port-forward svc/api 4000:4000"
    echo ""
    echo "  # Web on localhost:3000"
    echo "  kubectl -n appname-dev port-forward svc/web 3000:3000"
    echo ""
}

# Cleanup
cleanup() {
    log "Cleaning up..."
    kubectl delete -k infra/k8s/envs/dev --ignore-not-found
    
    if command -v kind &> /dev/null; then
        kind delete cluster --name "$CLUSTER_NAME"
    fi
}

# Main
case "${1:-}" in
    setup)
        check_prerequisites
        create_cluster
        ;;
    build)
        build_and_load_images
        ;;
    deploy)
        deploy
        ;;
    forward)
        port_forward
        ;;
    all)
        check_prerequisites
        create_cluster
        build_and_load_images
        deploy
        port_forward
        ;;
    cleanup)
        cleanup
        ;;
    validate)
        log "Validating manifests..."
        cd "$PROJECT_ROOT"
        kubectl kustomize infra/k8s/envs/dev > /dev/null
        kubectl kustomize infra/k8s/envs/stage > /dev/null
        kubectl kustomize infra/k8s/envs/prod > /dev/null
        log "All manifests valid!"
        ;;
    *)
        echo "Usage: $0 {setup|build|deploy|forward|all|cleanup|validate}"
        echo ""
        echo "Commands:"
        echo "  setup    - Create local K8s cluster (Kind)"
        echo "  build    - Build and load Docker images"
        echo "  deploy   - Deploy to cluster"
        echo "  forward  - Show port-forward commands"
        echo "  all      - Run setup + build + deploy + forward"
        echo "  cleanup  - Delete cluster and resources"
        echo "  validate - Validate all kustomize manifests"
        exit 1
        ;;
esac

