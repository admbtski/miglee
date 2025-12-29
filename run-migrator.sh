docker run --rm \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/app" \
  appname-migrator