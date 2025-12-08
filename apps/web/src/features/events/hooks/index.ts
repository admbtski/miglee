/**
 * Events Feature Hooks
 *
 * Hooks for filtering, sorting, search, and event management.
 */

// Search & Filters
export { useActiveFiltersCount } from './use-active-filters-count';
export { useCommittedFilters } from './use-committed-filters';
export { useCommittedMapVisible } from './use-committed-map-vision';
export { useCommittedSort } from './use-committed-sort';
export { useDebouncedHover } from './use-debounced-hover';
export { useFilterState } from './use-filter-state';
export { useFilterValidation } from './use-filter-validation';
export { useEventsQueryVariables } from './use-events-query-variables';
export { useLocationMode } from './use-location-mode';
export { useSearchMeta, type SearchMeta } from './use-search-meta';

// Event Form & Management
export { useAutoSaveDraft } from './use-auto-save-draft';
export { useCategories } from './use-categories';
export { useTags } from './use-tags';
export {
  useEventPermissions,
  type EventPermissions,
} from './use-event-permissions';

// My Events
export { useMyEventsFilters } from './use-my-events-filters';
export { useEventsModals } from './use-events-modals';
