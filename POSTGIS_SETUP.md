# PostGIS Setup Guide

## Problem

Migracja wymaga rozszerzenia PostGIS, którego standardowy obraz PostgreSQL nie zawiera.

## Rozwiązanie

### 1. Zatrzymaj obecny kontener PostgreSQL

```bash
cd docker
docker compose -f docker-compose.dev.yml down
```

### 2. Usuń stary volume (OPCJONALNIE - tylko jeśli chcesz wyczyścić dane)

```bash
# UWAGA: To usunie wszystkie dane w bazie!
docker volume rm miglee_dbdata
```

Jeśli NIE chcesz tracić danych, pomiń ten krok - PostGIS zainstaluje się na istniejącej bazie.

### 3. Uruchom nowy kontener z PostGIS

```bash
docker compose -f docker-compose.dev.yml up -d db
```

Poczekaj aż kontener się uruchomi (sprawdź healthcheck):

```bash
docker compose -f docker-compose.dev.yml ps
```

### 4. Uruchom migracje

```bash
cd ../apps/api
pnpm prisma migrate reset
# lub jeśli baza już ma dane:
pnpm prisma migrate deploy
```

### 5. (Opcjonalnie) Uruchom pozostałe serwisy

```bash
cd ../../docker
docker compose -f docker-compose.dev.yml up -d
```

## Weryfikacja

Sprawdź, czy PostGIS jest dostępne:

```bash
docker exec -it miglee-db-1 psql -U postgres -d app -c "SELECT PostGIS_Version();"
```

Powinno zwrócić wersję PostGIS (np. "3.4.x").

## Co się zmieniło?

W `docker/docker-compose.dev.yml`:

```yaml
# Przed:
image: postgres:16

# Po:
image: postgis/postgis:16-3.4
```

Obraz `postgis/postgis:16-3.4` to oficjalny obraz PostgreSQL 16 z preinstalowanym PostGIS 3.4.

## Troubleshooting

### Problem: "port 5432 already in use"

```bash
# Sprawdź co używa portu
lsof -i :5432

# Zatrzymaj stary kontener
docker compose -f docker-compose.dev.yml down
```

### Problem: "extension already exists"

To nie jest problem - oznacza, że PostGIS był już włączony. Możesz kontynuować.

### Problem: Stracone dane po `docker volume rm`

Niestety, dane są nieodwracalnie usunięte. Musisz uruchomić `pnpm prisma migrate reset` i zeseedować dane na nowo.
