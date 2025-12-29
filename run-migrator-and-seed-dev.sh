docker run --rm \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/app" \
  appname-migrator \
  sh -c "npx prisma migrate deploy && pnpm prisma:seed:prod"