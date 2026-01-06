/**
 * Web Vitals Utilities
 * 
 * Provides utilities for:
 * - Session management (anonymous session IDs)
 * - Sampling control
 * - Path normalization (dynamic segments → templates)
 * - Kill switch
 * - Batching/queuing
 */

// =============================================================================
// Session Management
// =============================================================================

const SESSION_KEY = '__wv_session_id';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

interface SessionData {
  id: string;
  createdAt: number;
  lastActivityAt: number;
}

/**
 * Get or create anonymous session ID
 * Session expires after 30 minutes of inactivity
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const data: SessionData = JSON.parse(stored);
      const now = Date.now();
      
      // Check if session expired
      if (now - data.lastActivityAt < SESSION_DURATION) {
        // Update last activity
        data.lastActivityAt = now;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
        return data.id;
      }
    }

    // Create new session
    const newSession: SessionData = {
      id: generateSessionId(),
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    return newSession.id;
  } catch {
    // Fallback if sessionStorage not available
    return generateSessionId();
  }
}

function generateSessionId(): string {
  return `wv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// =============================================================================
// Sampling Control
// =============================================================================

interface SamplingConfig {
  enabled: boolean;
  rate: number; // 0.0 to 1.0 (0.05 = 5%)
}

const DEFAULT_SAMPLING: SamplingConfig = {
  enabled: typeof window !== 'undefined' && process.env.NODE_ENV === 'production',
  rate: parseFloat(process.env.NEXT_PUBLIC_WEB_VITALS_SAMPLING_RATE || '0.1'), // 10% default
};

let samplingDecision: boolean | null = null;

/**
 * Check if current session should be sampled
 * Decision is made once per session and cached
 */
export function shouldSample(config: SamplingConfig = DEFAULT_SAMPLING): boolean {
  // Kill switch - disable all telemetry
  if (process.env.NEXT_PUBLIC_WEB_VITALS_DISABLED === 'true') {
    return false;
  }

  // Dev mode - always sample
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  // Check if sampling is enabled
  if (!config.enabled) {
    return true; // If sampling disabled, collect all
  }

  // Make sampling decision once per session
  if (samplingDecision === null) {
    samplingDecision = Math.random() < config.rate;
  }

  return samplingDecision;
}

// =============================================================================
// Path Normalization (Dynamic Segments → Templates)
// =============================================================================

/**
 * Normalize dynamic path segments to templates
 * 
 * Examples:
 *   /events/123 → /events/[id]
 *   /@username → /@[handle]
 *   /posts/abc-def-123 → /posts/[slug]
 *   /en/events → /[locale]/events
 */
export function normalizePathToTemplate(pathname: string): string {
  if (!pathname) return '/';

  // Remove trailing slash
  const normalized = pathname.replace(/\/$/, '') || '/';

  // Split into segments
  const segments = normalized.split('/').filter(Boolean);

  // Apply normalization rules
  const templated = segments.map((segment, index) => {
    // Locale pattern (first segment, 2-3 chars)
    if (index === 0 && /^[a-z]{2,3}$/i.test(segment)) {
      return '[locale]';
    }

    // UUID pattern
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
      return '[id]';
    }

    // Nanoid/CUID pattern (20-30 chars alphanumeric)
    if (/^[a-z0-9]{20,30}$/i.test(segment)) {
      return '[id]';
    }

    // Pure numeric ID
    if (/^\d+$/.test(segment)) {
      return '[id]';
    }

    // Slug pattern (words-separated-by-dashes with optional trailing numbers)
    if (/^[a-z0-9]+-[a-z0-9-]+-[0-9]+$/i.test(segment)) {
      return '[slug]';
    }

    // Username/handle pattern (starts with @)
    if (segment.startsWith('@')) {
      return '@[handle]';
    }

    // Keep segment as-is if no pattern matches
    return segment;
  });

  return '/' + templated.join('/');
}

/**
 * Get route group from path
 * Used for low-cardinality grouping when template not available
 * 
 * Examples:
 *   /events/123 → events_detail
 *   /events → events_list
 *   /@username → profile
 */
export function getRouteGroup(pathname: string): string {
  if (!pathname || pathname === '/') return 'home';

  const segments = pathname.split('/').filter(Boolean);
  
  // Remove locale if present
  const firstSegment = segments[0];
  if (firstSegment && /^[a-z]{2,3}$/i.test(firstSegment)) {
    segments.shift();
  }

  if (segments.length === 0) return 'home';

  const base = segments[0];

  // Determine if detail page (has dynamic segment)
  const hasId = segments.some(s => 
    /^\d+$/.test(s) || 
    /^[0-9a-f-]{20,}$/i.test(s) ||
    s.startsWith('@')
  );

  if (hasId) {
    return `${base}_detail`;
  }

  return base;
}

// =============================================================================
// Navigation Type Detection
// =============================================================================

export type NavigationType = 
  | 'initial_load' 
  | 'back_forward' 
  | 'prerender' 
  | 'restore'
  | 'navigate'
  | 'other';

/**
 * Get navigation type from PerformanceNavigationTiming
 */
export function getNavigationType(): NavigationType {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) {
    return 'other';
  }

  try {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      const type = navEntries[0].type;
      
      if (type === 'navigate') return 'initial_load';
      if (type === 'reload') return 'initial_load';
      if (type === 'back_forward') return 'back_forward';
      if (type === 'prerender') return 'prerender';
    }
  } catch {
    // Ignore errors
  }

  // Check if restored from bfcache
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.performance?.navigation?.type === 2) {
      return 'back_forward';
    }
  }

  return 'other';
}

// =============================================================================
// Batching & Queuing
// =============================================================================

interface QueuedEvent {
  payload: any;
  timestamp: number;
  retries: number;
}

const MAX_QUEUE_SIZE = 50;
const MAX_BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const FLUSH_INTERVAL = 5000; // 5 seconds

let eventQueue: QueuedEvent[] = [];
let flushTimer: NodeJS.Timeout | null = null;

/**
 * Add event to queue for batched sending
 */
export function queueEvent(payload: any): void {
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    // Drop oldest events if queue full
    eventQueue.shift();
  }

  eventQueue.push({
    payload,
    timestamp: Date.now(),
    retries: 0,
  });

  scheduleFlush();
}

/**
 * Schedule flush of queued events
 */
function scheduleFlush(): void {
  if (flushTimer) return;

  flushTimer = setTimeout(() => {
    flushQueue();
    flushTimer = null;
  }, FLUSH_INTERVAL);
}

/**
 * Flush queued events to server
 */
async function flushQueue(): Promise<void> {
  if (eventQueue.length === 0) return;

  const batch = eventQueue.splice(0, MAX_BATCH_SIZE);
  const payloads = batch.map(e => e.payload);

  try {
    const response = await fetch('/api/telemetry/web', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: payloads }),
      keepalive: true,
    });

    if (!response.ok) {
      // Re-queue failed events (with retry limit)
      const retriable = batch.filter(e => e.retries < MAX_RETRIES);
      retriable.forEach(e => {
        e.retries++;
        eventQueue.push(e);
      });
    }
  } catch (error) {
    // Network error - re-queue with retry limit
    const retriable = batch.filter(e => e.retries < MAX_RETRIES);
    retriable.forEach(e => {
      e.retries++;
      eventQueue.push(e);
    });
  }
}

/**
 * Flush queue on page unload
 */
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushQueue();
    }
  });

  window.addEventListener('pagehide', () => {
    flushQueue();
  });
}

