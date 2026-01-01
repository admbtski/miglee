#!/bin/bash

# Observability Stack Smoke Test
# Verifies that all components are running and configured correctly

set -e

echo "🔍 Observability Stack Smoke Test"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

# Helper functions
test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

test_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# 1. Check Docker containers
echo "1️⃣  Checking Docker containers..."
if docker ps | grep -q "grafana"; then
    test_pass "Grafana container is running"
else
    test_fail "Grafana container is NOT running"
fi

if docker ps | grep -q "tempo"; then
    test_pass "Tempo container is running"
else
    test_fail "Tempo container is NOT running"
fi

if docker ps | grep -q "loki"; then
    test_pass "Loki container is running"
else
    test_fail "Loki container is NOT running"
fi

if docker ps | grep -q "prometheus"; then
    test_pass "Prometheus container is running"
else
    test_fail "Prometheus container is NOT running"
fi

if docker ps | grep -q "otel-collector"; then
    test_pass "OTel Collector container is running"
else
    test_fail "OTel Collector container is NOT running"
fi

echo ""

# 2. Check HTTP endpoints
echo "2️⃣  Checking HTTP endpoints..."

# Grafana
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200"; then
    test_pass "Grafana is responding on port 3000"
else
    test_fail "Grafana is NOT responding on port 3000"
fi

# Prometheus
if curl -s http://localhost:9090/-/healthy | grep -q "Prometheus"; then
    test_pass "Prometheus is responding on port 9090"
else
    test_fail "Prometheus is NOT responding on port 9090"
fi

# OTel Collector
if curl -s http://localhost:13133 | grep -q "Server available"; then
    test_pass "OTel Collector is healthy on port 13133"
else
    test_fail "OTel Collector is NOT healthy"
fi

echo ""

# 3. Check Grafana datasources
echo "3️⃣  Checking Grafana datasources..."

DATASOURCES=$(curl -s -u admin:admin123 http://localhost:3000/api/datasources 2>/dev/null || echo "[]")

if echo "$DATASOURCES" | grep -q "Prometheus"; then
    test_pass "Prometheus datasource is configured"
else
    test_fail "Prometheus datasource is NOT configured"
fi

if echo "$DATASOURCES" | grep -q "Tempo"; then
    test_pass "Tempo datasource is configured"
else
    test_fail "Tempo datasource is NOT configured"
fi

if echo "$DATASOURCES" | grep -q "Loki"; then
    test_pass "Loki datasource is configured"
else
    test_fail "Loki datasource is NOT configured"
fi

echo ""

# 4. Check if OTel Collector can receive data
echo "4️⃣  Testing OTel Collector ingestion..."

# Send a test span
TEST_TRACE=$(cat <<EOF
{
  "resourceSpans": [{
    "resource": {
      "attributes": [
        {"key": "service.name", "value": {"stringValue": "smoke-test"}}
      ]
    },
    "scopeSpans": [{
      "spans": [{
        "traceId": "$(openssl rand -hex 16)",
        "spanId": "$(openssl rand -hex 8)",
        "name": "smoke-test-span",
        "kind": 1,
        "startTimeUnixNano": "$(date +%s)000000000",
        "endTimeUnixNano": "$(date +%s)000000000"
      }]
    }]
  }]
}
EOF
)

if curl -s -X POST http://localhost:4318/v1/traces \
    -H "Content-Type: application/json" \
    -d "$TEST_TRACE" \
    -o /dev/null -w "%{http_code}" | grep -q "200"; then
    test_pass "OTel Collector accepts traces"
else
    test_fail "OTel Collector does NOT accept traces"
fi

# Send a test metric
if curl -s -X POST http://localhost:4318/v1/metrics \
    -H "Content-Type: application/json" \
    -d '{"resourceMetrics":[]}' \
    -o /dev/null -w "%{http_code}" | grep -q "200"; then
    test_pass "OTel Collector accepts metrics"
else
    test_fail "OTel Collector does NOT accept metrics"
fi

echo ""

# 5. Check Prometheus targets
echo "5️⃣  Checking Prometheus targets..."

TARGETS=$(curl -s http://localhost:9090/api/v1/targets 2>/dev/null || echo '{"status":"error"}')

if echo "$TARGETS" | grep -q "otel-collector"; then
    test_pass "Prometheus is scraping OTel Collector"
else
    test_fail "Prometheus is NOT scraping OTel Collector"
fi

echo ""

# 6. Summary
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Open Grafana: http://localhost:3000 (admin/admin123)"
    echo "  2. Start your app with OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318"
    echo "  3. Generate traffic and view traces/logs/metrics in Grafana"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please check the output above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check Docker containers: docker-compose ps"
    echo "  2. Check logs: docker-compose logs"
    echo "  3. Restart stack: docker-compose down && docker-compose up -d"
    exit 1
fi

