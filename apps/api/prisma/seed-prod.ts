/* eslint-disable no-console */
/**
 * Production Seed
 *
 * Minimalne dane wymagane do uruchomienia produkcji:
 * - Kategorie
 * - Tagi
 * - 1 Admin
 * - 3 Moderatorów
 *
 * Usage:
 *   pnpm prisma:seed:prod
 */

import { PrismaClient, Role, Prisma } from '../src/prisma-client/client';
import { CATEGORY_DEFS, TAGS } from './constants';

const prisma = new PrismaClient();

// =============================================================================
// Production Users (to be configured via environment variables)
// =============================================================================

interface ProdUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

const PROD_USERS: ProdUser[] = [
  // Admin
  {
    id: 'u_admin_prod_0000000001',
    email: process.env.ADMIN_EMAIL || 'admin@appname.pl',
    name: process.env.ADMIN_NAME || 'admin_appname',
    role: Role.ADMIN,
  },
  // Moderators
  {
    id: 'u_mod_prod_00000000001',
    email: process.env.MOD1_EMAIL || 'moderator1@appname.pl',
    name: process.env.MOD1_NAME || 'mod_pierwszy',
    role: Role.MODERATOR,
  },
  {
    id: 'u_mod_prod_00000000002',
    email: process.env.MOD2_EMAIL || 'moderator2@appname.pl',
    name: process.env.MOD2_NAME || 'mod_drugi',
    role: Role.MODERATOR,
  },
  {
    id: 'u_mod_prod_00000000003',
    email: process.env.MOD3_EMAIL || 'moderator3@appname.pl',
    name: process.env.MOD3_NAME || 'mod_trzeci',
    role: Role.MODERATOR,
  },
];

// =============================================================================
// Helpers
// =============================================================================

const namesJson = (
  pl: string,
  de: string,
  en: string
): Prisma.InputJsonObject => ({
  pl,
  de,
  en,
});

// =============================================================================
// Seed Functions
// =============================================================================

async function seedCategories() {
  console.log('📂 Seeding categories...');

  for (const cat of CATEGORY_DEFS) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        names: namesJson(cat.pl, cat.de, cat.en),
      },
      create: {
        slug: cat.slug,
        names: namesJson(cat.pl, cat.de, cat.en),
      },
    });
  }

  console.log(`   ✅ ${CATEGORY_DEFS.length} categories`);
}

async function seedTags() {
  console.log('🏷️  Seeding tags...');

  for (const label of TAGS) {
    const slug = label.replace(/\s+/g, '-').toLowerCase();
    await prisma.tag.upsert({
      where: { slug },
      update: { label },
      create: { slug, label },
    });
  }

  console.log(`   ✅ ${TAGS.length} tags`);
}

async function seedUsers() {
  console.log('👤 Seeding production users...');

  for (const user of PROD_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verifiedAt: new Date(), // Production users are pre-verified
      },
    });

    const roleEmoji = user.role === Role.ADMIN ? '👑' : '🛡️';
    console.log(`   ${roleEmoji} ${user.role}: ${user.email} (@${user.name})`);
  }

  console.log(`   ✅ ${PROD_USERS.length} users`);
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('');
  console.log('🚀 Starting PRODUCTION seed...');
  console.log('================================');
  console.log('');

  await seedCategories();
  await seedTags();
  await seedUsers();

  console.log('');
  console.log('================================');
  console.log('✅ Production seed completed!');
  console.log('');
  console.log('📝 Konfiguracja użytkowników (opcjonalne env vars):');
  console.log('   ADMIN_EMAIL, ADMIN_NAME');
  console.log('   MOD1_EMAIL, MOD1_NAME');
  console.log('   MOD2_EMAIL, MOD2_NAME');
  console.log('   MOD3_EMAIL, MOD3_NAME');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
