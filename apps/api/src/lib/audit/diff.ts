/**
 * Diff utility for audit logs
 *
 * Generates a diff object comparing before/after states of an entity.
 * Only includes fields from the whitelist.
 */

export type DiffResult = Record<string, { from: unknown; to: unknown }>;

/**
 * Deep equality check for values
 * Handles primitives, arrays, objects, and dates
 */
function isEqual(a: unknown, b: unknown): boolean {
  // Handle null/undefined
  if (a === b) return true;
  if (a == null || b == null) return false;

  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }

  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }

  return false;
}

/**
 * Build a diff object for audit logging
 *
 * @param before - The entity state before the change
 * @param after - The entity state after the change
 * @param whitelist - Array of field names that are allowed in the diff
 * @returns A diff object with changed fields, or null if no changes
 *
 * @example
 * ```ts
 * const diff = buildDiff(
 *   { title: 'Old', description: 'Old desc' },
 *   { title: 'New', description: 'Old desc' },
 *   ['title', 'description']
 * );
 * // Result: { title: { from: 'Old', to: 'New' } }
 * ```
 */
export function buildDiff<T extends object>(
  before: T,
  after: T,
  whitelist: readonly (keyof T)[]
): DiffResult | null {
  const diff: DiffResult = {};

  for (const key of whitelist) {
    const beforeValue = before[key];
    const afterValue = after[key];

    // Use deep equality for objects/arrays
    if (!isEqual(beforeValue, afterValue)) {
      // Serialize dates to ISO strings for consistent comparison
      const fromValue = beforeValue instanceof Date ? beforeValue.toISOString() : beforeValue;
      const toValue = afterValue instanceof Date ? afterValue.toISOString() : afterValue;

      diff[key as string] = { from: fromValue, to: toValue };
    }
  }

  return Object.keys(diff).length > 0 ? diff : null;
}

/**
 * Check if an object has any meaningful changes based on a whitelist
 * Useful for deciding whether to create an audit log entry
 */
export function hasChanges<T extends object>(
  before: T,
  after: T,
  whitelist: readonly (keyof T)[]
): boolean {
  for (const key of whitelist) {
    if (!isEqual(before[key], after[key])) {
      return true;
    }
  }
  return false;
}

