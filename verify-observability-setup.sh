#!/bin/bash

# Web Observability Setup Verification Script
# Checks if all components are properly configured

set -e

echo "🔍 Verifying Web Observability Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} File exists: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} File missing: $1"
        ((FAILED++))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} Directory exists: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} Directory missing: $1"
        ((FAILED++))
        return 1
    fi
}

# Function to check env variable
check_env() {
    if grep -q "^$1=" apps/web/.env.local 2>/dev/null; then
        VALUE=$(grep "^$1=" apps/web/.env.local | cut -d '=' -f2)
        echo -e "${GREEN}✅${NC} ENV variable set: $1=$VALUE"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  ENV variable missing: $1 (check apps/web/.env.local)"
        ((WARNINGS++))
        return 1
    fi
}

# Function to check service running
check_service() {
    if docker ps --format '{{.Names}}' | grep -q "^$1\$"; then
        echo -e "${GREEN}✅${NC} Docker service running: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  Docker service not running: $1"
        ((WARNINGS++))
        return 1
    fi
}

echo "📁 Checking Core Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "packages/observability/src/web-vitals-utils.ts"
check_file "apps/web/src/lib/observability/web-vitals-enhanced.tsx"
check_file "apps/web/src/lib/observability/route-transitions.tsx"
check_file "apps/web/src/lib/observability/runtime-errors.tsx"
check_file "apps/web/src/components/observability/ObservabilityProvider.tsx"
check_file "apps/web/src/app/api/telemetry/web/route.ts"
check_file "apps/web/src/app/layout.tsx"

echo ""
echo "📊 Checking Dashboards..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "infra/observability/grafana/provisioning/dashboards/json/web-vitals.json"
check_file "infra/observability/grafana/provisioning/dashboards/json/route-transitions.json"

echo ""
echo "⚙️  Checking ENV Configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "apps/web/.env.local" ]; then
    echo -e "${GREEN}✅${NC} .env.local exists"
    ((PASSED++))
    
    check_env "NEXT_PUBLIC_WEB_VITALS_DISABLED"
    check_env "NEXT_PUBLIC_WEB_VITALS_SAMPLING_RATE"
    check_env "OTEL_EXPORTER_OTLP_ENDPOINT"
    check_env "OTEL_SERVICE_NAME"
else
    echo -e "${YELLOW}⚠️${NC}  apps/web/.env.local not found"
    echo "   Create it from: apps/web/.env.local.example"
    ((WARNINGS++))
fi

echo ""
echo "🐳 Checking Docker Services..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_service "otel-collector"
check_service "grafana"
check_service "prometheus"
check_service "loki"
check_service "tempo"

echo ""
echo "🔗 Checking Integration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if ObservabilityProvider is imported in layout
if grep -q "ObservabilityProvider" apps/web/src/app/layout.tsx; then
    echo -e "${GREEN}✅${NC} ObservabilityProvider imported in layout.tsx"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} ObservabilityProvider NOT imported in layout.tsx"
    ((FAILED++))
fi

# Check if ObservabilityProvider is used in layout
if grep -q "<ObservabilityProvider>" apps/web/src/app/layout.tsx; then
    echo -e "${GREEN}✅${NC} ObservabilityProvider used in layout.tsx"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} ObservabilityProvider NOT used in layout.tsx"
    ((FAILED++))
fi

# Check if old WebVitals is removed
if grep -q "from '@/lib/config/web-vitals'" apps/web/src/app/layout.tsx; then
    echo -e "${RED}❌${NC} Old WebVitals import still present in layout.tsx"
    ((FAILED++))
else
    echo -e "${GREEN}✅${NC} Old WebVitals import removed from layout.tsx"
    ((PASSED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Setup verification FAILED${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    echo ""
    echo "📚 Documentation:"
    echo "   - Quick Start: apps/web/OBSERVABILITY-SETUP.md"
    echo "   - Full Guide: WEB-VITALS-ROUTE-TRANSITIONS-GUIDE.md"
    echo "   - Integration: INTEGRATION-COMPLETE.md"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Setup verification completed with WARNINGS${NC}"
    echo ""
    echo "You can proceed, but review the warnings above."
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Fix any missing ENV variables in apps/web/.env.local"
    echo "   2. Start observability: cd infra/observability && docker-compose -f docker-compose.observability.yml up -d"
    echo "   3. Start app: pnpm dev:web:obs"
    echo "   4. Open: http://localhost:3000"
    echo "   5. Check dashboards: http://localhost:3001"
    exit 0
else
    echo -e "${GREEN}✅ Setup verification PASSED${NC}"
    echo ""
    echo "🎉 All checks passed! You're ready to go!"
    echo ""
    echo "🚀 Quick Start:"
    echo "   # Start observability stack:"
    echo "   cd infra/observability && docker-compose -f docker-compose.observability.yml up -d"
    echo ""
    echo "   # Start web app:"
    echo "   cd ../.. && pnpm dev:web:obs"
    echo ""
    echo "   # Open app:"
    echo "   open http://localhost:3000"
    echo ""
    echo "   # Check dashboards:"
    echo "   open http://localhost:3001"
    echo ""
    echo "📚 Documentation: see INTEGRATION-COMPLETE.md"
    exit 0
fi

