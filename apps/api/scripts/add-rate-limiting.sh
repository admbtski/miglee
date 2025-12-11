#!/bin/bash

# Script to add rate limiting imports to mutation files
# Run with: bash scripts/add-rate-limiting.sh

echo "🚀 Adding rate limiting to remaining mutations..."

# Note: This script adds imports. You need to manually add await assertRateLimit() calls.
# Follow the pattern in billing.ts

FILES=(
  "src/graphql/resolvers/mutation/feedback-questions.ts:assertFeedbackRateLimit,assertFeedbackSendRateLimit"
  "src/graphql/resolvers/mutation/reports.ts:assertReportRateLimit"
  "src/graphql/resolvers/mutation/join-requests.ts:assertEventWriteRateLimit"
)

for FILE_SPEC in "${FILES[@]}"; do
  IFS=':' read -r FILE HELPERS <<< "$FILE_SPEC"
  
  if [ -f "$FILE" ]; then
    echo "📝 Processing $FILE..."
    
    # Check if import already exists
    if ! grep -q "domainRateLimiter" "$FILE"; then
      # Find the last import line
      LAST_IMPORT=$(grep -n "^import" "$FILE" | tail -1 | cut -d: -f1)
      
      if [ -n "$LAST_IMPORT" ]; then
        # Add import after last import
        sed -i.bak "${LAST_IMPORT}a\\
import { $HELPERS } from '../../../lib/rate-limit/domainRateLimiter';
" "$FILE"
        echo "  ✅ Added import for $HELPERS"
        rm "${FILE}.bak"
      fi
    else
      echo "  ⏭️  Import already exists"
    fi
  else
    echo "  ❌ File not found: $FILE"
  fi
done

echo ""
echo "✅ Imports added!"
echo ""
echo "📝 NEXT STEPS:"
echo "1. Add await assertRateLimit() calls in each mutation"
echo "2. Follow the pattern from billing.ts"
echo "3. See RATE_LIMITING_IMPLEMENTATION.md for details"
echo "4. Run: pnpm typecheck"
