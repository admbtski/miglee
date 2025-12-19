/**
 * Members Feature
 *
 * Handles the lifecycle of event membership (User↔Event relationship):
 * - Joining, leaving, requesting to join events
 * - Invitations and waitlist management
 * - Moderator actions (approve, reject, kick, ban, role changes)
 * - Member queries and statistics
 *
 * This feature is separate from Events which handles event definition and lifecycle.
 */

export * from './api';
export * from './components';
export * from './types';
export * from './utils';

