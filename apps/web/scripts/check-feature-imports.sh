#!/bin/bash

# Script to check for direct imports into feature internals
# These should use the feature's public API instead

echo "🔍 Checking for direct imports into feature internals..."
echo ""

# Find all imports that go directly into feature subfolders
grep -r "from ['\"]@/features/[^/]\+/\(components\|api\|hooks\|types\|utils\|constants\)/" \
  src/app src/features src/components src/lib 2>/dev/null | \
  grep -v "node_modules" | \
  grep -v ".next" | \
  wc -l | \
  xargs -I {} echo "Found {} direct imports into feature internals"

echo ""
echo "📊 Breakdown by feature:"
echo ""

# Count by feature
grep -r "from ['\"]@/features/[^/]\+/\(components\|api\|hooks\|types\|utils\|constants\)/" \
  src/app src/features src/components src/lib 2>/dev/null | \
  grep -v "node_modules" | \
  grep -v ".next" | \
  sed -E "s/.*@\/features\/([^/]+)\/.*/\1/" | \
  sort | uniq -c | sort -rn

echo ""
echo "✅ Correct usage example:"
echo "   import { EventCard, useGetEvents } from '@/features/events';"
echo ""
echo "❌ Incorrect usage example:"
echo "   import { EventCard } from '@/features/events/components/event-card';"
echo "   import { useGetEvents } from '@/features/events/api/use-get-events';"
echo ""
echo "💡 To fix: Update feature's index.ts to export what's needed, then import from feature root"

