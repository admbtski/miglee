# Miglee API - Backend Documentation

> **Production-ready GraphQL API** built with Fastify, Mercurius, Prisma, and TypeScript

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [GraphQL API](#graphql-api)
- [Authentication & Authorization](#authentication--authorization)
- [Core Features](#core-features)
- [Billing & Payments](#billing--payments)
- [Media Management](#media-management)
- [Real-time Features](#real-time-features)
- [Background Jobs](#background-jobs)
- [Observability](#observability)
- [Security](#security)
- [Performance](#performance)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Miglee API is a **production-ready GraphQL backend** for a social event management platform. It provides:

- **GraphQL API** with queries, mutations, and subscriptions
- **Real-time messaging** (event chat, DMs, notifications)
- **Event management** with waitlists, RSVPs, and member roles
- **Billing integration** via Stripe (subscriptions and one-off payments)
- **Media storage** (local or S3-compatible)
- **Background jobs** for reminders and feedback requests
- **Admin panel** with BullMQ queue monitoring
- **Full observability** with OpenTelemetry, Pino logging, and metrics

### Key Metrics

- **~35,000 lines of TypeScript**
- **73 resolver files**
- **491 GraphQL operations**
- **0 TypeScript errors** ✅
- **Production-grade error handling** with `GraphQLError`

---

## 🛠 Tech Stack

### Core Framework

- **[Fastify](https://www.fastify.io/)** v5 - High-performance web framework
- **[Mercurius](https://mercurius.dev/)** v16 - GraphQL adapter for Fastify
- **[TypeScript](https://www.typescriptlang.org/)** v5 - Type-safe development
- **[Prisma](https://www.prisma.io/)** v6 - Type-safe ORM

### Database & Caching

- **PostgreSQL** - Primary database
- **Redis** (via IORedis) - Pub/sub, caching, rate limiting

### Authentication & Security

- **JWT** - Token-based authentication
- **@fastify/helmet** - Security headers
- **@fastify/rate-limit** - Rate limiting
- **@fastify/cors** - CORS management

### Payments

- **Stripe** v20 - Payment processing, subscriptions, webhooks

### Media & Storage

- **Sharp** - Image processing (resize, compress, blurhash)
- **AWS S3** - Cloud storage (optional, supports S3-compatible providers)
- **Local storage** - File system uploads (development)

### Background Jobs

- **BullMQ** v5 - Reliable job queues
- **Bull Board** - Queue monitoring UI

### Observability

- **OpenTelemetry** - Distributed tracing and metrics
- **Pino** v9 - Structured logging
- **Custom metrics** - GraphQL, Fastify, and runtime metrics

### Real-time

- **WebSocket** - GraphQL subscriptions
- **MQEmitter Redis** - Distributed pub/sub

### Utilities

- **Zod** - Runtime validation
- **Dataloader** - Batching and caching
- **Resend** - Email service

---

## 🏗 Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Apps                             │
│                    (Web, Mobile, Admin)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ GraphQL over HTTP/WS
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      Fastify Server                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Plugins: CORS, Helmet, JWT, Rate Limit, Raw Body         │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Mercurius (GraphQL Engine)                    │ │
│  │  - Schema validation (depth, complexity limits)            │ │
│  │  - Context creation (user, pubsub)                         │ │
│  │  - Resolvers (Query, Mutation, Subscription)               │ │
│  │  - Error formatting                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Business Logic                            │ │
│  │  - Resolvers (73 files, 491 operations)                   │ │
│  │  - Services (billing, media, email, waitlist)              │ │
│  │  - Guards (auth, permissions, chat access)                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┬─────────────────┐
          │                 │                 │                 │
┌─────────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐ ┌──────▼──────┐
│   PostgreSQL     │ │    Redis    │ │  Stripe API    │ │  S3/Local   │
│  (Prisma ORM)    │ │  (Pub/Sub)  │ │   (Billing)    │ │   (Media)   │
└──────────────────┘ └─────────────┘ └────────────────┘ └─────────────┘
          │
┌─────────▼────────┐
│   BullMQ Workers │
│  - Reminders     │
│  - Feedback      │
└──────────────────┘
```

### Request Flow

```
1. Client Request
   ↓
2. Fastify Middleware (CORS, Helmet, Rate Limit)
   ↓
3. JWT Authentication (optional, via x-user-id header)
   ↓
4. GraphQL Context Creation (user, pubsub, request, reply)
   ↓
5. Mercurius GraphQL Engine
   ↓
6. Resolver Execution
   ↓
7. Auth Guards (requireAuth, requireAdmin, requireEventAccess)
   ↓
8. Business Logic (Prisma queries, service calls)
   ↓
9. Response Formatting (with metrics and logging)
   ↓
10. Client Response
```

---

## 📁 Project Structure

```
apps/api/
├── prisma/
│   ├── schema.prisma          # Database schema (1500+ lines)
│   ├── seed.ts                # Database seeding
│   └── migrations/            # Database migrations
├── src/
│   ├── index.ts               # Application entry point
│   ├── server.ts              # Fastify server setup
│   ├── env.ts                 # Environment config (Zod validation)
│   │
│   ├── graphql/
│   │   ├── context.ts         # GraphQL context factory
│   │   ├── codegen.ts         # GraphQL code generation config
│   │   ├── __generated__/
│   │   │   └── resolvers-types.ts  # Generated TypeScript types
│   │   └── resolvers/
│   │       ├── index.ts       # Resolver aggregation
│   │       ├── scalars.ts     # Custom scalars (DateTime, JSON)
│   │       ├── fields/        # Field resolvers (6 files)
│   │       ├── mutation/      # Mutations (29 files)
│   │       ├── query/         # Queries (24 files)
│   │       ├── subscription/  # Subscriptions (2 files)
│   │       └── shared/
│   │           ├── auth-guards.ts  # Auth helpers
│   │           └── chat-guards.ts  # Chat permissions
│   │
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client + middleware
│   │   ├── redis.ts           # Redis client + pub/sub
│   │   ├── pino.ts            # Structured logging
│   │   ├── otel.ts            # OpenTelemetry setup
│   │   ├── bullmq.ts          # Queue client
│   │   ├── email.ts           # Email service (Resend)
│   │   ├── waitlist.ts        # Waitlist logic
│   │   ├── chat-utils.ts      # Chat helpers
│   │   ├── chat-rate-limit.ts # Chat typing indicators (Redis TTL)
│   │   ├── resolver-metrics.ts # GraphQL metrics
│   │   ├── rate-limit/
│   │   │   └── domainRateLimiter.ts # Domain rate limiting (ZSET sliding window)
│   │   ├── billing/
│   │   │   ├── stripe.service.ts         # Stripe client
│   │   │   ├── webhook-handler.service.ts # Stripe webhooks
│   │   │   ├── user-plan.service.ts      # User subscriptions
│   │   │   ├── event-sponsorship.service.ts  # Event billing
│   │   │   └── constants.ts              # Billing constants
│   │   ├── media/
│   │   │   ├── media-service.ts    # Unified media API
│   │   │   ├── storage.ts          # Storage interface
│   │   │   ├── local-storage.ts    # Local file storage
│   │   │   ├── s3-storage.ts       # S3 storage
│   │   │   └── image-processing.ts # Sharp image processing
│   │   └── geo/
│   │       └── webmercator.ts # Map tile calculations
│   │
│   ├── plugins/
│   │   ├── mercurius.ts       # GraphQL plugin
│   │   ├── jwt.ts             # JWT authentication
│   │   ├── cors.ts            # CORS config
│   │   ├── helmet.ts          # Security headers
│   │   ├── rate-limit.ts      # Rate limiting
│   │   ├── cookie.ts          # Cookie parser
│   │   ├── sensible.ts        # HTTP helpers
│   │   ├── health.ts          # Health check endpoint
│   │   ├── graceful-shutdown.ts  # Graceful shutdown
│   │   ├── stripe-webhook.ts  # Stripe webhook endpoint
│   │   ├── local-upload.ts    # Local file upload
│   │   ├── image-variants.ts  # Image variant serving
│   │   ├── last-seen.ts       # User activity tracking
│   │   ├── bull-board.ts      # Queue monitoring UI
│   │   └── metrics/
│   │       ├── fastify-metrics.ts    # Fastify metrics
│   │       └── node-runtime-metrics.ts # Node.js metrics
│   │
│   ├── workers/
│   │   ├── logger.ts          # Worker logger
│   │   ├── reminders/
│   │   │   ├── queue.ts       # Reminder queue setup
│   │   │   ├── worker.ts      # Reminder worker
│   │   │   └── runReminderForEvent.ts  # Reminder logic
│   │   └── feedback/
│   │       ├── queue.ts       # Feedback queue setup
│   │       ├── worker.ts      # Feedback worker
│   │       └── runFeedbackRequestForEvent.ts  # Feedback logic
│   │
│   └── types/
│       └── fastify.d.ts       # Fastify type extensions
│
├── package.json
├── tsconfig.json
└── .env                       # Environment variables
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+
- **PostgreSQL** v14+
- **Redis** v7+
- **pnpm** v9+ (or npm/yarn)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd miglee/apps/api

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
pnpm prisma:migrate
pnpm prisma:seed

# Generate Prisma client
pnpm prisma:generate

# Generate GraphQL types
pnpm gql:gen
```

### Development

```bash
# Start API server (with hot reload)
pnpm dev

# Start background workers (optional)
pnpm worker:reminders:dev
pnpm worker:feedback:dev

# Server will start at http://localhost:4000
# GraphQL Playground: http://localhost:4000/graphql
# Bull Board: http://localhost:4000/admin/queues
```

### Build & Production

```bash
# Type check
pnpm typecheck

# Build
pnpm build

# Start production server
pnpm start
```

---

## 🌍 Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/miglee"

# JWT
JWT_SECRET="<generate-a-secure-secret-min-32-chars>"

# Redis (optional for development)
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

### Optional Variables

```bash
# Server
NODE_ENV="development"           # development | production | test
SERVICE_NAME="api"
HOST="localhost"
PORT="4000"

# CORS
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"

# Logging
LOG_LEVEL="info"                 # fatal | error | warn | info | debug | trace
LOG_FILE_PATH="./logs/app.log"   # Optional: file logging

# Media Storage
MEDIA_STORAGE_PROVIDER="LOCAL"   # LOCAL | S3
UPLOADS_PATH="./uploads"
UPLOADS_TMP_PATH="./tmp/uploads"

# Image Processing
IMAGE_MAX_WIDTH="2560"
IMAGE_MAX_HEIGHT="2560"
IMAGE_FORMAT="webp"              # webp | avif
IMAGE_QUALITY="85"

# S3 (required if MEDIA_STORAGE_PROVIDER=S3)
S3_ENDPOINT="https://s3.amazonaws.com"
S3_REGION="us-east-1"
S3_BUCKET="miglee-media"
S3_ACCESS_KEY_ID="<your-access-key>"
S3_SECRET_ACCESS_KEY="<your-secret-key>"

# CDN
CDN_ENABLED="false"
CDN_BASE_URL="https://cdn.example.com"
ASSETS_BASE_URL="http://localhost:4000"

# Stripe Billing
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs
STRIPE_PRICE_USER_PLUS_MONTHLY_SUB="price_..."
STRIPE_PRICE_USER_PLUS_MONTHLY_ONEOFF="price_..."
STRIPE_PRICE_USER_PLUS_YEARLY_ONEOFF="price_..."
STRIPE_PRICE_USER_PRO_MONTHLY_SUB="price_..."
STRIPE_PRICE_USER_PRO_MONTHLY_ONEOFF="price_..."
STRIPE_PRICE_USER_PRO_YEARLY_ONEOFF="price_..."
STRIPE_PRICE_EVENT_PLUS="price_..."
STRIPE_PRICE_EVENT_PRO="price_..."

# App URLs
APP_URL="http://localhost:3000"
API_URL="http://localhost:4000"

# Redis (advanced)
REDIS_PASSWORD=""              # Redis password (optional)
REDIS_DB="0"                   # Redis database number
REDIS_TLS="false"              # Enable TLS for Redis

# Admin Features
ENABLE_BULL_BOARD="false"      # Enable Bull Board in production
```

---

## 🔧 Production vs Development

All plugins automatically detect environment and apply appropriate settings:

| Feature                | Production    | Development   |
| ---------------------- | ------------- | ------------- |
| **GraphiQL**           | ❌ Disabled   | ✅ Enabled    |
| **Introspection**      | ❌ Blocked    | ✅ Allowed    |
| **Query depth limit**  | 7             | 15            |
| **Query complexity**   | 1000          | 5000          |
| **HSTS**               | 1 year        | Disabled      |
| **CSP**                | Strict        | Relaxed (HMR) |
| **Error details**      | Masked        | Full stack    |
| **Rate limit**         | 100/min       | 1000/min      |
| **Rate limit backend** | Redis         | In-memory     |
| **Cookie secure**      | true          | false         |
| **Statement timeout**  | 30s           | 60s           |
| **Connection pool**    | 20            | 10            |
| **Redis retries**      | 20            | 10            |
| **BullMQ concurrency** | 5             | 2             |
| **Job attempts**       | 3             | 5             |
| **Shutdown timeout**   | 30s           | 10s           |
| **Bull Board**         | Requires flag | Open          |

---

## 🗄 Database Schema

### Core Entities

#### User

- **Fields**: id, email, name, bio, avatarKey, role, plan, locale, timezone
- **Relations**: eventMemberships, events, notifications, messages, reviews
- **Features**: Soft delete, last seen tracking, verification status

#### Event

- **Fields**: id, title, description, startAt, endAt, meetingKind, joinMode, maxCapacity
- **Relations**: members, messages, agenda, feedbackQuestions, sponsorships
- **Features**: Visibility controls, waitlist, moderation, categories/tags

#### EventMember

- **Fields**: id, userId, eventId, role, status, joinedAt
- **Status**: JOINED, PENDING, INVITED, REJECTED, BANNED, LEFT, KICKED, CANCELLED, WAITLIST
- **Role**: OWNER, MODERATOR, PARTICIPANT

#### EventChatMessage / DirectMessage

- **Fields**: id, text, authorId, eventId/recipientId, sentAt
- **Relations**: reactions, thread, media attachments
- **Features**: Reply threads, reactions, moderation

#### Notification

- **Fields**: id, recipientId, kind, referenceId, readAt, sentAt
- **Types**: 20+ notification kinds (events, memberships, chat, reviews, etc.)

### Billing Entities

#### UserPlanPeriod

- **Fields**: userId, plan, startDate, endDate, stripePaymentEventId, stripeSubscriptionId
- **Plans**: FREE, PLUS, PRO

#### EventSponsorshipPeriod

- **Fields**: eventId, plan, startDate, endDate, stripePaymentEventId
- **Plans**: FREE, PLUS, PRO

#### PaymentEvent

- **Fields**: id, eventId, type, success, lastError, payload
- **Types**: Stripe webhook events

### Full Schema

See `prisma/schema.prisma` for the complete schema (1513 lines).

---

## 🔌 GraphQL API

### Schema Overview

The GraphQL schema is code-first (TypeScript resolvers) with generated types.

### Queries (24 files)

- **Auth**: `me`, `session`
- **Users**: `users`, `user`, `adminUsers`
- **Events**: `events`, `event`, `mapClusters`, `userEvents`
- **Members**: `eventMembers`, `eventPermissions`
- **Chat**: `eventMessages`, `dmThreads`, `dmMessages`
- **Reviews**: `reviews`, `userReviews`
- **Admin**: `adminUsers`, `adminModeration`, `reports`
- **Billing**: `userBillingInfo`, `eventBillingInfo`
- And more...

### Mutations (29 files)

- **Auth**: `devLogin`, `refreshSession`, `logout`, `deleteMyAccount`
- **Events**: `createEvent`, `updateEvent`, `cancelEvent`, `deleteEvent`
- **Members**: `joinEvent`, `leaveEvent`, `kickMember`, `updateMemberRole`
- **Chat**: `sendEventMessage`, `sendDM`, `editMessage`, `deleteMessage`
- **Reactions**: `addReaction`, `removeReaction`
- **Reviews**: `createReview`, `updateReview`, `deleteReview`
- **Admin**: `banUser`, `unbanUser`, `deleteUser`, `updateEventModeration`
- **Billing**: `createUserCheckout`, `createEventCheckout`, `cancelSubscription`
- **Media**: `uploadMedia`, `deleteMedia`
- And more...

### Subscriptions (2 files)

- **Chat**: `eventMessageAdded`, `dmMessageAdded`
- **Notifications**: `notificationReceived`

### Custom Scalars

- `DateTime` - ISO 8601 date-time strings
- `JSON` - Arbitrary JSON data

### Example Query

```graphql
query GetEvent($id: ID!) {
  event(id: $id) {
    id
    title
    description
    startAt
    endAt
    meetingKind
    visibility
    maxCapacity
    joinedCount
    owner {
      id
      name
      avatarUrl
    }
    members {
      id
      user {
        id
        name
      }
      role
      status
    }
    categories {
      id
      name
    }
  }
}
```

### Example Mutation

```graphql
mutation JoinEvent($eventId: ID!, $answers: [JoinAnswerInput!]) {
  joinEvent(eventId: $eventId, answers: $answers) {
    id
    status
    joinedAt
  }
}
```

### Example Subscription

```graphql
subscription OnEventMessage($eventId: ID!) {
  eventMessageAdded(eventId: $eventId) {
    id
    text
    author {
      id
      name
    }
    sentAt
  }
}
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **Client** sends `x-user-id` header with user ID (development)
2. **Server** validates user ID and fetches user from database
3. **Context** is created with user object
4. **Resolvers** access `ctx.user` for authenticated user

> **Note**: In production, replace `x-user-id` with JWT token validation.

### Authorization Guards

#### `requireAuth(ctx)`

- Ensures user is authenticated
- Throws `UNAUTHENTICATED` error if not

#### `requireAdmin(ctx)`

- Ensures user is authenticated and has `ADMIN` or `MODERATOR` role
- Throws `FORBIDDEN` error if not

#### `requireEventAccess(ctx, eventId, options)`

- Ensures user has access to event (based on visibility, membership)
- Options: `requireJoined`, `requireOwner`, `requireModerator`

#### `requireChatAccess(ctx, eventId)`

- Ensures user can access event chat
- Checks membership status and chat permissions

### Example Usage

```typescript
export const myResolver: QueryResolvers['me'] = async (_parent, _args, ctx) => {
  const user = requireAuth(ctx); // Throws if not authenticated
  return user;
};
```

---

## 🎨 Core Features

### 1. Event Management

**Features**:

- Create, update, cancel, delete events
- Visibility controls (PUBLIC, HIDDEN)
- Join modes (OPEN, REQUEST, INVITE_ONLY)
- Meeting kinds (ONSITE, ONLINE, HYBRID)
- Max capacity + waitlist
- Categories, tags, levels
- Agenda items
- FAQ items
- Join questions (for applications)

**Resolvers**: `mutation/events.ts`, `query/events.ts`

### 2. Event Membership

**Features**:

- Join, leave, kick, ban members
- Invite members
- Approve/reject join requests
- Waitlist management (automatic promotion)
- Member roles (OWNER, MODERATOR, PARTICIPANT)
- Member status tracking

**Resolvers**: `mutation/event-members.ts`, `query/event-members.ts`

### 3. Chat System

**Features**:

- Event chat (group messaging)
- Direct messages (1-on-1)
- Reply threads
- Message reactions
- Message editing/deletion
- Chat moderation (delete messages, mute users)
- Rate limiting (per user, per event)
- Real-time updates via subscriptions

**Resolvers**: `mutation/event-chat.ts`, `mutation/dm.ts`, `query/event-chat.ts`, `query/dm.ts`, `subscription/chat.ts`

### 4. Notifications

**Features**:

- 20+ notification types
- Mark as read/unread
- Delete notifications
- Real-time delivery via subscriptions
- Email notifications (via Resend)

**Resolvers**: `mutation/notifications.ts`, `query/notifications.ts`, `subscription/notifications.ts`

### 5. Reviews & Ratings

**Features**:

- Users can review events after attendance
- Ratings (1-5 stars)
- Text reviews
- Event owners can respond
- Review moderation

**Resolvers**: `mutation/reviews.ts`, `query/reviews.ts`

### 6. User Management

**Features**:

- User profiles (name, bio, avatar, locale, timezone)
- User preferences (notifications, mutes)
- User blocks (block/unblock users)
- Favourites (save events)
- Last seen tracking
- Soft delete accounts

**Resolvers**: `mutation/user-profile.ts`, `query/users.ts`

### 7. Admin & Moderation

**Features**:

- Ban/unban users
- Delete users
- Approve/reject reports
- Update event moderation status
- Invite admin users
- View user activity

**Resolvers**: `mutation/admin-users.ts`, `mutation/admin-moderation.ts`, `query/admin-users.ts`

---

## 💳 Billing & Payments

### Stripe Integration

**Supported Payment Types**:

1. **User Subscriptions** (monthly/yearly, PLUS/PRO plans)
2. **User One-off Payments** (monthly/yearly access)
3. **Event Sponsorships** (one-off, PLUS/PRO plans)

### Checkout Flow

```typescript
// 1. User initiates checkout
mutation CreateCheckout {
  createUserCheckout(
    plan: PLUS
    billingPeriod: MONTHLY
    paymentType: SUBSCRIPTION
  ) {
    checkoutUrl
  }
}

// 2. User completes payment on Stripe
// 3. Stripe sends webhook to /webhooks/stripe
// 4. Webhook handler processes event:
//    - checkout.session.completed → activate plan
//    - invoice.payment_succeeded → extend subscription
//    - customer.subscription.deleted → downgrade to FREE
```

### Webhook Events

- `checkout.session.completed` - Activate plan/sponsorship
- `invoice.payment_succeeded` - Extend subscription
- `invoice.payment_failed` - Log failure
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Cancel subscription

**Implementation**: `lib/billing/webhook-handler.service.ts`

### Services

- **`stripe.service.ts`**: Stripe client, customer management, checkout creation
- **`user-plan.service.ts`**: User plan activation, subscription management
- **`event-sponsorship.service.ts`**: Event sponsorship activation
- **`webhook-handler.service.ts`**: Webhook processing

---

## 📸 Media Management

### Storage Providers

1. **Local Storage** (development)
   - Files stored in `./uploads/`
   - Served via `/media/:key` endpoint

2. **S3 Storage** (production)
   - Files stored in S3-compatible storage
   - Supports AWS S3, DigitalOcean Spaces, Cloudflare R2, etc.
   - Pre-signed URLs for uploads/downloads

### Image Processing

**Features** (via Sharp):

- Resize to max dimensions (configurable)
- Compress (WebP or AVIF)
- Generate blurhash (for placeholders)
- Generate variants (original, medium, small, thumbnail)

**Implementation**: `lib/media/image-processing.ts`

### Upload Flow

```typescript
// 1. Client requests upload URL
mutation {
  requestMediaUpload(input: {
    filename: "photo.jpg"
    contentType: "image/jpeg"
    purpose: EVENT_COVER
  }) {
    uploadUrl      # Pre-signed S3 URL or local endpoint
    mediaKey       # Unique key for retrieval
    expiresAt
  }
}

// 2. Client uploads file to uploadUrl (direct S3 or local endpoint)

// 3. Client confirms upload
mutation {
  confirmMediaUpload(mediaKey: "abc123") {
    id
    url          # Public URL
    thumbnailUrl
    blurhash
  }
}
```

### Image Variants

- **Original**: Full-size image
- **Medium**: 1024px max
- **Small**: 512px max
- **Thumbnail**: 256px max

Accessed via: `/media/:key?variant=thumbnail`

**Implementation**: `plugins/image-variants.ts`

---

## ⚡ Real-time Features

### GraphQL Subscriptions

**Transport**: WebSocket (via Mercurius)

**Pub/Sub**: Redis (via `mqemitter-redis`)

**Subscriptions**:

1. `eventMessageAdded(eventId: ID!)` - New event messages
2. `dmMessageAdded(threadId: ID!)` - New DMs
3. `notificationReceived(recipientId: ID!)` - New notifications

### Example Client Usage (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost:4000/graphql');

ws.send(
  JSON.stringify({
    type: 'connection_init',
    payload: { headers: { 'x-user-id': 'user123' } },
  })
);

ws.send(
  JSON.stringify({
    id: '1',
    type: 'subscribe',
    payload: {
      query: `
      subscription {
        eventMessageAdded(eventId: "event123") {
          id
          text
          author { id name }
        }
      }
    `,
    },
  })
);
```

---

## 🔄 Background Jobs

### BullMQ Queues

**Centralized Queue Management** (`lib/bullmq.ts`):

1. **Reminders Queue** (`event-reminders`)
   - Sends notifications before events
   - Buckets: 24h, 12h, 6h, 3h, 1h, 30m, 15m

2. **Feedback Queue** (`event-feedback`)
   - Sends feedback requests after events
   - Delay: 1h after event end (prod), 5s (dev)

### Queue API

```typescript
import { getQueue, createWorker } from './lib/bullmq';

// Get or create queue with DLQ
const myQueue = getQueue<MyPayload>('my-queue', {
  createDeadLetterQueue: true,
});

// Create worker with logging and DLQ support
const worker = createWorker<MyPayload>('my-queue', async (job) => {
  await processJob(job.data);
  return { success: true };
});
```

### Dead-Letter Queue (DLQ)

Failed jobs after max retries are moved to DLQ for inspection:

```typescript
// Reprocess all jobs from DLQ
await reprocessDeadLetterQueue('event-reminders');

// Get failed jobs for inspection
const failedJobs = await getFailedJobs('event-reminders', 0, 20);

// Retry specific job
await retryJob('event-reminders', 'job-id');
```

### Queue Statistics API

```bash
GET /admin/queues/stats
```

Response:

```json
{
  "queues": [
    {
      "name": "event-feedback",
      "waiting": 5,
      "active": 1,
      "completed": 1234,
      "failed": 12,
      "delayed": 45,
      "paused": 0
    }
  ],
  "timestamp": "2024-12-11T12:00:00.000Z"
}
```

### Queue Monitoring (Bull Board)

**URL**: `http://localhost:4000/admin/queues`

**Access**:

- Development: Open access
- Production: Requires `ENABLE_BULL_BOARD=true` + ADMIN role

**Features**:

- View jobs (active, completed, failed, delayed)
- Retry failed jobs
- Remove jobs
- View job details and logs
- Pause/resume queues

---

## 📊 Observability

### Logging (Pino)

**Structured JSON logs** with trace IDs:

```json
{
  "level": 30,
  "time": 1702564823000,
  "requestId": "req-123",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "msg": "incoming request",
  "method": "POST",
  "url": "/graphql"
}
```

**Log Levels**: `fatal`, `error`, `warn`, `info`, `debug`, `trace`

**Features**:

- Request/response logging
- Error logging with stack traces
- Query logging (GraphQL operations)
- Trace ID correlation (OpenTelemetry)

### Metrics (OpenTelemetry)

**Custom Metrics**:

- `graphql_operations_total` - GraphQL operation counts
- `graphql_operation_duration_seconds` - Operation latency
- `graphql_errors_total` - Error counts
- `fastify_requests_total` - HTTP request counts
- `fastify_request_duration_seconds` - HTTP latency

**Exporters**: OTLP HTTP (Grafana, Honeycomb, etc.)

### Tracing (OpenTelemetry)

**Instrumented**:

- Fastify requests
- GraphQL operations
- Prisma queries
- Redis operations
- HTTP outbound requests

**Exporters**: OTLP HTTP

---

## 🔒 Security

### Security Headers (Helmet)

Production-ready Helmet configuration with environment-specific settings:

**Production:**

```typescript
{
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': [...allowedOrigins, 'data:', 'blob:'],
      'connect-src': [...allowedOrigins, 'wss:', 'ws:'],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': [],
    }
  },
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}
```

**Development:**

- CSP relaxed (allows `'unsafe-inline'`, `'unsafe-eval'` for HMR)
- HSTS disabled
- Cross-origin policies disabled

### Rate Limiting

**Two-layer rate limiting architecture** for comprehensive protection:

#### Layer 1: HTTP/Infrastructure (Fastify)

Production-ready rate limiting with Redis support at the HTTP layer:

**Configuration:**
| Setting | Production | Development |
|---------|------------|-------------|
| Global max | 100/min | 1000/min |
| Redis backend | ✅ Enabled | ❌ In-memory |
| Ban after | 5 violations | Disabled |

**REST Endpoint Presets:**

```typescript
// Applied per-endpoint
rateLimitPresets.auth; // 10/15min  - login, register, password reset
rateLimitPresets.api; // 100/min   - standard API calls
rateLimitPresets.read; // 300/min   - health checks, public reads
rateLimitPresets.expensive; // 5/min     - admin endpoints
rateLimitPresets.upload; // 20/hour   - file uploads
rateLimitPresets.webhook; // 200/min   - external webhooks (Stripe)
```

**Active on:**

- `/health/*` → read preset (300/min)
- `/webhooks/stripe` → webhook preset (200/min)
- `/api/upload/local` → upload preset (20/hour)
- `/admin/queues/stats` → expensive preset (5/min)

#### Layer 2: Domain/Business Logic (Redis ZSET)

**Sliding window algorithm** with burst protection for GraphQL mutations:

**Rate Limit Buckets:**

| Bucket              | Limit              | Purpose                       |
| ------------------- | ------------------ | ----------------------------- |
| `chat:event:send`   | 30/30s, burst 5/5s | Event chat messages           |
| `chat:dm:send`      | 30/30s, burst 5/5s | Direct messages               |
| `chat:edit`         | 5/min              | Message edits                 |
| `chat:delete`       | 5/min              | Message deletes               |
| `gql:event:write`   | 30/min             | Join/leave/waitlist ops       |
| `gql:feedback`      | 5/min              | Review submission             |
| `gql:feedback:send` | 3/hour             | **Email sending** (critical!) |
| `gql:report`        | 10/10min           | Abuse reports                 |
| `gql:billing`       | 10/10min           | **Stripe operations**         |
| `gql:auth`          | 10/5min            | Login/register                |

**Protected Mutations (15 total):**

- ✅ Billing (5): createSubscriptionCheckout, createOneOffCheckout, createEventSponsorshipCheckout, cancelSubscription, reactivateSubscription
- ✅ Feedback (2): submitReviewAndFeedback, sendFeedbackRequests
- ✅ Event Membership (5): joinMember, acceptInvite, leaveEvent, joinWaitlistOpen, leaveWaitlist
- ✅ Join Requests (2): requestJoinEventWithAnswers, cancelJoinRequest
- ✅ Reports (1): createReport

**Error Response:**

```json
{
  "errors": [
    {
      "message": "Rate limit exceeded. Please slow down and try again later.",
      "extensions": {
        "code": "RATE_LIMIT_EXCEEDED",
        "retryAfter": 60,
        "bucket": "gql:billing",
        "currentCount": 11,
        "maxAllowed": 10
      }
    }
  ]
}
```

**Fail-Open Strategy:** Redis errors are logged but don't block requests (except critical ops can be configured fail-closed).

**Headers exposed:**

- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp
- `Retry-After` - Seconds until retry (on 429)

### CORS

**Production:**

- Strict origin validation from `CORS_ORIGINS`
- `maxAge: 86400` (24h preflight cache)
- `strictPreflight: true`

**Development:**

- All origins allowed
- `maxAge: 600` (10min)
- Relaxed preflight

**Credentials**: Enabled for cookies/auth headers

### Cookie Security

**Production:**

- `secure: true` - HTTPS only
- `sameSite: 'lax'` - CSRF protection
- `httpOnly: true` - XSS protection
- `domain` - Auto-extracted from `APP_URL`
- `maxAge: 7 days`

**Development:**

- `secure: false` - HTTP allowed
- `maxAge: 1 day`

### Input Validation

**Zod schemas** for environment variables

**GraphQL schema validation** (types, depth, complexity)

**Prisma validation** (unique constraints, foreign keys)

### GraphQL Security

| Feature                    | Production  | Development |
| -------------------------- | ----------- | ----------- |
| **GraphiQL Playground**    | ❌ Disabled | ✅ Enabled  |
| **Introspection**          | ❌ Blocked  | ✅ Allowed  |
| **Query depth limit**      | 7           | 15          |
| **Query complexity limit** | 1000        | 5000        |

**Error masking (Production):**

- Internal errors (5xx) → generic message
- Operational errors (4xx) → full details
- Stack traces → logs only

**Safe error codes exposed:**

```typescript
SAFE_ERROR_CODES = [
  'BAD_USER_INPUT',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'RATE_LIMIT_EXCEEDED',
  'CONFLICT',
  'GONE',
  'UNPROCESSABLE_ENTITY',
];
```

### Subscription Security

All GraphQL subscriptions require:

1. **Authentication** - valid user session
2. **Authorization** - membership/participation guards

```typescript
// Event chat - requires JOINED member status
eventMessageAdded(eventId) → requireJoinedMember()

// DM typing - requires thread participant
dmTyping(threadId) → requireDmParticipant()

// Notifications - user can only subscribe to own
notificationAdded() → validateNotificationAccess()
```

### Error Handling

**Production-safe errors**:

- GraphQL errors use `GraphQLError` with `extensions.code`
- Stack traces hidden in production (logged only)
- Error logging with request ID and trace context
- Custom error formatter with environment awareness

---

## ⚡ Performance

### Database (Prisma)

**Connection Pool:**
| Setting | Production | Development |
|---------|------------|-------------|
| Connection limit | 20 | 10 |
| Pool timeout | 10s | 30s |

**Query Timeouts:**
| Setting | Production | Development |
|---------|------------|-------------|
| Statement timeout | 30s | 60s |
| Transaction timeout | 30s | 60s |
| Lock timeout | 15s | 30s |

**Slow Query Tracking:**

- Threshold: 1s (prod), 5s (dev)
- Logged with query details
- Metrics: `db_slow_queries_total`

### Redis

**Centralized Configuration:**

```typescript
REDIS_CONFIG = {
  maxRetries: 20, // Production: 20, Dev: 10
  initialDelay: 500, // ms
  maxDelay: 30000, // 30s cap on exponential backoff
  connectTimeout: 10000, // 10s
  commandTimeout: 5000, // 5s
  keepAlive: 30000, // 30s
};
```

**Connection Types:**

- `healthRedis` - Health checks
- `rateLimitRedis` - Rate limiting (key prefix: `rl:`)
- `redisEmitter` - GraphQL pub/sub
- `createBullMQConnection()` - Queue workers

### BullMQ Queues

**Job Configuration:**

```typescript
defaultJobOptions: {
  attempts: 3,           // Production: 3, Dev: 5
  backoff: {
    type: 'exponential',
    delay: 5000,         // 5s initial
  },
  removeOnComplete: { count: 100, age: 86400 },
  removeOnFail: { count: 500, age: 604800 },
}
```

**Worker Configuration:**

```typescript
workerOptions: {
  concurrency: 5,        // Production: 5, Dev: 2
  lockDuration: 30000,   // 30s
  stalledInterval: 30000,
  maxStalledCount: 2,
}
```

**Dead-Letter Queues:**

- Auto-created for each queue (`queue-name-dlq`)
- Failed jobs after max retries → DLQ
- Manual reprocessing available

### Other Optimizations

1. **Image Optimization**
   - WebP/AVIF compression
   - Multiple variants (original, medium, small, thumbnail)
   - Lazy loading via blurhash

2. **Rate Limiting**
   - Protects against abuse
   - Per-user limits for expensive operations
   - Redis-based for distributed environments

3. **Dataloader** (planned)
   - Batch database queries
   - Cache repeated queries within request

### Benchmarks (Development)

- **GraphQL query**: ~50ms (simple), ~200ms (complex)
- **GraphQL mutation**: ~100ms (simple), ~500ms (complex)
- **Image upload**: ~2s (1MB image, local storage)
- **Subscription latency**: ~50ms (Redis pub/sub)

---

## 🛠 Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start API server with hot reload
pnpm worker:reminders:dev   # Start reminders worker
pnpm worker:feedback:dev    # Start feedback worker

# Build & Production
pnpm build                  # Compile TypeScript
pnpm start                  # Start production server

# Type Checking & Linting
pnpm typecheck              # Run TypeScript compiler
pnpm lint                   # Run ESLint

# Database
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:migrate         # Run migrations
pnpm prisma:studio          # Open Prisma Studio
pnpm prisma:seed            # Seed database
pnpm prisma:reset           # Reset database (caution!)

# GraphQL
pnpm gql:gen                # Generate GraphQL types
```

### GraphQL Code Generation

**Config**: `src/graphql/codegen.ts`

**Generates**:

- `resolvers-types.ts` - TypeScript types for resolvers
- Type-safe `Query`, `Mutation`, `Subscription` resolver interfaces
- Input/output types for all operations

**Run after schema changes**:

```bash
pnpm gql:gen
```

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name add_user_bio

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only!)
pnpm prisma:reset
```

### Testing

> **Note**: Test suite not yet implemented. Recommended setup:

- **Unit tests**: Vitest
- **Integration tests**: Supertest + Vitest
- **E2E tests**: Playwright

---

## 🚀 Deployment

### Docker (Recommended)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### Environment Variables (Production)

```bash
NODE_ENV=production
DATABASE_URL="postgresql://..."
JWT_SECRET="<secure-secret>"
REDIS_HOST="redis.example.com"
REDIS_PORT="6379"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
MEDIA_STORAGE_PROVIDER="S3"
S3_BUCKET="miglee-production"
# ... etc
```

### Database Migrations

```bash
# Run migrations before deployment
npx prisma migrate deploy
```

### Health Checks (Kubernetes-style)

**Liveness Probe** - Is the process alive?

```bash
curl http://localhost:4000/health/live
# Response: { "status": "ok", "uptime": 12345, "timestamp": "..." }
# Always returns 200 if process is running
```

**Readiness Probe** - Is the app ready for traffic?

```bash
curl http://localhost:4000/health/ready
# Response:
{
  "status": "ok",           // ok | degraded | fail
  "timestamp": "...",
  "uptime": 12345,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": { "status": "ok", "latency": 5 },
    "redis": { "status": "ok", "latency": 2 }
  }
}
# Returns 200 if ready, 503 if not
```

**Legacy Health** (backwards compatible)

```bash
curl http://localhost:4000/health
# Response: { "ok": true, "db": "ok", "redis": "ok" }
```

### Graceful Shutdown

**Timeouts:**
| Setting | Production | Development |
|---------|------------|-------------|
| Graceful timeout | 30s | 10s |
| Force shutdown | 45s | 15s |

**Shutdown Sequence:**

1. Stop accepting new connections (return 503)
2. Wait for in-flight requests to complete
3. Close BullMQ queues and workers
4. Close database connections
5. Close Redis connections
6. Exit process

**Signals handled:** `SIGTERM`, `SIGINT`, `SIGUSR2`

### Reverse Proxy (Nginx)

```nginx
upstream api {
  server localhost:4000;
}

server {
  listen 80;
  server_name api.example.com;

  location / {
    proxy_pass http://api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Prisma Connection Errors

**Problem**: `Can't reach database server at ...`

**Solution**:

- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Check firewall/network settings

#### 2. Redis Connection Errors

**Problem**: `ECONNREFUSED localhost:6379`

**Solution**:

- Ensure Redis is running
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`

#### 3. Stripe Webhook Signature Errors

**Problem**: `Webhook signature verification failed`

**Solution**:

- Check `STRIPE_WEBHOOK_SECRET` in `.env`
- Ensure webhook endpoint is `/webhooks/stripe`
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:4000/webhooks/stripe`

#### 4. GraphQL Subscription Not Working

**Problem**: WebSocket connection fails

**Solution**:

- Ensure Redis is running (required for pub/sub)
- Check WebSocket endpoint: `ws://localhost:4000/graphql`
- Verify `x-user-id` header is sent in `connection_init`

#### 5. Image Upload Fails

**Problem**: `Failed to process image`

**Solution**:

- Check `UPLOADS_TMP_PATH` exists and is writable
- Ensure Sharp dependencies are installed (libvips)
- Check file size limits (default: 10MB)

### Debug Logging

```bash
# Enable debug logs
LOG_LEVEL=debug pnpm dev

# View Prisma queries
DEBUG=prisma:query pnpm dev

# View GraphQL operations
# (check logs for operation names)
```

### Support

For additional support:

- Check logs in `./logs/` (if `LOG_FILE_PATH` is set)
- View queue errors in Bull Board: `/admin/queues`
- Check database with Prisma Studio: `pnpm prisma:studio`

---

## 📚 Additional Resources

### Documentation

- [Fastify Docs](https://www.fastify.io/docs/latest/)
- [Mercurius Docs](https://mercurius.dev/)
- [Prisma Docs](https://www.prisma.io/docs)
- [GraphQL Docs](https://graphql.org/learn/)
- [Stripe API Docs](https://stripe.com/docs/api)

### Code Quality

- **TypeScript errors**: 0 ✅
- **ESLint**: Configured (requires migration to ESLint 9)
- **Code style**: Prettier (configured in monorepo root)

### Generated Files

- `src/graphql/__generated__/resolvers-types.ts` - GraphQL types (35,000+ lines)
- `node_modules/.prisma/client/` - Prisma client

---

## 📝 License

Proprietary - All rights reserved

---

**Built with ❤️ using TypeScript, Fastify, GraphQL, and Prisma**

_Last updated: December 11, 2024 (Production-Ready Update)_
