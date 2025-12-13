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
  - [1. Event Management](#1-event-management)
  - [2. Check-in & Presence System](#2-check-in--presence-system)
  - [3. Event Membership](#3-event-membership)
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

- **~37,500 lines of TypeScript** (includes check-in system)
- **73 resolver files**
- **503 GraphQL operations** (12 check-in mutations + 1 query added)
- **0 TypeScript errors** ✅
- **Production-grade error handling** with `GraphQLError`
- **Check-in system**: 2,500 lines, 4 methods, 256-bit tokens, audit trail

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

### Detailed System Architecture

#### 1. Application Layer

**Fastify Server** (`src/server.ts`, `src/index.ts`)

- High-performance HTTP server with plugin architecture
- Request ID generation for tracing
- Lifecycle hooks (onRequest, preValidation, onResponse, onError)
- Graceful shutdown handling (SIGTERM, SIGINT)
- Trust proxy configuration for reverse proxy deployments
- Environment-aware configuration

**Key Plugins:**

1. **Rate Limiting** (`plugins/rate-limit.ts`)
   - Layer 1: HTTP-level rate limiting (Fastify)
   - Layer 2: Domain-level rate limiting (Redis ZSET)
   - Sliding window algorithm with burst protection
   - Fail-open strategy on Redis errors

2. **Security** (`plugins/helmet.ts`, `plugins/cors.ts`)
   - Helmet security headers (CSP, HSTS, frameguard)
   - CORS with environment-specific origins
   - Cookie security (httpOnly, secure, sameSite)

3. **Authentication** (`plugins/jwt.ts`)
   - JWT token generation and validation
   - Development bypass (`x-user-id` header)
   - Cookie-based token storage
   - 7-day token expiration

4. **GraphQL** (`plugins/mercurius.ts`)
   - Mercurius GraphQL server
   - Query complexity/depth limiting
   - Introspection control
   - WebSocket support for subscriptions
   - Context factory with user resolution
   - Error formatting with environment masking

#### 2. Data Layer

**PostgreSQL** (via Prisma ORM)

- **Connection Pooling**: 20 connections (prod), 10 (dev)
- **Timeouts**: 30s statement, 30s transaction (prod)
- **Slow Query Logging**: >1s queries logged
- **Middleware**: Query logging, error handling
- **Transactions**: ACID compliance with `$transaction`
- **Optimistic Locking**: Version-based concurrency control (waitlist)

**Key Features:**

- Soft delete support (User, Event entities)
- Foreign key constraints with cascades
- Unique indexes on critical fields (email, slug)
- Full-text search indexes (events, users)
- Composite indexes for performance
- Row-level security patterns

**Redis Architecture** (5 separate connections)

- **`healthRedis`**: Health check pings only
- **`rateLimitRedis`**: Rate limiting state (keyPrefix: `rl:`)
- **`chatRedis`**: Typing indicators (keyPrefix: `chat:`)
- **`redisEmitter`**: GraphQL pub/sub for subscriptions
- **BullMQ connections**: Per-queue dedicated connections

**Redis Usage Patterns:**

```
Health Checks:
  health:status -> PING/PONG

Rate Limiting (ZSET):
  domain:gql:billing:{userId} -> [(timestamp1, score1), ...]
  domain:chat:event:send:{eventId}:{userId} -> [(ts, score), ...]
  TTL: windowSeconds + 60s grace period

Typing Indicators (String + TTL):
  chat:event:typing:{eventId}:{userId} -> "1"
  chat:dm:typing:{threadId}:{userId} -> "1"
  TTL: 3 seconds

Pub/Sub (MQEmitter):
  Channel: event:{eventId}:chat
  Channel: dm:{threadId}:message
  Channel: notifications:{userId}
```

#### 3. Business Logic Layer

**Resolver Pattern:**

```typescript
// src/graphql/resolvers/mutation/events.ts
export const createEventMutation: MutationResolvers['createEvent'] =
  resolverWithMetrics('Mutation', 'createEvent', async (_parent, args, ctx) => {
    // 1. Authentication Guard
    const user = requireAuth(ctx);

    // 2. Rate Limiting (Domain Layer)
    await assertEventWriteRateLimit(user.id);

    // 3. Input Validation (Zod/GraphQL schema)
    validateEventInput(args.input);

    // 4. Authorization Business Logic
    checkUserCanCreateEvent(user);

    // 5. Database Transaction
    const event = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({ data: {...} });
      await tx.eventMember.create({
        data: { userId: user.id, eventId: event.id, role: 'OWNER' }
      });
      return event;
    });

    // 6. Side Effects (optional)
    await scheduleReminders(event.id, event.startAt);
    await publishNotification('EVENT_CREATED', event.id);

    // 7. Response Mapping
    return mapEvent(event);
  });
```

**Service Layer:**

- **Billing Services** (`lib/billing/`)
  - Stripe client wrapper
  - Webhook event processing
  - Plan activation/deactivation
  - Idempotency via `PaymentEvent` table
- **Media Services** (`lib/media/`)
  - Storage abstraction (local/S3)
  - Image processing (Sharp)
  - Variant generation
  - Blurhash generation
- **Email Service** (`lib/email.ts`)
  - Resend integration
  - Template-based emails
  - Feedback request generation
  - Event reminder emails

**Guard System** (`shared/auth-guards.ts`, `chat-guards.ts`)

```typescript
// Authentication
requireAuth(ctx) → User | throws UNAUTHENTICATED

// Authorization
requireAdmin(ctx) → User | throws FORBIDDEN
requireEventAccess(ctx, eventId, options) → Event | throws FORBIDDEN
requireChatAccess(ctx, eventId) → void | throws FORBIDDEN
requireDmAccess(ctx, threadId) → DmThread | throws FORBIDDEN

// Membership Checks
requireJoinedMember(ctx, eventId) → EventMember | throws FORBIDDEN
requireEventModerator(ctx, eventId) → EventMember | throws FORBIDDEN
requireEventOwner(ctx, eventId) → EventMember | throws FORBIDDEN
```

#### 4. Background Jobs Layer

**BullMQ Architecture** (`lib/bullmq.ts`)

**Queue Configuration:**

```typescript
{
  defaultJobOptions: {
    attempts: 3,                    // Max retries
    backoff: {
      type: 'exponential',
      delay: 5000                   // Initial delay
    },
    removeOnComplete: {
      count: 100,                   // Keep last 100
      age: 86400                    // 24 hours
    },
    removeOnFail: {
      count: 500,                   // Keep last 500
      age: 604800                   // 7 days
    }
  },
  workerOptions: {
    concurrency: 5,                 // Parallel jobs
    lockDuration: 30000,            // 30s job lock
    stalledInterval: 30000,         // Check for stalls every 30s
    maxStalledCount: 2             // Max stall retries
  }
}
```

**Dead-Letter Queue (DLQ) Pattern:**

- Auto-created for each queue: `{queueName}-dlq`
- Failed jobs after max retries → DLQ
- Manual reprocessing API available
- Separate monitoring/alerting

**Worker Isolation:**

- Separate processes for each worker type
- Independent scaling
- Graceful shutdown support
- Health monitoring

**Queue Types:**

1. **Reminders Queue** (`workers/reminders/`)
   - Scheduled per event (7 buckets: 24h, 12h, 6h, 3h, 1h, 30m, 15m)
   - Idempotent job IDs: `reminder:{minutes}m:{eventId}`
   - Automatic rescheduling on event time changes
2. **Feedback Queue** (`workers/feedback/`)
   - Single job per event
   - Scheduled 1h after event end (prod), 5s (dev)
   - Idempotent job ID: `feedback-request-{eventId}`
   - Email batch sending with rate limiting

#### 5. Real-Time Layer

**GraphQL Subscriptions** (via Mercurius + WebSocket)

**Connection Flow:**

```
1. Client opens WebSocket: ws://api.example.com/graphql
2. Client sends connection_init: { headers: { 'x-user-id': 'user123' } }
3. Server validates auth, creates context
4. Client subscribes: { query: 'subscription { eventMessageAdded(...) }' }
5. Server validates permissions, registers subscription
6. On event: pubsub.publish(channel, payload)
7. Server sends data to subscribed clients
```

**Pub/Sub Architecture** (Redis-backed)

- MQEmitter with Redis adapter
- Channel per subscription type
- Message broadcasting across instances
- Automatic cleanup on disconnect

**Subscription Security:**

- Auth required on `connection_init`
- Permission checks on subscribe
- Channel isolation per resource
- Rate limiting on subscription creation

#### 6. Observability Layer

**Logging** (Pino)

- Structured JSON logs
- Request ID correlation
- Trace ID from OpenTelemetry
- Environment-aware levels
- Optional file output

**Metrics** (OpenTelemetry)

- GraphQL operation counters
- GraphQL operation duration histograms
- HTTP request counters
- HTTP request duration histograms
- Database query counters
- Redis operation counters
- Queue job counters

**Tracing** (OpenTelemetry)

- Distributed trace context propagation
- Automatic instrumentation:
  - Fastify requests
  - GraphQL operations
  - Prisma queries
  - Redis commands
  - HTTP outbound calls

#### 7. Error Handling Strategy

**Error Types:**

```typescript
// Operational Errors (Expected)
throw new GraphQLError('User not found', {
  extensions: { code: 'NOT_FOUND' },
});

// Validation Errors
throw new GraphQLError('Invalid email format', {
  extensions: { code: 'BAD_USER_INPUT', field: 'email' },
});

// Authorization Errors
throw new GraphQLError('Access denied', {
  extensions: { code: 'FORBIDDEN' },
});

// Rate Limit Errors
throw new GraphQLError('Rate limit exceeded', {
  extensions: {
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60,
    bucket: 'gql:billing',
    currentCount: 11,
    maxAllowed: 10,
  },
});
```

**Error Masking (Production):**

- Safe codes exposed to client
- Stack traces hidden
- Sensitive data redacted
- Full errors logged internally

#### 8. Security Architecture

**Defense in Depth:**

1. **Network Layer**
   - CORS origin validation
   - Helmet security headers
   - Rate limiting (HTTP layer)
   - HTTPS enforcement (production)

2. **Authentication Layer**
   - JWT token validation
   - Secure cookie storage
   - Token expiration
   - Session management (planned)

3. **Authorization Layer**
   - Guard-based access control
   - Resource-level permissions
   - Role-based access (User, Admin, Moderator)
   - Membership-based access (Event roles)

4. **Application Layer**
   - GraphQL query complexity limiting
   - GraphQL depth limiting
   - Input validation (Zod schemas)
   - Rate limiting (domain layer)
   - SQL injection prevention (Prisma)
   - XSS prevention (input sanitization)

5. **Data Layer**
   - Prepared statements (Prisma)
   - Foreign key constraints
   - Unique constraints
   - Row-level security patterns
   - Soft deletes for sensitive data

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

**Complete Event Lifecycle:**

1. **Creation & Configuration**
   - Event metadata (title, description, dates)
   - Meeting types (ONSITE, ONLINE, HYBRID)
   - Location data (address, coordinates, map tile calculations)
   - Visibility control (PUBLIC, HIDDEN)
   - Join modes (OPEN, REQUEST, INVITE_ONLY)
   - Capacity management with waitlist support
   - Categories & tags for discovery
   - Difficulty levels (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT)

2. **Advanced Features**
   - **Agenda System**: Time-slotted activities
   - **FAQ System**: Pre-emptive Q&A for attendees
   - **Join Questions**: Custom application forms
   - **Image Attachments**: Cover photo, gallery support
   - **Feedback Questions**: Post-event surveys

3. **Event States & Transitions**

   ```typescript
   // Event Status Flow
   DRAFT → PUBLISHED → [LIVE] → ENDED → ARCHIVED

   // Special States
   CANCELLED // Can be cancelled at any time
   DELETED   // Soft delete (retains data)
   ```

4. **Capacity & Waitlist Management** (`lib/waitlist.ts`)

   **Automatic Promotion Algorithm:**

   ```typescript
   // When a member leaves an event:
   1. Check if event is at max capacity
   2. Query waitlist members (ordered by joinedAt ASC)
   3. For each waitlist member:
      a. Check current capacity
      b. If space available → promote to JOINED
      c. Send notification
      d. Send email
      e. Break if at capacity
   ```

   **Optimistic Locking:**
   - Uses Prisma `version` field for concurrency control
   - Prevents race conditions in capacity checks
   - Retry logic on version mismatch

5. **Event Discovery**
   - **Text Search**: Full-text search on title, description
   - **Geo Search**: Find events near coordinates
   - **Map Clustering**: Web Mercator tile-based clustering
   - **Category Filtering**: Multi-category support
   - **Date Filtering**: Upcoming, past, date ranges
   - **Visibility Filtering**: PUBLIC only for unauthenticated users

6. **Event Moderation**
   - Owner/moderator controls
   - Member kick/ban capabilities
   - Message deletion
   - Event reporting system
   - Admin intervention tools

**Resolvers**:

- `mutation/events.ts` (create, update, cancel, delete)
- `query/events.ts` (list, search, map clusters)
- `query/event-details.ts` (single event, permissions)

**Key Services**:

- `lib/waitlist.ts` - Waitlist promotion logic
- `lib/geo/webmercator.ts` - Map tile calculations

---

### 2. Check-in & Presence System

**Production-ready check-in/attendance tracking system with 4 methods, QR codes, blocking, and audit trail.**

#### Overview

The Check-in system allows event organizers to track attendee presence at events. It supports multiple check-in methods simultaneously and provides comprehensive moderation tools.

**Key Statistics:**
- ~2,500 lines of backend code
- 12 GraphQL mutations + 1 query
- 4 check-in methods
- 256-bit secure tokens
- Complete audit trail
- Idempotent operations

#### Check-in Methods

```typescript
enum CheckinMethod {
  SELF_MANUAL       // User clicks "I'm here"
  MODERATOR_PANEL   // Organizer checks off from list
  EVENT_QR          // Scan event's shared QR code
  USER_QR           // Scan user's personal QR code
}
```

**Method Details:**

1. **SELF_MANUAL**
   - User self-reports presence via button click
   - Fastest method for users
   - Can be disabled by organizer
   - Can be blocked per-member

2. **MODERATOR_PANEL**
   - Organizer manually checks in members from list
   - Full control for organizer
   - Useful for registration desk
   - Supports bulk operations

3. **EVENT_QR**
   - Single QR code for entire event
   - Display on projector/TV at entrance
   - Users scan with their devices
   - Easy for organizer, scalable for large events
   - Token can be rotated if compromised

4. **USER_QR**
   - Each member has unique QR code
   - Organizer scans member's code at entrance
   - Most secure method (1:1 verification)
   - Token per member (can be rotated individually)
   - Best for controlled entry

#### Data Model

**Event Fields:**

```typescript
model Event {
  // ... existing fields
  
  // Check-in configuration
  checkinEnabled           Boolean          @default(false)
  enabledCheckinMethods    CheckinMethod[]  @default([])
  eventCheckinToken        String?          @unique  // 256-bit token
}
```

**EventMember Fields:**

```typescript
model EventMember {
  // ... existing fields
  
  // Check-in state
  isCheckedIn              Boolean          @default(false)
  checkinMethods           CheckinMethod[]  @default([])
  lastCheckinAt            DateTime?
  
  // Personal QR token
  memberCheckinToken       String?          @unique
  
  // Blocking & rejection
  checkinBlockedAll        Boolean          @default(false)
  checkinBlockedMethods    CheckinMethod[]  @default([])
  lastCheckinRejectionReason  String?
  lastCheckinRejectedAt    DateTime?
  lastCheckinRejectedById  String?
  lastCheckinRejectedBy    User?           @relation(...)
}
```

**EventCheckinLog** (Audit Trail):

```typescript
model EventCheckinLog {
  id                String          @id @default(cuid())
  eventId           String
  memberId          String
  actorId           String?
  
  action            CheckinAction   // CHECK_IN, UNCHECK, REJECT, BLOCK_*, UNBLOCK_*
  method            CheckinMethod?
  source            CheckinSource   // USER, MODERATOR, SYSTEM
  result            CheckinResult   // SUCCESS, DENIED, NOOP
  
  reason            String?
  comment           String?
  showCommentToUser Boolean         @default(false)
  metadata          Json?
  
  createdAt         DateTime        @default(now())
  
  // Relations
  event             Event           @relation(...)
  member            EventMember     @relation(...)
  actor             User?           @relation(...)
  
  @@index([eventId, createdAt(sort: Desc)])
  @@index([memberId])
  @@index([action])
  @@index([method])
  @@index([actorId])
}
```

#### Business Logic

**Core Helper Functions** (`resolvers/helpers/checkin.ts` - 600 lines):

```typescript
// Token generation (256-bit secure)
function generateCheckinToken(): string {
  return nanoid(32); // Cryptographically secure
}

// Validation pipeline
async function validateEventCheckin(prisma, eventId, userId): Promise<void> {
  // 1. Event must have check-in enabled
  // 2. User must be JOINED member
  // 3. Event not canceled/deleted
  // 4. Event exists
}

async function validateMethodEnabled(prisma, eventId, method): Promise<void> {
  // Method must be in enabledCheckinMethods
}

async function validateMemberCanCheckin(member, method): Promise<void> {
  // 1. Not globally blocked (checkinBlockedAll)
  // 2. Method not blocked (checkinBlockedMethods)
  // 3. Status is JOINED
}

// Check-in operations (idempotent)
async function addCheckinMethod(
  prisma,
  memberId: string,
  method: CheckinMethod
): Promise<void> {
  // Add method to checkinMethods array (if not present)
  // Set isCheckedIn = true
  // Update lastCheckinAt
}

async function removeCheckinMethod(
  prisma,
  memberId: string,
  method: CheckinMethod
): Promise<void> {
  // Remove method from array
  // If array empty → set isCheckedIn = false
}

// Audit logging
async function logCheckinAction(
  prisma,
  log: CheckinLogEntry
): Promise<void> {
  // Create EventCheckinLog entry
  // All mutations log their actions
}

// Notifications
async function sendCheckinNotification(
  prisma,
  pubsub,
  kind: NotificationKind,
  data: ...
): Promise<void> {
  // Send in-app + email notifications
  // Respect user preferences
  // Deduplicate by key
}

// Status change invalidation
async function invalidateCheckinOnStatusChange(
  prisma,
  memberId: string
): Promise<void> {
  // Called when member status changes (e.g., JOINED → BANNED)
  // Clears isCheckedIn and checkinMethods
  // Logs SYSTEM action
}
```

**Permission Checks:**

```typescript
async function validateModeratorAccess(
  prisma,
  eventId: string,
  userId: string
): Promise<void> {
  const membership = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  
  if (!membership || !['OWNER', 'MODERATOR'].includes(membership.role)) {
    throw new GraphQLError('Only owner/moderator can perform this action', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}
```

#### GraphQL API

**User Mutations (4):**

```graphql
# Self check-in (SELF_MANUAL method)
mutation CheckInSelf($eventId: ID!) {
  checkInSelf(eventId: $eventId) {
    success
    message
    member {
      id
      isCheckedIn
      checkinMethods
      lastCheckinAt
    }
  }
}

# Self un-check-in
mutation UncheckInSelf($eventId: ID!) {
  uncheckInSelf(eventId: $eventId) {
    success
    message
    member { ... }
  }
}

# Check-in via event QR code
mutation CheckInByEventQr($eventId: ID!, $token: String!) {
  checkInByEventQr(eventId: $eventId, token: $token) {
    success
    message
    member { ... }
  }
}

# Check-in via personal QR code (scanned by moderator)
mutation CheckInByUserQr($token: String!) {
  checkInByUserQr(token: $token) {
    success
    message
    member { ... }
  }
}
```

**Moderator Mutations (5):**

```graphql
# Manual check-in from panel
mutation CheckInMember($input: CheckInMemberInput!) {
  checkInMember(input: $input) {
    success
    message
    member { ... }
  }
}

input CheckInMemberInput {
  eventId: ID!
  memberId: ID!
  method: CheckinMethod! # Usually MODERATOR_PANEL
}

# Un-check member
mutation UncheckInMember($input: UncheckInMemberInput!) {
  uncheckInMember(input: $input) { ... }
}

# Reject check-in with reason
mutation RejectMemberCheckin($input: RejectMemberCheckinInput!) {
  rejectMemberCheckin(input: $input) { ... }
}

input RejectMemberCheckinInput {
  eventId: ID!
  memberId: ID!
  method: CheckinMethod!
  reason: String
  showReasonToUser: Boolean
}

# Block all check-ins for member
mutation BlockMemberCheckin($input: BlockMemberCheckinInput!) {
  blockMemberCheckin(input: $input) { ... }
}

input BlockMemberCheckinInput {
  eventId: ID!
  memberId: ID!
  scope: BlockScope!     # ALL or METHOD
  method: CheckinMethod  # Required if scope=METHOD
  reason: String
}

# Unblock check-ins
mutation UnblockMemberCheckin($input: UnblockMemberCheckinInput!) {
  unblockMemberCheckin(input: $input) { ... }
}
```

**Configuration Mutations (3):**

```graphql
# Update event check-in settings
mutation UpdateEventCheckinConfig($input: UpdateEventCheckinConfigInput!) {
  updateEventCheckinConfig(input: $input) {
    success
    message
    event {
      id
      checkinEnabled
      enabledCheckinMethods
      eventCheckinToken
    }
  }
}

input UpdateEventCheckinConfigInput {
  eventId: ID!
  checkinEnabled: Boolean
  enabledCheckinMethods: [CheckinMethod!]
}

# Rotate event QR token (security)
mutation RotateEventCheckinToken($eventId: ID!) {
  rotateEventCheckinToken(eventId: $eventId) {
    success
    message
    newToken: String!
  }
}

# Rotate member QR token
mutation RotateMemberCheckinToken($eventId: ID!, $memberId: ID!) {
  rotateMemberCheckinToken(eventId: $eventId, memberId: $memberId) {
    success
    message
    newToken: String!
  }
}
```

**Queries (1):**

```graphql
# Get check-in audit log (with filters & pagination)
query EventCheckinLogs(
  $eventId: ID!
  $limit: Int = 50
  $offset: Int = 0
  $action: CheckinAction
  $method: CheckinMethod
) {
  eventCheckinLogs(
    eventId: $eventId
    limit: $limit
    offset: $offset
    action: $action
    method: $method
  ) {
    totalCount
    logs {
      id
      action
      method
      source
      result
      reason
      comment
      showCommentToUser
      createdAt
      actor {
        id
        name
        displayName
      }
      member {
        id
        user {
          id
          name
          displayName
        }
      }
    }
  }
}
```

#### Notifications

**New NotificationKind values:**

```typescript
enum NotificationKind {
  // ... existing values
  CHECKIN_CONFIRMED   // User successfully checked in
  CHECKIN_REJECTED    // Organizer rejected check-in
  CHECKIN_BLOCKED     // Organizer blocked check-ins
  CHECKIN_UNBLOCKED   // Organizer unblocked check-ins
}
```

**Notification Flow:**

1. **User checks in** → `CHECKIN_CONFIRMED` sent to user
2. **Organizer rejects** → `CHECKIN_REJECTED` sent to user (with reason if enabled)
3. **Organizer blocks** → `CHECKIN_BLOCKED` sent to user
4. **Organizer unblocks** → `CHECKIN_UNBLOCKED` sent to user

All notifications respect user preferences (`NotificationPreference` model).

#### Security Features

1. **256-bit Tokens**
   - Generated via `nanoid(32)` (cryptographically secure)
   - Stored as unique fields in database
   - No expiration (manual rotation instead)

2. **Token Rotation**
   - Event tokens can be rotated if compromised
   - Member tokens can be rotated individually
   - Old tokens immediately invalidated

3. **Permission Checks**
   - All mutations validate permissions
   - Only owner/moderator for management operations
   - Only JOINED members can check in

4. **Status Validation**
   - Check-in only allowed for JOINED members
   - Status changes (BANNED, KICKED) auto-invalidate check-ins
   - System logs all invalidations

5. **Method Blocking**
   - Granular control: block all or specific methods
   - Prevents abuse of self-check-in
   - Logs all blocking actions

#### Frontend Integration

**React Query Hooks** (`apps/web/src/features/events/api/checkin.ts` - 770 lines):

```typescript
// User hooks
export function useCheckInSelfMutation() { ... }
export function useUncheckInSelfMutation() { ... }
export function useCheckInByEventQrMutation() { ... }
export function useCheckInByUserQrMutation() { ... }

// Moderator hooks
export function useCheckInMemberMutation() { ... }
export function useUncheckInMemberMutation() { ... }
export function useRejectMemberCheckinMutation() { ... }
export function useBlockMemberCheckinMutation() { ... }
export function useUnblockMemberCheckinMutation() { ... }

// Configuration hooks
export function useUpdateEventCheckinConfigMutation() { ... }
export function useRotateEventCheckinTokenMutation() { ... }
export function useRotateMemberCheckinTokenMutation() { ... }

// Query hook
export function useGetEventCheckinLogsQuery() { ... }

// All hooks include:
// - Automatic cache invalidation
// - Toast notifications via meta.successMessage
// - Error handling
// - Loading states
```

**UI Components:**

1. **User Components:**
   - `UserCheckinSection` - Check-in button, status display, warnings
   - `UserQRCode` - Personal QR code with full-screen & download

2. **Organizer Components:**
   - Checkin management page (`/event/[id]/manage/checkin`)
   - `EventQRCode` - Event QR with full-screen, PNG, PDF download
   - `QRScannerModal` - Camera scanner for User QR codes
   - Participants list with check-in status
   - Event log with filters

3. **Export Utilities:**
   - `generateParticipantListPDF()` - PDF attendance list
   - `generateParticipantListPNG()` - PNG attendance list
   - Blank attendance sheet for manual tracking

**Dependencies:**

```json
{
  "qrcode.react": "^4.2.0",        // QR generation
  "react-qr-reader": "3.0.0-beta-1", // QR scanning
  "jspdf": "^3.0.4",               // PDF export
  "html2canvas": "^1.4.1"          // PNG export
}
```

#### Usage Examples

**1. Enable check-in for event (organizer):**

```typescript
const { mutateAsync } = useUpdateEventCheckinConfigMutation();

await mutateAsync({
  input: {
    eventId: 'evt_123',
    checkinEnabled: true,
    enabledCheckinMethods: ['SELF_MANUAL', 'EVENT_QR', 'USER_QR'],
  },
});
// Auto-generates eventCheckinToken and memberCheckinToken for all JOINED members
```

**2. User self check-in:**

```typescript
const { mutateAsync } = useCheckInSelfMutation();

await mutateAsync({ eventId: 'evt_123' });
// → member.isCheckedIn = true
// → member.checkinMethods = ['SELF_MANUAL']
// → notification sent
```

**3. Organizer checks in member via QR scan:**

```typescript
const { mutateAsync } = useCheckInByUserQrMutation();

await mutateAsync({ token: 'user_qr_token_from_scan' });
// → finds member by token
// → checks in with USER_QR method
```

**4. Block member from self check-in (but allow QR):**

```typescript
const { mutateAsync } = useBlockMemberCheckinMutation();

await mutateAsync({
  input: {
    eventId: 'evt_123',
    memberId: 'mem_456',
    scope: 'METHOD',
    method: 'SELF_MANUAL',
    reason: 'Must check in at entrance',
  },
});
// → member.checkinBlockedMethods = ['SELF_MANUAL']
// → SELF_MANUAL removed from member.checkinMethods
// → notification sent
```

**5. Fetch audit log:**

```typescript
const { data } = useGetEventCheckinLogsQuery({
  variables: {
    eventId: 'evt_123',
    action: 'CHECK_IN',
    limit: 50,
    offset: 0,
  },
});

console.log(data.eventCheckinLogs.logs);
// → array of log entries with actor, member, timestamps
```

#### File Structure

```
apps/api/src/graphql/
├── resolvers/
│   ├── helpers/
│   │   └── checkin.ts          # Business logic (600 lines)
│   ├── mutation/
│   │   └── checkin.ts          # Mutation resolvers (1000 lines)
│   └── query/
│       └── checkin.ts          # Query resolvers (100 lines)

apps/web/src/features/events/
├── api/
│   └── checkin.ts              # React Query hooks (770 lines)
├── components/
│   ├── user-checkin-section.tsx    # User UI
│   ├── event-qr-code.tsx           # Event QR display
│   ├── user-qr-code.tsx            # Personal QR
│   └── qr-scanner-modal.tsx        # Scanner modal

apps/web/src/lib/
├── pdf-export.ts               # PDF generation (350 lines)
└── png-export.ts               # PNG generation (350 lines)

apps/web/src/app/[locale]/event/[id]/manage/
└── checkin/
    └── page.tsx                # Organizer panel
```

#### Best Practices

1. **Always validate permissions** before check-in operations
2. **Use idempotent operations** - safe to retry
3. **Log all actions** for audit trail and debugging
4. **Rotate tokens** if they may be compromised
5. **Block methods** instead of disabling globally when possible
6. **Show reasons to users** when rejecting/blocking (optional)
7. **Export attendance lists** for record-keeping

#### Edge Cases Handled

- ✅ Duplicate check-in attempts (idempotent)
- ✅ Concurrent check-ins (Prisma transactions)
- ✅ Status changes invalidating check-ins
- ✅ Token rotation with active check-ins
- ✅ Method removal while method is active
- ✅ Event deletion/cancellation with check-ins
- ✅ Member leaving after check-in
- ✅ QR code sharing/leaking (rotation)

**See also:**
- `apps/api/CHECKIN_IMPLEMENTATION.md` - Full technical spec
- `apps/api/CHECKIN_QUICKSTART.md` - Integration guide
- `apps/api/VERIFICATION.md` - Verification report

---

### 3. Event Membership

**Membership Lifecycle:**

```
┌─────────────────────────────────────────────────────────┐
│  JOIN MODES DETERMINE FLOW                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  OPEN MODE:                                             │
│    User → joinMember() → JOINED (instant)               │
│                                                          │
│  REQUEST MODE:                                          │
│    User → requestJoinEvent() → PENDING                  │
│      ↓                                                  │
│    Owner/Mod → approve() → JOINED                       │
│      or                                                 │
│    Owner/Mod → reject() → REJECTED                      │
│                                                          │
│  INVITE_ONLY MODE:                                      │
│    Owner/Mod → inviteMember() → INVITED                 │
│      ↓                                                  │
│    User → acceptInvite() → JOINED                       │
│      or                                                 │
│    User → declineInvite() → CANCELLED                   │
│                                                          │
│  WAITLIST (if at capacity):                             │
│    User → joinWaitlistOpen() → WAITLIST                 │
│      ↓ (auto-promoted when space available)            │
│    System → promoteFromWaitlist() → JOINED              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Member Roles:**

- **OWNER**: Full control, cannot leave without transferring ownership
- **MODERATOR**: Can manage members, delete messages, no event edits
- **PARTICIPANT**: Standard member, chat access, can leave anytime

**Member Status Flow:**

```typescript
enum EventMemberStatus {
  PENDING      // Waiting for approval (REQUEST mode)
  INVITED      // Invited by owner/mod (INVITE_ONLY mode)
  JOINED       // Active member
  REJECTED     // Application rejected
  BANNED       // Banned by owner/mod
  LEFT         // User left voluntarily
  KICKED       // Removed by owner/mod
  CANCELLED    // Invitation declined
  WAITLIST     // On waitlist (at capacity)
}
```

**Key Operations:**

1. **Join Operations**
   - `joinMember()` - Join open event
   - `requestJoinEvent()` - Request to join (with optional answers)
   - `acceptInvite()` - Accept invitation
   - `joinWaitlistOpen()` - Join waitlist

2. **Approval Operations** (Owner/Moderator only)
   - `approveJoinRequest()` - Approve pending member
   - `rejectJoinRequest()` - Reject application
   - `inviteMember()` - Send invitation

3. **Removal Operations**
   - `leaveEvent()` - Member leaves voluntarily
   - `kickMember()` - Owner/moderator removes member
   - `banMember()` - Permanent ban
   - `unbanMember()` - Revoke ban

4. **Role Management** (Owner only)
   - `updateMemberRole()` - Promote/demote members
   - `transferOwnership()` - Transfer event ownership

**Permissions Matrix:**

| Operation          | Owner | Moderator | Participant |
| ------------------ | ----- | --------- | ----------- |
| Update event       | ✅    | ❌        | ❌          |
| Delete event       | ✅    | ❌        | ❌          |
| Invite members     | ✅    | ✅        | ❌          |
| Approve/reject     | ✅    | ✅        | ❌          |
| Kick members       | ✅    | ✅        | ❌          |
| Ban members        | ✅    | ✅        | ❌          |
| Delete messages    | ✅    | ✅        | ❌          |
| Update member role | ✅    | ❌        | ❌          |
| Send messages      | ✅    | ✅        | ✅          |
| Leave event        | ❌\*  | ✅        | ✅          |

\*Owner must transfer ownership first

**Resolvers**:

- `mutation/event-members.ts` - All membership operations
- `query/event-members.ts` - Member listing, permissions

---

### 3. Chat System

**Two Chat Types:**

#### 3.1 Event Chat (Group Messaging)

**Features:**

- Group messaging per event
- All JOINED members can participate
- Reply threading support
- Message reactions (emoji)
- Message edit/delete (within time limits)
- Moderation (moderators can delete any message)
- Real-time delivery via subscriptions
- Typing indicators (3s TTL in Redis)

**Rate Limiting:**

- **Send**: 30 messages per 30 seconds
- **Burst**: Max 5 messages in 5 seconds
- **Edit**: 5 edits per minute
- **Delete**: 5 deletions per minute

**Message Lifecycle:**

```typescript
// Creation
sendEventMessage(input: { eventId, content, replyToId?, attachmentKeys? })
  → EventChatMessage

// Modification
editEventMessage(id, newContent)
  → EventChatMessage (with editedAt timestamp)

// Deletion
deleteEventMessage(id)
  → Soft delete (text cleared, deletedAt set)
  → Or hard delete (for owner within grace period)
```

**Permissions:**

- Send: Requires JOINED status
- Edit: Author only, within 15 minutes
- Delete (soft): Author only, anytime
- Delete (hard): Moderators only

#### 3.2 Direct Messages (1-on-1)

**Features:**

- Private messaging between two users
- Thread-based (DmThread entity)
- Reply support
- Message reactions
- Real-time delivery
- Read receipts
- Typing indicators

**Thread Management:**

- Threads created automatically on first message
- Unique pair key: sorted user IDs (`${userA}:${userB}`)
- Prevents duplicate threads

**Privacy:**

- Users can block each other
- Blocked users cannot create new threads
- Existing threads hidden from blocked user

**Rate Limiting:**

- **Send**: 30 messages per 30 seconds
- **Burst**: Max 5 messages in 5 seconds

#### 3.3 Chat Guards & Security

**Permission Checks** (`shared/chat-guards.ts`):

```typescript
// Event Chat
requireEventChatAccess(ctx, eventId)
  → Checks: authenticated, JOINED member, not banned

requireEventChatModerator(ctx, eventId)
  → Checks: authenticated, OWNER or MODERATOR role

// DM
requireDmAccess(ctx, threadId)
  → Checks: authenticated, is thread participant

checkDmAllowed(userId, recipientId)
  → Checks: not blocked, not blocking
```

#### 3.4 Real-Time Updates

**Event Chat Subscription:**

```graphql
subscription OnEventMessage($eventId: ID!) {
  eventMessageAdded(eventId: $eventId) {
    id
    text
    author {
      id
      name
      avatarUrl
    }
    sentAt
    replyTo {
      id
      text
    }
  }
}
```

**DM Subscription:**

```graphql
subscription OnDmMessage($threadId: ID!) {
  dmMessageAdded(threadId: $threadId) {
    id
    text
    sender {
      id
      name
    }
    sentAt
  }
}
```

**Typing Indicators** (`lib/chat-rate-limit.ts`):

```typescript
// Set typing (3s TTL in Redis)
setEventChatTyping(userId, eventId, true)

// Get typing users
getEventChatTypingUsers(eventId) → string[]
```

**Resolvers**:

- `mutation/event-chat.ts` - Event messages
- `mutation/dm.ts` - Direct messages
- `query/event-chat.ts` - Message history
- `query/dm.ts` - Thread history
- `subscription/chat.ts` - Real-time subscriptions

---

### 4. Notifications

**20+ Notification Types:**

**Event Notifications:**

- `EVENT_PUBLISHED` - Event published
- `EVENT_UPDATED` - Event details changed
- `EVENT_CANCELLED` - Event cancelled
- `EVENT_REMINDER` - Reminder before event
- `EVENT_STARTING_SOON` - Event starting in 15min
- `EVENT_INVITATION` - Invited to event

**Membership Notifications:**

- `JOIN_REQUEST_RECEIVED` - New join request
- `JOIN_REQUEST_APPROVED` - Request approved
- `JOIN_REQUEST_REJECTED` - Request rejected
- `MEMBER_JOINED` - New member joined
- `MEMBER_LEFT` - Member left
- `MEMBER_PROMOTED` - Role changed
- `PROMOTED_FROM_WAITLIST` - Moved from waitlist to joined

**Chat Notifications:**

- `EVENT_MESSAGE_MENTION` - Mentioned in chat
- `DM_RECEIVED` - New DM received

**Review Notifications:**

- `REVIEW_RECEIVED` - Event received review
- `REVIEW_REPLY` - Review got reply
- `FEEDBACK_REQUEST` - Request to leave review

**Admin Notifications:**

- `REPORT_RESOLVED` - Report was handled
- `USER_BANNED` - Account banned

**Notification Structure:**

```typescript
interface Notification {
  id: string;
  kind: NotificationKind;
  recipientId: string;
  actorId?: string; // Who triggered it
  referenceId?: string; // Event/Message/Review ID
  text?: string; // Custom message
  readAt?: Date; // Read status
  sentAt: Date;
  entity: NotificationEntity; // EVENT | MESSAGE | REVIEW
}
```

**Notification Delivery:**

1. **In-App** - GraphQL subscription
2. **Email** - Via Resend (batched, configurable)
3. **Push** (planned) - FCM/APNS integration

**Real-Time Subscription:**

```graphql
subscription OnNotification {
  notificationReceived {
    id
    kind
    text
    actor {
      id
      name
    }
    readAt
    sentAt
  }
}
```

**Operations:**

- `markNotificationAsRead(id)` - Mark single as read
- `markAllNotificationsAsRead()` - Mark all as read
- `deleteNotification(id)` - Delete notification

**Resolvers**:

- `mutation/notifications.ts` - Mark read, delete
- `query/notifications.ts` - List, unread count
- `subscription/notifications.ts` - Real-time delivery

---

### 5. Reviews & Ratings

**Post-Event Feedback System:**

**Eligibility:**

- Must have attended event (JOINED status)
- Can review after event ends
- One review per user per event

**Review Components:**

1. **Rating**: 1-5 stars (required)
2. **Text Review**: Detailed feedback (optional)
3. **Feedback Answers**: Responses to custom questions (optional)

**Feedback Questions:**

- Event owners can define custom questions
- Supports multiple question types (planned: text, rating, multiple choice)
- Responses stored separately for privacy

**Review Moderation:**

- Event owner can respond to reviews
- Admin can delete inappropriate reviews
- Reviews can be edited by author (within time limit)

**Aggregate Ratings:**

```typescript
// Event rating calculation
event.averageRating = SUM(reviews.rating) / COUNT(reviews);
event.reviewCount = COUNT(reviews);

// Cached on Event entity for performance
```

**Feedback Request Flow:**

1. Event ends
2. Feedback job queued (1h delay in prod, 5s in dev)
3. Job processes:
   - Find all JOINED members
   - Filter out those who already reviewed
   - Send email to each eligible member
   - Create notification
4. Rate limiting: Max 3 feedback request sends per hour

**Resolvers**:

- `mutation/reviews.ts` - Create, update, delete review
- `mutation/feedback-questions.ts` - Submit feedback, send requests
- `query/reviews.ts` - List reviews, aggregates

---

### 6. User Management

**User Profile:**

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatarKey?: string; // Media key for S3
  role: UserRole; // USER | ADMIN | MODERATOR
  plan: UserPlanKind; // FREE | PLUS | PRO
  locale: string; // Language preference
  timezone: string; // Timezone for events
  verifiedAt?: Date; // Email verification
  deletedAt?: Date; // Soft delete
  lastSeenAt?: Date; // Activity tracking
}
```

**User Features:**

1. **Profile Management**
   - Update name, bio, avatar
   - Change locale/timezone
   - Email verification (planned)

2. **Preferences**
   - Notification settings
   - Privacy settings
   - Blocked users list

3. **Activity Tracking**
   - Last seen updates (`plugins/last-seen.ts`)
   - Event participation history
   - Review history

4. **Social Features**
   - Block/unblock users
   - Follow/favorites (planned)
   - Friend system (planned)

5. **Account Management**
   - Delete account (soft delete)
   - Data export (planned)
   - Account recovery (planned)

**User Roles:**

- **USER**: Standard user
- **ADMIN**: Full system access
- **MODERATOR**: Moderation capabilities

**User Plans** (Billing):

- **FREE**: Basic features
- **PLUS**: Enhanced features
- **PRO**: Premium features

**Resolvers**:

- `mutation/user-profile.ts` - Profile updates
- `mutation/user-blocks.ts` - Block/unblock
- `query/users.ts` - User listing, search
- `query/user-profile.ts` - Profile details

---

### 7. Admin & Moderation

**Admin Capabilities:**

1. **User Management**
   - View all users
   - Ban/unban users
   - Delete users (soft delete)
   - Invite admin users
   - View user activity logs

2. **Event Moderation**
   - Update event visibility
   - Force cancel events
   - Delete events
   - Review reported events

3. **Report Management**
   - View all reports
   - Approve/reject reports
   - Take action (ban, delete content)
   - Track resolution

4. **Content Moderation**
   - Delete messages
   - Delete reviews
   - Ban users from specific events
   - Global user bans

5. **System Monitoring**
   - View queue statistics
   - Monitor background jobs
   - Check system health
   - Access logs

**Report System:**

```typescript
interface Report {
  id: string;
  reporterId: string;
  targetId: string; // User/Event/Message ID
  targetType: ReportTargetType;
  reason: ReportReason; // SPAM | HARASSMENT | INAPPROPRIATE | OTHER
  description?: string;
  status: ReportStatus; // PENDING | APPROVED | REJECTED
  resolvedAt?: Date;
  resolvedBy?: string; // Admin ID
}
```

**Admin Guards:**

```typescript
requireAdmin(ctx) → User | throws FORBIDDEN
isAdminOrModerator(user) → boolean
```

**Resolvers**:

- `mutation/admin-users.ts` - User management
- `mutation/admin-moderation.ts` - Content moderation
- `mutation/reports.ts` - Report creation
- `query/admin-users.ts` - Admin user listing
- `query/reports.ts` - Report listing

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
