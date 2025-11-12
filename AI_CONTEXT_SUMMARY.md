# Miglee - AI Context Summary

> **Purpose:** This document provides structured context for AI assistants to understand the Miglee application architecture, patterns, and conventions.

---

## 🎯 Application Identity

**Name:** Miglee  
**Type:** Social platform for sports events and activities  
**Architecture:** Full-stack monorepo (Next.js + Fastify + GraphQL)  
**Primary Language:** TypeScript (strict mode)  
**Package Manager:** pnpm with workspaces  
**Build System:** Turbo (monorepo orchestration)

---

## 📐 Core Architecture Patterns

### 1. Monorepo Structure

```
miglee/
├── apps/
│   ├── api/          # Backend (Fastify + GraphQL + Prisma)
│   └── web/          # Frontend (Next.js 14 App Router)
├── packages/
│   ├── config/       # Shared TypeScript configs
│   └── contracts/    # GraphQL schema & operations (source of truth)
```

**Key Pattern:** Contracts-first development

- GraphQL schema in `packages/contracts/graphql/schema.graphql` is the source of truth
- Operations defined in `packages/contracts/graphql/operations/*.graphql`
- Types auto-generated via GraphQL Codegen
- Both frontend and backend import from contracts

### 2. Backend Architecture (apps/api/)

**Framework:** Fastify 4.x (not Express!)

- Plugin-based architecture
- High-performance HTTP server
- Built-in schema validation

**GraphQL:** Mercurius (not Apollo!)

- GraphQL server for Fastify
- Built-in subscriptions (WebSocket)
- Schema-first approach

**Database:** PostgreSQL 15+ with PostGIS

- ORM: Prisma 5.x
- Migrations: `prisma migrate`
- Spatial queries: PostGIS extension for geo features

**Real-time:** Redis PubSub

- GraphQL Subscriptions transport
- Rate limiting storage
- Session cache

**Key Files:**

- `src/server.ts` - Fastify server setup
- `src/plugins/mercurius.ts` - GraphQL configuration
- `src/graphql/resolvers/` - All resolvers (query, mutation, subscription)
- `src/graphql/context.ts` - Request context (user, prisma, pubsub)
- `prisma/schema.prisma` - Database schema

**Resolver Pattern:**

```typescript
// All resolvers follow this pattern:
export async function queryName(
  parent: any,
  args: QueryNameArgs,
  ctx: GraphQLContext
): Promise<ReturnType> {
  // 1. Auth check
  if (!ctx.user) throw new Error('Not authenticated');

  // 2. Authorization check
  if (ctx.user.role !== 'ADMIN') throw new Error('Forbidden');

  // 3. Business logic
  const result = await ctx.prisma.model.findMany({ ... });

  // 4. Map to GraphQL types
  return result.map(mapToGraphQLType);
}
```

### 3. Frontend Architecture (apps/web/)

**Framework:** Next.js 14 with App Router (not Pages Router!)

- Server Components by default
- Client Components marked with 'use client'
- File-based routing in `src/app/`

**State Management:**

- **Server State:** React Query (TanStack Query v5)
  - All API calls use React Query hooks
  - Automatic caching, refetching, invalidation
  - Location: `src/lib/api/*.tsx`
- **Local State:** React Context + useState
  - Theme, auth status, UI state

**GraphQL Client:** graphql-request (not Apollo!)

- Simple, lightweight
- Used in React Query hooks
- Location: `src/lib/api/client.tsx`

**Key Files:**

- `src/app/layout.tsx` - Root layout with providers
- `src/lib/api/` - All API hooks (React Query)
- `src/lib/config/query-client.ts` - React Query configuration
- `src/components/` - Reusable UI components
- `src/features/` - Feature-specific components

**API Hook Pattern:**

```typescript
// Query hook pattern:
export function useGetIntents(variables, options) {
  return useQuery({
    queryKey: ['GetIntents', variables],
    queryFn: () => gqlClient.request(GetIntentsDocument, variables),
    ...options,
  });
}

// Mutation hook pattern:
export function useCreateIntentMutation(options) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['CreateIntent'],
    mutationFn: (variables) =>
      gqlClient.request(CreateIntentDocument, variables),
    meta: {
      successMessage: 'Event created successfully', // Auto-toast
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['GetIntents']); // Auto-refetch
    },
    ...options,
  });
}
```

---

## 🗂️ Domain Model

### Core Entities

#### 1. Intent (Event)

**Database:** `Intent` table  
**Purpose:** Represents a sports event/activity  
**Key Fields:**

- `id` (UUID) - Primary key
- `title`, `description` - Event details
- `startAt`, `endAt` - DateTime
- `lat`, `lng`, `geom` - Location (PostGIS point)
- `ownerId` - Creator (User)
- `visibility` - PUBLIC | PRIVATE | INVITE_ONLY
- `joinMode` - OPEN | APPROVAL | INVITE
- `min`, `max` - Participant limits
- `isCanceled`, `isDeleted` - Soft delete flags

**Relations:**

- `owner` → User
- `members` → IntentMember[]
- `comments` → Comment[]
- `reviews` → Review[]
- `categories` → Category[]
- `tags` → Tag[]

**Business Rules:**

- Owner can edit/delete/cancel
- Admins/Moderators can manage members
- Plan limits: Free(5), Premium(20), Pro(∞)

#### 2. IntentMember (Membership)

**Database:** `IntentMember` table  
**Purpose:** User participation in events  
**Key Fields:**

- `intentId`, `userId` - Composite key
- `role` - OWNER | ADMIN | MODERATOR | MEMBER
- `status` - PENDING | INVITED | APPROVED | REJECTED | BANNED
- `joinedAt`, `leftAt` - Timestamps

**State Machine:**

```
PENDING → APPROVED → (active member)
        ↓ REJECTED
INVITED → APPROVED → (active member)
        ↓ REJECTED
(active) → BANNED (can't rejoin)
```

**Business Rules:**

- Only OWNER can delete intent
- OWNER/ADMIN can kick/ban members
- OWNER can promote to ADMIN/MODERATOR
- One membership per user per intent

#### 3. User

**Database:** `User` table  
**Purpose:** Platform users  
**Key Fields:**

- `id` (UUID)
- `name`, `email`, `imageUrl`
- `plan` - FREE | PREMIUM | PRO
- `role` - USER | ADMIN | MODERATOR
- `verifiedAt` - Verified badge
- `suspendedAt`, `suspensionReason` - Admin actions

**Relations:**

- `ownedIntents` → Intent[]
- `memberships` → IntentMember[]
- `comments` → Comment[]
- `sentMessages` → DirectMessage[]

#### 4. Comment

**Database:** `Comment` table  
**Purpose:** Comments on events (with replies)  
**Key Fields:**

- `id` (UUID)
- `content` - Text
- `intentId` - Event
- `authorId` - User
- `parentId` - For nested replies (self-reference)
- `deletedAt` - Soft delete

**Tree Structure:**

```
Comment (parent)
├── Reply 1 (parentId = comment.id)
│   └── Reply 1.1 (parentId = reply1.id)
└── Reply 2 (parentId = comment.id)
```

#### 5. EventChatMessage

**Database:** `EventChatMessage` table  
**Purpose:** Group chat for event participants  
**Key Fields:**

- `id` (UUID)
- `content` - Message text
- `intentId` - Event
- `authorId` - Sender
- `isEdited` - Edit flag
- `deletedAt` - Soft delete

**Real-time:** GraphQL Subscription `eventChatMessages(intentId)`

#### 6. DirectMessage

**Database:** `DirectMessage` table  
**Purpose:** 1-on-1 private messages  
**Key Fields:**

- `id` (UUID)
- `content` - Message text
- `threadId` - Conversation ID
- `senderId` - Sender
- `isRead`, `readAt` - Read status
- `deletedAt` - Soft delete

**Real-time:** GraphQL Subscription `dmMessages(threadId)`

---

## 🔐 Authentication & Authorization

### Authentication

**Method:** JWT (JSON Web Tokens)  
**Storage:** HTTP-only cookies + Authorization header  
**Flow:**

1. User logs in (dev login in development)
2. Server generates JWT with user payload
3. JWT stored in cookie + returned in response
4. Client sends JWT in requests
5. Server validates JWT in context

**Context:**

```typescript
interface GraphQLContext {
  user: User | null; // Authenticated user (from JWT)
  prisma: PrismaClient; // Database client
  pubsub: PubSub; // For subscriptions
  request: FastifyRequest; // HTTP request
}
```

### Authorization

**Pattern:** Role-based + ownership checks

```typescript
// Admin-only
if (ctx.user?.role !== 'ADMIN') throw new Error('Forbidden');

// Owner-only
const intent = await ctx.prisma.intent.findUnique({ where: { id } });
if (intent.ownerId !== ctx.user?.id) throw new Error('Forbidden');

// Member check
const member = await ctx.prisma.intentMember.findUnique({
  where: { intentId_userId: { intentId, userId: ctx.user.id } },
});
if (!member || member.status !== 'APPROVED') throw new Error('Not a member');
```

**Roles:**

- `USER` - Default role, can create events
- `ADMIN` - Full platform access, can suspend users
- `MODERATOR` - Can moderate content (comments, reports)

---

## 🗺️ Geospatial Features (PostGIS)

### Map Clustering

**Purpose:** Show events on map with dynamic clustering  
**Technology:** PostGIS + Mapbox GL JS + Deck.gl

**Algorithm:**

```sql
-- Small zoom (show clusters)
SELECT
  ST_ClusterKMeans(geom, 50) OVER() as cluster_id,
  COUNT(*) as count,
  ST_Centroid(ST_Collect(geom)) as center
FROM intents
WHERE ST_Within(geom, bbox)
GROUP BY cluster_id;

-- Large zoom (show individual events)
SELECT id, title, lat, lng
FROM intents
WHERE ST_Within(geom, bbox);
```

**Frontend Flow:**

1. User moves map → get viewport bounds
2. Send bounds to `mapClusters` query
3. Backend calculates clusters in PostGIS
4. Frontend renders clusters/markers on map
5. Click cluster → show popup with events list

**Key Files:**

- Backend: `apps/api/src/graphql/resolvers/query/map-clusters.ts`
- Frontend: `apps/web/src/app/[[...slug]]/_components/server-clustered-map.tsx`

### Location Search

**Features:**

- Geocoding (address → coordinates)
- Reverse geocoding (coordinates → address)
- Nearby events (radius search)
- Bounding box queries

---

## 💬 Real-time Communication

### GraphQL Subscriptions

**Transport:** WebSocket (Mercurius built-in)  
**PubSub:** Redis

**Pattern:**

```typescript
// Backend: Publish event
ctx.pubsub.publish({
  topic: `event-chat:${intentId}`,
  payload: { eventChatMessage: message },
});

// Backend: Subscription resolver
export const eventChatMessages = {
  subscribe: (parent, { intentId }, ctx) => {
    return ctx.pubsub.subscribe(`event-chat:${intentId}`);
  },
};

// Frontend: Subscribe
const { data } = useSubscription({
  query: EventChatMessagesDocument,
  variables: { intentId },
});
```

**Active Subscriptions:**

1. `eventChatMessages(intentId)` - Event chat
2. `dmMessages(threadId)` - Direct messages
3. `notifications` - User notifications
4. `typingIndicator(intentId)` - Typing status

### Rate Limiting

**Storage:** Redis  
**Algorithm:** Token bucket

**Limits:**

- Event chat: 10 messages/minute
- DM: 20 messages/minute
- API calls: 100 requests/minute
- Mutations: 30/minute

---

## 🎨 UI/UX Patterns

### Component Structure

```
Component/
├── index.tsx           # Main component
├── types.ts            # TypeScript types
├── hooks.ts            # Custom hooks (optional)
└── utils.ts            # Helper functions (optional)
```

### Styling

**Framework:** Tailwind CSS  
**Convention:** Utility-first, no CSS modules

```tsx
// Good
<div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-md dark:bg-zinc-900">

// Avoid
<div className={styles.container}>
```

**Dark Mode:**

- System preference detection
- Manual toggle
- Classes: `dark:bg-zinc-900`, `dark:text-white`

### Forms

**Library:** React Hook Form + Zod  
**Pattern:**

```tsx
const schema = z.object({
  title: z.string().min(3).max(100),
  startAt: z.date(),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});

const onSubmit = form.handleSubmit(async (data) => {
  await createMutation.mutateAsync(data);
});
```

### Loading States

**Pattern:** Suspense + loading.tsx

```tsx
// app/intent/[id]/loading.tsx
export default function Loading() {
  return <Skeleton />;
}

// app/intent/[id]/page.tsx (Server Component)
export default async function Page({ params }) {
  const data = await fetchData(params.id);
  return <IntentDetail data={data} />;
}
```

---

## 🔧 Development Patterns

### Error Handling

**Backend:**

```typescript
// Throw specific errors
throw new Error('Not found'); // Generic
throw new ValidationError('Invalid'); // Validation
throw new AuthenticationError(); // Auth
throw new ForbiddenError(); // Authorization
```

**Frontend:**

```typescript
// React Query handles errors automatically
const { data, error, isError } = useQuery({ ... });

if (isError) {
  toast.error('Failed to load', { description: error.message });
}

// Mutations with auto-toast
const mutation = useMutation({
  mutationFn: createIntent,
  meta: {
    successMessage: 'Event created!', // Auto-toast on success
  },
  // Errors auto-toasted by react-query-config
});
```

### Logging & Debugging

**System:** Custom dev-logger + toast-manager  
**Location:** `apps/web/src/lib/utils/`

**Usage:**

```typescript
import { devLogger, toast } from '@/lib/utils';

// Automatic logging (configured in react-query-config)
// All queries/mutations are auto-logged

// Manual logging
devLogger.mutationSuccess('createEvent', data, 250);
devLogger.queryError(['getEvents'], error, 500);

// Toast notifications
toast.success('Event created!');
toast.error('Failed', { description: 'Try again' });

// Console commands (browser)
enableDebug(); // Enable verbose logging
disableDebug(); // Disable logging
```

### Testing

**Backend:**

- Jest for unit tests
- Test resolvers in isolation
- Mock Prisma client

**Frontend:**

- Jest + React Testing Library
- Test components with mocked API
- E2E with Playwright (optional)

---

## 📦 Key Dependencies

### Backend

```json
{
  "fastify": "^4.x", // HTTP server
  "mercurius": "^16.x", // GraphQL
  "@prisma/client": "^5.x", // ORM
  "ioredis": "^5.x", // Redis client
  "@fastify/jwt": "^7.x", // JWT auth
  "@fastify/cookie": "^9.x", // Cookie handling
  "zod": "^3.x", // Validation
  "pino": "^8.x" // Logging
}
```

### Frontend

```json
{
  "next": "^14.x", // Framework
  "react": "^18.x", // UI library
  "@tanstack/react-query": "^5.x", // Server state
  "graphql-request": "^6.x", // GraphQL client
  "tailwindcss": "^3.x", // Styling
  "react-hook-form": "^7.x", // Forms
  "zod": "^3.x", // Validation
  "sonner": "^1.x", // Toast notifications
  "mapbox-gl": "^3.x", // Maps
  "deck.gl": "^9.x", // Map layers
  "react-virtuoso": "^4.x", // Virtualization
  "lucide-react": "^0.x" // Icons
}
```

---

## 🚀 Common Tasks

### Adding a New Feature

1. **Define GraphQL Schema** (`packages/contracts/graphql/schema.graphql`)

```graphql
type NewFeature {
  id: ID!
  name: String!
}

extend type Query {
  newFeature(id: ID!): NewFeature
}

extend type Mutation {
  createNewFeature(input: CreateNewFeatureInput!): NewFeature
}
```

2. **Generate Types**

```bash
cd apps/api && pnpm codegen
cd apps/web && pnpm codegen
```

3. **Add Database Model** (`apps/api/prisma/schema.prisma`)

```prisma
model NewFeature {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
}
```

4. **Create Migration**

```bash
cd apps/api && pnpm prisma migrate dev --name add_new_feature
```

5. **Implement Resolver** (`apps/api/src/graphql/resolvers/`)

```typescript
export async function newFeature(parent, { id }, ctx) {
  return ctx.prisma.newFeature.findUnique({ where: { id } });
}

export async function createNewFeature(parent, { input }, ctx) {
  if (!ctx.user) throw new Error('Not authenticated');
  return ctx.prisma.newFeature.create({ data: input });
}
```

6. **Create API Hook** (`apps/web/src/lib/api/new-feature.tsx`)

```typescript
export function useGetNewFeature(id, options) {
  return useQuery({
    queryKey: ['GetNewFeature', id],
    queryFn: () => gqlClient.request(GetNewFeatureDocument, { id }),
    ...options,
  });
}

export function useCreateNewFeatureMutation(options) {
  return useMutation({
    mutationKey: ['CreateNewFeature'],
    mutationFn: (input) =>
      gqlClient.request(CreateNewFeatureDocument, { input }),
    meta: {
      successMessage: 'Feature created!',
    },
    ...options,
  });
}
```

7. **Create UI Component** (`apps/web/src/components/new-feature/`)

```tsx
'use client';

export function NewFeatureForm() {
  const mutation = useCreateNewFeatureMutation();

  const onSubmit = async (data) => {
    await mutation.mutateAsync(data);
  };

  return <form onSubmit={onSubmit}>...</form>;
}
```

### Adding a New Page

1. **Create Route** (`apps/web/src/app/new-page/page.tsx`)

```tsx
export default function NewPage() {
  return <div>New Page</div>;
}
```

2. **Add to Navigation** (if needed)

```tsx
// apps/web/src/components/layout/navigation.tsx
<Link href="/new-page">New Page</Link>
```

---

## 🎯 Code Conventions

### Naming

- **Files:** kebab-case (`event-card.tsx`, `use-intents.tsx`)
- **Components:** PascalCase (`EventCard`, `MembersList`)
- **Functions:** camelCase (`createIntent`, `getUserById`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_PARTICIPANTS`, `DEFAULT_LIMIT`)
- **Types/Interfaces:** PascalCase (`Intent`, `CreateIntentInput`)

### Imports Order

```typescript
// 1. External libraries
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

// 2. Internal absolute imports
import { Button } from '@/components/ui/button';
import { useGetIntents } from '@/lib/api/intents';

// 3. Relative imports
import { EventCard } from './event-card';
import type { Intent } from './types';
```

### TypeScript

- **Strict mode enabled**
- **No `any`** (use `unknown` if needed)
- **Explicit return types** for public functions
- **Interfaces over types** for objects
- **Enums from GraphQL** (auto-generated)

### Comments

```typescript
// Good: Explain WHY, not WHAT
// We use PostGIS clustering here because ST_ClusterKMeans is 10x faster
// than client-side clustering for large datasets
const clusters = await clusterEvents(bounds);

// Bad: Obvious comment
// Get the user by ID
const user = await getUser(id);
```

---

## 🔍 Debugging Tips

### Backend Debugging

```bash
# Enable debug logs
DEBUG=* pnpm dev

# Check Prisma queries
DEBUG=prisma:query pnpm dev

# Check GraphQL operations
DEBUG=mercurius:* pnpm dev
```

### Frontend Debugging

```javascript
// In browser console:
enableDebug(); // Enable verbose logging

// Check React Query cache
queryClient.getQueryCache().getAll();

// Check specific query
queryClient.getQueryData(['GetIntents', { page: 1 }]);

// Invalidate query
queryClient.invalidateQueries(['GetIntents']);

// Test toast
toast.success('Test');
```

### Database Debugging

```bash
# Prisma Studio (GUI)
cd apps/api && pnpm prisma studio

# Check migrations
pnpm prisma migrate status

# Reset database (DANGER!)
pnpm prisma migrate reset
```

---

## 🎓 Learning Resources

### Internal Documentation

- `README.md` - Quick start
- `APPLICATION_SUMMARY.md` - Full application overview
- `FINAL_IMPLEMENTATION_SUMMARY.md` - Toast & logging system
- `CHAT_IMPLEMENTATION_SUMMARY.md` - Chat system details
- `MAP_CLUSTERING_IMPLEMENTATION.md` - Map clustering details

### External Resources

- [Next.js Docs](https://nextjs.org/docs) - App Router
- [React Query Docs](https://tanstack.com/query/latest) - TanStack Query
- [Prisma Docs](https://www.prisma.io/docs) - ORM
- [Fastify Docs](https://fastify.dev/) - HTTP server
- [Mercurius Docs](https://mercurius.dev/) - GraphQL
- [PostGIS Docs](https://postgis.net/docs/) - Spatial queries

---

## ⚠️ Common Pitfalls

### 1. Using Apollo instead of Mercurius

❌ **Wrong:** Apollo Server/Client  
✅ **Correct:** Mercurius (backend), graphql-request (frontend)

### 2. Using Pages Router instead of App Router

❌ **Wrong:** `pages/` directory  
✅ **Correct:** `app/` directory with App Router

### 3. Direct Prisma queries in frontend

❌ **Wrong:** Import Prisma in frontend  
✅ **Correct:** Always use GraphQL API

### 4. Forgetting to invalidate queries

❌ **Wrong:** Mutation without invalidation  
✅ **Correct:** Always invalidate related queries after mutations

### 5. Not checking authentication

❌ **Wrong:** Assume user is logged in  
✅ **Correct:** Always check `ctx.user` in resolvers

### 6. Using `any` type

❌ **Wrong:** `const data: any = ...`  
✅ **Correct:** Use proper types or `unknown`

### 7. Hardcoding values

❌ **Wrong:** `if (user.plan === 'PRO')`  
✅ **Correct:** `if (user.plan === Plan.PRO)` (use enum)

### 8. Not handling loading/error states

❌ **Wrong:** Only show data  
✅ **Correct:** Handle `isLoading`, `isError`, `error`

---

## 🤖 AI Assistant Guidelines

When helping with this codebase:

1. **Always check contracts first** - GraphQL schema is source of truth
2. **Use existing patterns** - Don't introduce new patterns without discussion
3. **Follow conventions** - Naming, file structure, import order
4. **Type safety** - No `any`, use generated types
5. **Error handling** - Always handle errors properly
6. **Testing** - Suggest tests for new features
7. **Performance** - Consider caching, indexes, optimization
8. **Security** - Check auth, validate input, sanitize output
9. **Documentation** - Update docs when adding features
10. **Consistency** - Match existing code style

### When Suggesting Code

**Do:**

- Use existing hooks and utilities
- Follow established patterns
- Include error handling
- Add TypeScript types
- Consider edge cases
- Suggest tests

**Don't:**

- Introduce new libraries without discussion
- Use deprecated patterns (Pages Router, Apollo, etc.)
- Skip error handling
- Use `any` type
- Ignore existing conventions
- Forget about mobile responsiveness

---

## 📊 Quick Reference

### File Locations

| What               | Where                                             |
| ------------------ | ------------------------------------------------- |
| GraphQL Schema     | `packages/contracts/graphql/schema.graphql`       |
| GraphQL Operations | `packages/contracts/graphql/operations/*.graphql` |
| Database Schema    | `apps/api/prisma/schema.prisma`                   |
| API Resolvers      | `apps/api/src/graphql/resolvers/`                 |
| API Hooks          | `apps/web/src/lib/api/*.tsx`                      |
| UI Components      | `apps/web/src/components/`                        |
| Pages              | `apps/web/src/app/`                               |
| Utilities          | `apps/web/src/lib/utils/`                         |

### Commands

| Task          | Command                                  |
| ------------- | ---------------------------------------- |
| Install deps  | `pnpm install`                           |
| Dev mode      | `pnpm dev`                               |
| Build         | `pnpm build`                             |
| Codegen       | `pnpm codegen`                           |
| Migration     | `cd apps/api && pnpm prisma migrate dev` |
| Prisma Studio | `cd apps/api && pnpm prisma studio`      |
| Test          | `pnpm test`                              |
| Lint          | `pnpm lint`                              |

### Ports

| Service       | Port |
| ------------- | ---- |
| Web (Next.js) | 3000 |
| API (Fastify) | 4000 |
| PostgreSQL    | 5432 |
| Redis         | 6379 |
| Prometheus    | 9090 |
| Grafana       | 3001 |

---

**Last Updated:** 2024-11-12  
**Version:** 1.0.0  
**Maintainer:** Development Team
