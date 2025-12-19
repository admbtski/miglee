/**
 * Events API Exports
 *
 * This module exports event lifecycle hooks.
 * Member-related hooks have been moved to @/features/members
 * and are re-exported here for backwards compatibility.
 */

// Event Lifecycle Hooks (kept in events)
export * from './events-query-keys';
export * from './use-cancel-event';
export * from './use-cancel-schedule-publication';
export * from './use-close-event-join';
export * from './use-create-event';
export * from './use-delete-event';
export * from './use-event-permissions';
export * from './use-events-listing-infinite';
export * from './use-events-query';
export * from './use-get-event-detail';
export * from './use-publish-event';
export * from './use-reopen-event-join';
export * from './use-schedule-event-publication';
export * from './use-unpublish-event';
export * from './use-update-event';

// Member-related hooks have been moved to @/features/members
// Import them directly from '@/features/members' instead
