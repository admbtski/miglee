# Przewodnik dla Deweloperów

## Rozpoczęcie Pracy

### Wymagania Wstępne

- **Node.js** >= 22.18.0
- **pnpm** >= 10.14.0
- **PostgreSQL** 14+ z PostGIS
- **Redis** 7+
- **Docker** (opcjonalnie, dla lokalnej bazy danych)

### Instalacja

```bash
# Sklonuj repozytorium
git clone <repository-url>
cd miglee

# Zainstaluj zależności
pnpm install

# Skonfiguruj zmienne środowiskowe
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Uruchom bazę danych (Docker)
pnpm db:up

# Uruchom migracje
cd apps/api
pnpm prisma:migrate dev

# (Opcjonalnie) Seed bazy danych
pnpm prisma:seed
```

### Uruchomienie

```bash
# Uruchom wszystkie aplikacje
pnpm dev

# Lub osobno:
# Terminal 1 - API
cd apps/api && pnpm dev

# Terminal 2 - Web
cd apps/web && pnpm dev
```

## Struktura Kodu

### Backend (API)

#### Tworzenie Nowego Resolvera

1. **Query Resolver:**

```typescript
// apps/api/src/graphql/resolvers/query/my-feature.ts
import { QueryResolvers } from '../../__generated__/codegen';

export const myFeatureQuery: QueryResolvers['myFeature'] = async (
  _parent,
  args,
  context
) => {
  // Sprawdź autentykację
  const user = context.user;
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Logika biznesowa
  const result = await context.prisma.myModel.findMany({
    where: { userId: user.id },
  });

  return result;
};
```

2. **Mutation Resolver:**

```typescript
// apps/api/src/graphql/resolvers/mutation/my-feature.ts
import { MutationResolvers } from '../../__generated__/codegen';
import { z } from 'zod';

const createMyFeatureInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const createMyFeature: MutationResolvers['createMyFeature'] = async (
  _parent,
  args,
  context
) => {
  const user = context.user;
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Walidacja
  const input = createMyFeatureInputSchema.parse(args.input);

  // Logika biznesowa
  const result = await context.prisma.myModel.create({
    data: {
      ...input,
      userId: user.id,
    },
  });

  return result;
};
```

3. **Rejestracja w index.ts:**

```typescript
// apps/api/src/graphql/resolvers/query/index.ts
import { myFeatureQuery } from './my-feature';

export const queryResolvers = {
  // ... inne resolvers
  myFeature: myFeatureQuery,
};
```

#### Tworzenie Nowego Pluginu Fastify

```typescript
// apps/api/src/plugins/my-plugin.ts
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const myPlugin: FastifyPluginAsync = async (fastify) => {
  // Dekorator
  fastify.decorate('myFeature', {
    doSomething: () => {
      // ...
    },
  });

  // Hook
  fastify.addHook('onRequest', async (request) => {
    // ...
  });
};

export default fp(myPlugin, {
  name: 'my-plugin',
});

// apps/api/src/server.ts
await server.register(myPlugin);
```

### Frontend (Web)

#### Tworzenie Nowej Strony

```typescript
// apps/web/src/app/[locale]/my-page/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Page',
};

export default function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
    </div>
  );
}
```

#### Tworzenie Nowego Komponentu

```typescript
// apps/web/src/components/my-component.tsx
'use client'; // Jeśli potrzebujesz interaktywności

interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <div>
      <h2>{title}</h2>
      {onClick && <button onClick={onClick}>Click me</button>}
    </div>
  );
}
```

#### Używanie GraphQL Query

```typescript
// apps/web/src/features/my-feature/hooks/use-my-data.ts
import { useQuery } from '@tanstack/react-query';
import { request } from 'graphql-request';
import { graphql } from '@/lib/api/generated';

const GET_MY_DATA = graphql(`
  query GetMyData {
    myData {
      id
      name
    }
  }
`);

export function useMyData() {
  return useQuery({
    queryKey: ['myData'],
    queryFn: () => request('/api/graphql', GET_MY_DATA),
  });
}
```

#### Używanie GraphQL Mutation

```typescript
// apps/web/src/features/my-feature/hooks/use-create-data.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from 'graphql-request';
import { graphql } from '@/lib/api/generated';

const CREATE_MY_DATA = graphql(`
  mutation CreateMyData($input: CreateMyDataInput!) {
    createMyData(input: $input) {
      id
      name
    }
  }
`);

export function useCreateMyData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string }) =>
      request('/api/graphql', CREATE_MY_DATA, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myData'] });
    },
  });
}
```

## Konwencje Kodowania

### TypeScript

- **Używaj typów zamiast interfejsów** dla prostych obiektów
- **Eksportuj typy** z plików `types.ts`
- **Używaj `const` assertions** gdzie możliwe
- **Unikaj `any`** - używaj `unknown` jeśli potrzebujesz

### Naming Conventions

- **Komponenty:** PascalCase (`MyComponent.tsx`)
- **Hooks:** camelCase z prefiksem `use` (`useMyData.ts`)
- **Utilities:** camelCase (`formatDate.ts`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_ITEMS`)
- **Types:** PascalCase (`UserData`)

### Struktura Plików

```
feature/
├── components/        # Komponenty specyficzne dla feature
├── hooks/            # Custom hooks
├── lib/              # Utilities
├── types.ts          # TypeScript types
└── index.ts          # Public exports
```

## Testowanie

### Backend Tests

```typescript
// apps/api/src/__tests__/my-feature.test.ts
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Frontend Tests

```typescript
// apps/web/src/__tests__/my-component.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/my-component';

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Debugging

### Backend

```typescript
// Używaj loggera
import { logger } from './lib/pino';

logger.info({ data }, 'Log message');
logger.error({ err }, 'Error message');
```

### Frontend

```typescript
// React DevTools
// TanStack Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// W komponencie
<ReactQueryDevtools initialIsOpen={false} />
```

## Git Workflow

### Branch Strategy

- `main` - Production branch
- `develop` - Development branch
- `feature/feature-name` - Feature branches
- `fix/bug-name` - Bug fix branches

### Commit Messages

Używaj konwencjonalnych commitów:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### Pull Requests

1. Stwórz branch z `develop`
2. Wprowadź zmiany
3. Utwórz PR z opisem zmian
4. Oczekuj na code review
5. Po approval, merge do `develop`

## Performance

### Backend Optimization

- **Używaj DataLoader** dla batch loading
- **Dodawaj indeksy** do bazy danych
- **Cache** często używane zapytania
- **Pagination** dla dużych list

### Frontend Optimization

- **Code Splitting** - Dynamic imports
- **Image Optimization** - Next.js Image component
- **Memoization** - React.memo, useMemo, useCallback
- **Virtual Scrolling** - Dla długich list

## Bezpieczeństwo

### Backend

- **Walidacja Inputów** - Zawsze waliduj z Zod
- **Autoryzacja** - Sprawdzaj uprawnienia w resolvers
- **Rate Limiting** - Ochrona przed abuse
- **SQL Injection** - Używaj Prisma (parametryzowane zapytania)

### Frontend

- **XSS Protection** - Sanityzuj user input
- **CSRF Protection** - Next.js ma wbudowaną ochronę
- **Sensitive Data** - Nie przechowuj w localStorage

## Troubleshooting

### Problem: Baza danych nie łączy się

```bash
# Sprawdź czy PostgreSQL działa
docker ps

# Sprawdź DATABASE_URL w .env
# Uruchom ponownie
pnpm db:down && pnpm db:up
```

### Problem: GraphQL types nie są aktualizowane

```bash
# Wygeneruj typy
pnpm gql:gen

# W obu aplikacjach
cd apps/api && pnpm gql:gen
cd apps/web && pnpm gql:gen
```

### Problem: Port już w użyciu

```bash
# Zmień port w .env
PORT=4001  # dla API
# lub
# Zmień port w next.config.ts dla Web
```

## Przydatne Komendy

```bash
# Database
pnpm db:up              # Uruchom PostgreSQL
pnpm db:down            # Zatrzymaj PostgreSQL
pnpm db:logs            # Logi PostgreSQL
pnpm prisma:studio      # Prisma Studio GUI

# Development
pnpm dev                # Uruchom wszystko
pnpm build              # Build wszystkiego
pnpm typecheck          # Sprawdź typy
pnpm lint               # Lint kodu

# GraphQL
pnpm gql:gen            # Generuj typy GraphQL

# Cleanup
pnpm clean              # Wyczyść build artifacts
```

## Zasoby

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [GraphQL Docs](https://graphql.org/learn/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Fastify Docs](https://www.fastify.io/docs/latest/)
