# Miglee - Sports Events MVP

A modern monorepo built with pnpm + Turborepo featuring a React frontend and GraphQL API backend.

## 🏗️ Architecture

- **Frontend**: Next.js 15 + React 19 + TailwindCSS 4 + React Query
- **Backend**: Fastify + Mercurius GraphQL + Prisma + PostgreSQL
- **Monorepo**: pnpm workspaces + Turborepo
- **Database**: PostgreSQL 16 with Adminer

## 📁 Project Structure

```
miglee/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Fastify GraphQL API
├── packages/
│   ├── config/       # Shared TypeScript configuration
│   └── contracts/    # GraphQL schema & operations
└── docker/           # PostgreSQL + Adminer
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### Setup

1. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd miglee
   pnpm install
   ```

2. **Start the database**

   ```bash
   pnpm db:up
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example apps/api/.env
   cp .env.example apps/web/.env.local
   ```

4. **Initialize the database**

   ```bash
   pnpm -C apps/api prisma:migrate
   pnpm -C apps/api prisma:generate
   pnpm -C apps/api prisma:seed
   ```

5. **Generate GraphQL types**

   ```bash
   pnpm -C apps/api gql:gen
   pnpm -C apps/web gql:gen
   ```

6. **Start development servers**
   ```bash
   pnpm dev
   ```

### Access Points

- **Frontend**: http://localhost:3000
- **GraphQL API**: http://localhost:4000/graphql
- **GraphQL Playground**: http://localhost:4000/graphql (dev only)
- **Database Admin**: http://localhost:8080 (Adminer)
- **Health Check**: http://localhost:4000/health

## 📋 Available Scripts

### Root Commands

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all applications
- `pnpm typecheck` - Type check all packages
- `pnpm lint` - Lint all packages
- `pnpm gql:gen` - Generate GraphQL types
- `pnpm db:up` - Start database containers
- `pnpm db:down` - Stop database containers

### API Commands

```bash
cd apps/api
pnpm dev              # Start API server
pnpm prisma:studio    # Open Prisma Studio
pnpm prisma:migrate   # Run database migrations
pnpm prisma:seed      # Seed database with test data
```

### Web Commands

```bash
cd apps/web
pnpm dev              # Start Next.js dev server
pnpm build            # Build for production
```

## 🗃️ Database

The application uses PostgreSQL with the following schema:

```sql
model Event {
  id        String   @id @default(cuid())
  title     String
  createdAt DateTime @default(now())
}
```

### Seed Data

The database is seeded with 10 sports events with deterministic dates:

- Anchor date: January 15, 2025, 00:00:00 UTC
- Each event is created 1 day earlier than the previous
- Events are displayed sorted by `createdAt` in descending order

## 🔧 GraphQL API

### Schema

```graphql
scalar DateTime

type Event {
  id: ID!
  title: String!
  createdAt: DateTime!
}

type Query {
  events(limit: Int = 10): [Event!]!
}
```

### Example Query

```graphql
query GetEvents($limit: Int = 10) {
  events(limit: $limit) {
    id
    title
    createdAt
  }
}
```

## 🎨 Frontend Features

- **Responsive Design**: 1/2/3 column grid layout
- **Date Formatting**: Polish locale (dd.mm.yyyy)
- **Loading States**: Proper loading and error handling
- **Type Safety**: Full TypeScript integration with generated types

## 🧪 Acceptance Criteria

- ✅ Homepage renders exactly 10 event cards
- ✅ Events sorted by `createdAt` descending
- ✅ Health check endpoint returns `{ ok: true }`
- ✅ GraphQL `events(limit: 5)` returns 5 records
- ✅ Both frontend and backend codegen succeed
- ✅ Prisma Studio shows 10 seeded Event records
- ✅ Limit parameter clamped between 1-100

## 🛠️ Development

### Code Generation

GraphQL code generation is configured for both frontend and backend:

- **Backend**: Generates resolver types with Prisma mappers
- **Frontend**: Generates React Query hooks and TypeScript types

### Environment Variables

Required environment variables (see `.env.example`):

```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app?schema=public
JWT_SECRET=change-me-please-32chars
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
```

### Database Management

```bash
# View data in Prisma Studio
pnpm -C apps/api prisma:studio

# Reset database
pnpm -C apps/api prisma:migrate reset

# Generate Prisma client
pnpm -C apps/api prisma:generate
```

## 📦 Tech Stack Details

### Frontend Dependencies

- `react@19.1.1` + `react-dom@19.1.1`
- `next@15.4.6`
- `tailwindcss@4.1.12`
- `@tanstack/react-query@5.85.3`
- `graphql-request@7.2.0`

### Backend Dependencies

- `fastify@5.5.0`
- `mercurius@16.2.0`
- `@prisma/client@^5`
- `graphql@16.11.0`
- `zod@^3`

### Development Tools

- `typescript@5.9.2` (pinned across all packages)
- `turbo@^2.3.3`
- `@graphql-codegen/cli@^5`
- ESLint with React, React Hooks, and Import plugins

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 4000, 5432, and 8080 are available
2. **Database connection**: Verify PostgreSQL is running via `pnpm db:up`
3. **GraphQL generation**: Run `pnpm gql:gen` after schema changes
4. **Prisma sync**: Run `pnpm -C apps/api prisma:generate` after schema updates

### Reset Everything

```bash
pnpm db:down
pnpm db:up
pnpm -C apps/api prisma:migrate reset
pnpm -C apps/api prisma:seed
pnpm gql:gen
pnpm dev
```

# AIzaSyDcpZpIdRTzPiM8-Q64WuB2AsUNtWJSHVo - place api
