/**
 * Comprehensive capacity formatter for event cards
 * Handles all modes: ONE_TO_ONE, GROUP, CUSTOM (STANDARD)
 * Returns formatted label and optional warning/status indicators
 */

export type CapacityDetailResult = {
  /** Main participants count display */
  participants: string;
  /** Minimum threshold info (if applicable) */
  minThreshold?: string;
  /** Status message */
  status: string;
  /** Status variant for styling */
  statusVariant: 'neutral' | 'warning' | 'success' | 'info';
};

export type CapacityStatusConfig = {
  /** Icon component to display */
  icon: 'AlertTriangle' | 'CheckCircle' | 'Info';
  /** CSS classes for the status card */
  colorClasses: string;
};

/**
 * Get status configuration (icon and color classes) based on status variant
 *
 * @param statusVariant - The status variant from formatCapacityDetail
 * @returns Configuration object with icon name and color classes
 */
export function getCapacityStatusConfig(
  statusVariant: 'neutral' | 'warning' | 'success' | 'info'
): CapacityStatusConfig {
  switch (statusVariant) {
    case 'warning':
      return {
        icon: 'AlertTriangle',
        colorClasses:
          'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-800',
      };
    case 'success':
      return {
        icon: 'CheckCircle',
        colorClasses:
          'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/50 dark:border-green-800',
      };
    case 'info':
      return {
        icon: 'Info',
        colorClasses:
          'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/50 dark:border-blue-800',
      };
    case 'neutral':
    default:
      return {
        icon: 'Info',
        colorClasses:
          'text-zinc-700 bg-zinc-50 border-zinc-200 dark:text-zinc-400 dark:bg-zinc-900/50 dark:border-zinc-700',
      };
  }
}

/**
 * Format capacity for detailed event view (event-hero, event-detail-client)
 * Provides comprehensive participant information with status messages
 *
 * @param joinedCount - Current number of participants
 * @param min - Minimum participants (null = no minimum)
 * @param max - Maximum participants (null = no maximum)
 * @param mode - Event mode (ONE_TO_ONE, GROUP, CUSTOM/STANDARD)
 * @returns Detailed capacity information with status
 */
export function formatCapacityDetail(
  joinedCount: number,
  min: number | null | undefined,
  max: number | null | undefined,
  mode: 'ONE_TO_ONE' | 'GROUP' | 'CUSTOM' = 'GROUP'
): CapacityDetailResult {
  const minVal = min ?? null;
  const maxVal = max ?? null;

  // ===================================================================
  // ONE_TO_ONE MODE (always min=2, max=2)
  // ===================================================================
  if (mode === 'ONE_TO_ONE') {
    if (joinedCount < 2) {
      return {
        participants: `${joinedCount} z 2`,
        status: 'Potrzebny jeszcze 1 uczestnik, aby rozpocząć spotkanie 1:1',
        statusVariant: 'warning',
      };
    }
    return {
      participants: '2 z 2',
      status: 'Wydarzenie jest pełne',
      statusVariant: 'success',
    };
  }

  // ===================================================================
  // BOTH NULL - Unlimited event
  // ===================================================================
  if (minVal === null && maxVal === null) {
    if (joinedCount < 50) {
      return {
        participants: `${joinedCount}`,
        status:
          'Wydarzenie jest otwarte — brak minimalnej i maksymalnej liczby uczestników',
        statusVariant: 'info',
      };
    }
    if (joinedCount < 1000) {
      return {
        participants: `${joinedCount}`,
        status: 'Brak limitów — wydarzenie rośnie dynamicznie',
        statusVariant: 'info',
      };
    }
    return {
      participants: `${joinedCount.toLocaleString('pl-PL')}`,
      status: 'Brak limitów — wydarzenie nie ma określonej pojemności',
      statusVariant: 'info',
    };
  }

  // ===================================================================
  // ONLY MIN NULL, MAX SET - No minimum limit
  // ===================================================================
  if (minVal === null && maxVal !== null) {
    const fillPercentage = (joinedCount / maxVal) * 100;

    if (joinedCount >= maxVal) {
      return {
        participants: `${joinedCount} z ${maxVal}`,
        status: 'Wydarzenie jest pełne',
        statusVariant: 'success',
      };
    }
    if (fillPercentage >= 80) {
      return {
        participants: `${joinedCount} z ${maxVal}`,
        status: 'Ostatnie wolne miejsca',
        statusVariant: 'warning',
      };
    }
    return {
      participants: `${joinedCount} z ${maxVal}`,
      status: 'Wydarzenie jest otwarte',
      statusVariant: 'info',
    };
  }

  // ===================================================================
  // ONLY MAX NULL, MIN SET - No upper limit
  // ===================================================================
  if (maxVal === null && minVal !== null) {
    if (joinedCount < minVal) {
      return {
        participants: `${joinedCount}`,
        minThreshold: `${minVal}`,
        status:
          'Wydarzenie ruszy po osiągnięciu minimalnej liczby uczestników (brak maksymalnego limitu)',
        statusVariant: 'warning',
      };
    }
    if (joinedCount < 1000) {
      return {
        participants: `${joinedCount}`,
        status:
          'Wydarzenie jest otwarte — brak ograniczenia maksymalnej liczby uczestników',
        statusVariant: 'info',
      };
    }
    return {
      participants: `${joinedCount.toLocaleString('pl-PL')}`,
      status: 'Brak górnego limitu — uczestnicy mogą dołączać bez ograniczeń',
      statusVariant: 'info',
    };
  }

  // ===================================================================
  // BOTH MIN AND MAX SET
  // ===================================================================
  if (minVal !== null && maxVal !== null) {
    const fillPercentage = (joinedCount / maxVal) * 100;

    // Full
    if (joinedCount >= maxVal) {
      if (mode === 'GROUP') {
        return {
          participants: `${joinedCount} z ${maxVal}`,
          status: 'Wydarzenie jest pełne',
          statusVariant: 'success',
        };
      }
      return {
        participants: `${joinedCount} z ${maxVal}`,
        status: 'Osiągnięto maksymalną liczbę uczestników',
        statusVariant: 'success',
      };
    }

    // Below minimum
    if (joinedCount < minVal) {
      if (mode === 'GROUP') {
        return {
          participants: `${joinedCount} z ${maxVal}`,
          minThreshold: `${minVal} uczestników`,
          status:
            'Wydarzenie jeszcze nie osiągnęło minimalnej liczby uczestników',
          statusVariant: 'warning',
        };
      }
      return {
        participants: `${joinedCount} z ${maxVal}`,
        minThreshold: `${minVal} uczestników`,
        status:
          'Wydarzenie rozpocznie się po osiągnięciu minimalnej liczby uczestników',
        statusVariant: 'warning',
      };
    }

    // Near full (80-99%)
    if (fillPercentage >= 80) {
      if (mode === 'GROUP') {
        return {
          participants: `${joinedCount} z ${maxVal}`,
          status: 'Ostatnie wolne miejsca',
          statusVariant: 'warning',
        };
      }
      return {
        participants: `${joinedCount} z ${maxVal}`,
        status: 'Zbliżamy się do maksymalnego limitu uczestników',
        statusVariant: 'warning',
      };
    }

    // Normal state
    if (mode === 'GROUP') {
      return {
        participants: `${joinedCount} z ${maxVal}`,
        status: 'Wydarzenie jest otwarte na kolejnych uczestników',
        statusVariant: 'info',
      };
    }
    return {
      participants: `${joinedCount} z ${maxVal}`,
      status: 'Wydarzenie jest aktywne i otwarte',
      statusVariant: 'info',
    };
  }

  // Fallback (shouldn't reach here)
  return {
    participants: `${joinedCount}`,
    status: 'Wydarzenie jest otwarte',
    statusVariant: 'info',
  };
}

/**
 * Format short participants count for compact display (hero sections, cards)
 * Returns a concise string like "5 z 2", "250 uczestników", "120 z 1000"
 *
 * @param joinedCount - Current number of participants
 * @param min - Minimum participants (null = no minimum)
 * @param max - Maximum participants (null = no maximum)
 * @param mode - Event mode (ONE_TO_ONE, GROUP, CUSTOM/STANDARD)
 * @returns Short formatted string
 */
export function formatParticipantsShort(
  joinedCount: number,
  min: number | null | undefined,
  max: number | null | undefined,
  mode?: 'ONE_TO_ONE' | 'GROUP' | 'CUSTOM'
): string {
  const minVal = min ?? null;
  const maxVal = max ?? null;

  // ONE_TO_ONE mode
  if (mode === 'ONE_TO_ONE') {
    return `${joinedCount} z 2`;
  }

  // Both limits null - unlimited
  if (minVal === null && maxVal === null) {
    return `${joinedCount} uczestników`;
  }

  // Only min is null, max is set
  if (minVal === null && maxVal !== null) {
    return `${joinedCount} z ${maxVal}`;
  }

  // Only max is null, min is set
  if (maxVal === null && minVal !== null) {
    return `${joinedCount} uczestników`;
  }

  // Both min and max are set
  if (minVal !== null && maxVal !== null) {
    return `${joinedCount} z ${maxVal}`;
  }

  // Fallback
  return `${joinedCount} uczestników`;
}

/**
 * Format capacity label as simple string (legacy compatibility)
 * Returns a human-readable string for display
 *
 * @param joinedCount - Current number of participants
 * @param min - Minimum participants (null = no minimum)
 * @param max - Maximum participants (null = no maximum)
 * @returns Formatted string for display
 */
export function formatCapacityString(
  joinedCount: number,
  min: number | null | undefined,
  max: number | null | undefined
): string {
  const minVal = min ?? null;
  const maxVal = max ?? null;

  // Both null or undefined - unlimited
  if (minVal === null && maxVal === null) {
    return `${joinedCount} • brak limitu uczestników`;
  }

  // Only min is null/undefined - show max only
  if (minVal === null && maxVal !== null) {
    const isFull = joinedCount >= maxVal;
    const available = Math.max(0, maxVal - joinedCount);
    return isFull
      ? `Brak miejsc • ${joinedCount} / ${maxVal}`
      : `${joinedCount} / ${maxVal} • ${available} wolne`;
  }

  // Only max is null/undefined - show min only
  if (maxVal === null && minVal !== null) {
    const belowMin = joinedCount < minVal;
    return belowMin
      ? `${joinedCount} • minimum ${minVal} osób`
      : `${joinedCount} • minimum ${minVal} osób`;
  }

  // Both set - standard display
  if (minVal !== null && maxVal !== null) {
    const isFull = joinedCount >= maxVal;
    const available = Math.max(0, maxVal - joinedCount);
    return isFull
      ? `Brak miejsc • ${joinedCount} / ${maxVal}`
      : `${joinedCount} / ${maxVal} • ${available} wolne`;
  }

  // Fallback (shouldn't happen)
  return `${joinedCount} uczestników`;
}
