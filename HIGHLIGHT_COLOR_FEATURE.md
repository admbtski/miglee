# 🎨 Custom Highlight Color Feature

**Date**: November 25, 2025  
**Version**: 1.0  
**Status**: Implemented

---

## 🎯 Overview

This feature allows users to customize the highlight ring color for their boosted events. When purchasing or upgrading an event sponsorship plan (Plus/Pro), users can select from 4 preset colors or choose a custom color from a full palette.

---

## 🖼️ Feature Highlights

### Preset Colors

4 professionally designed preset colors are available:

- **Złoty (Amber)** - `#f59e0b` - Default
- **Niebieski (Blue)** - `#3b82f6`
- **Fioletowy (Purple)** - `#a855f7`
- **Zielony (Green)** - `#22c55e`

### Custom Colors

Users can select any custom color using:

- **Color Picker Widget** - Visual color selection
- **HEX Input** - Manual HEX code entry (#RRGGBB)

### Live Preview

Real-time preview of the selected highlight color shows how the event card will appear with the chosen ring color.

---

## 📐 Architecture

### Database Schema

#### `Intent` Model

Added `highlightColor` field to store the custom color:

```prisma
model Intent {
  // ... existing fields
  boostedAt       DateTime? // Last time event was boosted
  highlightColor  String?   // Custom highlight/ring color (hex format: #RRGGBB)
}
```

### GraphQL Schema

#### Type Definition

```graphql
type Intent {
  # ... existing fields
  boostedAt: DateTime
  highlightColor: String # Custom highlight/ring color (hex format: #RRGGBB)
}
```

#### Input

```graphql
input CreateEventSponsorshipCheckoutInput {
  intentId: ID!
  plan: IntentPlan!
  actionType: String
  actionPackageSize: Int
  highlightColor: String # Hex color for event highlight ring
}
```

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User selects highlight color in Checkout Panel          │
│    - Choose from 4 presets OR                              │
│    - Select custom color from palette                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Color passed to createEventSponsorshipCheckout mutation │
│    - Stored in Stripe checkout session metadata            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. User redirected to Stripe for payment                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Stripe webhook: checkout.session.completed              │
│    - handleEventSponsorshipCheckout extracts color          │
│    - Updates Intent.highlightColor field                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend displays EventCard with custom highlight       │
│    - Preset colors use Tailwind classes                    │
│    - Custom colors use inline styles with boxShadow        │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Implementation Details

### Backend (API)

#### Constants (`billing-constants.ts`)

```typescript
export const HIGHLIGHT_PRESETS = [
  {
    id: 'amber',
    name: 'Złoty',
    hex: '#f59e0b',
    ring: 'ring-amber-500/30',
    shadow:
      'shadow-[0_0_16px_rgba(245,158,11,0.35),0_0_48px_rgba(245,158,11,0.2)]',
  },
  // ... more presets
] as const;

export const DEFAULT_HIGHLIGHT_COLOR = HIGHLIGHT_PRESETS[0].hex; // amber
```

#### Checkout Service (`event-sponsorship.service.ts`)

```typescript
export interface CreateEventSponsorshipCheckoutParams {
  // ... existing fields
  highlightColor?: string; // Hex color for highlight ring
}

// In createEventSponsorshipCheckout:
const metadata = {
  type: METADATA_TYPE.EVENT_SPONSORSHIP,
  eventSponsorshipId: sponsorship.id,
  intentId,
  userId,
  plan,
  actionType,
  actionPackageSize: String(actionPackageSize || actionsToAdd),
  highlightColor: highlightColor || '', // Store for webhook
};
```

#### Webhook Handler (`webhook-handler.service.ts`)

```typescript
async function handleEventSponsorshipCheckout(
  session: Stripe.Checkout.Session,
  metadata: EventSponsorshipMetadata
): Promise<void> {
  const { highlightColor } = metadata;

  // Update Intent with highlight color (only for new/upgrade, not reload)
  if (highlightColor && actionType !== 'reload') {
    await prisma.intent.update({
      where: { id: intentId },
      data: { highlightColor },
    });
  }
}
```

#### GraphQL Resolver (`helpers.ts`)

```typescript
export function mapIntent(i: IntentWithGraph, viewerId?: string): GQLIntent {
  return {
    // ... existing fields
    boostedAt: i.boostedAt ?? null,
    highlightColor: i.highlightColor ?? null,
  };
}
```

### Frontend (Web)

#### Color Picker Component (`highlight-color-picker.tsx`)

- Displays 4 preset color buttons
- Custom color option with:
  - Native HTML5 color picker
  - Manual HEX input field
  - Live preview
- Validation for HEX format (#RRGGBB)

#### Checkout Panel (`checkout-panel.tsx`)

```tsx
const [highlightColor, setHighlightColor] = React.useState<string>(
  DEFAULT_HIGHLIGHT_COLOR
);

// Pass color to mutation
const result = await createCheckout.mutateAsync({
  input: {
    intentId,
    plan: planMap[selectedPlan],
    actionType,
    highlightColor, // Custom color
  },
});
```

#### Event Card (`event-card.tsx`)

```tsx
function getHighlightRingClasses(
  highlightColor: string | null | undefined,
  isCanceled: boolean,
  isDeleted: boolean
): { className: string; style?: React.CSSProperties } {
  // Check for preset
  const preset = HIGHLIGHT_PRESETS.find(
    (p) => p.hex.toLowerCase() === highlightColor.toLowerCase()
  );

  if (preset) {
    return { className: `ring-2 ${preset.ring} ${preset.shadow}` };
  }

  // Custom color - use inline styles
  const rgb = hexToRgb(highlightColor);
  return {
    className: 'ring-2',
    style: {
      boxShadow: `0 0 0 2px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3), 
                  0 0 16px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35), 
                  0 0 48px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
    },
  };
}
```

---

## 🎨 UX Design

### Checkout Panel

1. **Location**: Between "Co otrzymujesz" and "Security & Agreements" sections
2. **Visibility**: Only shown for Plus/Pro plans, hidden for reload actions
3. **Default**: Amber color pre-selected
4. **Interactive**: Immediate visual feedback on selection

### Color Selection

- **Preset Buttons**: Large, clickable color circles with labels
- **Selected State**: Blue ring + checkmark indicator
- **Custom Option**: Expandable section with color picker and HEX input
- **Preview**: Real-time preview of how the event card will look

### Event Card Display

- **Boosted Events**: Display ring with selected color (if boost active < 24h)
- **Non-boosted Events**: No ring displayed
- **Performance**: Preset colors use CSS classes, custom colors use inline styles

---

## 🔧 Technical Considerations

### Color Validation

- HEX format: `#[0-9A-F]{6}` (case-insensitive)
- Invalid colors fallback to amber (#f59e0b)
- Stored in database exactly as provided by user

### Performance

- **Preset Colors**: Leverage Tailwind CSS classes (no runtime computation)
- **Custom Colors**: Generate inline styles dynamically
- **Caching**: `highlightColor` fetched once per intent, cached by GraphQL

### Security

- Color values are sanitized (hex format validation)
- No XSS risk (colors applied via CSS, not innerHTML)
- Stripe metadata size limit: colors are small strings (~7 chars)

### Accessibility

- Color previews have sufficient contrast
- Labels provided for all color options
- Keyboard navigation supported in color picker

---

## 🧪 Testing

### Test Cases

1. ✅ Select preset color (amber, blue, purple, green)
2. ✅ Select custom color via picker
3. ✅ Enter custom color via HEX input
4. ✅ Invalid HEX input validation
5. ✅ Color persists after payment
6. ✅ Boosted event displays correct ring color
7. ✅ Non-boosted event shows no ring
8. ✅ Reload action doesn't change color

### Manual Testing

```bash
# 1. Start development environment
pnpm dev

# 2. Navigate to event management
/intent/{id}/manage/plans

# 3. Select Plus or Pro plan
# 4. Choose a highlight color (preset or custom)
# 5. Complete checkout (use Stripe test card)
# 6. Verify color appears on event card after boost

# 7. Test reload action
# - Color should remain unchanged
# - Boost counter should increment
```

---

## 📝 Migration

A database migration was created to add the `highlightColor` field:

```sql
-- Migration: 20251125131751_add_highlight_color_to_intents
ALTER TABLE "intents" ADD COLUMN "highlightColor" TEXT;
```

Existing intents have `highlightColor = NULL` (default, no custom color).

---

## 🎯 Future Enhancements

Potential improvements:

- [ ] Allow color change without purchasing new plan
- [ ] Gradient support (two-color rings)
- [ ] Animation effects (pulse, glow)
- [ ] More preset colors (pastels, neon, dark)
- [ ] Color themes (holiday, seasonal)
- [ ] Admin-defined "featured" colors
- [ ] A/B testing on color effectiveness

---

## 📚 Related Files

### Backend

- `apps/api/prisma/schema.prisma` - Database model
- `apps/api/src/lib/billing/event-sponsorship.service.ts` - Checkout logic
- `apps/api/src/lib/billing/webhook-handler.service.ts` - Payment processing
- `apps/api/src/lib/billing/constants.ts` - Metadata interface
- `apps/api/src/graphql/resolvers/helpers.ts` - Intent mapper
- `apps/api/src/graphql/resolvers/mutation/billing.ts` - GraphQL mutation

### Frontend

- `apps/web/src/lib/billing-constants.ts` - Color presets
- `apps/web/src/app/intent/[id]/manage/plans/_components/highlight-color-picker.tsx` - UI component
- `apps/web/src/app/intent/[id]/manage/plans/_components/checkout-panel.tsx` - Integration
- `apps/web/src/app/[[...slug]]/_components/event-card/event-card.tsx` - Display logic
- `apps/web/src/types/intent.ts` - TypeScript types

### Schema

- `packages/contracts/graphql/schema.graphql` - GraphQL type definitions
- `packages/contracts/graphql/fragments/intents.graphql` - GraphQL fragments

---

## ✨ Summary

The custom highlight color feature provides a personalized, visually appealing way for users to make their boosted events stand out. The implementation is:

- **User-friendly**: Intuitive color picker with presets and custom options
- **Performant**: Optimized rendering with Tailwind classes and inline styles
- **Secure**: Validated inputs, sanitized outputs
- **Extensible**: Easy to add more presets or features in the future

This feature enhances the event sponsorship experience and gives users more control over their event's visual presentation on the platform.
