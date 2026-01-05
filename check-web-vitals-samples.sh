#!/bin/bash

echo "🔍 Checking Web Vitals samples count:"
echo ""

echo "LCP samples:"
curl -s 'http://localhost:9090/api/v1/query?query=app_web_vitals_lcp_milliseconds_count' | jq -r '.data.result[0].value[1] // "0"'

echo ""
echo "INP samples:"
curl -s 'http://localhost:9090/api/v1/query?query=app_web_vitals_inp_milliseconds_count' | jq -r '.data.result[0].value[1] // "0"'

echo ""
echo "CLS samples:"
curl -s 'http://localhost:9090/api/v1/query?query=app_web_vitals_cls_count' | jq -r '.data.result[0].value[1] // "0"'

echo ""
echo "FCP samples:"
curl -s 'http://localhost:9090/api/v1/query?query=app_web_vitals_fcp_milliseconds_count' | jq -r '.data.result[0].value[1] // "0"'

echo ""
echo "TTFB samples:"
curl -s 'http://localhost:9090/api/v1/query?query=app_web_vitals_ttfb_milliseconds_count' | jq -r '.data.result[0].value[1] // "0"'

echo ""
echo "✅ Target: ~20+ samples each for good charts"

