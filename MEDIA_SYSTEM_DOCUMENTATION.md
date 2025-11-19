# 📸 Media System - Dokumentacja Implementacji

## 🎯 Cel projektu

Zaprojektowanie i zaimplementowanie kompletnego systemu zarządzania mediami (obrazami) dla aplikacji Miglee z następującymi funkcjonalnościami:

- Presigned upload (bezpośredni upload do S3 lub lokalny endpoint)
- On-demand generowanie wariantów obrazów (różne rozmiary)
- Cache wariantów (dysk lokalny / S3)
- Model `MediaAsset` w bazie danych
- Obsługa avatarów użytkowników, coverów profili i coverów Intentów

---

## 🏗️ Architektura systemu

### 1. **Warstwa danych (Prisma)**

#### Model `MediaAsset`

```prisma
model MediaAsset {
  id        String   @id @default(cuid())
  key       String   @unique
  blurhash  String?
  width     Int?
  height    Int?
  mimeType  String?
  ownerId   String?
  purpose   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([ownerId])
  @@index([purpose])
  @@index([createdAt])
  @@map("media_assets")
}
```

#### Aktualizacje istniejących modeli

- **User**: `imageUrl` → `avatarKey: String?`
- **UserProfile**: `coverUrl` → `coverKey: String?`
- **Intent**: dodano `coverKey: String?`

**Migracja**: `apps/api/prisma/migrations/20251119030000_add_media_assets_and_keys/migration.sql`

---

### 2. **Warstwa storage (abstrakcja)**

#### Interfejs `MediaStorage`

```typescript
export interface MediaStorage {
  saveOriginal(params: {
    key: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<{ key: string; url: string }>;

  getOriginalStream(key: string): Promise<NodeJS.ReadableStream | null>;

  saveVariant(params: {
    originalKey: string;
    variantKey: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<{ key: string; url: string }>;

  getVariantStream(
    originalKey: string,
    variantKey: string
  ): Promise<NodeJS.ReadableStream | null>;

  deleteOriginalAndVariants?(key: string): Promise<void>;

  generatePresignedUploadUrl?(params: {
    key: string;
    mimeType: string;
    maxSizeBytes?: number;
  }): Promise<{ uploadUrl: string; key: string }>;
}
```

#### Implementacje

**LocalMediaStorage** (`apps/api/src/lib/media/local-storage.ts`)

- Przechowuje pliki w systemie plików
- Oryginały: `${UPLOADS_PATH}/original/{key}.webp`
- Warianty: `${UPLOADS_PATH}/cache/{originalKey}/{variantKey}.webp`

**S3MediaStorage** (`apps/api/src/lib/media/s3-storage.ts`)

- Przechowuje pliki w S3-compatible storage
- Oryginały: `s3://bucket/original/{key}`
- Warianty: `s3://bucket/variants/{originalKey}/{variantKey}`
- Generuje presigned URLs dla bezpośredniego uploadu

**Factory**: `getMediaStorage()` zwraca odpowiednią implementację na podstawie `MEDIA_STORAGE_PROVIDER`

---

### 3. **Przetwarzanie obrazów (Sharp)**

#### `processOriginalImage()`

```typescript
export async function processOriginalImage(
  inputBuffer: Buffer,
  opts: ProcessOriginalOptions
): Promise<ProcessedOriginal>;
```

**Funkcjonalności:**

- Automatyczna rotacja (EXIF orientation)
- Usunięcie metadanych (privacy)
- Resize do max szerokości/wysokości (zachowanie proporcji)
- Konwersja do WebP/AVIF
- Generowanie blurhash (placeholder)

#### `processImageVariant()`

```typescript
export async function processImageVariant(
  inputBuffer: Buffer,
  opts: VariantOptions
): Promise<{ buffer: Buffer; width: number; height: number; mimeType: string }>;
```

**Funkcjonalności:**

- Resize/crop do określonych wymiarów
- Różne tryby dopasowania (cover, contain, inside)
- Konwersja formatu (webp, jpeg)
- Kontrola jakości

**Pliki:**

- `apps/api/src/lib/media/image-processing.ts`

---

### 4. **Warstwa logiki biznesowej**

#### `media-service.ts`

**`createMediaAssetFromUpload()`**

```typescript
export async function createMediaAssetFromUpload(params: {
  ownerId?: string | null;
  purpose: MediaPurpose;
  tempBuffer: Buffer;
}): Promise<{
  mediaAssetId: string;
  key: string;
  blurhash: string | null;
  width: number;
  height: number;
}>;
```

**Odpowiedzialność:**

Ta funkcja **nie zajmuje się** pobieraniem pliku z tymczasowego storage (LOCAL `/tmp/uploads` lub S3 `uploadKey`).
Dostaje już **raw buffer** z tymczasowego pliku i wykonuje:

**Proces:**

1. **Walidacja obrazu** (`validateImage()`) - sprawdzenie czy to poprawny obraz
2. **Przetworzenie** przez `processOriginalImage()`:
   - Resize do max wymiarów (IMAGE_MAX_WIDTH/HEIGHT)
   - Konwersja do WebP/AVIF
   - Usunięcie metadanych (privacy)
   - Generowanie blurhash
3. **Generowanie finalnego `mediaKey`** przez `buildMediaKey({ purpose, ownerId })`
   - Np. `avatars/{userId}/{cuid}`, `covers/intents/{intentId}/{cuid}`
4. **Zapis przetworzonego oryginału** do storage przez `saveOriginal({ key: mediaKey, buffer })`
5. **Utworzenie rekordu `MediaAsset`** w bazie z `key = mediaKey`
6. **Zwrócenie metadanych** (`mediaAssetId`, `key`, `blurhash`, `width`, `height`)

**Uwaga:** Wywołujący (np. `confirmMediaUpload`) jest odpowiedzialny za:

- Odczyt surowego pliku z `uploadKey` (dysk lub S3)
- Przekazanie buffera do tej funkcji
- Usunięcie tymczasowego pliku po sukcesie

**`buildMediaKey()`**

```typescript
export function buildMediaKey(params: {
  purpose: MediaPurpose;
  ownerId?: string | null;
}): string;
```

**Generuje klucze:**

- `USER_AVATAR`: `avatars/{userId}/{cuid}`
- `USER_COVER`: `covers/users/{userId}/{cuid}`
- `INTENT_COVER`: `covers/intents/{intentId}/{cuid}`
- `GALLERY_IMAGE`: `gallery/{ownerId}/{cuid}`

**`deleteMediaAsset()`**

- Usuwa plik ze storage (oryginał + warianty)
- Usuwa rekord z bazy danych

**Plik:** `apps/api/src/lib/media/media-service.ts`

---

### 5. **GraphQL API**

#### Schema

```graphql
enum MediaPurpose {
  USER_AVATAR
  USER_COVER
  INTENT_COVER
  GALLERY_IMAGE
}

type PresignedUpload {
  uploadUrl: String!
  uploadKey: String! # tymczasowy klucz uploadu (tmp/uploads/...)
  provider: String!
}

type Mutation {
  # Krok 1: Wygeneruj tymczasowy uploadKey i URL do uploadu
  getUploadUrl(purpose: MediaPurpose!, entityId: ID!): PresignedUpload!

  # Krok 2: Potwierdź upload, przetwórz i zapisz jako MediaAsset
  confirmMediaUpload(
    purpose: MediaPurpose!
    entityId: ID!
    uploadKey: String!
  ): Boolean!
}

type User {
  id: ID!
  name: String!
  avatarKey: String
}

type UserProfile {
  id: ID!
  userId: ID!
  coverKey: String
}

type Intent {
  id: ID!
  title: String!
  coverKey: String
}
```

#### Resolvers

**`getUploadUrl`** (`apps/api/src/graphql/resolvers/mutation/media.ts`)

**Proces:**

1. Walidacja autoryzacji (sprawdzenie `purpose` i `entityId`)
2. Generowanie tymczasowego `uploadKey` (np. `tmp/uploads/{cuid}`)
3. Zwrócenie URL do uploadu

**LOCAL storage:**

```typescript
const uploadKey = `tmp/uploads/${cuid()}`;
return {
  uploadUrl: `http://localhost:4000/api/upload/local?uploadKey=${uploadKey}`,
  uploadKey: uploadKey,
  provider: 'LOCAL',
};
```

**S3 storage:**

```typescript
const uploadKey = `tmp/uploads/${cuid()}`;
const presignedUrl = await s3.generatePresignedUploadUrl({
  key: uploadKey,
  mimeType: 'image/webp',
  maxSizeBytes: 10 * 1024 * 1024,
});
return {
  uploadUrl: presignedUrl,
  uploadKey: uploadKey,
  provider: 'S3',
};
```

**Uwagi:**

- `entityId` jest obowiązkowe dla wszystkich `purpose`
- Dla `USER_AVATAR` i `USER_COVER`: backend używa `ctx.user.id` jako właściciela (entityId służy do walidacji)
- Dla `INTENT_COVER`: `entityId` to `intentId` (wymagane do autoryzacji i budowy finalnego `mediaKey`)

**`confirmMediaUpload`**

**Proces:**

1. **Walidacja autoryzacji** (user może tylko swoje avatar/cover, dla Intent sprawdzenie owner/mod/admin)
2. **Odczyt surowego pliku z tymczasowego storage:**
   - LOCAL: z dysku `/tmp/uploads/{uploadKey}` (przez `fs.readFile`)
   - S3: z S3 bucket `tmp/uploads/{uploadKey}` (przez `getOriginalStream`)
3. **Przetworzenie przez `createMediaAssetFromUpload()`:**
   - Walidacja obrazu
   - Przetworzenie przez `processOriginalImage()` (resize, webp, blurhash)
   - Generowanie finalnego `mediaKey` przez `buildMediaKey()` (np. `avatars/{userId}/{cuid}`)
   - Zapis przetworzony oryginału do storage pod `mediaKey`
   - Utworzenie rekordu `MediaAsset` z `key = mediaKey`
4. **Aktualizacja odpowiedniego modelu:**
   - `USER_AVATAR` → `User.avatarKey = mediaKey`
   - `USER_COVER` → `UserProfile.coverKey = mediaKey`
   - `INTENT_COVER` → `Intent.coverKey = mediaKey`
5. **Usunięcie starego media** (jeśli istnieje) - oryginał + warianty
6. **Usunięcie tymczasowego pliku:**
   - LOCAL: `fs.unlink(/tmp/uploads/{uploadKey})`
   - S3: `s3.deleteObject(tmp/uploads/{uploadKey})`

**Kluczowe rozróżnienie:**

- `uploadKey` = tymczasowy klucz surowego uploadu (np. `tmp/uploads/xyz`)
- `mediaKey` = finalny klucz przetworzonego oryginału w `MediaAsset.key` (np. `avatars/userId/abc`)

**Pliki:**

- `packages/contracts/graphql/schema.graphql`
- `apps/api/src/graphql/resolvers/mutation/media.ts`

---

### 6. **HTTP Endpoints (Fastify)**

#### `POST /api/upload/local` (tylko LOCAL storage)

**Plugin:** `apps/api/src/plugins/local-upload.ts`

**Funkcjonalność:**

- Przyjmuje pliki multipart/form-data
- Waliduje MIME type (tylko `image/jpeg`, `image/png`, `image/webp`, `image/avif`)
- Limit: 10MB
- **Zapisuje surowy plik na dysku** w katalogu tymczasowym (np. `/tmp/uploads` lub `UPLOADS_TMP_PATH`)
- Klucz `uploadKey` określa ścieżkę względną pliku
- Plik jest usuwany po udanym `confirmMediaUpload` lub przez okresowy cleanup

**Uwaga:** Staging na dysku oznacza, że tymczasowe uploady przeżywają restart procesu Node (w przeciwieństwie do Map in-memory).

**Request:**

```bash
POST /api/upload/local?uploadKey=tmp/uploads/xyz123
Content-Type: multipart/form-data

file: [binary data]
```

**Response:**

```json
{
  "success": true,
  "uploadKey": "tmp/uploads/xyz123",
  "size": 123456
}
```

**Implementacja:**

```typescript
// Zapis na dysk
const tmpPath = path.join(UPLOADS_TMP_PATH, uploadKey);
await fs.promises.mkdir(path.dirname(tmpPath), { recursive: true });
await fs.promises.writeFile(tmpPath, buffer);
```

#### `GET /img/:key` (on-demand warianty)

**Plugin:** `apps/api/src/plugins/image-variants.ts`

**Funkcjonalność:**

- Generuje warianty obrazów on-demand
- Cache wariantów (dysk / S3)
- Publiczny endpoint (bez auth)

**Query params:**

- `w` - szerokość (opcjonalna)
- `h` - wysokość (opcjonalna)
- `fit` - `cover` | `contain` | `inside` (domyślnie `cover`)
- `format` - `webp` | `jpeg` (domyślnie `webp`)

**Przykład:**

```
GET /img/avatars/userId/cuid?w=96&h=96&fit=cover&format=webp
```

**Proces:**

1. Walidacja parametrów (wymagane min. `w` lub `h`)
2. Generowanie `variantKey` (hash parametrów)
3. Sprawdzenie czy wariant istnieje w cache
4. Jeśli nie:
   - Pobranie oryginału
   - Generowanie wariantu przez `processImageVariant()`
   - Zapis do cache
5. Zwrócenie wariantu z nagłówkami cache (1 rok, immutable)

**Fallback:** Jeśli oryginał nie istnieje → redirect do placeholdera

---

### 7. **Frontend (React/Next.js)**

#### Helpery URL

**`apps/web/src/lib/media/url.ts`**

```typescript
// Presety rozmiarów
type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
const AVATAR_PRESETS = {
  sm: { w: 64, h: 64 },
  md: { w: 96, h: 96 },
  lg: { w: 160, h: 160 },
  xl: { w: 256, h: 256 },
};

// Funkcje buildujące URL
buildAvatarUrl(avatarKey, size = 'md'): string | null
buildUserCoverUrl(coverKey, variant = 'detail'): string | null
buildIntentCoverUrl(coverKey, variant = 'card'): string | null
```

**Użycie:**

```tsx
<img src={buildAvatarUrl(user.avatarKey, 'lg')} alt={user.name} />
```

#### Hooki do uploadu

**`apps/web/src/lib/media/use-media-upload.tsx`**

**Generyczne:**

```typescript
useMediaUpload(options: {
  purpose: MediaPurpose;
  entityId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
})
```

**Specjalizowane:**

```typescript
useAvatarUpload(options?)
useCoverUpload(options?)
useIntentCoverUpload(intentId: string, options?)
```

**Proces uploadu:**

1. Wywołanie `getUploadUrl` mutation
2. Upload pliku:
   - S3: PUT na presigned URL
   - LOCAL: POST multipart/form-data
3. Wywołanie `confirmMediaUpload` mutation
4. Invalidacja query cache

**Przykład użycia:**

```tsx
const avatarUpload = useAvatarUpload({
  onSuccess: () => {
    toast.success('Avatar updated!');
  },
});

const handleFileSelect = async (file: File) => {
  await avatarUpload.uploadAsync(file);
};

return (
  <button onClick={() => input.click()} disabled={avatarUpload.isUploading}>
    {avatarUpload.isUploading ? 'Uploading...' : 'Change Avatar'}
  </button>
);
```

#### Integracja w komponencie

**`apps/web/src/app/account/profile/_components/profile-tab.tsx`**

```tsx
const avatarUpload = useAvatarUpload({
  onSuccess: () => {
    setAvatarCropModalOpen(false);
    setSelectedAvatarSrc(null);
  },
  onError: (error) => {
    toast.error(`Upload failed: ${error.message}`);
  },
});

const coverUpload = useCoverUpload({
  onSuccess: () => {
    setCoverCropModalOpen(false);
    setSelectedCoverSrc(null);
  },
});

// Wyświetlanie
<img
  src={buildAvatarUrl(user.avatarKey, 'xl') || '/default-avatar.png'}
  alt={user.name}
/>

<img
  src={buildUserCoverUrl(profile.coverKey, 'detail') || '/default-cover.jpg'}
  alt="Cover"
/>
```

---

## 🔧 Konfiguracja (Environment Variables)

### Backend (`apps/api/.env`)

```bash
# Storage Provider
MEDIA_STORAGE_PROVIDER=LOCAL  # LOCAL | S3

# Local Storage
UPLOADS_PATH=./uploads           # Ścieżka dla przetworzonych oryginałów i wariantów
UPLOADS_TMP_PATH=./tmp/uploads   # Ścieżka dla tymczasowych uploadów (surowe pliki)

# Image Processing
IMAGE_MAX_WIDTH=2048
IMAGE_MAX_HEIGHT=2048
IMAGE_FORMAT=webp  # webp | avif
IMAGE_QUALITY=85

# S3 (tylko gdy MEDIA_STORAGE_PROVIDER=S3)
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=miglee-media
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Assets / CDN
ASSETS_BASE_URL=http://localhost:4000
CDN_ENABLED=false
CDN_BASE_URL=https://cdn.example.com
```

---

## 🔄 Flow diagramy

### Upload Flow (LOCAL)

```
Frontend                Backend                  Disk Storage
   |                       |                        |
   |--getUploadUrl()------>|                        |
   |                       |--generate uploadKey--->|
   |<--uploadUrl-----------|   (tmp/uploads/xyz)    |
   |   uploadKey           |                        |
   |                       |                        |
   |--POST /api/upload---->|                        |
   |   (multipart)         |--save to /tmp/-------->|
   |                       |   uploads/{uploadKey}  |
   |<--200 OK--------------|                        |
   |                       |                        |
   |--confirmMediaUpload-->|                        |
   |   (uploadKey)         |--read from /tmp/------>|
   |                       |   uploads/{uploadKey}  |
   |                       |--processOriginalImage->|
   |                       |--generate mediaKey---->|
   |                       |   (avatars/user/abc)   |
   |                       |--saveOriginal--------->|
   |                       |   (uploads/original/)  |
   |                       |--create MediaAsset---->|
   |                       |   (key=mediaKey)       |
   |                       |--update User.avatarKey>|
   |                       |   (=mediaKey)          |
   |                       |--delete /tmp/--------->|
   |                       |   uploads/{uploadKey}  |
   |<--true----------------|                        |
```

### Upload Flow (S3)

```
Frontend                Backend                  S3
   |                       |                        |
   |--getUploadUrl()------>|                        |
   |                       |--generate uploadKey--->|
   |                       |   (tmp/uploads/xyz)    |
   |                       |--generatePresignedURL->|
   |                       |   for uploadKey        |
   |<--presignedURL--------|<-----------------------|
   |   uploadKey           |                        |
   |                       |                        |
   |--PUT (presignedURL)------------------------------>|
   |   (raw file)          |                        |   tmp/uploads/xyz
   |<--200 OK--------------------------------|        |
   |                       |                        |
   |--confirmMediaUpload-->|                        |
   |   (uploadKey)         |--getOriginalStream---->|
   |                       |   (tmp/uploads/xyz)    |
   |                       |<--stream---------------|
   |                       |--processOriginalImage->|
   |                       |--generate mediaKey---->|
   |                       |   (avatars/user/abc)   |
   |                       |--saveOriginal--------->|
   |                       |   (original/avatars/)  |
   |                       |--create MediaAsset---->|
   |                       |   (key=mediaKey)       |
   |                       |--update User.avatarKey>|
   |                       |   (=mediaKey)          |
   |                       |--deleteObject--------->|
   |                       |   (tmp/uploads/xyz)    |
   |<--true----------------|                        |
```

### Variant Generation Flow

```
Browser                 Backend                  Storage
   |                       |                        |
   |--GET /img/:key?w=96-->|                        |
   |                       |--check variant cache-->|
   |                       |<--not found------------|
   |                       |                        |
   |                       |--getOriginalStream---->|
   |                       |<--stream---------------|
   |                       |--processImageVariant-->|
   |                       |--saveVariant---------->|
   |                       |                        |
   |<--image (webp)--------|                        |
   |   Cache-Control: 1yr  |                        |
```

---

## 📊 Struktura plików

```
miglee/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma                    # Model MediaAsset + aktualizacje
│   │   │   ├── migrations/
│   │   │   │   └── 20251119030000_add_media... # Migracja
│   │   │   └── seed.ts                          # Zaktualizowane seedy
│   │   └── src/
│   │       ├── env.ts                           # Zmienne środowiskowe
│   │       ├── graphql/
│   │       │   ├── context.ts                   # Dodano fastify do kontekstu
│   │       │   └── resolvers/
│   │       │       ├── helpers.ts               # mapUser, mapIntent z *Key
│   │       │       └── mutation/
│   │       │           ├── media.ts             # getUploadUrl, confirmMediaUpload
│   │       │           └── index.ts             # Rejestracja resolverów
│   │       ├── lib/
│   │       │   └── media/
│   │       │       ├── storage.ts               # Interfejs MediaStorage
│   │       │       ├── local-storage.ts         # LocalMediaStorage
│   │       │       ├── s3-storage.ts            # S3MediaStorage
│   │       │       ├── image-processing.ts      # Sharp + blurhash
│   │       │       └── media-service.ts         # Logika biznesowa
│   │       ├── plugins/
│   │       │   ├── local-upload.ts              # POST /api/upload/local
│   │       │   └── image-variants.ts            # GET /img/:key
│   │       └── server.ts                        # Rejestracja pluginów
│   │
│   └── web/
│       └── src/
│           ├── lib/
│           │   ├── api/
│           │   │   ├── client.ts               # GraphQL client
│           │   │   └── __generated__/
│           │   │       └── react-query-update.ts  # Wygenerowane typy
│           │   └── media/
│           │       ├── url.ts                   # Helpery buildAvatarUrl, etc.
│           │       └── use-media-upload.tsx     # Hooki do uploadu
│           ├── components/
│           │   └── ui/
│           │       ├── blurhash-image.tsx       # Komponent BlurHash
│           │       └── image-crop-modal.tsx     # Modal do cropowania
│           ├── features/
│           │   └── intents/
│           │       └── components/
│           │           ├── cover-step.tsx       # Upload cover dla Intent
│           │           ├── create-edit-intent-modal.tsx  # Modal Intent
│           │           └── privacy-step.tsx     # Step z join form
│           └── app/
│               ├── account/
│               │   └── profile/
│               │       └── _components/
│               │           └── profile-tab.tsx  # Integracja uploadu
│               └── [[...slug]]/
│                   └── _components/
│                       └── event-card.tsx       # Wyświetlanie Intent cover
│
└── packages/
    └── contracts/
        └── graphql/
            ├── schema.graphql                   # Schema GraphQL
            └── operations/
                ├── media.graphql                # Operacje GetUploadUrl, ConfirmMediaUpload
                ├── user-profile.graphql         # Zaktualizowane fragmenty
                └── fragments.graphql            # UserCore, IntentCore z *Key
```

---

## 🔒 Bezpieczeństwo

### Walidacja

- **MIME type**: Tylko `image/jpeg`, `image/png`, `image/webp`, `image/avif`
- **Rozmiar pliku**: Max 10MB
- **Wymiary**: Max 2048×2048 (konfigurowane)
- **Sharp validation**: Sprawdzenie czy plik jest poprawnym obrazem

### Autoryzacja

- **USER_AVATAR / USER_COVER**: User może tylko swoje
- **INTENT_COVER**: Tylko owner/moderator/admin Intenta
- Sprawdzenie w `validateUploadPurpose()`

### Rate Limiting

- Wykorzystanie istniejącego `rateLimitPlugin` w Fastify
- Rekomendacja: Dodać osobny limit dla `/api/upload/local`

### Cache Control

- Warianty: `Cache-Control: public, max-age=31536000, immutable` (1 rok)
- Klucze zawierają CUID → zmiana obrazu = nowy klucz = automatyczne cache busting

---

## 🧪 Testowanie

### Backend

```bash
# Uruchom API
cd apps/api
pnpm dev

# Test getUploadUrl (GraphQL)
mutation {
  getUploadUrl(purpose: USER_AVATAR) {
    uploadUrl
    key
    provider
  }
}

# Test upload (LOCAL)
curl -X POST "http://localhost:4000/api/upload/local?key=test/123&mimeType=image/webp" \
  -F "file=@avatar.jpg"

# Test confirmMediaUpload (GraphQL)
mutation {
  confirmMediaUpload(
    purpose: USER_AVATAR
    key: "avatars/userId/cuid"
  )
}

# Test wariantu
curl "http://localhost:4000/img/avatars/userId/cuid?w=96&h=96&fit=cover"
```

### Frontend

```bash
# Uruchom web
cd apps/web
pnpm dev

# Przejdź do profilu
http://localhost:3000/account/profile

# Kliknij "Change Avatar" lub "Change Cover"
# Wybierz plik
# Sprawdź logi w konsoli przeglądarki i terminalu API
```

---

## 🐛 Debugging

### Logi w backendzie

**Local upload:**

```
[INFO] File stored in uploadCache { key: "avatars/...", size: 123456, cacheSize: 1 }
```

**Confirm upload:**

```
[INFO] Looking for file in uploadCache { key: "avatars/...", cacheSize: 1 }
[INFO] File found in uploadCache { key: "avatars/...", size: 123456 }
```

**Jeśli błąd:**

```
[ERROR] File not found in uploadCache { key: "avatars/...", cacheKeys: [...] }
```

### Sprawdzenie bazy danych

```sql
-- Sprawdź MediaAssets
SELECT * FROM media_assets ORDER BY created_at DESC LIMIT 10;

-- Sprawdź avatarKey użytkowników
SELECT id, name, avatar_key FROM users WHERE avatar_key IS NOT NULL;

-- Sprawdź coverKey profili
SELECT user_id, cover_key FROM user_profiles WHERE cover_key IS NOT NULL;
```

### Sprawdzenie plików (LOCAL)

```bash
# Oryginały
ls -lh uploads/original/

# Warianty
ls -lh uploads/cache/
```

---

## 📈 Metryki i monitoring

### OpenTelemetry

Wszystkie resolvery GraphQL są owinięte w `resolverWithMetrics()`:

- Czas wykonania
- Liczba wywołań
- Błędy

**Przykład:**

```
[GQL] Mutation.getUploadUrl dur=15 ms
[GQL] Mutation.confirmMediaUpload dur=234 ms
```

### Fastify metrics

- Request duration
- Status codes
- Error rates

---

## 🚀 Deployment

### LOCAL → S3 Migration

1. **Ustaw zmienne środowiskowe:**

```bash
MEDIA_STORAGE_PROVIDER=S3
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=miglee-media
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
CDN_ENABLED=true
CDN_BASE_URL=https://cdn.miglee.com
```

2. **Migracja istniejących plików:**

```bash
# Skrypt do przeniesienia plików z uploads/ do S3
# TODO: Zaimplementować w cleanup worker
```

3. **Restart aplikacji**

### CDN Setup

**CloudFront / CloudFlare:**

- Origin: S3 bucket lub backend (`/img/:key`)
- Cache policy: 1 rok dla `/img/*`
- Compression: Brotli + Gzip

**Aktualizacja frontend:**

```typescript
// url.ts
const CDN_BASE = process.env.NEXT_PUBLIC_CDN_BASE_URL;

export function buildAvatarUrl(key: string, size: AvatarSize) {
  if (!key) return null;
  const { w, h } = AVATAR_PRESETS[size];
  return `${CDN_BASE}/img/${key}?w=${w}&h=${h}&fit=cover`;
}
```

---

## ✅ Co zostało zaimplementowane

### Backend

- ✅ Model `MediaAsset` w Prisma
- ✅ Migracja bazy danych
- ✅ Interfejs `MediaStorage` + LocalMediaStorage + S3MediaStorage
- ✅ Przetwarzanie obrazów (Sharp + blurhash)
- ✅ `media-service.ts` (createMediaAssetFromUpload, buildMediaKey, deleteMediaAsset)
- ✅ GraphQL mutations: `getUploadUrl`, `confirmMediaUpload`
- ✅ GraphQL resolvers z walidacją i autoryzacją
- ✅ Fastify plugin: `POST /api/upload/local`
- ✅ Fastify plugin: `GET /img/:key` (on-demand warianty)
- ✅ Aktualizacja `User`, `UserProfile`, `Intent` z nowymi polami
- ✅ Backward compatibility: `imageUrl` deprecated ale dostępne
- ✅ Logi i debugging

### Frontend

- ✅ Helpery URL: `buildAvatarUrl`, `buildUserCoverUrl`, `buildIntentCoverUrl`
- ✅ Hooki: `useAvatarUpload`, `useCoverUpload`, `useIntentCoverUpload`
- ✅ Integracja w `profile-tab.tsx`
- ✅ GraphQL operations: `GetUploadUrl`, `ConfirmMediaUpload`
- ✅ Wygenerowane typy TypeScript

### Infrastruktura

- ✅ Environment variables (MEDIA_STORAGE_PROVIDER, UPLOADS_PATH, UPLOADS_TMP_PATH, etc.)
- ✅ Seed data z nowymi polami (`avatarKey`, `coverKey`)
- ✅ Metryki i monitoring (OpenTelemetry)
- ✅ **Stare pola `imageUrl` / `coverUrl` zostały usunięte** z modelu Prisma, schemy GraphQL i frontendu
- ✅ Cały system używa wyłącznie `avatarKey` / `coverKey` i endpointu `/img/:key`

---

## 🔜 TODO (nie zaimplementowane)

### 1. Cleanup Worker

**Cel:** Usuwanie osieroconych MediaAsset i wariantów

**Lokalizacja:** `apps/api/src/workers/media-cleanup/`

**Funkcjonalność:**

- Znajdź `MediaAsset` bez referencji w `User.avatarKey`, `UserProfile.coverKey`, `Intent.coverKey`
- Starsze niż `MEDIA_CLEANUP_AGE_DAYS` (np. 7 dni)
- Usuń przez `deleteMediaAsset()`
- Cron job: co `MEDIA_CLEANUP_INTERVAL_HOURS` (np. 24h)

**Konfiguracja:**

```bash
ENABLE_MEDIA_CLEANUP=true
MEDIA_CLEANUP_INTERVAL_HOURS=24
MEDIA_CLEANUP_AGE_DAYS=7
MEDIA_TMP_MAX_AGE_MINUTES=60  # Cleanup dla plików w /tmp/uploads (1h)
```

**Zakres:**

**Krok A: Tymczasowe uploady**

- Znajdź pliki w `/tmp/uploads` (LOCAL) lub `tmp/uploads/*` (S3)
- Starsze niż `MEDIA_TMP_MAX_AGE_MINUTES` (np. 60 minut)
- Usuń (nie zostały potwierdzone przez `confirmMediaUpload`)

**Krok B: Osierocone MediaAsset**

- Znajdź `MediaAsset` bez referencji w `User.avatarKey`, `UserProfile.coverKey`, `Intent.coverKey`
- Starsze niż `MEDIA_CLEANUP_AGE_DAYS` (np. 7 dni)
- Usuń przez `deleteMediaAsset()` (oryginał + warianty + rekord)

**Krok C: Osierocone warianty**

- Znajdź warianty w cache bez odpowiedniego `MediaAsset.key`
- Lub warianty starsze niż X dni (opcjonalnie, np. 90 dni)
- Usuń z storage

### 2. Usunięcie starego kodu

**Cel:** Całkowite usunięcie `imageUrl` / `coverUrl` z kodu

**Do sprawdzenia:**

- Grep po całym projekcie: `imageUrl`, `coverUrl`
- Usunąć deprecated pola z GraphQL schema
- Usunąć z resolverów (mapUser, mapIntent)
- Usunąć z komponentów frontendowych
- Usunąć z testów

**Komenda:**

```bash
# Znajdź wszystkie wystąpienia
rg "imageUrl|coverUrl" --type ts --type tsx
```

### 3. Testy jednostkowe

- `image-processing.test.ts`: Sharp transformacje
- `media-service.test.ts`: Logika biznesowa
- `local-storage.test.ts`: File system operations
- `s3-storage.test.ts`: S3 operations (mock)

### 4. Testy E2E

- Upload avatara (LOCAL + S3)
- Upload covera (LOCAL + S3)
- Generowanie wariantów
- Autoryzacja (próba uploadu cudzego avatara)
- Walidacja (niepoprawny MIME type, za duży plik)

### 5. Migracja danych produkcyjnych

**Skrypt do przeniesienia starych `imageUrl` → `avatarKey`:**

```typescript
// Dla każdego User z imageUrl:
// 1. Pobierz obraz z imageUrl
// 2. Utwórz MediaAsset przez createMediaAssetFromUpload()
// 3. Ustaw User.avatarKey = asset.key
// 4. Usuń User.imageUrl
```

### 6. Rate limiting dla uploadu

```typescript
// apps/api/src/plugins/local-upload.ts
fastify.addHook('preHandler', async (request, reply) => {
  const userId = request.headers['x-user-id'];
  // Sprawdź rate limit (np. 10 uploadów/godzinę)
  // Użyj Redis lub in-memory store
});
```

### 7. Progressbar dla uploadu

```typescript
// Frontend: XMLHttpRequest z progress events
const xhr = new XMLHttpRequest();
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const progress = (e.loaded / e.total) * 100;
    setUploadProgress(progress);
  }
});
```

### 8. Image cropping na frontendzie

- Biblioteka: `react-easy-crop` lub `react-image-crop`
- Crop przed uploadem (canvas → blob)
- Lub: upload pełnego obrazu + parametry crop w metadata

### 9. Multiple formats support

- Automatyczne generowanie WebP + AVIF
- `<picture>` z fallbackiem

```html
<picture>
  <source srcset="/img/key?w=96&format=avif" type="image/avif" />
  <source srcset="/img/key?w=96&format=webp" type="image/webp" />
  <img src="/img/key?w=96&format=jpeg" alt="Avatar" />
</picture>
```

### 10. Lazy loading + blur placeholder

```tsx
<img
  src={buildAvatarUrl(key, 'md')}
  placeholder="blur"
  blurDataURL={blurhash ? blurhashToDataURL(blurhash) : undefined}
  loading="lazy"
/>
```

---

## 📚 Dodatkowe zasoby

### Biblioteki użyte

- **Prisma**: ORM dla PostgreSQL
- **Sharp**: Przetwarzanie obrazów
- **Blurhash**: Placeholdery obrazów
- **@fastify/multipart**: Upload plików
- **@aws-sdk/client-s3**: S3 storage
- **@aws-sdk/s3-request-presigner**: Presigned URLs
- **@tanstack/react-query**: Data fetching na frontendzie
- **graphql-request**: GraphQL client

### Dokumentacja

- [Sharp](https://sharp.pixelplumbing.com/)
- [Blurhash](https://blurha.sh/)
- [AWS S3 SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Fastify Multipart](https://github.com/fastify/fastify-multipart)
- [Prisma](https://www.prisma.io/docs)

---

## 🎉 Podsumowanie

System mediów został zaprojektowany i zaimplementowany zgodnie z wymaganiami:

✅ **Presigned upload** - bezpośredni upload do S3 lub lokalny endpoint  
✅ **On-demand warianty** - generowanie różnych rozmiarów tylko gdy są potrzebne  
✅ **Cache** - warianty są cache'owane (dysk / S3)  
✅ **MediaAsset model** - pełne metadane w bazie danych  
✅ **Avatary + covery** - obsługa User, UserProfile, Intent  
✅ **LOCAL + S3** - elastyczna konfiguracja storage  
✅ **Clean architecture** - modułowa struktura, SOLID principles  
✅ **Type safety** - pełne typowanie TypeScript  
✅ **Security** - walidacja, autoryzacja, rate limiting ready  
✅ **Monitoring** - metryki OpenTelemetry  
✅ **Rozdział uploadKey vs mediaKey** - tymczasowy upload → przetwarzanie → finalny klucz  
✅ **Staging na dysku** - tymczasowe uploady w `/tmp/uploads` (nie w pamięci)  
✅ **Oryginał = przetworzony** - max 2048px, WebP/AVIF, bez metadanych

**Status:** System jest gotowy do użycia w środowisku development (LOCAL storage).  
Dla produkcji wymagane jest skonfigurowanie S3 i opcjonalnie CDN.

**Kluczowe koncepcje:**

- **`uploadKey`** = tymczasowy klucz surowego uploadu (np. `tmp/uploads/xyz`)
- **`mediaKey`** = finalny klucz przetworzonego oryginału w `MediaAsset.key` (np. `avatars/userId/abc`)
- **Warianty** = cache pochodny od `mediaKey` (np. `cache/avatars/userId/abc/96x96.webp`)
- **Tymczasowe pliki** = staging na dysku (`/tmp/uploads` LOCAL) lub S3 (`tmp/uploads/*`)
- **Cleanup** = usuwanie: (A) tymczasowych uploadów, (B) osieroconych MediaAsset, (C) osieroconych wariantów

---

## 🎨 Intent Cover Upload - Wymagania i Implementacja

### 📋 Wymagania biznesowe

#### Rodzaj zdjęcia

- **Na dziś:** Cover Intenta (jedno zdjęcie na Intent)
- **Później:** Możliwość rozszerzenia na galerię (`GALLERY_IMAGE`)

#### Gdzie działa

- **Formularz Create Intent:** Użytkownik może od razu dodać cover
- **Formularz Edit Intent:** Użytkownik może zmienić istniejący cover

#### Zasady

- ✅ Cover **nie jest obowiązkowy** - Intent może istnieć bez zdjęcia
- ✅ Jeśli upload się nie uda, ale Intent został utworzony:
  - Event nadal istnieje w bazie
  - Użytkownik dostaje komunikat: _"Event utworzony, ale cover nie wszedł – możesz dodać później"_
  - Nie blokuje to całego procesu tworzenia

#### Bezpieczeństwo i uprawnienia

Cover Intenta może zmienić:

- ✅ **Owner** (twórca Intenta)
- ✅ **Moderator** Intenta
- ✅ **Global admin**
- ❌ Zwykły uczestnik **nie może**

---

### 🔧 Implementacja Backend

#### GraphQL Schema

**Enum `MediaPurpose`** (już zaimplementowany):

```graphql
enum MediaPurpose {
  USER_AVATAR
  USER_COVER
  INTENT_COVER
  GALLERY_IMAGE
}
```

**Typ `PresignedUpload`**:

```graphql
type PresignedUpload {
  uploadUrl: String! # URL do uploadu (presigned S3 lub /api/upload/local)
  uploadKey: String! # Klucz tymczasowy (tmp/uploads/...)
  provider: String! # 'S3' lub 'LOCAL'
}
```

**Typ `ConfirmMediaUploadPayload`**:

```graphql
type ConfirmMediaUploadPayload {
  success: Boolean!
  mediaKey: String! # Finalny MediaAsset.key
  mediaAssetId: ID!
}
```

**Mutacje**:

```graphql
type Mutation {
  getUploadUrl(
    purpose: MediaPurpose!
    entityId: ID! # Dla INTENT_COVER → intentId
  ): PresignedUpload!

  confirmMediaUpload(
    purpose: MediaPurpose!
    entityId: ID! # Dla INTENT_COVER → intentId
    uploadKey: String!
  ): ConfirmMediaUploadPayload!
}
```

**Typ `Intent`** (fragment):

```graphql
type Intent {
  id: ID!
  title: String!
  coverKey: String # Klucz do MediaAsset
  coverBlurhash: String # BlurHash dla placeholdera
}
```

#### Resolver `getUploadUrl` dla `INTENT_COVER`

**Cel:** Wygenerować tymczasowy `uploadKey` + link do uploadu surowego pliku.

**Logika:**

```typescript
async function getUploadUrl(
  parent: unknown,
  args: { purpose: MediaPurpose; entityId: string },
  ctx: MercuriusContext
) {
  const { purpose, entityId } = args;

  if (purpose === 'INTENT_COVER') {
    // 1. Sprawdź czy Intent istnieje
    const intent = await prisma.intent.findUnique({
      where: { id: entityId },
      include: { members: true },
    });

    if (!intent) {
      throw new Error('Intent not found');
    }

    // 2. Sprawdź uprawnienia (owner/moderator/admin)
    const canManage = await validateIntentPermissions(ctx.user.id, intent, [
      'OWNER',
      'MODERATOR',
      'ADMIN',
    ]);

    if (!canManage) {
      throw new Error('Unauthorized: You cannot manage this Intent cover');
    }

    // 3. Wygeneruj uploadKey
    const uploadKey = `tmp/uploads/intents/${entityId}/${createId()}`;

    // 4. Zwróć URL w zależności od providera
    if (MEDIA_STORAGE_PROVIDER === 'LOCAL') {
      return {
        uploadUrl: `${ASSETS_BASE_URL}/api/upload/local?uploadKey=${encodeURIComponent(uploadKey)}&mimeType=image/webp`,
        uploadKey,
        provider: 'LOCAL',
      };
    } else {
      // S3: generuj presigned URL
      const presignedUrl = await s3Storage.generatePresignedUploadUrl({
        key: uploadKey,
        mimeType: 'image/webp',
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
      });

      return {
        uploadUrl: presignedUrl.uploadUrl,
        uploadKey,
        provider: 'S3',
      };
    }
  }

  // ... inne purpose
}
```

#### Resolver `confirmMediaUpload` dla `INTENT_COVER`

**Cel:** Wziąć surowy plik zza `uploadKey`, przetworzyć, zapisać jako `MediaAsset` i podpiąć do Intenta.

**Logika:**

```typescript
async function confirmMediaUpload(
  parent: unknown,
  args: {
    purpose: MediaPurpose;
    entityId: string;
    uploadKey: string;
  },
  ctx: MercuriusContext
) {
  const { purpose, entityId, uploadKey } = args;

  if (purpose === 'INTENT_COVER') {
    // 1. Walidacja uprawnień
    const intent = await prisma.intent.findUnique({
      where: { id: entityId },
      include: { members: true },
    });

    if (!intent) {
      throw new Error('Intent not found');
    }

    const canManage = await validateIntentPermissions(ctx.user.id, intent, [
      'OWNER',
      'MODERATOR',
      'ADMIN',
    ]);

    if (!canManage) {
      throw new Error('Unauthorized');
    }

    // 2. Odczyt surowego bufora z tymczasowego storage
    let tempBuffer: Buffer;

    if (MEDIA_STORAGE_PROVIDER === 'LOCAL') {
      const tmpPath = path.join(UPLOADS_TMP_PATH, uploadKey);
      tempBuffer = await fs.promises.readFile(tmpPath);
      console.log('[confirmMediaUpload] Read from disk:', tmpPath);
    } else {
      // S3: pobierz z tmp/uploads/...
      const stream = await s3Storage.getOriginalStream(uploadKey);
      if (!stream) throw new Error('Temporary file not found in S3');
      tempBuffer = await streamToBuffer(stream);
      console.log('[confirmMediaUpload] Read from S3:', uploadKey);
    }

    // 3. Przetworzenie i zapis oryginału
    const {
      mediaAssetId,
      key: mediaKey,
      blurhash,
    } = await createMediaAssetFromUpload({
      ownerId: ctx.user.id,
      purpose: 'INTENT_COVER',
      tempBuffer,
    });

    console.log('[confirmMediaUpload] MediaAsset created:', {
      mediaAssetId,
      mediaKey,
    });

    // 4. Update Intenta + usunięcie starego covera
    const oldCoverKey = intent.coverKey;

    await prisma.intent.update({
      where: { id: entityId },
      data: { coverKey: mediaKey },
    });

    console.log('[confirmMediaUpload] Intent.coverKey updated:', mediaKey);

    // 5. Usunięcie poprzedniego covera (opcjonalnie)
    if (oldCoverKey && oldCoverKey !== mediaKey) {
      console.log('[confirmMediaUpload] Deleting old cover:', oldCoverKey);
      await deleteMediaAsset(oldCoverKey);
    }

    // 6. Usunięcie pliku tymczasowego
    if (MEDIA_STORAGE_PROVIDER === 'LOCAL') {
      const tmpPath = path.join(UPLOADS_TMP_PATH, uploadKey);
      await fs.promises.unlink(tmpPath).catch(() => {});
      console.log('[confirmMediaUpload] Deleted temp file:', tmpPath);
    } else {
      await s3Storage.deleteObject(uploadKey);
      console.log('[confirmMediaUpload] Deleted temp S3 object:', uploadKey);
    }

    return {
      success: true,
      mediaKey,
      mediaAssetId,
    };
  }

  // ... inne purpose
}
```

#### Helper: `validateIntentPermissions`

```typescript
async function validateIntentPermissions(
  userId: string,
  intent: Intent & { members: IntentMember[] },
  allowedRoles: ('OWNER' | 'MODERATOR' | 'ADMIN')[]
): Promise<boolean> {
  // 1. Sprawdź czy user jest global admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === 'ADMIN' && allowedRoles.includes('ADMIN')) {
    return true;
  }

  // 2. Sprawdź czy user jest owner
  if (intent.createdById === userId && allowedRoles.includes('OWNER')) {
    return true;
  }

  // 3. Sprawdź czy user jest moderatorem
  const member = intent.members.find((m) => m.userId === userId);
  if (member?.role === 'MODERATOR' && allowedRoles.includes('MODERATOR')) {
    return true;
  }

  return false;
}
```

---

### 🎨 Implementacja Frontend

### Komponent `CoverStep`

**Plik:** `apps/web/src/features/intents/components/cover-step.tsx`

Dedykowany komponent do uploadu cover image dla Intentów z pełną funkcjonalnością crop.

#### Funkcjonalności:

- ✅ **Crop modal** z aspect ratio 16:9 (`ImageCropModal`)
- ✅ **Walidacja plików** (typ: `image/*`, max: 10MB)
- ✅ **Preview** z możliwością usunięcia
- ✅ **Loading state** podczas uploadu
- ✅ **Placeholder** gdy brak obrazka
- ✅ **Responsywny UI** z Tailwind CSS

#### Props:

```typescript
interface CoverStepProps {
  coverPreview: string | null;
  isUploading?: boolean;
  onImageSelected: (file: File) => void;
  onImageRemove: () => void;
}
```

#### Przykład użycia:

```typescript
<CoverStep
  coverPreview={coverImagePreview}
  isUploading={isCoverUploading}
  onImageSelected={handleCoverImageSelected}
  onImageRemove={handleCoverImageRemove}
/>
```

### Flow uploadu Intent Cover

**Problem:** `intentId` jest znane dopiero **po** utworzeniu Intenta, więc nie można użyć `useIntentCoverUpload` z góry.

**Rozwiązanie:** Upload odbywa się **synchronicznie** w funkcji `submit()` **przed** zamknięciem modala.

#### Implementacja w `create-edit-intent-modal.tsx`:

```typescript
const submit = handleSubmit(
  useCallback(async (values) => {
    try {
      // 1. Utwórz Intent
      const resultIntentId = await onSubmit(
        values as IntentFormValues,
        isEdit ? undefined : joinFormQuestions,
        coverImageFile
      );

      // 2. Jeśli jest cover image, uploaduj PRZED zamknięciem modala
      if (resultIntentId && coverImageFile) {
        console.log('[Submit] Intent created:', resultIntentId);
        console.log('[Submit] Uploading cover image...');

        setIsCoverUploading(true);

        try {
          // Step 1: Get upload URL
          const uploadUrlResponse = await gqlClient.request(
            GetUploadUrlDocument,
            {
              purpose: MediaPurpose.IntentCover,
              entityId: resultIntentId, // ✅ Teraz mamy intentId!
            }
          );

          const { uploadUrl, uploadKey, provider } =
            uploadUrlResponse.getUploadUrl;

          // Step 2: Upload file
          if (provider === 'S3') {
            const response = await fetch(uploadUrl, {
              method: 'PUT',
              body: coverImageFile,
              headers: { 'Content-Type': coverImageFile.type },
            });
            if (!response.ok)
              throw new Error(`Upload failed: ${response.statusText}`);
          } else {
            const formData = new FormData();
            formData.append('file', coverImageFile);
            const response = await fetch(uploadUrl, {
              method: 'POST',
              body: formData,
            });
            if (!response.ok)
              throw new Error(`Upload failed: ${response.statusText}`);
          }

          // Step 3: Confirm upload
          await gqlClient.request(ConfirmMediaUploadDocument, {
            purpose: MediaPurpose.IntentCover,
            entityId: resultIntentId,
            uploadKey,
          });

          console.log('[Submit] Cover upload completed successfully!');

          // Reset cover state
          setCoverImageFile(null);
          setCoverImagePreview(null);
        } catch (uploadErr) {
          console.error('[Submit] Cover upload failed:', uploadErr);
          toast.error('Event created but cover upload failed', {
            description: 'You can add a cover image later from event settings',
          });
        } finally {
          setIsCoverUploading(false);
        }
      }

      // 3. Dopiero teraz zamknij modal
      onClose();
    } catch (error) {
      console.error('[Submit] Failed to create intent:', error);
    }
  }, [onSubmit, coverImageFile, ...])
);
```

#### Kluczowe różnice vs User Avatar/Cover:

| Aspekt       | User Avatar/Cover          | Intent Cover                    |
| ------------ | -------------------------- | ------------------------------- |
| **Hook**     | `useAvatarUpload(userId)`  | Bezpośrednie wywołanie GraphQL  |
| **Timing**   | Upload w dowolnym momencie | Upload **po** utworzeniu Intent |
| **entityId** | Znane z góry (`user.id`)   | Znane dopiero po `onSubmit()`   |
| **Modal**    | Może zamknąć się od razu   | Czeka na zakończenie uploadu    |
| **Loading**  | `hook.isUploading`         | `isCoverUploading` state        |

#### Sekwencja kroków:

```
1. User wypełnia formularz Intent (steps 0-2)
2. User wybiera cover image w step 3 (CoverStep)
   → ImageCropModal (16:9)
   → handleCoverImageSelected(file)
   → setCoverImageFile(file)
   → setCoverImagePreview(base64)
3. User przechodzi do step 4 (Review)
4. User klika "Create Event"
5. submit() wywołuje onSubmit()
   → Intent tworzy się w DB
   → zwraca resultIntentId
6. if (resultIntentId && coverImageFile):
   → setIsCoverUploading(true)
   → getUploadUrl(INTENT_COVER, resultIntentId)
   → Upload file (PUT/POST)
   → confirmMediaUpload(INTENT_COVER, resultIntentId, uploadKey)
   → Intent.coverKey aktualizowany w DB
   → setIsCoverUploading(false)
7. onClose() → modal zamyka się
8. event-card.tsx wyświetla cover z BlurHash
```

### Wyświetlanie Intent Cover w `event-card.tsx`

```typescript
<BlurHashImage
  src={buildIntentCoverUrl(coverKey, 'card')}
  blurhash={coverBlurhash}
  alt={title}
  className="h-full w-full object-cover"
  width={480}
  height={270}
/>
```

**Fallback:** Jeśli `coverKey` jest `null`, wyświetlany jest gradient:

```typescript
{coverKey ? (
  <BlurHashImage ... />
) : (
  <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/20 dark:to-violet-900/20" />
)}
```

### Privacy Step - Join Form Integration

**Plik:** `apps/web/src/features/intents/components/privacy-step.tsx`

Join Form został **zintegrowany** w Privacy Step i wyświetla się tylko gdy `joinMode === 'REQUEST'`:

```typescript
{joinMode === 'REQUEST' && onJoinFormQuestionsChange && (
  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
    <label className="mb-1 block text-sm font-medium">
      Pytania w formularzu prośby o dołączenie
    </label>
    <p className="mb-4 text-xs text-zinc-500">
      Dodaj niestandardowe pytania (opcjonalne).
    </p>
    <JoinFormStep
      questions={joinFormQuestions || []}
      onChange={onJoinFormQuestionsChange}
      maxQuestions={5}
    />
  </div>
)}
```

**Zmiana:** Usunięto dedykowany step "Join Form" - teraz jest częścią step "Settings".

---

### 🔄 Helper Function: `uploadIntentCover`

Rekomendowany helper do enkapsulacji logiki uploadu cover dla Intenta:

```typescript
/**
 * Upload cover image dla Intenta
 * @param intentId - ID Intenta
 * @param file - Plik obrazu (po cropie)
 * @returns Promise<void>
 */
async function uploadIntentCover(intentId: string, file: File): Promise<void> {
  setIsCoverUploading(true);

  try {
    // 1. getUploadUrl
    console.log('[uploadIntentCover] Step 1: Getting upload URL');
    const uploadUrlResponse = await gqlClient.request(GetUploadUrlDocument, {
      purpose: MediaPurpose.IntentCover,
      entityId: intentId,
    });

    const { uploadUrl, uploadKey, provider } = uploadUrlResponse.getUploadUrl;

    console.log('[uploadIntentCover] Got upload URL, provider:', provider);

    // 2. Upload raw file
    console.log('[uploadIntentCover] Step 2: Uploading file');
    if (provider === 'S3') {
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }
    } else {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }
    }

    // 3. confirmMediaUpload
    console.log('[uploadIntentCover] Step 3: Confirming upload');
    await gqlClient.request(ConfirmMediaUploadDocument, {
      purpose: MediaPurpose.IntentCover,
      entityId: intentId,
      uploadKey,
    });

    console.log('[uploadIntentCover] ✅ Cover uploaded successfully!');

    // 4. Invalidate queries
    await queryClient.invalidateQueries({ queryKey: ['GetIntent', intentId] });
    await queryClient.invalidateQueries({ queryKey: ['GetIntents'] });

    // 5. Wyczyść stan
    setCoverImageFile(null);
    setCoverImagePreview(null);

    toast.success('Cover został dodany pomyślnie');
  } catch (error) {
    console.error('[uploadIntentCover] ❌ Upload failed:', error);
    toast.error('Event utworzony, ale nie udało się dodać covera', {
      description: 'Możesz spróbować dodać cover później z ustawień eventu',
    });
    throw error; // Re-throw jeśli chcesz obsłużyć wyżej
  } finally {
    setIsCoverUploading(false);
  }
}
```

### 📝 Flow dla Create Intent

```typescript
const submit = handleSubmit(
  useCallback(
    async (values: IntentFormValues) => {
      try {
        setIsSubmitting(true);

        // 1. Utwórz Intent (bez covera)
        console.log('[Submit] Creating Intent...');
        const resultIntentId = await onSubmit(
          values,
          isEdit ? undefined : joinFormQuestions,
          null // coverImageFile NIE jest przekazywany do onSubmit
        );

        if (!resultIntentId) {
          throw new Error('Failed to create Intent');
        }

        console.log('[Submit] Intent created:', resultIntentId);

        // 2. Jeśli jest cover, uploaduj go
        if (coverImageFile) {
          console.log('[Submit] Uploading cover...');
          try {
            await uploadIntentCover(resultIntentId, coverImageFile);
          } catch (uploadErr) {
            // Cover upload failed, ale Intent istnieje
            // Error już obsłużony w uploadIntentCover (toast)
            console.error('[Submit] Cover upload failed, but Intent created');
          }
        }

        // 3. Wyczyść draft i zamknij modal
        if (!isEdit) {
          clearDraft();
        }

        onClose();

        // 4. Success message
        toast.success(
          isEdit ? 'Event zaktualizowany' : 'Event utworzony pomyślnie'
        );
      } catch (error) {
        console.error('[Submit] Failed to create/update Intent:', error);
        toast.error('Nie udało się utworzyć eventu');
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, isEdit, joinFormQuestions, coverImageFile, clearDraft, onClose]
  )
);
```

### 📝 Flow dla Edit Intent

```typescript
const handleEditSubmit = async (values: IntentFormValues) => {
  try {
    setIsSubmitting(true);

    // 1. Update Intent (inne pola, nie rusza coverKey)
    console.log('[EditSubmit] Updating Intent fields...');
    await updateIntentMutation({
      id: intentId,
      ...values,
    });

    console.log('[EditSubmit] Intent updated');

    // 2. Jeśli user wybrał nowy cover, uploaduj go
    if (coverImageFile) {
      console.log('[EditSubmit] Uploading new cover...');
      try {
        await uploadIntentCover(intentId, coverImageFile);
      } catch (uploadErr) {
        // Cover upload failed
        console.error('[EditSubmit] Cover upload failed');
      }
    }

    // 3. Zamknij modal
    onClose();

    toast.success('Event zaktualizowany pomyślnie');
  } catch (error) {
    console.error('[EditSubmit] Failed to update Intent:', error);
    toast.error('Nie udało się zaktualizować eventu');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## ✅ Checklist implementacji Intent Cover

### Backend

- [x] **Model `MediaAsset`** - już zaimplementowany
- [x] **Pole `Intent.coverKey`** - już dodane do schema
- [x] **Pole `Intent.coverBlurhash`** - już dodane (field resolver)
- [x] **Interfejs `MediaStorage`** - już zaimplementowany
- [x] **Staging w `UPLOADS_TMP_PATH`** - już działa
- [ ] **`getUploadUrl` dla `INTENT_COVER`:**
  - [ ] Walidacja `intentId` (czy Intent istnieje)
  - [ ] Walidacja uprawnień (owner/moderator/admin)
  - [ ] Generowanie `uploadKey` dla Intenta: `tmp/uploads/intents/${intentId}/${cuid()}`
  - [ ] Zwracanie presigned URL (S3) lub local endpoint
- [ ] **`confirmMediaUpload` dla `INTENT_COVER`:**
  - [ ] Walidacja uprawnień
  - [ ] Odczyt surowego pliku z `UPLOADS_TMP_PATH` (LOCAL) lub S3
  - [ ] Wywołanie `createMediaAssetFromUpload({ purpose: 'INTENT_COVER' })`
  - [ ] Update `Intent.coverKey` w bazie
  - [ ] Usunięcie starego covera (jeśli istnieje)
  - [ ] Usunięcie pliku tymczasowego
  - [ ] Zwrócenie `{ success, mediaKey, mediaAssetId }`
- [ ] **Helper `validateIntentPermissions`:**
  - [ ] Sprawdzanie czy user jest global admin
  - [ ] Sprawdzanie czy user jest owner Intenta
  - [ ] Sprawdzanie czy user jest moderatorem Intenta
- [ ] **Cleanup worker:**
  - [ ] Usuwanie starych plików z `/tmp/uploads/intents/...` (starsze niż X godzin)

### Frontend

- [x] **Komponent `CoverStep`** - już zaimplementowany
  - [x] Local preview
  - [x] Crop modal (16:9)
  - [x] Walidacja plików
  - [x] Loading state
- [x] **Integracja w `create-edit-intent-modal.tsx`:**
  - [x] State: `coverImageFile`, `coverImagePreview`, `isCoverUploading`
  - [x] Handlers: `handleCoverImageSelected`, `handleCoverImageRemove`
  - [x] Step 3: Renderowanie `CoverStep`
- [ ] **Helper `uploadIntentCover`:**
  - [ ] Wywołanie `getUploadUrl`
  - [ ] Upload pliku (PUT dla S3, POST dla LOCAL)
  - [ ] Wywołanie `confirmMediaUpload`
  - [ ] Invalidate queries
  - [ ] Error handling z toast
- [x] **Flow Create Intent:**
  - [x] Najpierw `createIntent` → `intentId`
  - [x] Potem `uploadIntentCover(intentId, file)` (jeśli `coverImageFile`)
  - [x] Graceful degradation - jeśli upload fail, Intent nadal istnieje
- [ ] **Flow Edit Intent:**
  - [ ] Najpierw `updateIntent` (inne pola)
  - [ ] Potem `uploadIntentCover(intentId, file)` (jeśli nowy cover)
- [x] **Wyświetlanie covera:**
  - [x] `buildIntentCoverUrl(intent.coverKey, 'card'/'detail')`
  - [x] `BlurHashImage` z `coverBlurhash`
  - [x] Fallback gradient gdy `coverKey` brak
- [x] **Komponenty:**
  - [x] `event-card.tsx` - wyświetlanie cover
  - [x] `privacy-step.tsx` - integracja join form

### Testy

- [ ] **Backend:**
  - [ ] Test `getUploadUrl` dla `INTENT_COVER` (happy path)
  - [ ] Test `getUploadUrl` - unauthorized (nie owner/mod/admin)
  - [ ] Test `confirmMediaUpload` - pełny flow
  - [ ] Test `confirmMediaUpload` - usunięcie starego covera
  - [ ] Test `validateIntentPermissions` - wszystkie role
- [ ] **Frontend:**
  - [ ] Test `CoverStep` - wybór pliku
  - [ ] Test `CoverStep` - crop modal
  - [ ] Test `uploadIntentCover` - mock GraphQL
  - [ ] Test Create Intent z coverem
  - [ ] Test Create Intent bez covera
  - [ ] Test Edit Intent - zmiana covera

---

**Data utworzenia:** 2025-11-19  
**Ostatnia aktualizacja:** 2025-11-19  
**Wersja:** 2.1  
**Autor:** AI Assistant + User (abartski)

**Changelog:**

**v2.1 (2025-11-19):**

- ✅ Dodano komponent `CoverStep` dla Intent cover upload
- ✅ Zaimplementowano synchroniczny upload w `submit()` (Intent cover)
- ✅ Zintegrowano Join Form w Privacy Step
- ✅ Dodano `event-card.tsx` z BlurHash dla Intent covers
- ✅ Dodano sekcję "Intent Cover Upload - Wymagania i Implementacja":
  - Wymagania biznesowe (uprawnienia, zasady, graceful degradation)
  - Pełna implementacja backend (resolvers, helpers, walidacja)
  - Helper function `uploadIntentCover` (rekomendowany pattern)
  - Flow dla Create Intent i Edit Intent
  - Checklist implementacji (backend + frontend + testy)

**v2.0 (2025-11-19):**

- ✅ Usunięto stare pola `imageUrl`/`coverUrl` (brak backward compatibility)
- ✅ Wprowadzono rozdział `uploadKey` (tymczasowy) vs `mediaKey` (finalny)
- ✅ Zmieniono `entityId` na obowiązkowe w GraphQL
- ✅ Staging na dysku (`/tmp/uploads`) zamiast Map in-memory
- ✅ Rozbudowano cleanup worker o tymczasowe pliki
- ✅ Doprecyzowano odpowiedzialności `createMediaAssetFromUpload()`
- ✅ Zaktualizowano flow diagramy (LOCAL i S3)

---

## 📝 Uwagi implementacyjne

**Status:** Kod jest w fazie **development** - nie ma użytkowników produkcyjnych.

**Wymagane aktualizacje w istniejącym kodzie:**

1. **Frontend hooki wymagają `userId`:**

   ```typescript
   const avatarUpload = useAvatarUpload(user.id, { onSuccess: ... });
   const coverUpload = useCoverUpload(user.id, { onSuccess: ... });
   ```

2. **Używaj `avatarKey`/`coverKey` zamiast `imageUrl`/`coverUrl`:**

   ```typescript
   // Renderowanie avatara
   <img src={buildAvatarUrl(user.avatarKey, 'md')} alt={user.name} />

   // Renderowanie covera
   <img src={buildUserCoverUrl(profile.coverKey, 'detail')} alt="Cover" />
   ```

3. **GraphQL queries muszą używać nowych pól:**
   ```graphql
   query GetUser {
     user {
       avatarKey # nie imageUrl
     }
   }
   ```
