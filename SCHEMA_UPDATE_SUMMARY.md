# GraphQL Schema Update Summary

This document summarizes all changes made to align the GraphQL schema and resolvers with the Prisma schema.

## Date: 2025-11-02

## Changes Made

### 1. GraphQL Schema Updates (`packages/contracts/graphql/schema.graphql`)

#### Added Enums:

- `JoinMode` (OPEN, REQUEST, INVITE_ONLY) - replaces the boolean `requiresApproval`
- `MemberEvent` (JOIN, REQUEST, APPROVE, REJECT, LEAVE, KICK, BAN, UNBAN, INVITE, ACCEPT_INVITE)
- `ReportEntity` (INTENT, COMMENT, REVIEW, USER, MESSAGE)
- `SubscriptionPlan` (BASIC, PLUS, PRO)
- `SubscriptionStatus` (INCOMPLETE, TRIALING, ACTIVE, PAST_DUE, CANCELED, UNPAID, PAUSED)
- `SponsorPlan` (BASIC, PLUS, PRO)
- `SponsorshipStatus` (PENDING, ACTIVE, EXPIRED, CANCELED)

#### Updated `NotificationKind` Enum:

Added missing notification types:

- `JOIN_REQUEST`
- `NEW_MESSAGE`
- `NEW_COMMENT`
- `NEW_REVIEW`
- `BANNED`
- `UNBANNED`

#### Updated `User` Type:

Added profile/preference fields:

- `locale: String` - User's locale (e.g., "pl-PL", "en-US")
- `tz: String` - IANA timezone (e.g., "Europe/Warsaw")
- `acceptedTermsAt: DateTime` - When user accepted terms
- `acceptedMarketingAt: DateTime` - When user accepted marketing

#### Updated `Category` Type:

**Removed** fields (not in Prisma schema):

- `icon: String`
- `color: String`

#### Updated `Intent` Type:

**Added** fields:

- `joinMode: JoinMode!` - How users can join (replaces `requiresApproval`)
- `showMemberCount: Boolean!` - Privacy toggle for HIDDEN visibility
- `showAddress: Boolean!` - Privacy toggle for HIDDEN visibility
- `commentsCount: Int!` - Derived counter
- `messagesCount: Int!` - Derived counter
- `ownerId: String` - Direct reference to owner user

**Removed** fields:

- `requiresApproval: Boolean!` - Replaced by `joinMode`

#### Updated Input Types:

- `CreateIntentInput`: Added `joinMode`, `showMemberCount`, `showAddress`; removed `requiresApproval`
- `UpdateIntentInput`: Added `joinMode`, `showMemberCount`, `showAddress`; removed `requiresApproval`
- `CreateCategoryInput`: Removed `icon`, `color`
- `UpdateCategoryInput`: Removed `icon`, `color`

#### Updated Queries:

- `intents`: Added `joinMode: JoinMode` filter parameter

### 2. GraphQL Fragments Updates (`packages/contracts/graphql/operations/fragments.graphql`)

#### `UserCore` Fragment:

Added fields: `locale`, `tz`, `acceptedTermsAt`, `acceptedMarketingAt`

#### `CategoryCore` Fragment:

Removed fields: `icon`, `color`

#### `IntentLight` and `IntentCore` Fragments:

- Added: `joinMode`, `showMemberCount`, `showAddress`, `commentsCount`, `messagesCount`, `ownerId`
- Removed: `requiresApproval`

### 3. GraphQL Operations Updates (`packages/contracts/graphql/operations/intents.graphql`)

Updated `GetIntents` query to include `joinMode` parameter.

### 4. Resolver Updates

#### `apps/api/src/graphql/resolvers/helpers.ts`:

- Updated `IntentWithGraph` type to include `owner: true`
- Updated `mapUser()` to include new User fields
- Updated `mapCategory()` to remove `icon` and `color`
- Updated `mapIntent()` to:
  - Add `joinMode`, `showMemberCount`, `showAddress`, `commentsCount`, `messagesCount`, `ownerId`
  - Remove `requiresApproval`
  - Use `ownerId` field when available for owner resolution

#### `apps/api/src/graphql/resolvers/query/intents.ts`:

- Added `owner: true` to `INTENT_INCLUDE`
- Added `joinMode` filter support
- Changed owner filter from member-based to `ownerId` field

#### `apps/api/src/graphql/resolvers/mutation/intents.ts`:

- Added `owner: true` to `INTENT_INCLUDE`
- Updated `createIntent` to set `joinMode`, `showMemberCount`, `showAddress`, and `ownerId`
- Updated `updateIntent` to handle new fields

#### `apps/api/src/graphql/resolvers/mutation/intent-members.ts`:

- Added `owner: true` to `NOTIFICATION_INCLUDE` and `reloadFullIntent()`
- Replaced `requiresApproval` checks with `joinMode !== 'OPEN'` logic

#### `apps/api/src/graphql/resolvers/mutation/categories.ts`:

- Removed `icon` and `color` from `categorySelect`
- Removed `icon` and `color` handling in create/update mutations

#### `apps/api/src/graphql/resolvers/query/categories.ts`:

- Removed `icon` and `color` from `categorySelect`
- Removed `icon` and `color` from query results

### 5. Seed File Updates (`apps/api/prisma/seed.ts`)

- Added `JoinMode` import
- Updated `createIntentWithMembers()` to:
  - Generate random `joinMode` value
  - Set `showMemberCount` and `showAddress` privacy toggles
  - Set `ownerId` field
- Updated `Scenario` type to include `joinMode`
- Updated `buildScenarios()` to generate `joinMode` values
- Updated `createPresetIntent()` to use new fields
- Removed `icon` and `color` from category seeding

## Migration Notes

### Breaking Changes:

1. **`requiresApproval` → `joinMode`**: This is a semantic change. Old code using `requiresApproval: true` should now use `joinMode: REQUEST` or `joinMode: INVITE_ONLY`.
2. **Category fields removed**: `icon` and `color` fields are no longer available in the GraphQL API.

### Data Migration Required:

If you have existing data with `requiresApproval` values, you'll need to migrate:

- `requiresApproval: false` → `joinMode: OPEN`
- `requiresApproval: true` → `joinMode: REQUEST` (or `INVITE_ONLY` based on business logic)

### New Features Available:

1. **Privacy Controls**: Intents can now hide member count and address for HIDDEN visibility
2. **Richer Join Modes**: Three distinct join modes instead of binary approval
3. **Owner Field**: Direct `ownerId` reference for better performance
4. **User Preferences**: Locale, timezone, and consent tracking

## Testing Recommendations

1. **Regenerate Types**: Run `pnpm run gql:gen` to regenerate TypeScript types
2. **Update Frontend**: Update all components using `requiresApproval` to use `joinMode`
3. **Test Join Flows**: Verify all three join modes work correctly (OPEN, REQUEST, INVITE_ONLY)
4. **Test Privacy Toggles**: Verify `showMemberCount` and `showAddress` work for HIDDEN intents
5. **Seed Database**: Run `pnpm --filter @miglee/api prisma db seed` to test seed data

## Files Modified

### Schema & Contracts:

- `packages/contracts/graphql/schema.graphql`
- `packages/contracts/graphql/operations/fragments.graphql`
- `packages/contracts/graphql/operations/intents.graphql`

### Resolvers:

- `apps/api/src/graphql/resolvers/helpers.ts`
- `apps/api/src/graphql/resolvers/query/intents.ts`
- `apps/api/src/graphql/resolvers/query/categories.ts`
- `apps/api/src/graphql/resolvers/mutation/intents.ts`
- `apps/api/src/graphql/resolvers/mutation/intent-members.ts`
- `apps/api/src/graphql/resolvers/mutation/categories.ts`

### Database:

- `apps/api/prisma/seed.ts`

## Next Steps

1. Review and test all changes
2. Update frontend components to use new schema
3. Run database migrations if needed
4. Update API documentation
5. Deploy changes to staging environment for testing
