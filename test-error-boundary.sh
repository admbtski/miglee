#!/bin/bash

# Error Boundary Integration Test Script
# Tests failed route transition tracking

set -e

echo "🛡️  Testing Error Boundary Integration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if app is running
echo "📡 Checking if app is running..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}❌ App is not running!${NC}"
    echo ""
    echo "Please start the app:"
    echo "  pnpm dev:web:obs"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ App is running${NC}"
echo ""

# Check if observability stack is running
echo "🐳 Checking observability stack..."
if ! docker ps --format '{{.Names}}' | grep -q "prometheus"; then
    echo -e "${YELLOW}⚠️  Prometheus not running${NC}"
    echo "Start observability stack:"
    echo "  cd infra/observability"
    echo "  docker-compose -f docker-compose.observability.yml up -d"
    echo ""
else
    echo -e "${GREEN}✅ Observability stack running${NC}"
fi
echo ""

# Instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📋 Manual Test Instructions${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open app in browser:"
echo -e "   ${GREEN}http://localhost:3000${NC}"
echo ""
echo "2. Navigate to test page:"
echo -e "   ${GREEN}http://localhost:3000/test-error-boundary${NC}"
echo ""
echo "3. Click any 'Trigger Error' button"
echo ""
echo "4. Error Boundary will catch the error"
echo ""
echo "5. Check if failed transition was reported:"
echo ""

# Wait for user to trigger error
echo -e "${YELLOW}Press ENTER when you've triggered an error...${NC}"
read -r

echo ""
echo "🔍 Checking for failed transitions..."
echo ""

# Wait a bit for metrics to be scraped
echo "⏳ Waiting 10 seconds for metrics to be scraped..."
sleep 10

# Check Prometheus for failed transitions
echo "📊 Querying Prometheus..."
RESULT=$(curl -s 'http://localhost:9090/api/v1/query' \
  --data-urlencode 'query=web_route_transition_total{route_success="false"}' \
  | jq -r '.data.result')

if [ "$RESULT" == "[]" ] || [ "$RESULT" == "null" ]; then
    echo -e "${YELLOW}⚠️  No failed transitions found yet${NC}"
    echo ""
    echo "This could mean:"
    echo "  - Error occurred on initial page load (not a transition)"
    echo "  - Metrics not scraped yet (wait 30s total)"
    echo "  - Kill switch enabled"
    echo ""
    echo "Try:"
    echo "  1. Navigate FROM home page TO test page"
    echo "  2. THEN trigger error"
    echo "  3. Run this script again"
    echo ""
else
    echo -e "${GREEN}✅ Failed transitions detected!${NC}"
    echo ""
    echo "Prometheus data:"
    echo "$RESULT" | jq '.'
    echo ""
fi

# Check recent telemetry events (if we can access logs)
echo "📝 Checking for telemetry events..."
if docker ps --format '{{.Names}}' | grep -q "otel-collector"; then
    echo ""
    echo "Recent OTel Collector logs:"
    docker logs otel-collector --tail 20 2>&1 | grep -i "route_transition" || echo "No route_transition events in recent logs"
else
    echo -e "${YELLOW}⚠️  OTel Collector not running, skipping log check${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🎯 Verification Checklist${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "[ ] Error Boundary caught error and showed fallback UI"
echo "[ ] Console shows [runtime-error] log"
echo "[ ] Network tab shows POST to /api/telemetry/web"
echo "[ ] Prometheus has web_route_transition_total{route_success=\"false\"} > 0"
echo "[ ] Grafana dashboard shows error rate spike"
echo ""

# Grafana dashboard link
echo "📊 Check Grafana Dashboard:"
echo -e "   ${GREEN}http://localhost:3001/d/route-transitions${NC}"
echo ""

# Advanced queries
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🔬 Advanced Verification${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Run these queries in Prometheus (http://localhost:9090):"
echo ""
echo "1. Total failed transitions:"
echo -e "${YELLOW}   sum(web_route_transition_total{route_success=\"false\"})${NC}"
echo ""
echo "2. Failed transitions by route:"
echo -e "${YELLOW}   sum(web_route_transition_total{route_success=\"false\"}) by (route_to_template)${NC}"
echo ""
echo "3. Error rate (last 5 minutes):"
echo -e "${YELLOW}   sum(rate(web_route_transition_total{route_success=\"false\"}[5m])) / sum(rate(web_route_transition_total[5m]))${NC}"
echo ""
echo "4. Failed transitions with reason:"
echo -e "${YELLOW}   web_route_transition_total{route_success=\"false\", route_reason=\"error\"}${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Test complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation: ERROR-BOUNDARY-INTEGRATION.md"
echo ""

