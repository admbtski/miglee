/**
 * Configuration constants for the events page
 */

export const EVENTS_CONFIG = {
  /** Default number of events to fetch per page */
  DEFAULT_LIMIT: 30,

  /** Navbar height in pixels for sticky positioning */
  NAV_HEIGHT: 86,

  /** Default avatar image when user has no profile picture */
  FALLBACK_AVATAR: 'https://i.pravatar.cc/150?u=event-owner-fallback&img=12',

  /** Default distance radius in kilometers */
  DEFAULT_DISTANCE_KM: 30,
} as const;

/**
 * Returns ISO string for current date/time
 * Used as default filter for upcoming events
 */
export const getUpcomingAfterDefault = (): string => new Date().toISOString();
