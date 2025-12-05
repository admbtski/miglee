# Event Edit Panel

A simplified, section-based event editing experience. Each section saves independently.

## Architecture

```
/edit
├── _components/
│   ├── edit-provider.tsx    # Context for intent data and save operations
│   ├── edit-section.tsx     # Wrapper using ManagementPageLayout + save button
│   └── index.ts             # Exports
├── basics/                  # Event name, categories, description, tags
├── cover/                   # Cover image upload with drag & drop
├── schedule/                # Date/time with presets and duration
├── location/                # Meeting type, address, map, online link
├── capacity/                # 1:1, Group, Custom modes with PRO gating
├── privacy/                 # Visibility settings
├── join-rules/              # Registration windows with presets
├── audience/                # Skill levels
├── layout.tsx               # Provides EditProvider context
└── page.tsx                 # Redirects to /basics
```

## Key Features

### Consistent with Other Manage Pages

All edit sections use `ManagementPageLayout` for consistent styling with other pages like `appearance`, `join-form`, etc.

### Independent Saving

Each section has its own Save button. Changes are saved independently without affecting other sections.

### Presets

- **Schedule**: Quick start presets (Now +1h, Tonight, Tomorrow, Weekend) and duration presets (Coffee, Lunch, Workshop, etc.)
- **Join Rules**: Preset configurations (Casual meetup, Structured event, Workshop, Drop-in session)

### PRO Gating

Custom capacity mode (1-99999 or unlimited participants) is gated behind PRO plan. Free users see an upgrade prompt.

### Map Integration

Location section includes:

- Address autocomplete
- "Use my location" button
- Draggable map pin
- Privacy radius slider (0-10km)

### Privacy Controls

- Event visibility (Public/Hidden)
- Address visibility (Always/After join/Hidden)
- Member list visibility (Always/After join/Hidden)
- Map display toggle

## Components

### EditProvider

Provides intent data and save operations to all sections.

```tsx
const { intent, isLoading, saveSection } = useEdit();
```

### EditSection

Wrapper for each section using ManagementPageLayout with save button.

```tsx
<EditSection
  title="Basics"
  description="Set up the fundamental details"
  onSave={handleSave}
  isDirty={isDirty}
  isLoading={isLoading}
>
  {/* Section content */}
</EditSection>
```

### FormField

Consistent field wrapper with label, description, and error handling.

```tsx
<FormField
  label="Event name"
  description="Max 60 characters"
  required
  error={errors.title}
>
  <input ... />
</FormField>
```

### InfoBox

Informational boxes with different variants.

```tsx
<InfoBox variant="info">
  <p>Helpful tip here</p>
</InfoBox>
```

## Sections

### 1. Basics

- Event name (max 60 chars, required)
- Categories (1-3, required)
- Description (max 500 chars, optional)
- Tags (0-3, optional)

### 2. Cover Image

- Drag & drop upload
- PNG, JPG, WEBP (max 10MB)
- Fallback cover info

### 3. Schedule

- Quick start presets
- Date/time pickers
- Duration presets
- Timezone display

### 4. Location

- Meeting type (In-person/Online/Hybrid)
- Address with autocomplete
- Map preview with draggable pin
- Privacy radius slider
- Online meeting link

### 5. Capacity

- 1:1 mode (fixed 2 participants)
- Group mode (2-50, slider)
- Custom mode (PRO only, 1-99999 or unlimited)

### 6. Privacy

- Event visibility
- Map display toggle
- Address visibility
- Member list visibility

### 7. Join Rules

- Quick presets
- Registration open/close times
- Late join settings

### 8. Audience

- Skill levels (Beginner/Intermediate/Advanced)
- Multi-select with quick actions

## Navigation

Navigation is handled by the main `IntentManagementSidebar` in the `/manage/` layout. The edit layout only provides the `EditProvider` context.
