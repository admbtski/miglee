/**
 * Events Feature Hooks
 *
 * Hooks for filtering, sorting, search, and event management.
 */

// Search & Filters (re-exported from search feature)
export { useActiveFiltersCount } from '../../search/hooks/use-active-filters-count';
export { useCommittedFilters } from '../../search/hooks/use-committed-filters';
export { useCommittedMapVisible } from './use-committed-map-vision';
export { useCommittedSort } from '../../search/hooks/use-committed-sort';
export { useDebouncedHover } from './use-debounced-hover';
export { useEventsListingInfiniteQueryVariables } from '../../search/hooks/use-events-listing-infinite-query-variables';
export { useFilterState } from '../../search/hooks/use-filter-state';
export { useFilterValidation } from '../../search/hooks/use-filter-validation';
export { useLocationMode } from './use-location-mode';
export { useSearchMeta, type SearchMeta } from '../../search/hooks/use-search-meta';

// Event Form & Management (re-exported from event-creation feature)
export { useAutoSaveDraft } from '../../event-creation/hooks/use-auto-save-draft';
export { useCategories } from './use-categories';
export {
  type EventPermissions,
  useEventPermissions,
} from './use-event-permissions';
export { useTags } from '../../tags/hooks/use-tags';

// Event Form (re-exported from event-creation feature)
export {
  defaultEventValues,
  defaultSimpleEventValues,
  EventSchema,
  MeetingKind,
  SimpleEventSchema,
  useEventForm,
  useSimpleEventForm,
  type EventFormValues,
  type SimpleEventFormValues,
} from '../../event-creation/hooks/use-event-form';

// Subscription Data
export { useSubscriptionData } from './use-subscription-data';

// My Events (re-exported from search feature)
export { useEventsModals } from './use-events-modals';
export { useMyEventsFilters } from '../../search/hooks/use-my-events-filters';
