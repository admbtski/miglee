# Intent Creator Page - Test Checklist

## Pre-requisites

- [ ] Development server is running (`pnpm dev`)
- [ ] User is authenticated
- [ ] Database is accessible
- [ ] GraphQL API is running

## Basic Functionality Tests

### Page Access

- [ ] Navigate to `/intent/creator` - page loads without errors
- [ ] Page shows correct title: "Create New Event"
- [ ] Progress bar is visible and shows 0% initially
- [ ] Step 1 indicator shows "What & Who"

### Step 0: What & Who (Basics + Capacity)

#### Basics Section

- [ ] Title input is visible and functional
- [ ] Title validation works (min 3, max 60 chars)
- [ ] Category selector is visible
- [ ] Can select 1-3 categories
- [ ] Tag selector is visible
- [ ] Can select 0-3 tags
- [ ] Description textarea is visible
- [ ] Description validation works (max 500 chars)
- [ ] Mode selector (1:1 vs Group) works

#### Capacity Section

- [ ] Min capacity input works
- [ ] Max capacity input works
- [ ] Validation: min ≤ max
- [ ] 1:1 mode locks capacity to 2-2
- [ ] Group mode allows 2-50 range

### Step 1: When & Where (Time + Place)

#### Time Section

- [ ] Start date/time picker works
- [ ] End date/time picker works
- [ ] Validation: start must be in future (5 min buffer)
- [ ] Validation: end must be after start
- [ ] Validation: max duration 30 days
- [ ] Timezone is displayed correctly
- [ ] "Allow join late" toggle works
- [ ] Join window controls work

#### Place Section

- [ ] Meeting kind selector (Onsite/Online/Hybrid) works
- [ ] Location picker works for Onsite
- [ ] "Use my location" button works
- [ ] Online URL input works for Online
- [ ] Both location and URL work for Hybrid
- [ ] Address field is populated
- [ ] Radius slider works (0-20km)
- [ ] Notes textarea works

### Step 2: Settings (Privacy + Join Form)

#### Privacy Section

- [ ] Visibility selector (Public/Hidden) works
- [ ] Join mode selector (Open/Request/Invite Only) works
- [ ] Address visibility selector works
- [ ] Members visibility selector works
- [ ] Level checkboxes work (Beginner/Intermediate/Advanced)

#### Join Form Section (Create mode only)

- [ ] "Add Question" button is visible
- [ ] Can add text question
- [ ] Can add single choice question
- [ ] Can add multi choice question
- [ ] Can set question as required/optional
- [ ] Can add help text
- [ ] Can delete questions
- [ ] Max 5 questions enforced

### Step 3: Cover Image

- [ ] File upload button is visible
- [ ] Can select image file (jpg, png, webp)
- [ ] Image preview is shown after selection
- [ ] Can remove selected image
- [ ] File size validation works (max 10MB)
- [ ] Can skip this step (optional)

### Step 4: Review

- [ ] All form values are displayed correctly
- [ ] Can edit any step by clicking "Edit" button
- [ ] Map preview is shown (if location provided)
- [ ] Join form questions are shown (if any)
- [ ] Cover image preview is shown (if selected)
- [ ] Validation errors are highlighted

## Navigation Tests

### Forward Navigation

- [ ] "Continue" button is enabled when step is valid
- [ ] "Continue" button is disabled when step is invalid
- [ ] Clicking "Continue" moves to next step
- [ ] Progress bar updates correctly
- [ ] Step indicator updates correctly

### Backward Navigation

- [ ] "Back" button is visible (except on step 0)
- [ ] "Back" button is disabled on step 0
- [ ] Clicking "Back" moves to previous step
- [ ] Form values are preserved when going back

### Keyboard Shortcuts

- [ ] `Enter` moves to next step (skip in textarea)
- [ ] `Shift+Enter` moves to previous step
- [ ] `Cmd/Ctrl+Enter` moves to next step (works in textarea)
- [ ] `Cmd/Ctrl+Shift+Enter` moves to previous step

## Submission Tests

### Create Mode

- [ ] "Create Event" button is visible on final step
- [ ] Button is disabled if form is invalid
- [ ] Clicking button shows loading state
- [ ] Success modal appears after creation
- [ ] Confetti animation plays (if motion not reduced)
- [ ] Auto-close countdown is visible (5 seconds)
- [ ] Can close modal manually
- [ ] Redirects to intent detail page after close
- [ ] Cover image is uploaded (if provided)
- [ ] Join form questions are created (if provided)

### Edit Mode

- [ ] Navigate to `/intent/creator?intentId={id}`
- [ ] Page title shows "Edit Event"
- [ ] Form is pre-filled with existing values
- [ ] Categories and tags are pre-selected
- [ ] "Save Changes" button is visible on final step
- [ ] Button is disabled if form is unchanged
- [ ] Clicking button shows loading state
- [ ] Success modal appears after update
- [ ] Redirects to intent detail page after close

## Auto-save Tests (Create mode only)

- [ ] Draft is saved automatically every 5 seconds
- [ ] "Draft saved" indicator appears
- [ ] Timestamp is updated after each save
- [ ] Reload page - draft restoration prompt appears
- [ ] Clicking "Restore" loads draft values
- [ ] Clicking "Cancel" clears draft
- [ ] Draft includes form values
- [ ] Draft includes selected categories
- [ ] Draft includes selected tags
- [ ] Draft is cleared after successful submission

## Error Handling Tests

### Form Validation Errors

- [ ] Field-level errors are shown inline
- [ ] Error messages are clear and helpful
- [ ] Can't proceed to next step with errors
- [ ] Errors are cleared when field is fixed

### API Errors

- [ ] Network error shows toast notification
- [ ] GraphQL error shows toast notification
- [ ] Error message is user-friendly
- [ ] Form remains editable after error
- [ ] Can retry submission

### Upload Errors

- [ ] Cover upload error shows toast notification
- [ ] Intent is still created if upload fails
- [ ] Error message suggests retry later

## UI/UX Tests

### Responsive Design

- [ ] Desktop (≥1024px): Full layout with max-width
- [ ] Tablet (768-1023px): Adjusted padding
- [ ] Mobile (<768px): Single column, touch-friendly

### Dark Mode

- [ ] Toggle dark mode - all colors adapt
- [ ] Text is readable in both modes
- [ ] Borders and backgrounds are visible
- [ ] Gradient effects work in both modes

### Accessibility

- [ ] Can navigate entire form with keyboard only
- [ ] Focus indicators are visible
- [ ] ARIA labels are present
- [ ] Screen reader announces step changes
- [ ] Error messages are announced

### Performance

- [ ] Initial page load < 1 second
- [ ] Step transitions are smooth
- [ ] No layout shifts during load
- [ ] Form inputs are responsive
- [ ] Auto-save doesn't block UI

## Edge Cases

### Data Edge Cases

- [ ] Very long title (60 chars)
- [ ] Very long description (500 chars)
- [ ] Very long notes (300 chars)
- [ ] Max categories (3)
- [ ] Max tags (3)
- [ ] Max join questions (5)
- [ ] Start date far in future (1 year)
- [ ] Max duration (30 days)
- [ ] Max radius (20km)

### Behavior Edge Cases

- [ ] Rapid clicking "Continue" button
- [ ] Rapid clicking "Back" button
- [ ] Switching between steps quickly
- [ ] Changing mode after setting capacity
- [ ] Changing meeting kind after setting location
- [ ] Removing all categories (should show error)
- [ ] Submitting while auto-save is running

### Browser Edge Cases

- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge
- [ ] Works with JavaScript disabled (graceful degradation)
- [ ] Works with cookies disabled
- [ ] Works with localStorage disabled (no auto-save)

## Integration Tests

### Navigation Integration

- [ ] Back button navigates to previous page
- [ ] Success redirect goes to intent detail page
- [ ] Intent detail page shows created intent
- [ ] Can edit intent from detail page

### Data Integration

- [ ] Created intent appears in user's intents list
- [ ] Created intent appears in public intents feed
- [ ] Categories are correctly associated
- [ ] Tags are correctly associated
- [ ] Cover image is displayed
- [ ] Join form questions are displayed

### API Integration

- [ ] GraphQL mutations are called correctly
- [ ] Query cache is invalidated after creation
- [ ] Optimistic updates work (if implemented)
- [ ] Concurrent requests are handled

## Regression Tests

### Modal Version Compatibility

- [ ] Modal version still works
- [ ] Both versions create identical intents
- [ ] Both versions use same validation
- [ ] Both versions use same API calls

### Existing Features

- [ ] Intent detail page still works
- [ ] Intent list page still works
- [ ] Intent search still works
- [ ] Intent filters still work

## Test Results

### Summary

- Total tests: ~150
- Passed: \_\_\_
- Failed: \_\_\_
- Skipped: \_\_\_

### Critical Issues

- [ ] None found

### Non-Critical Issues

- [ ] None found

### Notes

```
Add any additional notes or observations here
```

## Sign-off

- [ ] All critical tests passed
- [ ] All non-critical tests passed or documented
- [ ] Performance is acceptable
- [ ] Accessibility is acceptable
- [ ] Ready for production

**Tested by**: ******\_\_\_******  
**Date**: ******\_\_\_******  
**Environment**: ******\_\_\_******  
**Browser**: ******\_\_\_******  
**Notes**: ******\_\_\_******
