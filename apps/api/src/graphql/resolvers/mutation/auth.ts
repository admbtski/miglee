// apps/api/src/graphql/resolvers/auth.ts
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type {
  MutationResolvers,
  Role,
} from '../../__generated__/resolvers-types';

function slugify(s: string) {
  return (
    s
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'user'
  );
}

async function ensureDevUserByName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Name is required');

  // 1) try exact name match first (DEV convenience)
  const existing = await prisma.user.findFirst({
    where: { name: trimmed },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing;

  // 2) create a new user with a synthetic email
  const base = slugify(trimmed);
  let email = `dev+${base}@example.local`;
  // avoid unique collisions on email
  for (let i = 1; ; i++) {
    try {
      return await prisma.user.create({
        data: {
          email,
          name: trimmed,
          role: 'USER' as Role,
          imageUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
            base
          )}`,
          verifiedAt: new Date(),
        },
      });
    } catch (e: any) {
      // Prisma unique constraint → try next email variant
      if (e?.code === 'P2002') {
        email = `dev+${base}+${i}@example.local`;
        continue;
      }
      throw e;
    }
  }
}

export const devLoginMutation: MutationResolvers['devLogin'] =
  resolverWithMetrics('Mutation', 'devLogin', async (_p, { name }) => {
    const u = await ensureDevUserByName(name);

    return {
      id: u.id!,
      name: u.name!,
      imageUrl: u.imageUrl!,
      role: (u.role ?? 'USER') as Role,
      verifiedAt: u.verifiedAt,
      email: u.email,
    };
  });

export const devLogoutMutation: MutationResolvers['devLogout'] =
  resolverWithMetrics('Mutation', 'devLogout', async () => true);
