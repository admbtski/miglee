#!/bin/sh
set -eu

echo "[migrator] Starting migration process..."
echo "[migrator] DATABASE_URL is set: ${DATABASE_URL:+yes}"

# Run migrations
echo "[migrator] Running prisma migrate deploy..."
./node_modules/.bin/prisma migrate deploy

# Optional seeding
if [ "${RUN_SEED:-0}" = "1" ]; then
  SEED_TYPE="${SEED_TYPE:-prod}"
  echo "[migrator] RUN_SEED=1, SEED_TYPE=${SEED_TYPE} -> seeding..."
  
  if [ "$SEED_TYPE" = "dev" ]; then
    echo "[migrator] Running dev seed..."
    pnpm prisma:seed:dev
  else
    echo "[migrator] Running prod seed..."
    pnpm prisma:seed:prod
  fi
else
  echo "[migrator] RUN_SEED!=1 -> skipping seed"
fi

echo "[migrator] Done!"

