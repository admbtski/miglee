/**
 * Helper do obliczania stanu zapisów na wydarzenie
 * Implementuje logikę okien czasowych, cutoffów i ręcznego zamknięcia
 */

export type JoinStateResult = {
  isJoinOpenNow: boolean;
  isBeforeOpen: boolean;
  opensInMs?: number;
  isPreCutoffClosed: boolean;
  isManuallyClosed: boolean;
  isLateJoinOpen: boolean;
  isFull: boolean;
  canJoin: boolean;
  ctaLabel:
    | 'Dołącz'
    | 'Wyślij prośbę'
    | 'Tylko zaproszenie'
    | 'Zablokowane'
    | 'Brak miejsc'
    | 'Niedostępne';
  reason?: string;
};

export type IntentJoinConfig = {
  startAt: Date;
  endAt: Date;
  joinOpensMinutesBeforeStart?: number | null;
  joinCutoffMinutesBeforeStart?: number | null;
  allowJoinLate: boolean;
  lateJoinCutoffMinutesAfterStart?: number | null;
  joinManuallyClosed: boolean;
  min: number;
  max: number;
  joinedCount: number;
  joinMode: 'OPEN' | 'REQUEST' | 'INVITE_ONLY';
};

/**
 * Oblicza stan zapisów na wydarzenie na podstawie konfiguracji
 */
export function computeJoinState(
  now: Date,
  intent: IntentJoinConfig
): JoinStateResult {
  const msToStart = intent.startAt.getTime() - now.getTime();
  const msSinceStart = now.getTime() - intent.startAt.getTime();
  const msToEnd = intent.endAt.getTime() - now.getTime();

  // 1) Okno otwarcia zapisów (przed startem)
  const opensAt =
    intent.joinOpensMinutesBeforeStart != null
      ? new Date(
          intent.startAt.getTime() - intent.joinOpensMinutesBeforeStart * 60_000
        )
      : null;
  const isBeforeOpen = opensAt ? now < opensAt : false;

  // 2) Pre-cutoff przed startem
  const preCutoffAt =
    intent.joinCutoffMinutesBeforeStart != null
      ? new Date(
          intent.startAt.getTime() -
            intent.joinCutoffMinutesBeforeStart * 60_000
        )
      : null;
  const isPreCutoffClosed = preCutoffAt
    ? now >= preCutoffAt && now < intent.startAt
    : false;

  // 3) Late-join po starcie
  let isLateJoinOpen = false;
  if (now >= intent.startAt && now < intent.endAt) {
    if (intent.allowJoinLate) {
      if (intent.lateJoinCutoffMinutesAfterStart != null) {
        const lateCutoffAt = new Date(
          intent.startAt.getTime() +
            intent.lateJoinCutoffMinutesAfterStart * 60_000
        );
        isLateJoinOpen = now < lateCutoffAt;
      } else {
        isLateJoinOpen = true; // do endAt
      }
    }
  }

  // 4) Ręczne zamknięcie
  const isManuallyClosed = !!intent.joinManuallyClosed;

  // 5) Pojemność
  const isFull = intent.joinedCount >= intent.max;

  // 6) Sklejka „czy mogę dołączyć"
  const isWithinMainWindow =
    (opensAt ? now >= opensAt : true) && // jeśli jest opensAt
    now < intent.startAt &&
    !isPreCutoffClosed;

  const isWithinLateWindow = isLateJoinOpen;

  const windowOpen =
    (isWithinMainWindow || isWithinLateWindow) && !isManuallyClosed;
  const baseAvailable = windowOpen && !isFull;

  // 7) JoinMode wpływa na etykietę
  let ctaLabel: JoinStateResult['ctaLabel'] = 'Dołącz';
  if (intent.joinMode === 'REQUEST') ctaLabel = 'Wyślij prośbę';
  if (intent.joinMode === 'INVITE_ONLY') ctaLabel = 'Tylko zaproszenie';

  // 8) Dodatkowe blokady
  let canJoin = baseAvailable && ctaLabel !== 'Tylko zaproszenie';
  let reason: string | undefined;

  if (isBeforeOpen) {
    canJoin = false;
    ctaLabel = 'Zablokowane';
    reason = 'Zapisy nie są jeszcze otwarte.';
  }
  if (isPreCutoffClosed) {
    canJoin = false;
    ctaLabel = 'Zablokowane';
    reason = 'Zapisy zamknięte przed startem.';
  }
  if (isManuallyClosed) {
    canJoin = false;
    ctaLabel = 'Zablokowane';
    reason = 'Zapisy zamknięte ręcznie.';
  }
  if (isFull) {
    canJoin = false;
    ctaLabel = 'Brak miejsc';
    reason = 'Osiągnięto limit.';
  }
  if (now >= intent.endAt) {
    canJoin = false;
    ctaLabel = 'Niedostępne';
    reason = 'Wydarzenie zakończone.';
  }

  return {
    isJoinOpenNow: canJoin,
    isBeforeOpen,
    opensInMs:
      isBeforeOpen && opensAt ? opensAt.getTime() - now.getTime() : undefined,
    isPreCutoffClosed,
    isManuallyClosed,
    isLateJoinOpen,
    isFull,
    canJoin,
    ctaLabel,
    reason,
  };
}

/**
 * Formatuje czas do otwarcia zapisów w czytelny sposób
 */
export function formatOpensIn(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `za ${days} ${days === 1 ? 'dzień' : 'dni'}`;
  if (hours > 0) return `za ${hours} ${hours === 1 ? 'godzinę' : 'godzin'}`;
  if (minutes > 0) return `za ${minutes} ${minutes === 1 ? 'minutę' : 'minut'}`;
  return 'za chwilę';
}

/**
 * Formatuje czas trwania wydarzenia
 */
export function formatDuration(startAt: Date, endAt: Date): string {
  const ms = endAt.getTime() - startAt.getTime();
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0
      ? `${days}d ${remainingHours}h`
      : `${days} ${days === 1 ? 'dzień' : 'dni'}`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h`;
  }
  return `${minutes} min`;
}
