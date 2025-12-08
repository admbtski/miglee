/**
 * Utility exports - centralized access to all utilities
 */

// Styling
export { cn } from './cn';

// Logging
export { devLogger } from './dev-logger';

// Toast notifications
export { toast, toastManager } from './toast-manager';

// React Query helpers
export {
  createMutationWithToast,
  createOptimisticUpdate,
  createQueryClient,
  queryClient,
} from './react-query-config';

// Date utilities
export {
  dateToISO,
  formatDateRange,
  humanDuration,
  isoToLocalInput,
  isValidDate,
  localInputToISO,
  normalizeISO,
  parseISO,
} from './date';

// Slug utilities
export { generateSlug, isValidSlug } from './slug';
