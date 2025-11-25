# Highlight Color & Boost Feature Documentation

## Overview

This document describes the implementation of two key event sponsorship features:

1. **Custom Highlight Colors** - Events can have custom colored borders/rings
2. **24-Hour Boost Promotion** - Events can be boosted to appear at the top of listings for 24 hours

## Database Schema

### Intent Model Fields

```prisma
model Intent {
  // ... existing fields

  // Highlight & Boost Fields
  highlightColor String?    @map("highlight_color")  // HEX color for event border
  boostedAt      DateTime?  @map("boosted_at")       // Timestamp of last boost

  // ... other fields
}
```

### Indexes

```prisma
@@index([boostedAt(sort: Desc)])  // Optimized for sorting by boost priority
```

## GraphQL Schema

### Intent Type

```graphql
type Intent {
  # ... existing fields

  # Highlight & Boost
  highlightColor: String # HEX format: #RRGGBB
  boostedAt: DateTime # ISO 8601 timestamp

  # ... other fields
}
```

### Mutations

```graphql
type Mutation {
  # Update event highlight color (or remove it by passing null)
  updateIntentHighlightColor(intentId: ID!, color: String): Boolean!

  # Use a boost to promote event for 24 hours
  useBoost(intentId: ID!): Boolean!
}
```

## Frontend Implementation

### Event Detail Page (`/intent/[id]`)

**Location:**

- `apps/web/src/app/intent/[id]/_components/event-hero.tsx` - Event card with ring effect
- `apps/web/src/app/intent/[id]/_components/event-detail-client.tsx` - Page background tint, category tags

#### Features:

1. **Page Background Tint** (MAIN FEATURE)
   - Entire page gets a subtle colored background when boosted
   - Applied to root `<div>` of event detail page
   - Very subtle intensity (3-8% opacity diagonal gradient)
   - Creates cohesive, branded feel without overwhelming
   - Smooth color transition with 500ms duration
   - Most elegant and professional approach

2. **Category Tags Colored Background**
   - Category badges use highlight color as full background when boosted
   - 95% opacity for vibrant but readable effect
   - Replaces default `bg-black/40` background
   - Makes tags stand out clearly against cover photo

3. **Event Hero Card - Highlight Ring Effect**
   - Shows colored border when event is boosted AND has a highlight color
   - Supports 4 preset colors with predefined Tailwind classes
   - Supports custom HEX colors with dynamic inline styles
   - Creates a glowing shadow effect matching the highlight color

4. **Promoted Badge with Countdown**
   - Displays when boost is active (within 24 hours of `boostedAt`)
   - Shows real-time countdown timer (updates every second)
   - Format: `Xh Ym` (hours/minutes) or `Ym Xs` (minutes/seconds) or `Xs` (seconds only)
   - Beautiful gradient design with icons

#### Code Structure:

**In `event-hero.tsx`:**

```tsx
// Check if boost is active
const isBoosted = useMemo(() => {
  if (!event.boostedAt) return false;
  const elapsed = Date.now() - new Date(event.boostedAt).getTime();
  return elapsed < 24 * 60 * 60 * 1000; // 24 hours
}, [event.boostedAt]);

// Real-time countdown timer
const [boostTimeLeft, setBoostTimeLeft] = useState<number | null>(null);

useEffect(() => {
  if (!event.boostedAt || !isBoosted) return;

  const updateTimeLeft = () => {
    const remaining = 24 * 60 * 60 * 1000 - elapsed;
    setBoostTimeLeft(remaining > 0 ? remaining : null);
  };

  updateTimeLeft();
  const interval = setInterval(updateTimeLeft, 1000);
  return () => clearInterval(interval);
}, [event.boostedAt, isBoosted]);
```

**In `event-detail-client.tsx` (PAGE BACKGROUND APPROACH):**

```tsx
import { isBoostActive, getHighlightBackgroundStyle } from '@/lib/utils/is-boost-active';

// Check if boost is active (before early returns)
const isBoosted = useMemo(
  () => isBoostActive(intent?.boostedAt),
  [intent?.boostedAt]
);

// Get subtle background style for entire page
const subtleHighlightStyle = useMemo(
  () => getHighlightBackgroundStyle(intent?.highlightColor, isBoosted, 'subtle'),
  [intent?.highlightColor, isBoosted]
);

// Apply to page root
<div
  className="min-h-screen pb-20 bg-zinc-50 ... transition-colors duration-500"
  style={isBoosted ? subtleHighlightStyle : undefined}
>
  {/* Entire page content */}
</div>

// Apply to category tags
<span
  className="... text-white rounded-full backdrop-blur-sm"
  style={
    isBoosted && intent?.highlightColor
      ? { backgroundColor: intent.highlightColor, opacity: 0.95 }
      : { backgroundColor: 'rgba(0, 0, 0, 0.4)' }
  }
>
  {cat.name}
</span>
```

### Event Cards (`/` and other listings)

**Location:** `apps/web/src/app/[[...slug]]/_components/event-card/event-card.tsx`

#### Features:

1. **Card Background Tint**
   - Card gets subtle colored background when boosted
   - Subtle intensity (3-8% opacity gradient)
   - Applied to entire card container
   - Works alongside ring border effect

2. **Promowane Badge**
   - Shows small "Promowane" badge when boost is active
   - Positioned at top-left with Sparkles icon

3. **Highlight Ring**
   - Colored border when boosted and has highlight color
   - Supports preset and custom colors
   - Glowing shadow effect

**In `event-card.tsx` (CARD BACKGROUND):**

```tsx
import { getHighlightBackgroundStyle } from '@/lib/utils/is-boost-active';

// Check if boost is active
const isBoosted = useMemo(() => isBoostActive(boostedAt), [boostedAt]);

// Get card background style
const cardBackgroundStyle = useMemo(
  () => getHighlightBackgroundStyle(highlightColor, isBoosted, 'subtle'),
  [highlightColor, isBoosted]
);

// Apply to card
<motion.div
  className="... transition-colors duration-500"
  style={{
    ...highlightRing.style,
    ...(isBoosted && cardBackgroundStyle.background ? cardBackgroundStyle : {}),
  }}
>
```

### Subscription Management Panel

**Location:** `apps/web/src/app/intent/[id]/manage/subscription/_components/subscription-panel.tsx`

#### Features:

1. **Highlight Color Picker**
   - Section: "Wyróżniony kafelek"
   - 4 preset colors to choose from
   - Custom color input (HTML5 color picker)
   - HEX text input with real-time validation
   - "Zapisz kolor" button to save
   - "Usuń kolor" button to clear highlight

2. **Boost Section**
   - Shows remaining boosts
   - "Podbij wydarzenie" button
   - Displays last boost time or active countdown
   - Cooldown protection (15 seconds between actions)

## Backend Implementation

### Resolver: `updateIntentHighlightColor`

**Location:** `apps/api/src/graphql/resolvers/mutation/billing.ts`

```typescript
export const updateIntentHighlightColorMutation: MutationResolvers['updateIntentHighlightColor'] =
  async (_parent, args, { user }) => {
    const { intentId, color } = args;

    // Validate HEX format if color is provided (allow null for removal)
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      throw new Error('Invalid color format. Use HEX format: #RRGGBB');
    }

    // Verify user is owner/moderator
    // ... permission check

    await prisma.intent.update({
      where: { id: intentId },
      data: { highlightColor: color },
    });

    return true;
  };
```

### Service: `useBoost`

**Location:** `apps/api/src/lib/billing/event-sponsorship.service.ts`

```typescript
export async function useBoost(intentId: string): Promise<void> {
  const sponsorship = await prisma.eventSponsorship.findUnique({
    where: { intentId },
  });

  if (!sponsorship || sponsorship.status !== 'ACTIVE') {
    throw new Error('No active sponsorship for this event');
  }

  if (sponsorship.boostsUsed >= sponsorship.boostsTotal) {
    throw new Error('All boosts have been used');
  }

  // Update both sponsorship and intent in a transaction
  await prisma.$transaction([
    prisma.eventSponsorship.update({
      where: { id: sponsorship.id },
      data: { boostsUsed: { increment: 1 } },
    }),
    prisma.intent.update({
      where: { id: intentId },
      data: { boostedAt: new Date() }, // Set current time for 24h promotion
    }),
  ]);
}
```

### Sorting Logic

**Location:** `apps/api/src/graphql/resolvers/query/intents.ts`

Events are sorted with `boostedAt` having the **highest priority**:

```typescript
const orderBy = buildOrderBy(sortBy, sortDir);

function buildOrderBy(sortBy: string, sortDir: string) {
  const order: any[] = [];

  // 1. ALWAYS prioritize boosted events (within 24h)
  order.push({ boostedAt: { sort: 'desc', nulls: 'last' } });

  // 2. Then apply user-selected sorting
  if (sortBy === 'CREATED_AT') {
    order.push({ createdAt: sortDir.toLowerCase() });
  } else if (sortBy === 'START_DATE') {
    order.push({ startAt: sortDir.toLowerCase() });
  }
  // ... other sorting options

  return order;
}
```

**Note:** The 24-hour expiration is handled in application logic. Events with `boostedAt` older than 24 hours still sort by this field, but are treated as "not boosted" in the UI.

## Shared Constants

**Location:** `apps/web/src/lib/billing-constants.ts`

```typescript
export const HIGHLIGHT_PRESETS = [
  {
    name: 'Niebieski',
    hex: '#3b82f6',
    ring: 'ring-blue-500',
    shadow: 'shadow-blue-500/50',
  },
  {
    name: 'Fioletowy',
    hex: '#a855f7',
    ring: 'ring-purple-500',
    shadow: 'shadow-purple-500/50',
  },
  {
    name: 'Różowy',
    hex: '#ec4899',
    ring: 'ring-pink-500',
    shadow: 'shadow-pink-500/50',
  },
  {
    name: 'Pomarańczowy',
    hex: '#f97316',
    ring: 'ring-orange-500',
    shadow: 'shadow-orange-500/50',
  },
];
```

## Utility Functions

### Frontend: `isBoostActive` & `getHighlightBackgroundStyle`

**Location:** `apps/web/src/lib/utils/is-boost-active.ts`

```typescript
// Check if boost is active (within 24 hours)
export function isBoostActive(boostedAt: string | null | undefined): boolean {
  if (!boostedAt) return false;
  const boostedTime = new Date(boostedAt).getTime();
  const now = Date.now();
  const elapsed = now - boostedTime;
  return elapsed < 24 * 60 * 60 * 1000; // 24 hours in ms
}

// Generate gradient background styles
export function getHighlightBackgroundStyle(
  highlightColor: string | null | undefined,
  isBoosted: boolean,
  intensity: 'subtle' | 'medium' | 'strong' = 'medium'
): React.CSSProperties {
  if (!isBoosted || !highlightColor) {
    return {};
  }

  // Convert HEX to RGB for alpha manipulation
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result && result[1] && result[2] && result[3]
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 59, g: 130, b: 246 }; // fallback to blue
  };

  const rgb = hexToRgb(highlightColor);
  const rgbString = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  // Define opacity levels based on intensity
  const opacities = {
    subtle: { start: 0.03, end: 0.08 }, // Very light
    medium: { start: 0.05, end: 0.12 }, // Noticeable
    strong: { start: 0.08, end: 0.18 }, // Prominent
  };

  const { start, end } = opacities[intensity];

  return {
    background: `linear-gradient(135deg, rgba(${rgbString}, ${start}) 0%, rgba(${rgbString}, ${end}) 100%)`,
  };
}
```

### Map Helper: `mapIntent`

**Location:** `apps/api/src/graphql/resolvers/helpers.ts`

Maps Prisma Intent model to GraphQL Intent type:

```typescript
export function mapIntent(i: IntentWithGraph, viewerId?: string): GQLIntent {
  return {
    // ... other fields
    boostedAt: i.boostedAt ?? null,
    highlightColor: i.highlightColor ?? null,
    // ... other fields
  };
}
```

## User Experience

### Setting Highlight Color

1. User goes to `/intent/[id]/manage/subscription`
2. Scrolls to "Wyróżniony kafelek" section
3. Chooses a preset color OR enters custom HEX color
4. Clicks "Zapisz kolor"
5. Color is saved to database
6. When event is boosted, the colored ring appears

### Using Boost

1. User goes to `/intent/[id]/manage/subscription`
2. Clicks "Podbij wydarzenie" (if boosts remaining > 0)
3. Backend:
   - Decrements `boostsUsed` in `EventSponsorship`
   - Sets `boostedAt` to current timestamp in `Intent`
4. Event appears at top of listings for 24 hours
5. Event detail page shows "Promowane" badge with countdown
6. After 24 hours, boost expires (UI logic)

### Visual Feedback

#### Active Boost (with highlight color):

**Event Detail Page:**

- ✅ Colored gradient overlay on hero cover image (`mix-blend-overlay`)
- ✅ Category tags with full highlight color background (95% opacity)
- ✅ Metadata card with subtle gradient background (barely visible)
- ✅ Event hero card with colored ring border (from `event-hero.tsx`)
- ✅ "Wydarzenie promowane" panel with countdown timer

**Event Cards (listings):**

- ✅ Colored border on event card
- ✅ "Promowane" badge

**Design Philosophy:**
The background approach is more subtle and professional than glowing borders. It:

- Enhances the visual appeal without being overwhelming
- Works naturally with photos using `mix-blend-overlay`
- Creates a cohesive color theme across all elements
- Maintains readability and accessibility

#### Active Boost (no highlight color):

**Event Detail Page:**

- ✅ "Wydarzenie promowane" panel with countdown
- ❌ No colored backgrounds or effects (standard appearance)

**Event Cards:**

- ✅ "Promowane" badge
- ❌ No colored effects (default appearance)

#### No Boost:

- ❌ No badges, no colored backgrounds, no effects
- ℹ️ Standard event appearance

## Technical Decisions

### Why 24 Hours?

Boosts are time-limited to:

1. Create urgency and value for the feature
2. Encourage regular engagement
3. Prevent permanent "pay-to-win" dynamics
4. Keep listings fresh and dynamic

### Why Application-Layer Expiration?

PostgreSQL `GENERATED ALWAYS AS` columns require immutable expressions. `NOW()` is not immutable, so we handle the 24-hour logic in:

- Application code (sorting, filtering)
- Frontend UI (display logic)

### Why Nullable `highlightColor`?

Users should be able to:

1. Remove highlight color if they change their mind
2. Use boost without custom colors (optional feature)

## Testing Checklist

### Database

- [ ] `highlightColor` field stores HEX values correctly
- [ ] `boostedAt` field stores timestamps correctly
- [ ] Sorting by `boostedAt DESC NULLS LAST` works

### GraphQL API

- [ ] `updateIntentHighlightColor` mutation accepts valid HEX
- [ ] `updateIntentHighlightColor` mutation accepts `null` to remove color
- [ ] `updateIntentHighlightColor` mutation rejects invalid formats
- [ ] `useBoost` mutation sets `boostedAt` correctly
- [ ] `GetIntentDetail` query returns `highlightColor` and `boostedAt`
- [ ] `GetIntents` query returns `highlightColor` and `boostedAt`

### Frontend UI

- [ ] Event detail page shows highlight ring when boosted + color set
- [ ] Event detail page shows countdown badge when boosted
- [ ] Countdown updates every second
- [ ] Countdown hides after 24 hours
- [ ] Color picker shows current color
- [ ] Custom HEX input validates format
- [ ] "Usuń kolor" button removes highlight
- [ ] Event cards show "Promowane" badge when boosted
- [ ] Event cards show highlight ring when boosted + color set

### Sorting

- [ ] Boosted events appear at top of listings
- [ ] Non-boosted events sort by selected criteria (createdAt, startAt, etc.)
- [ ] Expired boosts (>24h) don't affect sorting

## Future Enhancements

1. **Server-side 24h Filtering**: Add PostgreSQL trigger to auto-clear `boostedAt` after 24h
2. **Push Notifications**: Notify users when boost expires
3. **Analytics**: Track boost effectiveness (views, clicks, conversions)
4. **Gradient Borders**: Allow gradient highlight colors
5. **Animated Rings**: Add pulse/glow animations to highlighted events

---

**Last Updated:** 2025-11-25
**Version:** 1.0
