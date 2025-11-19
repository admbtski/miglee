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
│           │   └── media/
│           │       ├── url.ts                   # Helpery buildAvatarUrl, etc.
│           │       └── use-media-upload.tsx     # Hooki do uploadu
│           └── app/
│               └── account/
│                   └── profile/
│                       └── _components/
│                           └── profile-tab.tsx  # Integracja uploadu
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

**Data utworzenia:** 2025-11-19  
**Ostatnia aktualizacja:** 2025-11-19  
**Wersja:** 2.0  
**Autor:** AI Assistant + User (abartski)

**Changelog v2.0:**

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
