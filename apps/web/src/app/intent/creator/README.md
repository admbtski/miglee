# Intent Creator Page

## Overview

This is a full-page implementation of the intent creator/editor, analogous to the modal-based `CreateEditIntentModalConnect` component. It provides the same functionality but as a standalone page accessible at `/intent/creator`.

## Architecture

### File Structure

```
/app/intent/creator/
├── layout.tsx                          # Layout with metadata and QueryClientProvider
├── page.tsx                            # Server component entry point
├── _components/
│   ├── index.ts                        # Barrel exports
│   ├── intent-creator-page-client.tsx  # Main client component (analogous to CreateEditIntentModalConnect)
│   ├── intent-creator-form.tsx         # Multi-step form component (analogous to CreateEditIntentModal)
│   └── intent-creator-skeleton.tsx     # Loading skeleton
└── README.md                           # This file
```

### Component Hierarchy

```
page.tsx (Server Component)
  └── IntentCreatorPageClient (Client Component)
      ├── CategorySelectionProvider
      │   └── TagSelectionProvider
      │       └── IntentCreatorForm
      │           ├── BasicsStep (Step 0)
      │           ├── CapacityStep (Step 0)
      │           ├── TimeStep (Step 1)
      │           ├── PlaceStep (Step 1)
      │           ├── PrivacyStep (Step 2)
      │           ├── CoverStep (Step 3)
      │           └── ReviewStep (Step 4)
      └── SuccessIntentModal
```

## Features

### ✅ Complete Feature Parity with Modal Version

- **Multi-step wizard** with 5 steps (What & Who, When & Where, Settings, Cover, Review)
- **Auto-save draft** functionality (create mode only)
- **Form validation** with Zod schema
- **Category and tag selection** with providers
- **Cover image upload** with preview
- **Join form questions** (create mode only)
- **Keyboard shortcuts**:
  - `Enter`: Next step / Submit (skip in textarea)
  - `Shift+Enter`: Previous step
  - `Cmd/Ctrl+Enter`: Next step / Submit (works everywhere)
  - `Cmd/Ctrl+Shift+Enter`: Previous step (works everywhere)
- **Success modal** with confetti animation
- **Auto-redirect** to intent detail page after success

### 🎨 Page-Specific Enhancements

- **Full-page layout** with gradient background
- **Back button** to navigate away from creator
- **Responsive design** with max-width container
- **Loading skeleton** for edit mode
- **Progress bar** with step indicator
- **Clean, modern UI** with Tailwind styling

## Usage

### Creating a New Intent

Navigate to `/intent/creator`:

```tsx
// From anywhere in the app
router.push('/intent/creator');

// Or use a Link component
<Link href="/intent/creator">Create Event</Link>;
```

### Editing an Existing Intent

Pass the intent ID as a query parameter:

```tsx
// Navigate to edit mode
router.push(`/intent/creator?intentId=${intentId}`);

// Or use a Link component
<Link href={`/intent/creator?intentId=${intentId}`}>Edit Event</Link>;
```

## Data Flow

### Create Flow

1. User navigates to `/intent/creator`
2. `IntentCreatorPageClient` initializes with fresh default values
3. User fills out the multi-step form
4. Form auto-saves draft to localStorage every 5 seconds
5. User submits the form
6. `handleSubmit` calls `createAsync` mutation
7. If cover image is provided, uploads it via `uploadIntentCover`
8. Success modal is shown
9. User closes success modal
10. Auto-redirect to `/intent/{intentId}`

### Edit Flow

1. User navigates to `/intent/creator?intentId={id}`
2. `IntentCreatorPageClient` fetches intent data via `useIntentQuery`
3. Form is initialized with existing intent values
4. User modifies the form
5. User submits the form
6. `handleSubmit` calls `updateAsync` mutation
7. Success modal is shown
8. User closes success modal
9. Auto-redirect to `/intent/{intentId}`

## State Management

### Form State

- Managed by `react-hook-form` with Zod validation
- Schema: `IntentSchema` from `use-intent-form.tsx`
- Default values: `defaultIntentValues` with fresh dates

### Selection State

- **Categories**: Managed by `CategorySelectionProvider` (max 3)
- **Tags**: Managed by `TagSelectionProvider` (max 3)

### Draft State

- Stored in `localStorage` with key `intent-draft`
- Auto-saved every 5 seconds (create mode only)
- Includes form values, categories, and tags
- Restored on page load with user confirmation

### Cover Image State

- Local state: `coverImageFile`, `coverImagePreview`
- Uploaded after intent creation via `uploadIntentCover`

## API Integration

### GraphQL Mutations

- `useCreateIntentMutation`: Creates new intent
- `useUpdateIntentMutation`: Updates existing intent

### GraphQL Queries

- `useIntentQuery`: Fetches intent data for edit mode

### Media Upload

- `uploadIntentCover`: Uploads cover image to storage
- Invalidates React Query cache after upload

## Error Handling

### Form Validation Errors

- Displayed inline with field-specific error messages
- Step validation prevents navigation to next step

### API Errors

- Caught in `handleSubmit`
- User-friendly toast notifications
- Detailed error logging via `devLogger`

### Upload Errors

- Cover upload errors show toast notification
- Intent is still created even if cover upload fails

## Keyboard Shortcuts

| Shortcut               | Action                                |
| ---------------------- | ------------------------------------- |
| `Enter`                | Next step / Submit (skip in textarea) |
| `Shift+Enter`          | Previous step                         |
| `Cmd/Ctrl+Enter`       | Next step / Submit (works everywhere) |
| `Cmd/Ctrl+Shift+Enter` | Previous step (works everywhere)      |

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Performance Optimizations

- Lazy loading of step components
- Memoized initial values
- Debounced auto-save
- Query prefetching for edit mode
- Optimistic UI updates

## Testing Checklist

- [ ] Create new intent (all steps)
- [ ] Edit existing intent
- [ ] Auto-save draft functionality
- [ ] Draft restoration on page reload
- [ ] Cover image upload
- [ ] Join form questions (create mode)
- [ ] Form validation (all fields)
- [ ] Keyboard shortcuts
- [ ] Success modal and redirect
- [ ] Error handling (network errors, validation errors)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode compatibility
- [ ] Back button navigation

## Future Enhancements

- [ ] Add step-by-step tutorial/onboarding
- [ ] Add template selection (pre-filled forms)
- [ ] Add duplicate intent functionality
- [ ] Add preview mode before publishing
- [ ] Add collaborative editing (multiple users)
- [ ] Add AI-assisted form filling
- [ ] Add analytics tracking for form completion

## Related Files

### Core Components

- `/features/intents/components/create-edit-intent-modal-connect.tsx` - Modal version
- `/features/intents/components/create-edit-intent-modal.tsx` - Modal form
- `/features/intents/components/use-intent-form.tsx` - Form hook and validation

### Step Components

- `/features/intents/components/basics-step.tsx`
- `/features/intents/components/capacity-step.tsx`
- `/features/intents/components/time-step.tsx`
- `/features/intents/components/place-step.tsx`
- `/features/intents/components/privacy-step.tsx`
- `/features/intents/components/cover-step.tsx`
- `/features/intents/components/review-step.tsx`

### Utilities

- `/features/intents/components/mappers.ts` - Form ↔ API mappers
- `/features/intents/hooks/use-auto-save-draft.ts` - Draft auto-save
- `/lib/media/upload-intent-cover.ts` - Cover upload

## Notes

- This page provides the same functionality as the modal but with a better UX for complex intent creation
- The modal version is still available for quick intent creation from within the app
- Both versions share the same underlying components and logic
- The page version is recommended for desktop users and complex intents
- The modal version is recommended for mobile users and quick intents
