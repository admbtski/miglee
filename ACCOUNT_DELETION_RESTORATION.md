# Account Deletion & Restoration Guide

## Overview

Miglee implements **soft delete** for user accounts. When a user deletes their account:

- The `deletedAt` timestamp is set to the current time
- An optional `deletedReason` is stored
- The user's data remains in the database but is **not accessible** through the normal application flow

## Soft Delete Implementation

### Database Schema

```prisma
model User {
  // ... other fields ...
  deletedAt        DateTime? // Soft delete timestamp
  deletedReason    String? // Reason for account deletion
  // ... other fields ...
}
```

### GraphQL Mutation

```graphql
mutation DeleteMyAccount($reason: String) {
  deleteMyAccount(reason: $reason)
}
```

### Backend Resolver

Located at: `apps/api/src/graphql/resolvers/mutation/delete-my-account.ts`

The resolver:

1. Checks authentication
2. Sets `deletedAt` to current timestamp
3. Stores optional `deletedReason`
4. Logs the deletion event

## User Experience

1. User goes to `/account/settings`
2. Scrolls to "Delete Account" section (red bordered)
3. Clicks "Delete Account" button
4. Modal opens with:
   - Warning message
   - Optional reason field
   - Confirmation input (must type "DELETE" / "USUŃ" / "LÖSCHEN")
5. After confirmation:
   - Account marked for deletion
   - Success toast shown
   - User redirected to homepage after 2 seconds

## Account Restoration

### Option 1: Manual Admin Restoration (Recommended for MVP)

**For administrators via Prisma Studio or direct database access:**

```sql
-- Restore a deleted account
UPDATE users
SET
  "deletedAt" = NULL,
  "deletedReason" = NULL
WHERE id = 'user_id_here'
AND "deletedAt" IS NOT NULL;
```

**For administrators via GraphQL (requires admin resolver):**

Create a new admin mutation in `schema.graphql`:

```graphql
# Admin - User Management
adminRestoreUser(id: ID!): User!
```

Create resolver at `apps/api/src/graphql/resolvers/mutation/admin-users.ts`:

```typescript
export const adminRestoreUserMutation: MutationResolvers['adminRestoreUser'] =
  async (_parent, args, ctx) => {
    const { session } = ctx;

    if (!session?.userId) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (admin?.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    const { id } = args;

    // Restore user account
    const restored = await prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedReason: null,
      },
    });

    logger.info(
      {
        userId: id,
        adminId: session.userId,
      },
      'User account restored by admin'
    );

    return mapUser(restored);
  };
```

Add to `apps/api/src/graphql/resolvers/mutation/index.ts`:

```typescript
export const Mutation: Resolvers['Mutation'] = {
  // ... existing mutations ...

  // ---- Admin User Management ----
  adminRestoreUser: adminRestoreUserMutation,
  // ...
};
```

### Option 2: Self-Service Restoration (Advanced)

For a more sophisticated approach, allow users to restore their own accounts within a grace period (e.g., 30 days):

#### Backend Implementation

1. **Create restoration mutation** (`schema.graphql`):

```graphql
type Mutation {
  restoreMyAccount(email: String!, token: String!): Boolean!
  requestAccountRestoration(email: String!): Boolean!
}
```

2. **Create restoration resolver** (`apps/api/src/graphql/resolvers/mutation/restore-my-account.ts`):

```typescript
import { MutationResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/pino';
import crypto from 'crypto';

const GRACE_PERIOD_DAYS = 30;

export const requestAccountRestorationMutation: MutationResolvers['requestAccountRestoration'] =
  async (_parent, args) => {
    const { email } = args;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.deletedAt) {
      // Don't reveal if account exists
      return true;
    }

    const daysSinceDeletion = Math.floor(
      (Date.now() - user.deletedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDeletion > GRACE_PERIOD_DAYS) {
      logger.warn(
        { userId: user.id, daysSinceDeletion },
        'Account restoration requested but grace period expired'
      );
      return false;
    }

    // Generate restoration token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token (you'll need to add these fields to User model)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        restorationToken: token,
        restorationTokenExpiry: tokenExpiry,
      },
    });

    // Send restoration email
    // TODO: Implement email sending
    logger.info({ userId: user.id, token }, 'Account restoration requested');

    return true;
  };

export const restoreMyAccountMutation: MutationResolvers['restoreMyAccount'] =
  async (_parent, args) => {
    const { email, token } = args;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.deletedAt || !user.restorationToken) {
      throw new Error('Invalid restoration request');
    }

    if (
      user.restorationToken !== token ||
      !user.restorationTokenExpiry ||
      user.restorationTokenExpiry < new Date()
    ) {
      throw new Error('Invalid or expired restoration token');
    }

    const daysSinceDeletion = Math.floor(
      (Date.now() - user.deletedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDeletion > GRACE_PERIOD_DAYS) {
      throw new Error('Grace period expired');
    }

    // Restore account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt: null,
        deletedReason: null,
        restorationToken: null,
        restorationTokenExpiry: null,
      },
    });

    logger.info({ userId: user.id }, 'User account restored via self-service');

    return true;
  };
```

3. **Update User model** (`prisma/schema.prisma`):

```prisma
model User {
  // ... existing fields ...
  deletedAt              DateTime?
  deletedReason          String?
  restorationToken       String? // Token for self-service restoration
  restorationTokenExpiry DateTime? // Expiry for restoration token
  // ... existing fields ...
}
```

4. **Create migration**:

```bash
pnpm prisma migrate dev --name add_restoration_tokens
```

#### Frontend Implementation

1. **Create restoration page** (`apps/web/src/app/[locale]/restore-account/page.tsx`):

```typescript
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useRestoreMyAccountMutation, useRequestAccountRestorationMutation } from '@/lib/api/user-restoration';

export default function RestoreAccountPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');

  const requestRestoration = useRequestAccountRestorationMutation();
  const restoreAccount = useRestoreMyAccountMutation();

  const handleRequestRestoration = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await requestRestoration.mutateAsync({ email });
      toast.success('If your account exists, you will receive an email with restoration instructions.');
    } catch (error) {
      toast.error('Failed to request account restoration');
    }
  };

  const handleRestoreAccount = async () => {
    if (!token || !email) {
      toast.error('Invalid restoration link');
      return;
    }

    try {
      await restoreAccount.mutateAsync({ email, token });
      toast.success('Your account has been restored! You can now log in.');
      // Redirect to login
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      toast.error('Failed to restore account. The link may have expired.');
    }
  };

  // If token present, auto-restore
  if (token && email) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6">
        <h1 className="text-2xl font-bold mb-4">Restore Your Account</h1>
        <p className="text-zinc-600 mb-6">
          Click below to restore your account.
        </p>
        <button
          onClick={handleRestoreAccount}
          disabled={restoreAccount.isPending}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {restoreAccount.isPending ? 'Restoring...' : 'Restore My Account'}
        </button>
      </div>
    );
  }

  // Request restoration form
  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold mb-4">Restore Your Account</h1>
      <p className="text-zinc-600 mb-6">
        Enter your email address to receive a restoration link.
      </p>
      <form onSubmit={handleRequestRestoration} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-4 py-3 border rounded-lg"
          required
        />
        <button
          type="submit"
          disabled={requestRestoration.isPending}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {requestRestoration.isPending ? 'Sending...' : 'Send Restoration Link'}
        </button>
      </form>
    </div>
  );
}
```

## Filtering Deleted Users

To ensure deleted users don't appear in the application, add a filter to all user queries:

### Example for Intents Query

```typescript
const intents = await prisma.intent.findMany({
  where: {
    // ... other conditions ...
    owner: {
      deletedAt: null, // ✅ Only show intents from non-deleted users
    },
  },
});
```

### Global Prisma Middleware (Optional)

Add middleware to automatically filter deleted users:

```typescript
// apps/api/src/lib/prisma.ts

import { Prisma } from '@prisma/client';

prisma.$use(async (params, next) => {
  // Auto-filter deleted users for all queries
  if (params.model === 'User') {
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      };
    }
    if (params.action === 'findMany') {
      if (params.args.where) {
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null;
        }
      } else {
        params.args.where = { deletedAt: null };
      }
    }
  }

  return next(params);
});
```

## Automated Cleanup (Optional)

For permanent deletion after grace period:

```typescript
// apps/api/src/workers/cleanup-deleted-accounts.ts

import { prisma } from '../lib/prisma';
import { logger } from '../lib/pino';

const PERMANENT_DELETE_AFTER_DAYS = 30;

export async function cleanupDeletedAccounts() {
  const cutoffDate = new Date(
    Date.now() - PERMANENT_DELETE_AFTER_DAYS * 24 * 60 * 60 * 1000
  );

  const deletedUsers = await prisma.user.findMany({
    where: {
      deletedAt: {
        lte: cutoffDate,
      },
    },
  });

  for (const user of deletedUsers) {
    // Anonymize or permanently delete
    await prisma.user.delete({
      where: { id: user.id },
    });

    logger.info(
      { userId: user.id, deletedAt: user.deletedAt },
      'Permanently deleted user account after grace period'
    );
  }

  logger.info({ count: deletedUsers.length }, 'Cleanup job completed');
}

// Schedule to run daily
// Use a cron job or similar scheduler
```

## Summary

**Current Implementation:**

- ✅ Soft delete (sets `deletedAt` + `deletedReason`)
- ✅ User-friendly modal with confirmation
- ✅ Multilingual support

**Restoration Options:**

1. **Manual (Recommended for MVP)**: Admin restores via Prisma Studio or SQL
2. **Admin Panel**: Admin mutation to restore accounts
3. **Self-Service (Advanced)**: Email-based restoration within grace period

Choose based on your product requirements and team resources.
