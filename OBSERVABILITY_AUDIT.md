# Audit Observability Functions

## Podsumowanie
- **Wszystkie eksporty**: 120 funkcji
- **Używane**: 44 funkcje
- **Nieużywane**: 76 funkcji (63%)

## Kategorie Nieużywanych Funkcji

### ✅ 1. Funkcje Pomocnicze (16) - ZACHOWAĆ
Te funkcje są utility/helpers używane wewnętrznie przez inne funkcje observability.

```
hashPayload                    - helper do tworzenia hash dla bulk payloadów
redactPII                      - sanityzacja PII przed logowaniem  
safeForLogging                 - walidacja bezpieczeństwa danych do logów
errorCodeToAuthzReason         - konwersja kodów błędów na authz reasons

measureDbTime                  - helper do pomiaru czasu DB
measureTime                    - helper do pomiaru czasu

addSpanAttributes              - helper do dodawania atrybutów do span
addSpanEvent                   - helper do dodawania eventów do span
getSpanId                      - helper do pobierania span ID
getTraceId                     - helper do pobierania trace ID
setSpanError                   - helper do ustawiania błędów w span

withSpan                       - wrapper dla operacji z tracing
withSpanSync                   - synchroniczny wrapper dla tracing
withClientSpan                 - wrapper dla operacji klienta
tracedResolver                 - wrapper dla GraphQL resolverów
tracedService                  - wrapper dla serwisów
```

### ✅ 2. Funkcje Audit (5) - ZACHOWAĆ JAKO OPCJONALNE
Strukturalne audit logi - używane opcjonalnie zamiast standardowych logów.

```
auditLog                       - główna funkcja audit log
auditAccessDenied              - audit dla denied access
auditDataExport                - audit dla eksportów danych
auditSecurityEvent             - audit dla security events
auditStateChange               - audit dla zmian stanu
```

### ✅ 3. Funkcje Trace Wrappers (14) - ZACHOWAĆ
Wysokopoziomowe wrappery dla distributed tracing - opcjonalne use case.

```
traceEventMutation             - wrapper dla event mutations
traceEventsQuery               - wrapper dla events query
traceBulkOperation             - wrapper dla bulk ops
traceDerivation                - wrapper dla derivations
traceIdempotentOperation       - wrapper dla idempotent ops
traceModerationOperation       - wrapper dla moderation
traceOperation                 - generic wrapper
traceSchedulingOperation       - wrapper dla scheduling
traceTokenOperation            - wrapper dla token ops
traceUnreadOperation           - wrapper dla unread ops
traceVisibilityOperation       - wrapper dla visibility ops
```

### ⚠️ 4. Funkcje Track DO INTEGRACJI (41)
Te funkcje POWINNY być zintegrowane w resolverach.

#### **Account & Profile (1)**
```
trackProfileUpdated            → user-profile.ts (updateUserProfile mutation)
```

#### **Media (1)**
```
trackPresignRateLimited        → media.ts (getUploadUrl - rate limit case)
```

#### **Messaging (2)**
```
trackContent                   → comments.ts, reviews.ts (create/update/delete)
trackReaction                  → reactions.ts (add/remove reactions)
```

#### **Membership (1)**
```
trackWaitlistAction            → join-requests.ts (waitlist operations)
```

#### **Moderation (5)**
```
trackUserBlock                 → user-blocks.ts (blockUser mutation)
trackAuditArchive              → audit.ts (archiveEventAuditLogs)
trackAuditExport               → audit.ts (exportEventAuditLogs)
trackVisibilityChange          → comments.ts, reviews.ts (hide/unhide)
trackModerationAction          → admin-moderation.ts (admin actions)
```

#### **Notifications (2)**
```
trackNotificationDelivery      → notifications system (email/push delivery)
trackEmailSent                 → email service (when emails are sent)
reportNotificationBacklog      → notification worker (backlog alerts)
```

#### **Scheduling (3)**
```
trackScheduleFire              → scheduling worker (when scheduled event fires)
trackAvailabilityChange        → user-availability.ts (availability mutations)
trackTimezoneUsage             → user profile (timezone changes)
```

#### **Gates (1)**
```
trackGateCheck                 → wrapper dla wszystkich gate checks
```

#### **Unread (4)**
```
trackUnreadRecompute           → unread counter recomputation
trackUnreadDivergence          → when counter diverges from reality
trackUnreadQuery               → unread count queries
trackMarkRead                  → mark as read operations
```

#### **Idempotency (2)**
```
trackDuplicateDetected         → when duplicate request detected
trackUniqueViolation           → when unique constraint violated
```

#### **Tokens (2)**
```
trackTokenRotation             → checkin.ts (token rotation)
trackTokenAbuseIndicator       → when suspicious token usage detected
```

#### **Security (5)**
```
trackSecurityAlert             → security events (suspicious patterns)
trackSuspiciousAuth            → suspicious auth attempts
trackRateLimitBreach           → rate limit violations
trackUnauthorizedAdminAttempt  → unauthorized admin access attempts
trackDevLogin                  → auth.ts (devLogin - już dodane ale można rozszerzyć)
trackDevLogout                 → auth.ts (devLogout - już dodane)
```

#### **Derivation (4)**
```
trackMemberStats               → event-members.ts (member stats query)
trackPlanPeriods               → billing.ts (plan periods query)
trackSponsorships              → billing.ts (sponsorships query)
trackDerivation                → generic derivation wrapper
```

#### **Bulk (1)**
```
trackBulkPartialSuccess        → admin-events.ts (partial success case)
```

#### **Geo (1)**
```
trackGeoQueryError             → map-clusters.ts (error cases)
```

#### **Validation (1)**
```
trackInviteValidation          → invite-links.ts (validate invite link) - WAIT, to już jest!
```

### ❌ 5. Legacy Functions (4) - DO USUNIĘCIA
Stare funkcje z przed refactoringu.

```
trackEvent                     → replaced by trackEventLifecycle
trackCheckIn                   → replaced by trackCheckin
recordJob                      → old worker metrics
```

### 🔄 6. Functions Already Aliased (2)
```
correlatePreferencesWithDelivery  - helper function
isDevEndpointAllowed              - helper function
requireDevEnvironment             - helper function
```

## Priorytet Integracji

### 🔴 Wysoki Priorytet (13)
```
trackPresignRateLimited        - abuse detection
trackUserBlock                 - moderation critical
trackAuditExport              - compliance
trackSecurityAlert            - security incidents
trackSuspiciousAuth           - security
trackRateLimitBreach          - abuse detection
trackUnauthorizedAdminAttempt - security
trackDuplicateDetected        - data integrity
trackUniqueViolation          - data integrity
trackScheduleFire             - scheduling reliability
trackNotificationDelivery     - notification reliability
trackEmailSent                - email delivery tracking
reportNotificationBacklog     - operational alert
```

### 🟠 Średni Priorytet (15)
```
trackProfileUpdated
trackContent
trackReaction
trackWaitlistAction
trackAuditArchive
trackVisibilityChange
trackModerationAction
trackAvailabilityChange
trackTimezoneUsage
trackUnreadRecompute
trackUnreadDivergence
trackUnreadQuery
trackMarkRead
trackTokenRotation
trackTokenAbuseIndicator
```

### 🟡 Niski Priorytet (13)
```
trackMemberStats
trackPlanPeriods
trackSponsorships
trackDerivation
trackBulkPartialSuccess
trackGeoQueryError
trackGateCheck
wszystkie trace* wrappers
```

## Rekomendacje

### Natychmiast
1. Zintegruj 13 funkcji wysokiego priorytetu
2. Usuń 4 legacy functions

### W Najbliższym Czasie
1. Zintegruj 15 funkcji średniego priorytetu
2. Dodaj dokumentację dla utility functions

### Opcjonalnie
1. Zintegruj trace* wrappers gdzie ma sens
2. Rozważ użycie audit* functions zamiast standardowych logów w sensitive operations

